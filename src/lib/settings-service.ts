import { db } from "@/lib/db";
import { settingsUpdateSchema, type SettingsUpdateInput } from "@/lib/validation";

export type FooterLink = { label: string; url: string };

export type SiteSettings = Omit<
  Awaited<ReturnType<typeof db.settings.upsert>>,
  "footerLinks" | "storeRelatedProductIds"
> & {
  footerLinks: FooterLink[];
  storeRelatedProductIds: string[];
};

function parseFooterLinks(raw: string | null): FooterLink[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseStringArray(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function toSiteSettings(row: Awaited<ReturnType<typeof db.settings.upsert>>): SiteSettings {
  return {
    ...row,
    footerLinks: parseFooterLinks(row.footerLinks),
    storeRelatedProductIds: parseStringArray(row.storeRelatedProductIds),
  };
}

// Always returns a row — upserts the singleton on first read so every caller (admin
// form, root layout) can rely on settings existing without null-checking.
export async function getSettings(): Promise<SiteSettings> {
  const row = await db.settings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton" },
    update: {},
  });
  return toSiteSettings(row);
}

export class SettingsServiceError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function updateSettings(input: unknown): Promise<SiteSettings> {
  const parsed = settingsUpdateSchema.safeParse(input);
  if (!parsed.success) {
    throw new SettingsServiceError(parsed.error.issues[0]?.message ?? "Dados inválidos", 400);
  }

  const data: SettingsUpdateInput = parsed.data;
  const row = await db.settings.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      ...data,
      footerLinks: JSON.stringify(data.footerLinks),
      storeRelatedProductIds: JSON.stringify(data.storeRelatedProductIds),
    },
    update: {
      ...data,
      footerLinks: JSON.stringify(data.footerLinks),
      storeRelatedProductIds: JSON.stringify(data.storeRelatedProductIds),
    },
  });
  return toSiteSettings(row);
}
