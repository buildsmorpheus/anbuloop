import { AppHeader } from "@/components/app-header";
import { StateProvider } from "@/components/state-provider";
import { VocabularyDashboard } from "@/components/vocabulary-dashboard";

export default async function WordsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <div className="app-shell"><AppHeader /><StateProvider><VocabularyDashboard familyId={id} /></StateProvider></div>;
}
