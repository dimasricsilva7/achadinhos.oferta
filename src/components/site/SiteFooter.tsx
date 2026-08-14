import type { FooterLink } from "@/lib/settings-service";

export function SiteFooter({
  footerText,
  footerLinks,
  supportEmail,
  whatsapp,
  phone,
}: {
  footerText: string | null;
  footerLinks: FooterLink[];
  supportEmail: string | null;
  whatsapp: string | null;
  phone: string | null;
}) {
  const hasContact = Boolean(supportEmail || whatsapp || phone);
  if (!footerText && footerLinks.length === 0 && !hasContact) return null;

  return (
    <footer className="mt-8 border-t border-border bg-surface">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-6 text-sm text-foreground/60">
        {footerText && <p>{footerText}</p>}

        {footerLinks.length > 0 && (
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {footerLinks.map((link) => (
              <li key={link.url}>
                <a href={link.url} className="hover:text-foreground hover:underline">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        )}

        {hasContact && (
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground/50">
            {supportEmail && <li>{supportEmail}</li>}
            {phone && <li>{phone}</li>}
            {whatsapp && <li>WhatsApp: {whatsapp}</li>}
          </ul>
        )}
      </div>
    </footer>
  );
}
