"use client";

import { StackProvider, StackTheme } from "@stackframe/stack";
import type { ReactNode } from "react";
import { stackClientApp } from "@/stack/client";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <StackTheme>
      <StackProvider app={stackClientApp}>{children}</StackProvider>
    </StackTheme>
  );
}
