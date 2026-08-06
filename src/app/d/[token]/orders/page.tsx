import type { Metadata } from "next";
import { MyOrders } from "./MyOrders";

export const metadata: Metadata = {
  title: "Buyurtmalarim — LokmaGo",
  robots: { index: false, follow: false },
};

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <MyOrders token={token} />;
}
