import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

type DividerProps = HTMLAttributes<HTMLHRElement> & {
  orientation?: "horizontal" | "vertical";
};

export function Divider({ orientation = "horizontal", className, ...props }: DividerProps) {
  return (
    <hr
      aria-orientation={orientation}
      className={cn(
        "shrink-0 border-0 bg-border-subtle",
        orientation === "horizontal" ? "h-px w-full" : "h-full min-h-6 w-px",
        className,
      )}
      {...props}
    />
  );
}
