import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("min-w-0 rounded-card border border-line bg-surface p-5 sm:px-6 sm:py-[22px]", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("mb-3.5 text-lead font-bold text-ink", className)} {...props} />;
}
