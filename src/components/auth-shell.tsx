import Link from "next/link";

interface AuthShellProps {
  headline: string;
  subline: string;
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

export function AuthShell({
  headline,
  subline,
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  return (
    <div className="min-h-screen flex">
      <aside className="hidden lg:flex lg:w-[42%] bg-rail text-white flex-col justify-between p-12 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none ledger-rules-dark"
          aria-hidden
        />
        <div className="relative">
          <Link href="/" className="inline-block font-display text-2xl tracking-tight">
            Ledger
          </Link>
          <p className="font-mono text-[10px] tracking-widest uppercase text-white/40 mt-6 mb-10">
            Task ledger
          </p>
          <h1 className="font-display text-[2.75rem] leading-[1.1] max-w-md">
            {headline}
          </h1>
        </div>
        <p className="relative text-sm text-white/40 font-mono max-w-xs leading-relaxed">
          {subline}
        </p>
      </aside>

      <main className="flex-1 flex items-center justify-center p-8 ledger-paper relative">
        <div className="w-full max-w-sm relative z-10">
          <p className="lg:hidden font-display text-xl mb-8">Ledger</p>
          <h2 className="font-display text-3xl mb-1">{title}</h2>
          <p className="text-ink-muted dark:text-dark-muted text-sm mb-8">
            {description}
          </p>
          {children}
          <div className="mt-6">{footer}</div>
        </div>
      </main>
    </div>
  );
}
