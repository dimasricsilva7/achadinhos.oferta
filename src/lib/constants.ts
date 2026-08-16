// Controlled "enums" — SQLite has no native enum type, so status fields are Strings
// in the DB. These are the single source of truth for valid values; never write a
// free-form status string anywhere else in the codebase.

export const PRODUCT_STATUS = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;
export type ProductStatus = (typeof PRODUCT_STATUS)[number];

export const ORDER_STATUS = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;
export type OrderStatus = (typeof ORDER_STATUS)[number];

// Order statuses an admin may set manually from the order list. PENDING is the only
// status the system itself ever writes (see src/app/api/checkout/start/route.ts) —
// there is no confirmed webhook/API from the external checkout, so every status past
// PENDING is a manual admin action, never inferred.
export const ADMIN_SETTABLE_ORDER_STATUS = ORDER_STATUS.filter((s) => s !== "PENDING");

// PUBLISHED reviews render on the storefront; HIDDEN ones are kept (moderation) but
// excluded from ReviewsSection. Same String-not-native-enum convention as above.
export const REVIEW_STATUS = ["PUBLISHED", "HIDDEN"] as const;
export type ReviewStatus = (typeof REVIEW_STATUS)[number];

export const AUDIT_ACTION = [
  "ADMIN_LOGIN",
  "ADMIN_LOGIN_FAILED",
  "ADMIN_LOGOUT",
  "PRODUCT_CREATED",
  "PRODUCT_UPDATED",
  "PRODUCT_DELETED",
  "PRODUCT_DUPLICATED",
  "PRICE_CHANGED",
  "STOCK_CHANGED",
  "ORDER_STATUS_CHANGED",
  "SETTINGS_UPDATED",
] as const;
export type AuditAction = (typeof AUDIT_ACTION)[number];
