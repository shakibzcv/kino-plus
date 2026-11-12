"use client";

import React from "react";
import AuthPage from "./AuthPage";

/**
 * 🌟 Auth View
 * Rendered when no authenticated user session is detected.
 * Full-screen split view with hero & animated poster waterfall.
 */
export default function LandingPageContent(): React.ReactElement {
  return (
    <div className="h-screen w-full bg-[#0e1013] text-white overflow-hidden select-none font-sans">
      <AuthPage />
    </div>
  );
}
