"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDb } from "@/lib/store";
import { useT } from "@/lib/i18n";

export function NotificationBell() {
  const { complaints } = useDb();
  const { t, tt, n, dateShort } = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fresh = useMemo(
    () =>
      complaints
        .filter((c) => c.status === "new")
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [complaints],
  );

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={fresh.length ? tt("newComplaintsNotification", { n: n(fresh.length) }) : t("বিজ্ঞপ্তি")}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
        className="relative flex size-11 items-center justify-center rounded-control border border-line bg-surface text-ink hover:border-primary"
      >
        <Bell size={18} />
        {fresh.length > 0 && (
          <span aria-hidden className="absolute right-2 top-2 size-2 rounded-full border-[1.5px] border-white bg-st-rejected" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-[min(340px,calc(100vw-32px))] animate-pop rounded-card border border-line bg-surface">
          <div className="border-b border-line px-4 py-3 text-small font-bold text-ink">
            {tt("newComplaintsHeading", { n: n(fresh.length) })}
          </div>
          {fresh.length === 0 ? (
            <p className="px-4 py-6 text-center text-body text-muted">{t("কোনো নতুন অভিযোগ নেই")}</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {fresh.slice(0, 6).map((c) => (
                <li key={c.id} className="border-b border-line last:border-0">
                  <Link
                    href={`/admin/complaints/${c.id}`}
                    onClick={() => setOpen(false)}
                    className="block px-4 py-3 hover:bg-canvas"
                  >
                    <span className="text-caption font-semibold text-muted">
                      {c.id} · {dateShort(c.createdAt)}
                    </span>
                    <span className="block text-body font-medium text-ink">{c.subject}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/admin/complaints?status=new"
            onClick={() => setOpen(false)}
            className="block border-t border-line px-4 py-3 text-center text-small font-semibold"
          >
            {t("সব নতুন অভিযোগ দেখুন")}
          </Link>
        </div>
      )}
    </div>
  );
}
