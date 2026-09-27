"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { ComplaintForm } from "@/components/complaint-form";
import { useSession } from "@/lib/auth";
import { useT } from "@/lib/i18n";

export default function NewComplaintPage() {
  const router = useRouter();
  const session = useSession();
  const { t } = useT();

  return (
    <>
      <PageHeader
        title={t("নতুন অভিযোগ যুক্ত করুন")}
        subtitle={t("ফোনে বা সরাসরি অফিসে পাওয়া অভিযোগ নাগরিকের পক্ষে এখানে নথিভুক্ত করুন")}
      />
      <Link href="/admin/complaints" className="-mt-3 inline-flex min-h-11 items-center gap-1.5 text-small font-semibold">
        <ArrowLeft size={16} aria-hidden /> {t("সকল অভিযোগে ফিরে যান")}
      </Link>
      <div className="max-w-[760px]">
        <ComplaintForm mode="admin" actor={session?.name} onCreated={(c) => router.push(`/admin/complaints/${c.id}`)} />
      </div>
    </>
  );
}
