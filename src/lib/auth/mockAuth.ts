export type UserRole = "user" | "admin";

export interface MockUser {
  id: string;
  role: UserRole;
  fullName: string;
  email: string;
  phone: string;
  address: string;
}

export interface MockSession {
  user: MockUser;
  loggedInAt: string;
}

export interface MockLoginResult {
  ok: boolean;
  session?: MockSession;
  error?: string;
}

export const MOCK_AUTH_COOKIE = "sp_spaces_auth";
export const MOCK_AUTH_STORAGE_KEY = "sp_spaces_session";
export const MOCK_AUTH_EVENT = "spspaces:auth-changed";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

const mockUsers: Array<MockUser & { password: string }> = [
  {
    id: "user-cliente",
    role: "user",
    fullName: "Marina Oliveira",
    email: "cliente@gmail.com",
    password: "cliente123",
    phone: "(11) 99876-5432",
    address: "Rua Haddock Lobo, 412 - Jardim Paulista, Sao Paulo",
  },
  {
    id: "admin-spaces",
    role: "admin",
    fullName: "Camila Araujo",
    email: "admin@gmail.com",
    password: "admin123",
    phone: "(11) 98765-4321",
    address: "Avenida Brigadeiro Faria Lima, 2400 - Itaim Bibi, Sao Paulo",
  },
];

export const mockUserDirectory: Record<string, MockUser> = mockUsers.reduce(
  (accumulator, user) => {
    const { password: _password, ...safeUser } = user;
    accumulator[safeUser.id] = safeUser;
    return accumulator;
  },
  {} as Record<string, MockUser>,
);

const isBrowser = () => typeof window !== "undefined";

const notifyAuthChange = () => {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(new Event(MOCK_AUTH_EVENT));
};

const setAuthCookie = (role?: UserRole) => {
  if (!isBrowser()) {
    return;
  }

  if (!role) {
    document.cookie = `${MOCK_AUTH_COOKIE}=; path=/; max-age=0; samesite=lax`;
    return;
  }

  document.cookie = `${MOCK_AUTH_COOKIE}=${role}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
};

const parseSession = (value: string | null): MockSession | null => {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as MockSession;

    if (!parsed?.user?.id || !parsed?.user?.role) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

export function getRoleFromCookieValue(cookieValue?: string | null): UserRole | null {
  if (cookieValue === "admin" || cookieValue === "user") {
    return cookieValue;
  }

  return null;
}

export function isMockAuthenticatedFromCookieValue(cookieValue?: string | null) {
  return Boolean(getRoleFromCookieValue(cookieValue));
}

export function isMockAdminFromCookieValue(cookieValue?: string | null) {
  return getRoleFromCookieValue(cookieValue) === "admin";
}

export function getStoredMockSession() {
  if (!isBrowser()) {
    return null;
  }

  return parseSession(window.localStorage.getItem(MOCK_AUTH_STORAGE_KEY));
}

export function persistMockSession(session: MockSession) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(MOCK_AUTH_STORAGE_KEY, JSON.stringify(session));
  setAuthCookie(session.user.role);
  notifyAuthChange();
}

export function clearMockSession() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(MOCK_AUTH_STORAGE_KEY);
  setAuthCookie();
  notifyAuthChange();
}

export function authenticateMockUser(email: string, password: string): MockLoginResult {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPassword = password.trim();

  const user = mockUsers.find((candidate) => candidate.email === normalizedEmail);

  if (!user || user.password !== normalizedPassword) {
    return {
      ok: false,
      error:
        "Credenciais inválidas. Use admin@gmail.com / admin123 ou cliente@gmail.com / cliente123.",
    };
  }

  const { password: _password, ...safeUser } = user;
  const session: MockSession = {
    user: safeUser,
    loggedInAt: new Date().toISOString(),
  };

  persistMockSession(session);

  return { ok: true, session };
}

export function getMockUserByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const found = mockUsers.find((user) => user.email === normalizedEmail);

  if (!found) {
    return null;
  }

  const { password: _password, ...safeUser } = found;
  return safeUser;
}
