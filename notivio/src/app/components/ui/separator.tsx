import * as React from "react";

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
}

export const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className = "", orientation = "horizontal", ...props }, ref) => {
    const isHorizontal = orientation === "horizontal";

    return (
      <div
        ref={ref}
        className={`
          ${isHorizontal ? "w-full h-px" : "h-full w-px"}
          bg-gray-300
          ${className}
        `}
        {...props}
      />
    );
  }
);

Separator.displayName = "Separator";
