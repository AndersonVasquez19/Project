import { NextRequest, NextResponse } from "next/server";

const ACCESS_TOKEN_COOKIE = "horus_access_token";

export function proxy(request: NextRequest) {
  if (!request.cookies.has(ACCESS_TOKEN_COOKIE)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set(
      "next",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
