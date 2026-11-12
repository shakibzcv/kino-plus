import React from "react";
import KinoLogo from "./KinoLogo";
import { AuthPageLayout } from "@repo/ui/auth-page";
import { GoogleSignInButton } from "@repo/ui/google-sign-in-button";

export interface AuthPageProps {
  onStartGoogleAuth: () => void;
  authStatus: "idle" | "requesting" | "authenticating" | "error";
  errorMessage?: string;
  onReopenBrowser?: () => void;
  onCancelAuth?: () => void;
}

export default function AuthPage({
  onStartGoogleAuth,
  authStatus,
  errorMessage,
  onReopenBrowser,
  onCancelAuth,
}: AuthPageProps): React.ReactElement {
  const isAuthenticating =
    authStatus === "authenticating" || authStatus === "requesting";

  const authAction = isAuthenticating ? (
    <div className="w-full max-w-sm space-y-4 p-5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
      <div className="flex items-center gap-3.5">
        <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-[#f2545b] animate-spin shrink-0" />
        <p className="text-xs sm:text-sm text-zinc-200 font-medium leading-relaxed">
          Please complete sign-in in your browser...
        </p>
      </div>
      <div className="flex items-center gap-2 pt-1">
        {onReopenBrowser && (
          <button
            type="button"
            onClick={onReopenBrowser}
            className="flex-1 py-2 px-3 rounded-lg bg-white/[0.1] hover:bg-white/[0.18] text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            Reopen Browser
          </button>
        )}
        {onCancelAuth && (
          <button
            type="button"
            onClick={onCancelAuth}
            className="py-2 px-3.5 rounded-lg bg-transparent hover:bg-white/[0.06] text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-start w-full sm:w-auto">
      {errorMessage && (
        <div className="p-3 mb-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-left max-w-sm">
          {errorMessage}
        </div>
      )}
      <GoogleSignInButton onClick={onStartGoogleAuth} />
    </div>
  );

  return (
    <AuthPageLayout
      logo={<KinoLogo size="lg" />}
      authAction={authAction}
      heightClass="h-full"
      containerClass="w-full max-w-[1920px] mx-auto"
    />
  );
}
