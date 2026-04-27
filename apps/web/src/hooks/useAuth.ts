"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect } from "react";
import { apiClient } from "@/lib/api";

export function useAuth() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";

  useEffect(() => {
    if (session?.accessToken) {
      apiClient.setToken(session.accessToken as string);
    } else {
      apiClient.setToken(null);
    }
  }, [session?.accessToken]);

  const login = () => {
    signIn("google", { callbackUrl: "/app/dashboard" });
  };

  const logout = () => {
    signOut({ callbackUrl: "/" });
  };

  return {
    user: session?.user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    token: session?.accessToken as string | undefined,
  };
}
