import Link from "next/link";

interface AuthShellProps {
  variant: "login" | "signup";
  headline: string;
  subline: string;
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

const PREVIEW_ENTRIES = [
  { title: "Ship quarterly review", due: "Tomorrow", urgency: "high" as const },
  { title: "Renew domain", due: "Fri 18", urgency: "medium" as const },
  { title: "Draft project brief", due: "Next week", urgency: "low" as const },
];

export function AuthShell({
  variant,
  headline,
  subline,
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  const entryNo = variant === "login" ? "042" : "001";

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <aside className="relative lg:w-[44%] bg-rail text-white flex flex-col justify-between px-8 py-10 lg:p-12 overflow-hidden">
        <div className="absolute inset-0 ledger-rules-dark opacity-60 pointer-events-none" aria-hidden />
        <div className="absolute -right-24 top-1/3 w-64 h-64 rounded-full bg-ember/8 blur-3xl pointer-events-none" aria-hidden />

        <div className="relative">
          <Link
            href="/"
            className="inline-flex items-baseline gap-2 font-display text-2xl tracking-tight hover:opacity-90 transition-opacity"
          >
            Ledger
          </Link>

          <h1 className="font-display text-[2.25rem] lg:text-[2.75rem] leading-[1.08] max-w-md mt-8">
            {headline}
          </h1>
        </div>

        <div className="relative hidden lg:block mt-10 space-y-2.5" aria-hidden>
          <p className="font-mono text-[10px] uppercase tracking-widest text-white/35 mb-4">
            On your desk
          </p>
          {PREVIEW_ENTRIES.map((entry) => (
            <PreviewEntry key={entry.title} {...entry} />
          ))}
        </div>

        <p className="relative text-sm text-white/45 font-mono max-w-sm leading-relaxed mt-8 lg:mt-0">
          {subline}
        </p>
      </aside>

      <main className="flex-1 flex items-center justify-center px-6 py-10 lg:p-12 ledger-paper relative">
        <div className="absolute inset-y-0 left-0 w-px bg-ink/6 dark:bg-dark-muted/15 hidden lg:block" aria-hidden />

        <div className="w-full max-w-[26rem] relative z-10 auth-enter">
          <div className="lg:hidden mb-8">
            <p className="font-display text-xl">Ledger</p>
          </div>

          <article className="auth-ledger-page rounded-lg border border-ink/10 dark:border-dark-muted/20 bg-surface-raised dark:bg-dark-raised shadow-[0_1px_2px_rgba(24,27,32,0.04),0_12px_40px_-12px_rgba(24,27,32,0.12)] dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.45)] overflow-hidden">
            <div className="auth-perforation h-3 border-b border-ink/6 dark:border-dark-muted/15" aria-hidden />

            <div className="auth-margin-rule pl-8 pr-6 py-7 sm:py-8">
              <header className="mb-7">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted dark:text-dark-muted">
                    Entry #{entryNo}
                  </span>
                  <span className="font-mono text-[10px] text-ember/80 uppercase tracking-wider">
                    {variant === "login" ? "Returning" : "New ledger"}
                  </span>
                </div>
                <h2 className="font-display text-[1.75rem] leading-tight">{title}</h2>
                <p className="text-ink-muted dark:text-dark-muted text-sm mt-1.5 leading-relaxed">
                  {description}
                </p>
              </header>

              {children}

              <div className="mt-7 pt-5 border-t border-ink/8 dark:border-dark-muted/15">
                {footer}
              </div>
            </div>
          </article>
        </div>
      </main>
    </div>
  );
}

function PreviewEntry({
  title,
  due,
  urgency,
}: {
  title: string;
  due: string;
  urgency: "high" | "medium" | "low";
}) {
  const bar =
    urgency === "high"
      ? "bg-ember w-1"
      : urgency === "medium"
        ? "bg-ember/60 w-0.5"
        : "bg-white/25 w-px";

  return (
    <div className="flex items-stretch rounded-md bg-white/[0.04] border border-white/[0.06] overflow-hidden">
      <div className={`shrink-0 self-stretch ${bar}`} />
      <div className="flex-1 flex items-center justify-between gap-3 px-3 py-2.5 min-w-0">
        <span className="text-sm text-white/75 truncate">{title}</span>
        <span className="font-mono text-[10px] text-white/35 shrink-0">{due}</span>
      </div>
    </div>
  );
}

interface AuthFieldProps {
  id: string;
  label: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}

export function AuthField({
  id,
  label,
  type = "text",
  autoComplete,
  required,
  minLength,
  value,
  onChange,
  hint,
}: AuthFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted dark:text-dark-muted mb-2"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="auth-input w-full px-0 py-2.5 bg-transparent border-0 border-b border-ink/20 dark:border-dark-muted/35 text-sm font-body placeholder:text-ink-muted/50 dark:placeholder:text-dark-muted/50"
      />
      {hint && (
        <p className="text-xs text-ink-muted dark:text-dark-muted mt-2">{hint}</p>
      )}
    </div>
  );
}

export function AuthSubmitButton({
  loading,
  children,
}: {
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="group w-full py-3 rounded-md bg-action hover:bg-action-hover text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
    >
      {children}
      {!loading && (
        <span
          className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200"
          aria-hidden
        >
          →
        </span>
      )}
    </button>
  );
}

export function AuthError({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="text-sm text-rose px-3 py-2.5 rounded-md bg-rose/8 border border-rose/15 font-mono"
    >
      {message}
    </p>
  );
}
