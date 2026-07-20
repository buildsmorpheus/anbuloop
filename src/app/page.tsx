import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col justify-center px-6 py-12 sm:px-10">
      <div className="mb-10 flex items-center gap-3 text-sm font-semibold tracking-wide text-[var(--clay)]">
        <span className="grid size-9 place-items-center rounded-full bg-[var(--sun)] text-base">✦</span>
        ANBULOOP
      </div>
      <section className="max-w-2xl">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--clay)]">
          Everyday voices, across generations
        </p>
        <h1 className="text-balance text-5xl font-semibold tracking-[-0.045em] text-[var(--ink)] sm:text-7xl">
          Help a child answer a grandparent in the words they share.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--muted)]">
          AnbuLoop is a consent-first prototype for short family voice notes. It keeps the original language at the center and makes space for a child to respond.
        </p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link className="button button-primary" href="/family/demo-family">
            Open demo family <span aria-hidden>→</span>
          </Link>
          <Link className="button button-secondary" href="/exchange/new">
            Add a voice note
          </Link>
        </div>
      </section>
      <aside className="mt-16 max-w-2xl rounded-3xl border border-[var(--line)] bg-white/70 p-5 text-sm leading-6 text-[var(--muted)] shadow-sm">
        <strong className="font-semibold text-[var(--ink)]">Prototype boundary.</strong> Demo transcripts are labelled fixtures. New recordings are not transcribed until a dedicated, server-side transcription provider is configured.
      </aside>
    </main>
  );
}
