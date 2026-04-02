import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AppShellProps = {
  sidebar: ReactNode;
  children: ReactNode;
  className?: string;
  mainClassName?: string;
  contentClassName?: string;
  width?: "wide" | "narrow";
};

const widthClassNames = {
  wide: "max-w-7xl",
  narrow: "max-w-4xl"
} as const;

export function AppShell({
  sidebar,
  children,
  className,
  mainClassName,
  contentClassName,
  width = "wide"
}: AppShellProps) {
  return (
    <div className={cn("min-h-[100dvh] overflow-x-hidden bg-slate-50 lg:flex", className)}>
      {sidebar}

      <main className={cn("app-shell-main min-w-0 overflow-x-hidden", mainClassName)}>
        <div className={cn("app-page-container min-w-0", widthClassNames[width], contentClassName)}>
          {children}
        </div>
      </main>
    </div>
  );
}
