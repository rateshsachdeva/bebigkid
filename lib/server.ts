import "server-only";
import { ZodError } from "zod";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { randomUUID, createHash } from "node:crypto";
export class AppError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
function env(name: string) {
  const value = process.env[name];
  if (!value)
    throw new AppError(
      "The private service is not connected yet. Please use the sample experience.",
      503,
    );
  return value;
}
export function service() {
  return createClient(
    env("NEXT_PUBLIC_SUPABASE_URL"),
    process.env.SUPABASE_SECRET_KEY || env("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
export async function sessionClient() {
  const jar = await cookies();
  return createServerClient(
    env("NEXT_PUBLIC_SUPABASE_URL"),
    env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (items) =>
          items.forEach(({ name, value, options }) =>
            jar.set(name, value, {
              ...options,
              httpOnly: true,
              sameSite: "lax",
              secure: process.env.NODE_ENV === "production",
              path: "/",
            }),
          ),
      },
    },
  );
}
export async function identity(consent = true) {
  const db = await sessionClient();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user)
    throw new AppError("Sign in to open your private space.", 401);
  const { data: profile } = await db
    .from("parent_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();
  if (!profile || profile.status !== "active")
    throw new AppError("This account is not available.", 403);
  if (consent && !profile.consent_at)
    throw new AppError(
      "Please review the welcome and privacy information first.",
      403,
    );
  return { db, user, profile };
}
export async function admin(ownerOnly = true) {
  const a = await identity(false);
  const privileged = service();
  const { data: member } = await privileged
    .from("admin_memberships")
    .select("role")
    .eq("user_id", a.user.id)
    .eq("active", true)
    .single();
  if (!member || (ownerOnly && member.role !== "owner"))
    throw new AppError("This page is only available to the owner.", 403);
  const { data: aal } = await a.db.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== "aal2")
    throw new AppError(
      "Verify your authenticator code before opening owner controls.",
      403,
    );
  return { ...a, privileged, role: member.role };
}
export async function provisionParent(
  db: Awaited<ReturnType<typeof sessionClient>>,
  userId: string,
) {
  const privileged = service();
  const { data: deleted } = await privileged
    .from("deletion_ledger")
    .select("owner_id")
    .eq("owner_id", userId)
    .maybeSingle();
  if (deleted) {
    await db.auth.signOut();
    throw new AppError("This account is being removed.", 403);
  }
  const { error } = await privileged
    .from("parent_profiles")
    .upsert(
      { user_id: userId },
      { onConflict: "user_id", ignoreDuplicates: true },
    );
  check(error);
}
export function origin(req: Request) {
  const expected = process.env.APP_URL;
  if (!expected)
    throw new AppError("The service address is not configured.", 503);
  if (req.headers.get("origin") !== new URL(expected).origin)
    throw new AppError("Request not allowed.", 403);
}
export function failure(error: unknown) {
  if (error instanceof ZodError)
    error = new AppError("Please check the information and try again.", 400);
  const id = randomUUID();
  return NextResponse.json(
    {
      error:
        error instanceof AppError
          ? error.message
          : "This action could not finish. Please try again.",
      reference: id,
    },
    {
      status: error instanceof AppError ? error.status : 500,
      headers: { "Cache-Control": "private, no-store" },
    },
  );
}
export async function body(req: Request) {
  const text = await req.text();
  if (Buffer.byteLength(text) > 110000)
    throw new AppError("That input is too long.", 413);
  try {
    return JSON.parse(text);
  } catch {
    throw new AppError("Please check the information and try again.");
  }
}
export const emailHash = (email: string) =>
  createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
export async function recentLogin(
  db: Awaited<ReturnType<typeof sessionClient>>,
) {
  const {
    data: { session },
  } = await db.auth.getSession();
  if (!session?.access_token)
    throw new AppError("Sign in again to confirm this action.", 401);
  const payload = JSON.parse(
    Buffer.from(session.access_token.split(".")[1], "base64url").toString(),
  );
  const events = Array.isArray(payload.amr) ? payload.amr : [];
  const latest = Math.max(
    0,
    ...events.map((e: { timestamp?: number }) => e.timestamp ?? 0),
  );
  if (Date.now() / 1000 - latest > 900)
    throw new AppError(
      "Sign in again before exporting or deleting your account.",
      403,
    );
}
export function check(
  error: { message: string; code?: string; status?: number } | null,
) {
  if (!error) return;
  if (
    error.status === 429 ||
    error.code === "over_email_send_rate_limit" ||
    /email rate limit/i.test(error.message)
  )
    throw new AppError(
      "Too many sign-in emails were requested. Please wait an hour and try again.",
      429,
    );
  if (
    error.code === "otp_expired" ||
    /token has expired|otp expired|invalid.*otp/i.test(error.message)
  )
    throw new AppError(
      "That sign-in code has expired or was already used. Please request a new code.",
      400,
    );
  if (
    error.code === "provider_disabled" ||
    /provider is not enabled|unsupported provider/i.test(error.message)
  )
    throw new AppError(
      "Google sign-in is not available yet. Please try again later.",
      503,
    );
  throw new AppError("The action could not be saved. Please try again.", 400);
}
