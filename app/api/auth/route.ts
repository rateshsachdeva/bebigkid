import { NextResponse } from "next/server";
import {
  AppError,
  body,
  check,
  emailHash,
  failure,
  origin,
  provisionParent,
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
    if (b.action === "google") {
      const appUrl = process.env.APP_URL;
      if (!appUrl)
        throw new AppError("The service address is not configured.", 503);
      const { data, error } = await db.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: new URL("/auth/callback", appUrl).toString(),
        },
      });
      check(error);
      if (!data.url) throw new AppError("Google sign-in could not start.", 503);
      const providerUrl = new URL(data.url);
      const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
      if (providerUrl.origin !== supabaseUrl.origin)
        throw new AppError("Google sign-in could not start.", 503);
      return NextResponse.json({ url: providerUrl.toString() });
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
      await provisionParent(db, data.user.id);
      return NextResponse.json({ ok: true });
    }
    throw new AppError("Unknown action.");
  } catch (e) {
    return failure(e);
  }
}
