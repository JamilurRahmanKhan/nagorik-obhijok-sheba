import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "outline" | "ghost" | "danger";

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-[18px] py-2.5 text-body font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary-hover hover:text-on-primary",
  outline: "border-[1.5px] border-primary bg-surface text-primary hover:bg-primary-tint hover:text-primary-hover",
  ghost: "text-ink-2 hover:bg-line/60 hover:text-ink",
  danger: "border-[1.5px] border-st-rejected bg-surface text-st-rejected hover:bg-st-rejected-bg hover:text-st-rejected",
};

export function buttonClass(variant: Variant = "primary", className?: string) {
  return cn(base, variants[variant], className);
}

export function Button({
  variant = "primary",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type={type} className={buttonClass(variant, className)} {...props} />;
}

export function LinkButton({
  variant = "primary",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={buttonClass(variant, className)} {...props} />;
}
