import { z } from "zod";
import { PRODUCT_STATUS, ADMIN_SETTABLE_ORDER_STATUS, REVIEW_STATUS } from "@/lib/constants";

export const productImageInput = z.object({
  id: z.string().optional(),
  url: z.string().min(1),
  alt: z.string().default(""),
  type: z.enum(["image", "video"]).default("image"),
  sortOrder: z.number().int().default(0),
  isPrimary: z.boolean().default(false),
});

export const productVariantInput = z.object({
  id: z.string().optional(),
  groupName: z.string().min(1),
  label: z.string().min(1),
  sku: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  priceCents: z.number().int().positive().optional().nullable(),
  stock: z.number().int().min(0).default(0),
  checkoutUrl: z.string().url().optional().nullable(),
  sortOrder: z.number().int().default(0),
});

export const productSpecInput = z.object({
  id: z.string().optional(),
  label: z.string().min(1),
  value: z.string().min(1),
  sortOrder: z.number().int().default(0),
});

export const productBenefitInput = z.object({
  id: z.string().optional(),
  icon: z.string().default("check"),
  label: z.string().min(1),
  sortOrder: z.number().int().default(0),
});

export const productAddonInput = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  description: z.string().max(500).optional().nullable(),
  durationLabel: z.string().max(60).optional().nullable(),
  priceCents: z.number().int().positive(),
  sortOrder: z.number().int().default(0),
  enabled: z.boolean().default(true),
});

export const reviewMediaInput = z.object({
  id: z.string().optional(),
  url: z.string().min(1),
  type: z.enum(["image", "video"]).default("image"),
  thumbnailUrl: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
});

export const reviewInput = z.object({
  id: z.string().optional(),
  customerName: z.string().min(1).max(120),
  avatarUrl: z.string().optional().nullable(),
  rating: z.number().int().min(1).max(5),
  variantLabel: z.string().max(120).optional().nullable(),
  comment: z.string().min(1).max(4000),
  helpfulCount: z.number().int().min(0).default(0),
  status: z.enum(REVIEW_STATUS).default("PUBLISHED"),
  media: z.array(reviewMediaInput).default([]),
});

export const reviewHighlightInput = z.object({
  label: z.string().min(1).max(60),
  text: z.string().min(1).max(300),
});

export const offerChipInput = z.object({
  label: z.string().min(1).max(60),
});

export const productUpsertSchema = z.object({
  slug: z
    .string()
    .regex(/^$|^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífens")
    .default(""), // empty is valid — product-service generates one from the name
  name: z.string().min(1).max(200),
  shortDescription: z.string().max(500).optional().nullable(),
  description: z.string().max(20000).optional().nullable(),
  status: z.enum(PRODUCT_STATUS),
  sku: z.string().max(100).optional().nullable(),
  priceCents: z.number().int().positive(),
  compareAtPriceCents: z.number().int().positive().optional().nullable(),
  stock: z.number().int().min(0),
  ratingAverage: z.number().min(0).max(5).default(0),
  ratingCount: z.number().int().min(0).default(0),
  soldCount: z.number().int().min(0).default(0),
  offerEnabled: z.boolean().default(false),
  offerExpiresAt: z.string().datetime().optional().nullable(),
  offerChips: z.array(offerChipInput).max(10).default([]),
  officialBadge: z.boolean().default(false),
  shippingEnabled: z.boolean().default(true),
  shippingDeliveryText: z.string().max(120).optional().nullable(),
  shippingFree: z.boolean().default(true),
  shippingOriginalPriceCents: z.number().int().positive().optional().nullable(),
  shippingFinalPriceCents: z.number().int().min(0).optional().nullable(),
  checkoutUrl: z.string().url().optional().nullable(),
  images: z.array(productImageInput).default([]),
  variants: z.array(productVariantInput).default([]),
  specifications: z.array(productSpecInput).default([]),
  benefits: z.array(productBenefitInput).default([]),
  addons: z.array(productAddonInput).default([]),
  reviews: z.array(reviewInput).default([]),
  reviewHighlights: z.array(reviewHighlightInput).max(6).default([]),
});

export type ProductUpsertInput = z.infer<typeof productUpsertSchema>;

export const checkoutStartSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1).optional().nullable(),
  quantity: z.number().int().positive().max(999),
  addonIds: z.array(z.string()).default([]),
});

// Validação de CPF (dígitos verificadores). A BravoPay recusa CPFs inválidos, então
// barramos aqui antes de criar a cobrança, dando uma mensagem clara ao cliente.
export function isValidCPF(raw: string): boolean {
  const cpf = raw.replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const digits = cpf.split("").map(Number);
  for (let t = 9; t < 11; t++) {
    let sum = 0;
    for (let i = 0; i < t; i++) sum += digits[i] * (t + 1 - i);
    const check = ((sum * 10) % 11) % 10;
    if (check !== digits[t]) return false;
  }
  return true;
}

// Dados do cliente coletados na tela de checkout (visual Shopee) antes de gerar o
// PIX. O valor nunca vem daqui — só identidade e endereço de entrega.
export const checkoutPaySchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome completo").max(120),
  email: z.string().trim().email("E-mail inválido").max(160),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v.length >= 10 && v.length <= 11, "Telefone (DDD + número) inválido"),
  cpf: z
    .string()
    .trim()
    .refine(isValidCPF, "CPF inválido"),
  cep: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v.length === 8, "CEP inválido"),
  street: z.string().trim().min(2, "Informe a rua").max(200),
  number: z.string().trim().min(1, "Informe o número").max(20),
  complement: z.string().trim().max(200).optional().default(""),
  neighborhood: z.string().trim().min(1, "Informe o bairro").max(120),
  city: z.string().trim().min(1, "Informe a cidade").max(120),
  state: z.string().trim().length(2, "UF inválida").toUpperCase(),
});
export type CheckoutPayInput = z.infer<typeof checkoutPaySchema>;

export const orderStatusUpdateSchema = z.object({
  status: z.enum(ADMIN_SETTABLE_ORDER_STATUS),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor deve estar no formato #RRGGBB");
const optionalUrl = z.string().url().optional().nullable();

export const settingsUpdateSchema = z.object({
  siteName: z.string().min(1).max(120),
  siteShortName: z.string().max(60).optional().nullable(),
  siteDescription: z.string().max(500).optional().nullable(),
  logoUrl: optionalUrl,
  faviconUrl: optionalUrl,
  socialImageUrl: optionalUrl,
  phone: z.string().max(40).optional().nullable(),
  whatsapp: z.string().max(40).optional().nullable(),
  supportEmail: z.string().email().optional().nullable(),

  colorPrimary: hexColor,
  colorPrimaryHover: hexColor,
  colorBackground: hexColor,
  colorSurface: hexColor,
  colorText: hexColor,
  colorTextSecondary: hexColor,
  colorBorder: hexColor,
  colorPrice: hexColor,
  colorDiscount: hexColor,
  colorOffer: hexColor,

  footerText: z.string().max(500).optional().nullable(),
  footerLinks: z.array(z.object({ label: z.string().min(1).max(60), url: z.string().url() })).default([]),

  checkoutTitle: z.string().max(120).optional().nullable(),
  checkoutSubtitle: z.string().max(200).optional().nullable(),
  checkoutCta: z.string().max(60).optional().nullable(),

  // Public Meta Pixel ID (numeric string, e.g. "123456789012345") — not a secret,
  // shipped straight into browser HTML by src/app/layout.tsx when set.
  metaPixelId: z.string().max(40).regex(/^\d*$/, "Pixel ID deve conter apenas números").optional().nullable(),

  storeLogoUrl: optionalUrl,
  storeRatingAverage: z.number().min(0).max(5).default(0),
  storeRatingCount: z.number().int().min(0).default(0),
  storeProductCount: z.number().int().min(0).optional().nullable(),
  storeResponseRatePercent: z.number().int().min(0).max(100).default(100),
  storeBadgeLabel: z.string().max(40).optional().nullable(),
  storeBadgeEnabled: z.boolean().default(false),
  // Admin-picked product ids for the "Produtos da mesma loja" carousel, in order.
  // Empty array means "auto-pick other active products" (see product-service.ts).
  storeRelatedProductIds: z.array(z.string()).max(20).default([]),
});

export type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>;
