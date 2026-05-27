"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { getProfile, logout as apiLogout } from "@/lib/api/client";
import type { User } from "@/lib/api/types";

const TOKEN_KEY = "agung-presence-token";

type AuthState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "authenticated"; user: User; token: string };

type AuthContextValue = {
  authState: AuthState;
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (token: string, user: User) => void;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const stored = window.localStorage.getItem(TOKEN_KEY);

      if (!stored) {
        if (!cancelled) {
          setAuthState({ status: "unauthenticated" });
        }
        return;
      }

      try {
        const user = await getProfile(stored);
        if (!cancelled) {
          setAuthState({ status: "authenticated", user, token: stored });
        }
      } catch {
        window.localStorage.removeItem(TOKEN_KEY);
        if (!cancelled) {
          setAuthState({ status: "unauthenticated" });
        }
      }
    }

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback((token: string, user: User) => {
    window.localStorage.setItem(TOKEN_KEY, token);
    setAuthState({ status: "authenticated", user, token });
  }, []);

  const signOut = useCallback(async () => {
    const stored = window.localStorage.getItem(TOKEN_KEY);

    if (stored) {
      await apiLogout(stored).catch(() => null);
    }

    window.localStorage.removeItem(TOKEN_KEY);
    setAuthState({ status: "unauthenticated" });
  }, []);

  const refreshUser = useCallback(async () => {
    const stored = window.localStorage.getItem(TOKEN_KEY);

    if (!stored) {
      return;
    }

    const user = await getProfile(stored);
    setAuthState({ status: "authenticated", user, token: stored });
  }, []);

  const token =
    authState.status === "authenticated" ? authState.token : null;
  const user =
    authState.status === "authenticated" ? authState.user : null;
  const isAuthenticated = authState.status === "authenticated";
  const isLoading = authState.status === "loading";

  return (
    <AuthContext.Provider
      value={{
        authState,
        token,
        user,
        isAuthenticated,
        isLoading,
        signIn,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }

  return ctx;
}
