export function Description({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-foreground">Descrição</h2>
      {/* Plain text stored, rendered as text (never HTML) — no XSS surface. */}
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/70">{text}</p>
    </div>
  );
}
