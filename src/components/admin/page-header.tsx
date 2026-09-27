"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useSession } from "@/lib/auth";
import { initial } from "@/lib/bn";
import { NotificationBell } from "./notification-bell";

function HeaderTools() {
  const router = useRouter();
  const session = useSession();
  const [q, setQ] = useState("");

  return (
    <div className="no-print hidden items-center gap-3 lg:flex">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          router.push(q.trim() ? `/admin/complaints?q=${encodeURIComponent(q.trim())}` : "/admin/complaints");
        }}
        className="relative"
      >
        <Search size={16} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="আইডি বা বিষয় দিয়ে খুঁজুন"
          aria-label="আইডি বা বিষয় দিয়ে খুঁজুন"
          className="min-h-11 w-[260px] rounded-control border border-line bg-surface py-2.5 pl-9 pr-3.5 text-body focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-0"
        />
      </form>
      <NotificationBell />
      <div
        aria-hidden
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-lead font-bold text-white"
      >
        {session ? initial(session.name) : ""}
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
      <title>{`${title} | নাগরিক অভিযোগ সেল`}</title>
      <div className="min-w-0">
        <h1 className="text-title font-bold leading-snug text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-body text-muted">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {actions}
        <HeaderTools />
      </div>
    </header>
  );
}
