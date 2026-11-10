import { NextResponse, type NextRequest } from "next/server";
import { homeFor, verifyLoginToken } from "@/lib/accounts";
import { sessionCookie } from "@/server/session";

/** Opening a signed login link signs that account in and lands on its home. */
export async function GET(request: NextRequest, ctx: RouteContext<"/auth/[token]">) {
  const { token } = await ctx.params;
  const account = verifyLoginToken(decodeURIComponent(token));
  if (!account) {
    return NextResponse.redirect(new URL("/sign-in?error=link", request.url));
  }
  const [name, value] = sessionCookie({ role: account.role, id: account.id });
  const response = NextResponse.redirect(new URL(homeFor(account.role), request.url));
  response.cookies.set(name, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return response;
}
