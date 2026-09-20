import { NextResponse } from "next/server";
import { provisionParent, sessionClient } from "@/lib/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const configuredUrl = process.env.APP_URL;
  const appOrigin = configuredUrl
    ? new URL(configuredUrl).origin
    : requestUrl.origin;
  const errorUrl = new URL("/sign-in?auth_error=google", appOrigin);
  try {
    const code = requestUrl.searchParams.get("code");
    if (!code) return NextResponse.redirect(errorUrl, { status: 303 });
    const db = await sessionClient();
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(errorUrl, { status: 303 });
    const {
      data: { user },
      error: userError,
    } = await db.auth.getUser();
    if (userError || !user)
      return NextResponse.redirect(errorUrl, { status: 303 });
    await provisionParent(db, user.id);
    return NextResponse.redirect(new URL("/welcome", appOrigin), {
      status: 303,
    });
  } catch {
    return NextResponse.redirect(errorUrl, { status: 303 });
  }
}
