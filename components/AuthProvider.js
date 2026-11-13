"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AUTH_EVENT, PROGRESS_EVENT, getCurrentUser } from "@/lib/auth";

const AuthContext = createContext({
  user: null,
  loading: true,
  refresh: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

/**
 * Hydrates the session on mount and keeps it in sync when any tab logs in,
 * logs out, migrates a guest, or writes progress.
 */
export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setUser(getCurrentUser());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();

    function handleAuthChange() {
      refresh();
    }

    function handleProgressChange(event) {
      setUser((current) => {
        if (!current) {
          return current;
        }

        const changedUsername = event?.detail?.username;
        if (changedUsername && changedUsername !== current.username) {
          return current;
        }

        return getCurrentUser() ?? current;
      });
    }

    function handleStorage(event) {
      if (!event.key || event.key.startsWith("codementor")) {
        refresh();
      }
    }

    window.addEventListener(AUTH_EVENT, handleAuthChange);
    window.addEventListener(PROGRESS_EVENT, handleProgressChange);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(AUTH_EVENT, handleAuthChange);
      window.removeEventListener(PROGRESS_EVENT, handleProgressChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, [refresh]);

  const value = useMemo(
    () => ({ user, loading, refresh }),
    [user, loading, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
