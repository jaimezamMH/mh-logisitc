import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, AUTH_VALUE } from "@/lib/auth";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/login")) {
    return NextResponse.next();
  }

  const autenticado = req.cookies.get(AUTH_COOKIE)?.value === AUTH_VALUE;
  if (!autenticado) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
