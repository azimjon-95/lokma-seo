import type { Metadata } from "next";
import { WaiterApp } from "./WaiterApp";

export const metadata: Metadata = {
  title: "Ofitsiant — LokmaGo",
  robots: { index: false, follow: false },
};

export default function WaiterPage() {
  return <WaiterApp />;
}
