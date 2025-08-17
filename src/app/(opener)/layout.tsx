import type { ReactNode } from "react";

// This minimal layout ensures that pages within the (opener) route group
// do not inherit the main application layout (sidebar, header, etc.).
export default function OpenerLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
