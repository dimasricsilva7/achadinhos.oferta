-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "metaPixelId" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "metaPurchaseEventSentAt" TIMESTAMP(3);
