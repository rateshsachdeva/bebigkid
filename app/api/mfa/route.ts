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
    const { data: factors } = await db.auth.mfa.listFactors();
    if (b.action === "enrol") {
      const existing = factors?.totp.find((f) => f.status === "verified");
      if (existing) return NextResponse.json({ id: existing.id });
      const { data, error } = await db.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Alongside owner",
      });
      check(error);
      return NextResponse.json({ id: data!.id, qr: data!.totp.qr_code });
    }
    if (b.action === "verify") {
      const factor =
        b.factor || factors?.totp.find((f) => f.status === "verified")?.id;
      if (!factor) throw new AppError("Set up your authenticator first.");
      const { error } = await db.auth.mfa.challengeAndVerify({
        factorId: z.string().uuid().parse(factor),
        code: z
          .string()
          .regex(/^\d{6}$/)
          .parse(b.code),
      });
      check(error);
      return NextResponse.json({ ok: true });
    }
    throw new AppError("Unknown action.");
  } catch (e) {
    return failure(e);
  }
}
