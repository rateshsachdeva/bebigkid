import { NextResponse } from "next/server";
import {
  AppError,
  body,
  check,
  emailHash,
  failure,
  origin,
  service,
  sessionClient,
} from "@/lib/server";
import { z } from "zod";
export async function POST(req: Request) {
  try {
    origin(req);
    const b = await body(req),
      db = await sessionClient();
    if (b.action === "logout") {
      await db.auth.signOut({ scope: "global" });
      return NextResponse.json({ ok: true });
    }
    const email = z
      .string()
      .email()
      .max(254)
      .parse(b.email)
      .trim()
      .toLowerCase();
    const { data: invite } = await service()
      .from("pilot_invites")
      .select("email_hash")
      .eq("email_hash", emailHash(email))
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    if (!invite)
      throw new AppError(
        "The pilot is invitation-only. This email does not currently have access.",
        403,
      );
    if (b.action === "send") {
      const { error } = await db.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });
      check(error);
      return NextResponse.json({ ok: true });
    }
    if (b.action === "verify") {
      const token = z
        .string()
        .regex(/^\d{6,10}$/)
        .parse(b.code);
      const { data, error } = await db.auth.verifyOtp({
        email,
        token,
        type: "email",
      });
      check(error);
      if (!data.user) throw new AppError("The code could not be verified.");
      const privileged = service();
      const { data: deleted } = await privileged
        .from("deletion_ledger")
        .select("owner_id")
        .eq("owner_id", data.user.id)
        .maybeSingle();
      if (deleted) {
        await db.auth.signOut();
        throw new AppError("This account is being removed.", 403);
      }
      const { error: e } = await privileged
        .from("parent_profiles")
        .upsert(
          { user_id: data.user.id },
          { onConflict: "user_id", ignoreDuplicates: true },
        );
      check(e);
      return NextResponse.json({ ok: true });
    }
    throw new AppError("Unknown action.");
  } catch (e) {
    return failure(e);
  }
}
