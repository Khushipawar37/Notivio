import * as React from "react";

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`w-full h-px bg-gray-300 ${className}`}
        {...props}
      />
    );
  }
);

Separator.displayName = "Separator";
