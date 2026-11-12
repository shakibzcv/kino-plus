"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import AuthenticatedDashboard from "./AuthenticatedDashboard";
import LandingPageContent from "./LandingPageContent";

interface HomeClientProps {
  initialAuthenticated: boolean;
}

/**
 * 🌟 Dynamic Home Client Orchestrator
 * Seamlessly switches between the Authenticated Dashboard and the Landing Page
 * based on server SSR authentication status and live client AuthContext updates.
 */
export default function HomeClient({
  initialAuthenticated,
}: HomeClientProps): React.ReactElement {
  const { isAuthenticated, token, user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAuthed =
    initialAuthenticated ||
    (mounted && (isAuthenticated || Boolean(token) || Boolean(user)));

  if (isAuthed) {
    return (
      <div className="w-full min-h-screen transition-opacity duration-300 animate-fadeIn">
        <AuthenticatedDashboard />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen transition-opacity duration-300">
      <LandingPageContent />
    </div>
  );
}
