"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Route guard wrapper that restricts access to authenticated users only.
 * Redirects unauthenticated users immediately to the landing page ("/")
 * and displays a clean spinner while authentication state is resolving.
 */
export default function ProtectedRoute({
  children,
}: ProtectedRouteProps): React.ReactElement | null {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = React.useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !isLoading && !isAuthenticated) {
      router.replace("/");
    }
  }, [isMounted, isLoading, isAuthenticated, router]);

  // Keep server and client hydration render identical
  if (!isMounted || isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-[#18191c] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#f2545b] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
