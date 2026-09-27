"use client";

import Link from "next/link";
import { fmtDateShort } from "@/lib/bn";
import type { Complaint } from "@/lib/types";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState, Skeleton } from "@/components/ui/misc";

const th = "px-4 py-3.5 text-left text-caption font-semibold text-muted";

export function ComplaintTable({
  items,
  loading,
  emptyTitle = "কোনো অভিযোগ পাওয়া যায়নি",
  emptyHint,
}: {
  items: Complaint[];
  loading?: boolean;
  emptyTitle?: string;
  emptyHint?: string;
}) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3 p-4" role="status" aria-label="লোড হচ্ছে">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    );
  }
  if (items.length === 0) return <EmptyState title={emptyTitle} hint={emptyHint} />;

  return (
    <>
      {/* ≥ md: table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-body">
          <caption className="sr-only">অভিযোগের তালিকা</caption>
          <thead>
            <tr className="bg-canvas">
              <th scope="col" className={th}>আইডি</th>
              <th scope="col" className={th}>বিষয় ও বিভাগ</th>
              <th scope="col" className={th}>অভিযোগকারী</th>
              <th scope="col" className={th}>তারিখ</th>
              <th scope="col" className={th}>স্ট্যাটাস</th>
              <th scope="col" className={th}>অ্যাকশন</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-t border-line transition-colors duration-150 hover:bg-canvas/60">
                <td className="whitespace-nowrap px-4 py-3.5 font-semibold text-ink">{c.id}</td>
                <td className="max-w-[340px] px-4 py-3.5">
                  <div className="font-medium text-ink">{c.subject}</div>
                  <div className="mt-0.5 text-caption text-muted">{c.category}</div>
                </td>
                <td className="px-4 py-3.5 text-ink">{c.citizen.name}</td>
                <td className="whitespace-nowrap px-4 py-3.5 text-muted">{fmtDateShort(c.createdAt)}</td>
                <td className="px-4 py-3.5">
                  <StatusBadge status={c.status} />
                </td>
                <td className="whitespace-nowrap px-4 py-3.5">
                  <Link
                    href={`/admin/complaints/${c.id}`}
                    className="inline-flex min-h-11 items-center text-small font-semibold"
                    aria-label={`${c.id} বিস্তারিত দেখুন`}
                  >
                    বিস্তারিত দেখুন →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* < md: cards */}
      <ul className="md:hidden">
        {items.map((c) => (
          <li key={c.id} className="border-t border-line first:border-t-0">
            <Link href={`/admin/complaints/${c.id}`} className="block px-4 py-4 hover:bg-canvas/60">
              <div className="flex items-center justify-between gap-3">
                <span className="text-small font-semibold text-ink">{c.id}</span>
                <StatusBadge status={c.status} />
              </div>
              <p className="mt-1.5 text-body font-medium text-ink">{c.subject}</p>
              <p className="mt-0.5 text-caption text-muted">
                {c.category} · {c.citizen.name} · {fmtDateShort(c.createdAt)}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
