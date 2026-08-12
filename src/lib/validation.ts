import { z } from "zod";
import { PRODUCT_STATUS, ADMIN_SETTABLE_ORDER_STATUS } from "@/lib/constants";

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

export const productUpsertSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífens"),
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
  checkoutUrl: z.string().url().optional().nullable(),
  images: z.array(productImageInput).default([]),
  variants: z.array(productVariantInput).default([]),
  specifications: z.array(productSpecInput).default([]),
  benefits: z.array(productBenefitInput).default([]),
});

export type ProductUpsertInput = z.infer<typeof productUpsertSchema>;

export const checkoutStartSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1).optional().nullable(),
  quantity: z.number().int().positive().max(999),
});

export const orderStatusUpdateSchema = z.object({
  status: z.enum(ADMIN_SETTABLE_ORDER_STATUS),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
