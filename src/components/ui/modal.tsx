"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Native <dialog> → focus trap, Esc to close and inert background for free. */
export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-labelledby="modal-title"
      className={cn(
        "m-auto w-[calc(100%-32px)] max-w-lg rounded-panel border border-line bg-surface p-0 text-ink backdrop:bg-ink/50",
        "open:animate-pop",
        className,
      )}
    >
      {open && (
        <div className="flex max-h-[85dvh] flex-col">
          <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
            <h2 id="modal-title" className="text-h3 font-bold">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="বন্ধ করুন"
              className="flex size-11 items-center justify-center rounded-control text-muted hover:bg-canvas hover:text-ink"
            >
              <X size={18} />
            </button>
          </div>
          <div className="overflow-y-auto px-6 py-5">{children}</div>
        </div>
      )}
    </dialog>
  );
}
