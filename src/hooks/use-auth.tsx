"use client";

import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  authenticateMockUser,
  clearMockSession,
  getStoredMockSession,
  MOCK_AUTH_EVENT,
  MOCK_AUTH_STORAGE_KEY,
  type MockLoginResult,
  type MockSession,
} from "@/lib/auth/mockAuth";

interface AuthContextValue {
  session: MockSession | null;
  isReady: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => MockLoginResult;
  logout: () => void;
  refresh: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const isSameSession = (left: MockSession | null, right: MockSession | null) => {
  if (left === right) {
    return true;
  }

  if (!left || !right) {
    return false;
  }

  return (
    left.loggedInAt === right.loggedInAt &&
    left.user.id === right.user.id &&
    left.user.role === right.user.role &&
    left.user.email === right.user.email
  );
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<MockSession | null>(null);
  const [isReady, setIsReady] = useState(false);

  const refresh = useCallback(() => {
    const nextSession = getStoredMockSession();

    setSession((current) => (isSameSession(current, nextSession) ? current : nextSession));
    setIsReady(true);
  }, []);

  useEffect(() => {
    refresh();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === MOCK_AUTH_STORAGE_KEY) {
        refresh();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(MOCK_AUTH_EVENT, refresh);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(MOCK_AUTH_EVENT, refresh);
    };
  }, [refresh]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isReady,
      isAuthenticated: Boolean(session),
      isAdmin: session?.user.role === "admin",
      login: (email, password) => {
        const result = authenticateMockUser(email, password);
        refresh();
        return result;
      },
      logout: () => {
        clearMockSession();
        refresh();
      },
      refresh,
    }),
    [isReady, refresh, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
