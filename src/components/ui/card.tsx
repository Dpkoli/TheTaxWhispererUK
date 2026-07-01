import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-xl border border-line bg-white/60 p-6 shadow-sm",
        className,
      )}
      {...props}
    />
  );
}
