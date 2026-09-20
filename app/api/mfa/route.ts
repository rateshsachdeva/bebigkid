import { NextResponse } from "next/server";
import {
  AppError,
  body,
  check,
  failure,
  identity,
  origin,
  service,
} from "@/lib/server";
import { z } from "zod";

function checkMfa(
  error: { message: string; code?: string; status?: number } | null,
) {
  if (!error) return;
  if (
    error.code === "mfa_verification_failed" ||
    error.code === "mfa_verification_rejected"
  )
    throw new AppError(
      "That authenticator code was not accepted. Use the current six-digit code shown for Alongside and try again.",
    );
  if (error.code === "mfa_challenge_expired")
    throw new AppError(
      "That authenticator challenge expired. Enter the newest six-digit code and try again.",
    );
  if (
    error.code === "session_expired" ||
    error.code === "session_not_found" ||
    error.code === "refresh_token_not_found" ||
    error.code === "refresh_token_already_used"
  )
    throw new AppError(
      "Your sign-in session expired. Sign out, sign in with Google again, and complete authenticator setup within 15 minutes.",
      401,
    );
  if (
    error.code === "mfa_totp_enroll_not_enabled" ||
    error.code === "mfa_totp_verify_not_enabled"
  )
    throw new AppError(
      "Authenticator verification is disabled in Supabase. Enable TOTP MFA and try again.",
      503,
    );
  if (error.code === "mfa_factor_not_found")
    throw new AppError(
      "That QR code is no longer active. Generate a new QR code and scan it again.",
    );
  check(error);
}

export async function POST(req: Request) {
  try {
    origin(req);
    const { db, user } = await identity(false);
    const { data: member } = await service()
      .from("admin_memberships")
      .select("role")
      .eq("user_id", user.id)
      .eq("active", true)
      .single();
    if (!member) throw new AppError("Owner access required.", 403);
    const b = await body(req);
    const { data: factors, error: factorsError } =
      await db.auth.mfa.listFactors();
    check(factorsError);
    if (b.action === "enrol") {
      const existing = factors?.totp[0];
      if (existing) return NextResponse.json({ id: existing.id });
      // Supabase returns the QR secret only when a factor is first enrolled.
      // If setup was interrupted, remove only stale unverified TOTP factors so
      // the owner can safely restart enrollment and receive a fresh QR code.
      const privileged = service();
      const { data: allFactors, error: adminListError } =
        await privileged.auth.admin.mfa.listFactors({ userId: user.id });
      check(adminListError);
      for (const stale of
        allFactors?.factors.filter(
          (factor) =>
            factor.factor_type === "totp" && factor.status === "unverified",
        ) ?? []) {
        const { error } = await privileged.auth.admin.mfa.deleteFactor({
          userId: user.id,
          id: stale.id,
        });
        check(error);
      }
      const { data, error } = await db.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Alongside owner",
      });
      checkMfa(error);
      return NextResponse.json({ id: data!.id, qr: data!.totp.qr_code });
    }
    if (b.action === "verify") {
      const requestedFactor = b.factor
        ? z.string().uuid().parse(b.factor)
        : undefined;
      const privileged = service();
      const { data: allFactors, error: adminListError } =
        await privileged.auth.admin.mfa.listFactors({ userId: user.id });
      check(adminListError);
      const ownedFactors =
        allFactors?.factors.filter(
          (candidate) => candidate.factor_type === "totp",
        ) ?? [];
      const factor = requestedFactor
        ? ownedFactors.find((candidate) => candidate.id === requestedFactor)?.id
        : (ownedFactors.find((candidate) => candidate.status === "unverified")
            ?.id ?? factors?.totp[0]?.id);
      if (!factor) throw new AppError("Set up your authenticator first.");
      const { error } = await db.auth.mfa.challengeAndVerify({
        factorId: factor,
        code: z.preprocess(
          (value) =>
            typeof value === "string" ? value.replace(/\s/g, "") : value,
          z.string().regex(/^\d{6}$/),
        ).parse(b.code),
      });
      checkMfa(error);
      return NextResponse.json({ ok: true });
    }
    throw new AppError("Unknown action.");
  } catch (e) {
    return failure(e);
  }
}
