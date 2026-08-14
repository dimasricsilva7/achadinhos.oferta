import Link from "next/link";

export function SiteHeader({ siteName, logoUrl }: { siteName: string; logoUrl: string | null }) {
  return (
    <header className="safe-top sticky top-0 z-10 border-b border-border bg-surface">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center px-4">
        <Link href="/" className="flex items-center gap-2">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={siteName} className="h-8 w-auto object-contain" />
          ) : (
            <span className="text-base font-bold text-foreground">{siteName}</span>
          )}
        </Link>
      </div>
    </header>
  );
}
