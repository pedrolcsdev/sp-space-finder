import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getRoleFromCookieValue } from "@/lib/auth/mockAuth";

const USER_PROTECTED_PATHS = ["/perfil", "/minhas-reservas", "/favoritos"];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const authCookie = request.cookies.get("sp_spaces_auth")?.value;
  const role = getRoleFromCookieValue(authCookie);
  const isAuthenticated = Boolean(role);

  const isUserProtectedPath = USER_PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (isUserProtectedPath && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", "/admin");
      return NextResponse.redirect(loginUrl);
    }

    if (role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/perfil/:path*", "/minhas-reservas/:path*", "/favoritos/:path*", "/admin/:path*"],
};
