-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "offerChips" TEXT,
ADD COLUMN     "officialBadge" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shippingEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "shippingDeliveryText" TEXT,
ADD COLUMN     "shippingFree" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "shippingOriginalPriceCents" INTEGER,
ADD COLUMN     "shippingFinalPriceCents" INTEGER;
