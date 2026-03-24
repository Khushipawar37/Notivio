import { Suspense } from "react";
import { StackHandler } from "@stackframe/stack";

export default function StackHandlerPage() {
  return (
    <Suspense fallback={null}>
      <StackHandler fullPage />
    </Suspense>
  );
}
