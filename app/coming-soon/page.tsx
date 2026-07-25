import type { Metadata } from "next";
import ComingSoonContent from "@/components/ComingSoonContent";

export const metadata: Metadata = {
  title: "Coming Soon | CBCK Youth Forum",
  description: "Something exciting is coming — stay tuned for the CBCK Youth Forum launch.",
};

export default function ComingSoonPage() {
  return <ComingSoonContent />;
}
