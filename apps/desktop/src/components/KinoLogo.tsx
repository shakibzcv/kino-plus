import React from "react";
import { KinoLogo as SharedKinoLogo, type KinoLogoProps as SharedLogoProps } from "@repo/ui/kino-logo";

export default function KinoLogo(props: SharedLogoProps): React.ReactElement {
  const Logo = SharedKinoLogo as React.ComponentType<any>;
  return <Logo {...props} />;
}
