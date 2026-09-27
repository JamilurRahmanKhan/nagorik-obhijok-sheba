import type { Metadata, Viewport } from "next";
import { SkipLink } from "@/components/skip-link";
import { ToastProvider } from "@/components/ui/toast";
import { LanguageProvider } from "@/lib/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "নাগরিক অভিযোগ সেল",
    template: "%s | নাগরিক অভিযোগ সেল",
  },
  description:
    "সরকারি সেবা নিয়ে আপনার অভিযোগ অনলাইনে জমা দিন এবং ট্র্যাকিং আইডি দিয়ে সমাধানের অগ্রগতি জানুন। — স্থানীয় সরকার বিভাগ",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#10231c",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <LanguageProvider>
          <SkipLink />
          <ToastProvider>{children}</ToastProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
