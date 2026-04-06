export const MOCK_AUTH_COOKIE = "sp_spaces_auth";

export function isMockAuthenticatedFromCookieValue(cookieValue?: string) {
  return cookieValue === "1";
}
