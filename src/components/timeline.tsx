"use client";

import { Check, X } from "lucide-react";
import { useT } from "@/lib/i18n";
import { STATUS_FLOW, STEP_LABEL } from "@/lib/constants";
import { cn } from "@/lib/cn";
import type { Complaint, Status } from "@/lib/types";

interface Step {
  label: string;
  date?: string;
  state: "done" | "current" | "pending" | "rejected";
}

function buildSteps(c: Complaint): Step[] {
  const dateOf = (s: Status) => {
    for (let i = c.history.length - 1; i >= 0; i--) if (c.history[i].status === s) return c.history[i].at;
    return undefined;
  };

  if (c.status === "rejected") {
    const reached = STATUS_FLOW.filter((s) => dateOf(s));
    return [
      ...reached.map((s) => ({ label: STEP_LABEL[s as keyof typeof STEP_LABEL], date: dateOf(s), state: "done" as const })),
      { label: "বাতিল করা হয়েছে", date: dateOf("rejected"), state: "rejected" as const },
    ];
  }

  const idx = STATUS_FLOW.indexOf(c.status);
  return STATUS_FLOW.map((s, i) => ({
    label: STEP_LABEL[s as keyof typeof STEP_LABEL],
    date: dateOf(s),
    // A resolved complaint is fully complete — no "current" step left.
    state: i < idx || c.status === "resolved" ? "done" : i === idx ? "current" : "pending",
  }));
}

export function Timeline({ complaint }: { complaint: Complaint }) {
  const { t, dateLong } = useT();
  const steps = buildSteps(complaint);
  return (
    <ol className="flex flex-col">
      {steps.map((s, i) => {
        const last = i === steps.length - 1;
        const done = s.state === "done";
        const current = s.state === "current";
        const rejected = s.state === "rejected";
        return (
          <li key={s.label} className="flex gap-3.5" aria-current={current ? "step" : undefined}>
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex size-[26px] shrink-0 items-center justify-center rounded-full border-2 text-caption font-bold",
                  done && "border-primary bg-primary text-white",
                  current && "border-primary bg-surface text-primary",
                  rejected && "border-st-rejected bg-st-rejected text-white",
                  s.state === "pending" && "border-line-strong bg-surface text-faint",
                )}
              >
                {done ? <Check size={14} strokeWidth={3} /> : rejected ? <X size={14} strokeWidth={3} /> : i + 1}
              </div>
              {!last && <div className={cn("min-h-[22px] w-0.5 grow", done ? "bg-primary" : "bg-line-strong")} />}
            </div>
            <div className={cn(!last && "pb-5")}>
              <div
                className={cn(
                  "text-small font-semibold",
                  rejected ? "text-st-rejected" : done || current ? "text-ink" : "text-faint",
                )}
              >
                {t(s.label)}
                {done && <span className="sr-only"> ({t("সম্পন্ন")})</span>}
                {current && <span className="sr-only"> ({t("বর্তমান ধাপ")})</span>}
              </div>
              <div className="mt-0.5 text-caption text-faint">
                {s.date ? dateLong(s.date) : s.state === "pending" ? t("অপেক্ষমাণ") : ""}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
