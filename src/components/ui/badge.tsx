import type { Priority, Status } from "@/lib/types";
import { PRIORITY_META, STATUS_META } from "@/lib/constants";
import { cn } from "@/lib/cn";

const pill = "inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-caption font-semibold";

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const m = STATUS_META[status];
  return <span className={cn(pill, m.pill, className)}>{m.label}</span>;
}

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  const m = PRIORITY_META[priority];
  return <span className={cn(pill, m.pill, className)}>{m.label}</span>;
}

export function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn(pill, "bg-primary-tint text-primary", className)}>{children}</span>;
}
