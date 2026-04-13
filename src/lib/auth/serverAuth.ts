import { cookies } from "next/headers";
import {
  getRoleFromCookieValue,
  isMockAuthenticatedFromCookieValue,
} from "@/lib/auth/mockAuth";

export function getServerMockAuth() {
  const cookieStore = cookies();
  const authCookie = cookieStore.get("sp_spaces_auth")?.value;
  const role = getRoleFromCookieValue(authCookie);

  return {
    isAuthenticated: isMockAuthenticatedFromCookieValue(authCookie),
    role,
    isAdmin: role === "admin",
  };
}
