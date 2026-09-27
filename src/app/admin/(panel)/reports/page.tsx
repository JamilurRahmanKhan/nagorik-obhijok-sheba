"use client";

import { Download, Printer } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { controlClass } from "@/components/ui/fields";
import { Skeleton } from "@/components/ui/misc";
import { BN_MONTHS, EN_MONTHS, dhakaParts } from "@/lib/bn";
import { ALL_STATUSES, OPEN_STATUSES, STATUS_META } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { downloadCsv } from "@/lib/csv";
import { isOpen, resolutionDays, resolvedAt, slaInfo } from "@/lib/metrics";
import { officerLabel, useDb } from "@/lib/store";
import { useT, type Lang } from "@/lib/i18n";
import type { Complaint } from "@/lib/types";

const RANGES = [
  { key: "all", label: "সব সময়", days: 0 },
  { key: "30", label: "গত ৩০ দিন", days: 30 },
  { key: "90", label: "গত ৯০ দিন", days: 90 },
  { key: "180", label: "গত ১৮০ দিন", days: 180 },
] as const;

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);

function Kpi({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: string }) {
  return (
    <div className="rounded-card border border-line bg-surface p-4 sm:px-[22px] sm:py-5">
      <div className="text-small font-semibold text-muted">{label}</div>
      <div className={cn("mt-2 text-stat font-bold leading-tight", tone ?? "text-primary")}>{value}</div>
      {hint && <div className="mt-1 text-caption text-muted">{hint}</div>}
    </div>
  );
}

function Legend({ items }: { items: { color: string; label: string }[] }) {
  const { t } = useT();
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-caption text-muted">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-sm" style={{ background: i.color }} />
          {t(i.label)}
        </li>
      ))}
    </ul>
  );
}

function TableWrap({ children }: { children: ReactNode }) {
  return <div className="-mx-5 overflow-x-auto sm:-mx-6">{children}</div>;
}

const th = "px-4 py-2.5 text-left text-caption font-semibold text-muted whitespace-nowrap";
const td = "px-4 py-3 text-body whitespace-nowrap";

export default function ReportsPage() {
  const { complaints, officers, settings, loading } = useDb();
  const { t, tt, n, lang } = useT();
  const hydrated = !loading;
  const [range, setRange] = useState<(typeof RANGES)[number]["key"]>("all");
  const days1 = (v: number | null) => (v === null ? "—" : tt("daysCount", { n: n(v.toFixed(1)) }));
  const monthName = (m: number, l: Lang) => (l === "en" ? EN_MONTHS[m].slice(0, 3) : BN_MONTHS[m]);

  const data = useMemo(() => {
    const now = new Date();
    const days = RANGES.find((r) => r.key === range)!.days;
    const list: Complaint[] = days
      ? complaints.filter((c) => now.getTime() - new Date(c.createdAt).getTime() <= days * 86_400_000)
      : complaints;

    const resolved = list.filter((c) => c.status === "resolved");
    const rejected = list.filter((c) => c.status === "rejected");
    const open = list.filter(isOpen);
    const overdue = open.filter((c) => slaInfo(c, settings, now).kind === "open-late");
    const withinSla = resolved.filter((c) => slaInfo(c, settings, now).kind === "done-ok");
    const avgDays = avg(resolved.map((c) => resolutionDays(c) ?? 0));

    // monthly trend
    const key = (iso: string) => {
      const p = dhakaParts(iso);
      return p.year * 12 + p.month;
    };
    const created = list.map((c) => key(c.createdAt));
    const keys: number[] = [];
    if (created.length) {
      const lo = Math.max(Math.min(...created), Math.max(...created) - 11);
      for (let k = lo; k <= Math.max(...created); k++) keys.push(k);
    }
    const months = keys.map((k) => ({
      k,
      month: k % 12,
      year: Math.floor(k / 12),
      received: list.filter((c) => key(c.createdAt) === k).length,
      resolved: resolved.filter((c) => key(resolvedAt(c)!) === k).length,
    }));

    // by category
    const byCategory = [...new Set(list.map((c) => c.category))]
      .map((cat) => {
        const items = list.filter((c) => c.category === cat);
        return {
          cat,
          total: items.length,
          resolved: items.filter((c) => c.status === "resolved").length,
          open: items.filter(isOpen).length,
          rejected: items.filter((c) => c.status === "rejected").length,
        };
      })
      .sort((a, b) => b.total - a.total);

    // by status
    const byStatus = ALL_STATUSES.map((s) => ({ s, count: list.filter((c) => c.status === s).length })).filter((x) => x.count > 0);

    // by department
    const byDept = [...new Set(list.map((c) => c.department))]
      .map((dept) => {
        const items = list.filter((c) => c.department === dept);
        const res = items.filter((c) => c.status === "resolved");
        return {
          dept,
          total: items.length,
          resolved: res.length,
          avg: avg(res.map((c) => resolutionDays(c) ?? 0)),
          overdue: items.filter((c) => isOpen(c) && slaInfo(c, settings, now).kind === "open-late").length,
        };
      })
      .sort((a, b) => b.total - a.total);

    // by officer
    const byOfficer = officers
      .map((o) => {
        const items = list.filter((c) => c.officerId === o.id);
        const res = items.filter((c) => c.status === "resolved");
        return {
          o,
          total: items.length,
          open: items.filter(isOpen).length,
          resolved: res.length,
          avg: avg(res.map((c) => resolutionDays(c) ?? 0)),
          sla: res.length ? pct(res.filter((c) => slaInfo(c, settings, now).kind === "done-ok").length, res.length) : null,
        };
      })
      .filter((x) => x.total > 0)
      .sort((a, b) => b.resolved - a.resolved);

    return { list, resolved, rejected, open, overdue, withinSla, avgDays, months, byCategory, byStatus, byDept, byOfficer };
  }, [complaints, officers, settings, range]);

  const maxMonth = Math.max(1, ...data.months.flatMap((m) => [m.received, m.resolved]));
  const maxCat = Math.max(1, ...data.byCategory.map((c) => c.total));

  const exportCsv = () => {
    const rows: (string | number)[][] = [
      [t("প্রতিবেদন"), t(RANGES.find((r) => r.key === range)!.label)],
      [],
      [t("মোট অভিযোগ"), data.list.length],
      [t("সমাধান হয়েছে"), data.resolved.length],
      [t("বাতিল"), data.rejected.length],
      [t("চলমান"), data.open.length],
      [t("সময়সীমা অতিক্রান্ত (চলমান)"), data.overdue.length],
      [t("গড় সমাধান সময় (দিন)"), data.avgDays === null ? "" : data.avgDays.toFixed(1)],
      [],
      [t("বিভাগ"), t("মোট"), t("সমাধান"), t("চলমান"), t("বাতিল")],
      ...data.byCategory.map((c) => [c.cat, c.total, c.resolved, c.open, c.rejected]),
      [],
      [t("দপ্তর"), t("মোট"), t("সমাধান"), t("গড় সময় (দিন)"), t("অতিক্রান্ত")],
      ...data.byDept.map((d) => [d.dept, d.total, d.resolved, d.avg === null ? "" : d.avg.toFixed(1), d.overdue]),
      [],
      [t("কর্মকর্তা"), t("নির্ধারিত"), t("চলমান"), t("সমাধান"), t("গড় সময় (দিন)"), t("সময়ের মধ্যে %")],
      ...data.byOfficer.map((x) => [officerLabel(x.o), x.total, x.open, x.resolved, x.avg === null ? "" : x.avg.toFixed(1), x.sla ?? ""]),
    ];
    downloadCsv(`${t("প্রতিবেদন")}.csv`, rows);
  };

  return (
    <>
      <PageHeader
        title={t("প্রতিবেদন")}
        subtitle={t("অভিযোগের পরিসংখ্যান, সমাধানের গতি এবং কর্মকর্তা ও দপ্তরভিত্তিক কর্মক্ষমতা")}
        actions={
          <div className="no-print flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportCsv} disabled={!hydrated}>
              <Download size={16} /> CSV
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer size={16} /> {t("প্রিন্ট")}
            </Button>
          </div>
        }
      />

      <div className="no-print flex flex-wrap items-center gap-3">
        <label htmlFor="range" className="text-small font-semibold text-ink">
          {t("সময়কাল")}
        </label>
        <select id="range" value={range} onChange={(e) => setRange(e.target.value as typeof range)} className={cn(controlClass, "max-w-56")}>
          {RANGES.map((r) => (
            <option key={r.key} value={r.key}>
              {t(r.label)}
            </option>
          ))}
        </select>
      </div>

      {!hydrated ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" role="status" aria-label={t("লোড হচ্ছে")}>
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <>
          <section aria-label={t("মূল সূচক")} className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            <Kpi label={t("মোট অভিযোগ")} value={n(data.list.length)} hint={tt("openCountHint", { n: n(data.open.length) })} />
            <Kpi
              label={t("সমাধানের হার")}
              value={`${n(pct(data.resolved.length, data.list.length))}%`}
              hint={tt("resolvedCountHint", { n: n(data.resolved.length) })}
              tone="text-st-resolved"
            />
            <Kpi label={t("গড় সমাধান সময়")} value={days1(data.avgDays)} hint={t("জমা থেকে সমাধান পর্যন্ত")} tone="text-st-new" />
            <Kpi
              label={t("সময়সীমা অতিক্রান্ত")}
              value={n(data.overdue.length)}
              hint={tt("withinSlaHint", { pct: n(pct(data.withinSla.length, data.resolved.length)) })}
              tone={data.overdue.length ? "text-st-rejected" : "text-st-resolved"}
            />
          </section>

          <div className="grid items-start gap-5 xl:grid-cols-5">
            <Card className="xl:col-span-3">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="mb-0">{t("মাসভিত্তিক অভিযোগ ও সমাধান")}</CardTitle>
                <Legend
                  items={[
                    { color: "var(--color-st-new)", label: "প্রাপ্ত" },
                    { color: "var(--color-st-resolved)", label: "সমাধান" },
                  ]}
                />
              </div>
              {data.months.length === 0 ? (
                <p className="py-10 text-center text-body text-muted">{t("এই সময়কালে কোনো তথ্য নেই।")}</p>
              ) : (
                <>
                  <div className="flex h-56 items-end gap-2 border-b border-line sm:gap-4" role="img" aria-label={t("মাসভিত্তিক প্রাপ্ত ও সমাধানকৃত অভিযোগের বার চার্ট")}>
                    {data.months.map((m) => (
                      <div key={m.k} className="flex h-full min-w-0 flex-1 flex-col justify-end">
                        <div className="flex h-full items-end justify-center gap-1">
                          {[
                            { v: m.received, c: "var(--color-st-new)" },
                            { v: m.resolved, c: "var(--color-st-resolved)" },
                          ].map((b, i) => (
                            <div key={i} className="flex h-full w-full max-w-9 flex-col justify-end">
                              <span className="mb-1 text-center text-caption font-semibold text-ink-2">{n(b.v)}</span>
                              <div className="w-full rounded-t-[4px]" style={{ height: `${(b.v / maxMonth) * 82}%`, background: b.c, minHeight: b.v ? 3 : 0 }} />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-2 sm:gap-4">
                    {data.months.map((m) => (
                      <div key={m.k} className="min-w-0 flex-1 text-center text-caption text-muted">
                        <span className="block truncate">{monthName(m.month, lang)}</span>
                      </div>
                    ))}
                  </div>
                  <table className="sr-only">
                    <caption>{t("মাসভিত্তিক তথ্য")}</caption>
                    <thead>
                      <tr>
                        <th scope="col">{t("মাস")}</th>
                        <th scope="col">{t("প্রাপ্ত")}</th>
                        <th scope="col">{t("সমাধান")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.months.map((m) => (
                        <tr key={m.k}>
                          <th scope="row">{monthName(m.month, lang)}</th>
                          <td>{n(m.received)}</td>
                          <td>{n(m.resolved)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </Card>

            <Card className="xl:col-span-2">
              <CardTitle>{t("স্ট্যাটাস অনুযায়ী বিন্যাস")}</CardTitle>
              <div className="flex h-4 overflow-hidden rounded-full bg-line" role="img" aria-label={t("স্ট্যাটাস অনুযায়ী অভিযোগের বিন্যাস")}>
                {data.byStatus.map(({ s, count }) => (
                  <div
                    key={s}
                    style={{ width: `${(count / data.list.length) * 100}%`, background: STATUS_META[s].color }}
                    title={`${t(STATUS_META[s].label)}: ${n(count)}`}
                  />
                ))}
              </div>
              <ul className="mt-4 flex flex-col gap-2.5">
                {data.byStatus.map(({ s, count }) => (
                  <li key={s} className="flex items-center justify-between gap-3 text-body">
                    <span className="flex items-center gap-2">
                      <span aria-hidden className="size-2.5 rounded-sm" style={{ background: STATUS_META[s].color }} />
                      {t(STATUS_META[s].label)}
                    </span>
                    <span className="font-semibold text-ink">
                      {n(count)} <span className="font-normal text-muted">({n(pct(count, data.list.length))}%)</span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 border-t border-line pt-3 text-caption text-muted">
                {t("চলমান")} = {OPEN_STATUSES.map((s) => t(STATUS_META[s].label)).join(", ")}
              </p>
            </Card>
          </div>

          <Card>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="mb-0">{t("বিভাগভিত্তিক অভিযোগ")}</CardTitle>
              <Legend
                items={[
                  { color: "var(--color-st-resolved)", label: "সমাধান" },
                  { color: "var(--color-st-progress)", label: "চলমান" },
                  { color: "var(--color-st-rejected)", label: "বাতিল" },
                ]}
              />
            </div>
            <ul className="flex flex-col gap-3">
              {data.byCategory.map((c) => (
                <li key={c.cat} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 md:grid-cols-[200px_minmax(0,1fr)_40px]">
                  <span className="truncate text-body text-ink">{c.cat}</span>
                  <span className="text-right text-body font-semibold text-ink md:order-3">{n(c.total)}</span>
                  <div className="col-span-2 flex h-3 overflow-hidden rounded-full bg-line md:col-span-1" style={{ width: `${Math.max(6, (c.total / maxCat) * 100)}%` }}>
                    <div style={{ width: `${(c.resolved / c.total) * 100}%`, background: "var(--color-st-resolved)" }} />
                    <div style={{ width: `${(c.open / c.total) * 100}%`, background: "var(--color-st-progress)" }} />
                    <div style={{ width: `${(c.rejected / c.total) * 100}%`, background: "var(--color-st-rejected)" }} />
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <div className="grid items-start gap-5 xl:grid-cols-2">
            <Card>
              <CardTitle>{t("দপ্তরভিত্তিক কর্মক্ষমতা")}</CardTitle>
              <TableWrap>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-canvas">
                      <th scope="col" className={th}>{t("দপ্তর")}</th>
                      <th scope="col" className={th}>{t("মোট")}</th>
                      <th scope="col" className={th}>{t("সমাধান")}</th>
                      <th scope="col" className={th}>{t("গড় সময়")}</th>
                      <th scope="col" className={th}>{t("অতিক্রান্ত")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byDept.map((d) => (
                      <tr key={d.dept} className="border-t border-line">
                        <th scope="row" className={cn(td, "text-left font-medium text-ink")}>{d.dept}</th>
                        <td className={td}>{n(d.total)}</td>
                        <td className={td}>{n(d.resolved)}</td>
                        <td className={td}>{days1(d.avg)}</td>
                        <td className={cn(td, d.overdue ? "font-semibold text-st-rejected" : "text-muted")}>{n(d.overdue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            </Card>

            <Card>
              <CardTitle>{t("কর্মকর্তাভিত্তিক কর্মক্ষমতা")}</CardTitle>
              {data.byOfficer.length === 0 ? (
                <p className="text-body text-muted">{t("এই সময়কালে কোনো কর্মকর্তার নামে অভিযোগ নেই।")}</p>
              ) : (
                <TableWrap>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-canvas">
                        <th scope="col" className={th}>{t("কর্মকর্তা")}</th>
                        <th scope="col" className={th}>{t("নির্ধারিত")}</th>
                        <th scope="col" className={th}>{t("চলমান")}</th>
                        <th scope="col" className={th}>{t("সমাধান")}</th>
                        <th scope="col" className={th}>{t("গড় সময়")}</th>
                        <th scope="col" className={th}>{t("সময়ের মধ্যে")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byOfficer.map((x) => (
                        <tr key={x.o.id} className="border-t border-line">
                          <th scope="row" className={cn(td, "text-left font-medium text-ink")}>{officerLabel(x.o)}</th>
                          <td className={td}>{n(x.total)}</td>
                          <td className={td}>{n(x.open)}</td>
                          <td className={td}>{n(x.resolved)}</td>
                          <td className={td}>{days1(x.avg)}</td>
                          <td className={td}>{x.sla === null ? "—" : `${n(x.sla)}%`}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableWrap>
              )}
            </Card>
          </div>

          <p className="text-caption text-muted">
            {tt("slaFooter", { high: n(settings.slaDays.high), medium: n(settings.slaDays.medium), low: n(settings.slaDays.low) })}
          </p>
        </>
      )}
    </>
  );
}
