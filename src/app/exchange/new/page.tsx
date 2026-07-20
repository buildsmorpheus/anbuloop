import { AppHeader } from "@/components/app-header";
import { NewExchange } from "@/components/new-exchange";
import { StateProvider } from "@/components/state-provider";

export default function NewExchangePage() {
  return <div className="app-shell"><AppHeader /><StateProvider><NewExchange /></StateProvider></div>;
}
