import type { Metadata, Viewport } from "next";
import { ToastProvider } from "@/components/ui/toast";
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
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-control focus:bg-primary focus:px-4 focus:py-2 focus:text-on-primary"
        >
          মূল অংশে যান
        </a>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
