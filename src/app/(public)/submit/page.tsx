import type { Metadata } from "next";
import { SubmitContent } from "./submit-content";

export const metadata: Metadata = { title: "অভিযোগ দাখিল" };

export default function SubmitPage() {
  return <SubmitContent />;
}
