import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
});
