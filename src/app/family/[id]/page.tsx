import { AppHeader } from "@/components/app-header";
import { FamilyDashboard } from "@/components/family-dashboard";
import { StateProvider } from "@/components/state-provider";

export default async function FamilyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <div className="app-shell"><AppHeader /><StateProvider><FamilyDashboard familyId={id} /></StateProvider></div>;
}
