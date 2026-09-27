"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { controlClass } from "@/components/ui/fields";

/** Only the (non-sensitive) tracking id goes in the URL; the mobile number is asked on the next screen. */
export function QuickTrack() {
  const router = useRouter();
  const [id, setId] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    router.push(id.trim() ? `/track?id=${encodeURIComponent(id.trim())}` : "/track");
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <label htmlFor="quick-id" className="text-small font-semibold text-white">
        ট্র্যাকিং আইডি
      </label>
      <div className="relative">
        <Search size={16} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          id="quick-id"
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="BD-2026-0129"
          autoCapitalize="characters"
          className={`${controlClass} pl-9`}
        />
      </div>
      <button
        type="submit"
        className="min-h-11 rounded-control bg-side-dot-on px-[18px] py-2.5 text-body font-bold text-side transition-colors duration-150 hover:bg-white"
      >
        অবস্থা দেখুন
      </button>
    </form>
  );
}
