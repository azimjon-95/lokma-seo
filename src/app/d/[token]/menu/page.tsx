import type { Metadata } from "next";
import { DineInMenu } from "./DineInMenu";

export const metadata: Metadata = {
  title: "Menyu — LokmaGo",
  robots: { index: false, follow: false },
};

export default async function MenuPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <DineInMenu token={token} />;
}
