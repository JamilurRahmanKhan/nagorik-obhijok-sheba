import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const controlClass =
  "w-full rounded-control border border-line bg-surface px-3 py-2.5 text-body text-ink transition-colors duration-150 min-h-11 focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary disabled:bg-canvas disabled:text-muted aria-[invalid=true]:border-st-rejected";

export function Field({
  label,
  htmlFor,
  required,
  hint,
  error,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-small font-semibold text-ink">
        {label}
        {required && (
          <span aria-hidden className="text-st-rejected">
            {" "}
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && <p className="text-caption text-muted">{hint}</p>}
      {error && (
        <p id={`${htmlFor}-error`} role="alert" className="text-caption font-medium text-st-rejected">
          {error}
        </p>
      )}
    </div>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClass, className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(controlClass, "pr-8", className)} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(controlClass, "resize-y leading-relaxed", className)} {...props} />;
}
