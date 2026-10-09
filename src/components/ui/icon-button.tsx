import { forwardRef, type ReactNode } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type IconButtonProps = Omit<ButtonProps, "children" | "leadingIcon" | "trailingIcon"> & {
  "aria-label": string;
  icon: ReactNode;
};

const squareSizes = {
  xs: "size-7 px-0",
  sm: "size-8 px-0",
  md: "size-10 px-0",
  lg: "size-12 px-0",
  xl: "size-14 px-0",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, size = "md", className, ...props }, ref) => (
    <Button
      ref={ref}
      size={size}
      className={cn(squareSizes[size ?? "md"], className)}
      {...props}
    >
      <span aria-hidden="true">{icon}</span>
    </Button>
  ),
);

IconButton.displayName = "IconButton";
