import React from "react";
import Link from "next/link";
import { KinoLogo as SharedKinoLogo, type KinoLogoProps as SharedLogoProps } from "@repo/ui/kino-logo";

interface KinoLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  href?: string;
}

export default function KinoLogo({ href, ...props }: KinoLogoProps): React.ReactElement {
  const Logo = SharedKinoLogo as React.ComponentType<any>;
  if (href) {
    return (
      <Logo
        {...props}
        renderLink={(content: any) => (
          <Link href={href} className="inline-flex items-center flex-shrink-0 group">
            {content as any}
          </Link>
        )}
      />
    );
  }
  return <Logo {...props} />;
}
