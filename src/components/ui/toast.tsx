"use client";

import { CheckCircle2, TriangleAlert } from "lucide-react";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "success" | "error";
interface ToastItem {
  id: number;
  message: string;
  tone: Tone;
}

const Ctx = createContext<(message: string, tone?: Tone) => void>(() => {});

export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((message: string, tone: Tone = "success") => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s, { id, message, tone }]);
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), 4200);
  }, []);

  return (
    <Ctx.Provider value={push}>
      {children}
      <div
        aria-live="polite"
        className="no-print pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
      >
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              "pointer-events-auto flex max-w-sm animate-pop items-start gap-2.5 rounded-card border bg-surface px-4 py-3 text-body font-medium text-ink",
              t.tone === "success" ? "border-st-resolved" : "border-st-rejected",
            )}
          >
            {t.tone === "success" ? (
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-st-resolved" />
            ) : (
              <TriangleAlert size={18} className="mt-0.5 shrink-0 text-st-rejected" />
            )}
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
