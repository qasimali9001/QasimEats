import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-white/10 bg-surface px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="min-w-0 text-sm font-semibold tracking-tight">QasimEats admin</div>
          <Link
            href="/"
            className="shrink-0 text-sm text-muted underline-offset-4 hover:text-foreground hover:underline"
          >
            Back to map
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-5xl min-w-0 px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {children}
      </div>
    </div>
  );
}
