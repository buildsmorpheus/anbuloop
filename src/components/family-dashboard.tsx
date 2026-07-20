"use client";

import Link from "next/link";
import { useAnbuLoop } from "@/components/state-provider";
import { fixtureEnglishGloss } from "@/lib/fixtures";
import { providerTraceLabel } from "@/lib/provider";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}

export function FamilyDashboard({ familyId }: { familyId: string }) {
  const { state, reset } = useAnbuLoop();
  const family = state.families.find((item) => item.id === familyId);
  if (!family) return <main className="app-main"><p>That family is not available.</p></main>;
  const members = state.members.filter((member) => member.familyId === familyId);
  const exchanges = state.exchanges.filter((exchange) => exchange.familyId === familyId);

  return (
    <main className="app-main">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Your demo family</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em]">{family.name}</h1>
        </div>
        <div className="flex flex-wrap gap-3"><Link className="button button-secondary" href={`/family/${familyId}/words`}>Words we’re learning</Link><Link className="button button-primary" href="/exchange/new">Add a voice note <span aria-hidden>→</span></Link></div>
      </div>

      <section className="grid gap-4 md:grid-cols-[1.3fr_0.7fr]">
        <div className="card">
          <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Recent exchanges</h2><span className="pill">Fixture mode</span></div>
          <div className="space-y-3">
            {exchanges.map((exchange) => {
              const firstSegment = state.transcriptSegments.find((segment) => segment.exchangeId === exchange.id);
              return (
                <Link href={`/exchange/${exchange.id}`} key={exchange.id} className="block rounded-2xl border border-[var(--line)] p-4 transition hover:border-[#d7bba9] hover:bg-[#fffaf6]">
                  <div className="flex items-start justify-between gap-4"><div><p className="font-semibold">Paati → Maya</p><p className="mt-1 text-sm text-[var(--muted)]">{firstSegment?.textOriginal ?? "No transcript available"}</p></div><span className="shrink-0 text-xs text-[var(--muted)]">{formatDate(exchange.createdAt)}</span></div>
                  {firstSegment && <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{fixtureEnglishGloss[firstSegment.id] ?? "Transcript ready for review."}</p>}
                  <p className="mt-2 text-xs font-semibold text-[var(--clay)]">{providerTraceLabel(exchange.providerUsed, exchange.isFixture)}</p>
                </Link>
              );
            })}
          </div>
        </div>
        <aside className="card">
          <h2 className="font-semibold">Who is here</h2>
          <ul className="mt-4 space-y-4">
            {members.map((member) => {
              const profile = state.languageProfiles.find((item) => item.memberId === member.id);
              const consent = state.consents.find((item) => item.memberId === member.id);
              return <li key={member.id} className="flex gap-3"><span className="grid size-10 place-items-center rounded-full bg-[var(--mint)] text-sm font-bold">{member.displayName[0]}</span><div><p className="font-semibold">{member.displayName}</p><p className="text-sm text-[var(--muted)]">{member.primaryLanguage} · {member.role}</p>{profile && <p className="mt-1 text-xs text-[var(--clay)]">{profile.comprehensionLevel} · {profile.preferredScript} script</p>}{consent && <p className="mt-1 text-xs text-[#4f7f70]">Processing consent recorded</p>}</div></li>;
            })}
          </ul>
        </aside>
      </section>
      <section className="mt-4 card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="font-semibold">Delete browser-local family data</p><p className="text-sm text-[var(--muted)]">Removes local exchanges, transcripts, PhraseCards, replies, and vocabulary history from this browser. Starter fixtures return after reset.</p></div>
        <button onClick={reset} className="button button-danger">Delete local data</button>
      </section>
    </main>
  );
}
