import type { ReactNode } from "react";

/** Full-screen clinical journey — outer AppShell hides its chrome on /journey. */
export default function JourneyLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
