"use client";

import { LogOut, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NAV_ITEMS } from "@/lib/constants";
import { logout } from "@/lib/auth";
import { initial } from "@/lib/bn";
import { cn } from "@/lib/cn";
import { useDb } from "@/lib/store";
import type { AdminProfile } from "@/lib/types";

export function Sidebar({
  profile,
  onNavigate,
  onClose,
  className,
}: {
  profile: AdminProfile;
  onNavigate?: () => void;
  onClose?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { settings } = useDb();

  return (
    <aside className={cn("flex h-full w-[260px] shrink-0 flex-col bg-side px-5 py-7 text-side-text", className)}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <Link href="/admin" className="block text-brand font-bold leading-snug text-white hover:text-white">
            {settings.orgName}
          </Link>
          <p className="mb-8 mt-1 text-caption text-side-muted">{settings.orgSub}</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="মেনু বন্ধ করুন"
            className="-mr-2 -mt-2 flex size-11 items-center justify-center rounded-control text-side-muted hover:bg-side-active hover:text-white"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <nav aria-label="প্রধান মেনু" className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-2.5 rounded-control px-3.5 py-[11px] text-body transition-colors duration-150",
                active
                  ? "bg-side-active font-semibold text-white hover:text-white"
                  : "text-side-text hover:bg-side-active/60 hover:text-white",
              )}
            >
              <span
                aria-hidden
                className={cn("size-[7px] shrink-0 rounded-full", active ? "bg-side-dot-on" : "bg-side-dot")}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex items-center gap-2.5 border-t border-side-line pt-5">
        <div
          aria-hidden
          className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-primary text-body font-bold text-white"
        >
          {initial(profile.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-small font-semibold text-white">{profile.name}</div>
          <div className="truncate text-[11px] text-side-muted">{profile.role}</div>
        </div>
        <button
          type="button"
          onClick={async () => {
            await logout();
            router.replace("/admin/login");
          }}
          aria-label="লগ আউট"
          title="লগ আউট"
          className="flex size-11 shrink-0 items-center justify-center rounded-control text-side-muted hover:bg-side-active hover:text-white"
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
