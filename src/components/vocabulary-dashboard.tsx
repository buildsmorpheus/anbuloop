"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAnbuLoop } from "@/components/state-provider";
import { providerTraceLabel } from "@/lib/provider";
import type { AiProvider, MasteredState } from "@/lib/types";

const stateCopy: Record<MasteredState, { title: string; detail: string; className: string }> = {
  new: { title: "New", detail: "Waiting for a first reply attempt", className: "bg-[#fff8eb] text-[#9b6428]" },
  practicing: { title: "Practicing", detail: "Building familiarity through replies", className: "bg-[#eef4ff] text-[#41608e]" },
  mastered: { title: "Learning together", detail: "Three recognized phrase-presence matches", className: "bg-[#eef7f1] text-[#3f7667]" },
};

function providerSummary(providers: AiProvider[]) {
  if (!providers.length) return "Synthetic fixture — no provider call";
  if (providers.length === 1) return providerTraceLabel(providers[0]);
  return `Providers: ${providers.map((provider) => provider === "openai" ? "OpenAI" : "Gemini").join(", ")}`;
}

export function VocabularyDashboard({ familyId }: { familyId: string }) {
  const { state } = useAnbuLoop();
  const family = state.families.find((item) => item.id === familyId);
  const words = useMemo(() => [...state.vocabularyItems].sort((left, right) => right.lastUsedAt.localeCompare(left.lastUsedAt)), [state.vocabularyItems]);
  if (!family) return <main className="app-main"><p>That family is not available.</p></main>;

  return (
    <main className="app-main max-w-4xl">
      <Link href={`/family/${familyId}`} className="text-sm font-bold text-[var(--clay)]">← Back to family</Link>
      <div className="mt-7 flex flex-wrap items-end justify-between gap-4">
        <div><p className="eyebrow">Vocabulary history</p><h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em]">Words we’re learning together</h1><p className="mt-3 max-w-2xl leading-7 text-[var(--muted)]">A shared, transparent history of the phrases Maya has encountered in Paati’s notes.</p></div>
        <span className="pill">{words.length} {words.length === 1 ? "word" : "words"}</span>
      </div>

      <section className="mt-6 rounded-2xl border border-[var(--line)] bg-[#fff8eb] p-4 text-sm leading-6 text-[var(--muted)]">
        <strong className="text-[var(--ink)]">What “learning together” means.</strong> A phrase becomes “learning together” after three recognized phrase-presence matches. It is a visible counter—not a pronunciation, accent, or fluency grade.
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        {words.map((word) => {
          const linkedCards = state.phraseCards.filter((card) => word.linkedPhraseCardIds.includes(card.id));
          const sources = [...new Set(linkedCards.flatMap((card) => card.providerUsed ? [card.providerUsed] : []))];
          const progress = stateCopy[word.masteredState];
          return <article key={word.id} className="card"><div className="flex items-start justify-between gap-3"><div><p className="text-2xl font-semibold" lang="ta">{word.phrase}</p><p className="mt-1 text-sm text-[var(--muted)]">{word.childFriendlyMeaning}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${progress.className}`}>{progress.title}</span></div><p className="mt-4 text-sm text-[var(--muted)]">{progress.detail}</p><dl className="mt-5 grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-[var(--paper)] p-3"><dt className="text-xs text-[var(--muted)]">Shared</dt><dd className="mt-1 text-lg font-semibold">{word.exposureCount}</dd></div><div className="rounded-xl bg-[var(--paper)] p-3"><dt className="text-xs text-[var(--muted)]">Attempts</dt><dd className="mt-1 text-lg font-semibold">{word.attemptCount}</dd></div><div className="rounded-xl bg-[var(--paper)] p-3"><dt className="text-xs text-[var(--muted)]">Recognized</dt><dd className="mt-1 text-lg font-semibold">{word.matchedCount}</dd></div></dl><p className="mt-4 text-xs font-semibold text-[var(--clay)]">{providerSummary(sources)}</p></article>;
        })}
      </section>

      {!words.length && <section className="mt-6 card"><h2 className="font-semibold">No words yet</h2><p className="mt-2 text-sm text-[var(--muted)]">Create a PhraseCard from a consented voice note and it will appear here.</p><Link href="/exchange/new" className="button button-primary mt-4">Add a voice note</Link></section>}
    </main>
  );
}
