import { NextResponse, type NextRequest } from "next/server";
import { homeFor, verifyLoginToken } from "@/lib/accounts";
import { sessionCookie } from "@/server/session";

/**
 * A relative redirect: behind a proxy (Render) request.url is the internal
 * address (localhost:10000), which the visitor's browser can't reach.
 */
const redirectTo = (path: string) => new NextResponse(null, { status: 307, headers: { Location: path, "Cache-Control": "no-store" } });

/** Opening a signed login link signs that account in and lands on its home. */
export async function GET(_request: NextRequest, ctx: RouteContext<"/auth/[token]">) {
  const { token } = await ctx.params;
  const account = verifyLoginToken(decodeURIComponent(token));
  if (!account) {
    return redirectTo("/sign-in?error=link");
  }
  const [name, value] = sessionCookie({ role: account.role, id: account.id });
  const response = redirectTo(homeFor(account.role));
  response.cookies.set(name, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return response;
}
