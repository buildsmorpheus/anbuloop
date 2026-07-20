import { AppHeader } from "@/components/app-header";
import { ExchangeDetail } from "@/components/exchange-detail";
import { StateProvider } from "@/components/state-provider";

export default async function ExchangePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <div className="app-shell"><AppHeader /><StateProvider><ExchangeDetail exchangeId={id} /></StateProvider></div>;
}
