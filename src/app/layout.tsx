import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { getSettings } from "@/lib/settings-service";
import { SiteFooter } from "@/components/site/SiteFooter";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Every page reads live data straight from Prisma (products, settings, orders) with
// no revalidation strategy anywhere in this codebase — without this, Next's static
// optimization can cache pages like "/" or "/admin/settings" at build time, so a
// newly published product or a saved settings change wouldn't show up after a reload.
// Forced dynamic here so freshness is guaranteed app-wide, not per-page.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const title = settings.siteShortName || settings.siteName;
  return {
    title: {
      default: title,
      template: `%s | ${title}`,
    },
    description: settings.siteDescription || "Catálogo de produtos com ofertas por tempo limitado.",
    icons: settings.faviconUrl ? { icon: settings.faviconUrl } : undefined,
    openGraph: settings.socialImageUrl ? { images: [settings.socialImageUrl] } : undefined,
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#F2790F",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const settings = await getSettings();

  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <style>{`:root {
  --background: ${settings.colorBackground};
  --foreground: ${settings.colorText};
  --surface: ${settings.colorSurface};
  --border: ${settings.colorBorder};
  --brand: ${settings.colorPrimary};
  --brand-dark: ${settings.colorPrimaryHover};
  --price: ${settings.colorPrice};
  --success: ${settings.colorDiscount};
  --warning: ${settings.colorOffer};
}`}</style>
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {settings.metaPixelId && (
          <>
            {/* Meta Pixel base code — fires PageView on every page. Purchase is fired
                separately on /obrigado, alongside the server-side Conversions API call
                (see src/lib/meta-capi.ts), with a shared eventID for dedup. */}
            <Script id="meta-pixel-base" strategy="afterInteractive">
              {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${settings.metaPixelId}');
fbq('track', 'PageView');`}
            </Script>
            <noscript>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                height="1"
                width="1"
                style={{ display: "none" }}
                alt=""
                src={`https://www.facebook.com/tr?id=${settings.metaPixelId}&ev=PageView&noscript=1`}
              />
            </noscript>
          </>
        )}
        <div className="flex min-h-full flex-1 flex-col">{children}</div>
        <SiteFooter
          footerText={settings.footerText}
          footerLinks={settings.footerLinks}
          supportEmail={settings.supportEmail}
          whatsapp={settings.whatsapp}
          phone={settings.phone}
        />
      </body>
    </html>
  );
}
