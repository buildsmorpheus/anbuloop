import Link from "next/link";

export function AppHeader() {
  return (
    <header className="flex items-center justify-between border-b border-[var(--line)] bg-[var(--paper)] px-5 py-4 sm:px-8">
      <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-[var(--ink)]">
        <span className="grid size-8 place-items-center rounded-full bg-[var(--sun)]">✦</span> AnbuLoop
      </Link>
      <nav className="flex items-center gap-4 text-sm font-bold text-[var(--clay)]"><Link href="/family/demo-family/words">Words</Link><Link href="/exchange/new">New note</Link></nav>
    </header>
  );
}
