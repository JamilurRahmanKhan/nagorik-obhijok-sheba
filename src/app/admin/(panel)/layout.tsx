"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { NotificationBell } from "@/components/admin/notification-bell";
import { Sidebar } from "@/components/admin/sidebar";
import { useSession } from "@/lib/auth";
import { useDb } from "@/lib/store";
import { useT } from "@/lib/i18n";

export default function PanelLayout({ children }: { children: ReactNode }) {
  const session = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { settings } = useDb();
  const { t } = useT();
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    if (session === null) router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
  }, [session, router, pathname]);

  if (!session) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-body text-muted" role="status">
        {t("লোড হচ্ছে…")}
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh bg-canvas">
      {/* desktop sidebar */}
      <div className="no-print sticky top-0 hidden h-dvh lg:block">
        <Sidebar profile={session} />
      </div>

      {/* mobile drawer */}
      {drawer && (
        <div className="no-print fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label={t("মেনু বন্ধ করুন")}
            className="absolute inset-0 animate-fade-in bg-ink/50"
            onClick={() => setDrawer(false)}
          />
          <Sidebar
            profile={session}
            className="relative h-full animate-slide-in overflow-y-auto"
            onNavigate={() => setDrawer(false)}
            onClose={() => setDrawer(false)}
          />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="no-print sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-surface px-4 lg:hidden">
          <button
            type="button"
            aria-label={t("মেনু খুলুন")}
            onClick={() => setDrawer(true)}
            className="-ml-2 flex size-11 items-center justify-center rounded-control text-ink hover:bg-canvas"
          >
            <Menu size={22} />
          </button>
          <Link href="/admin" className="text-h3 font-bold text-ink hover:text-ink">
            {settings.orgName}
          </Link>
          <NotificationBell />
        </div>

        <main id="main" className="print-full mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
