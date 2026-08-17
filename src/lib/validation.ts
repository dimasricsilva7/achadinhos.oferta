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
});

export type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>;
