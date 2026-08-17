-- AlterTable
ALTER TABLE "Admin" ADD COLUMN     "lastLoginAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "storeLogoUrl" TEXT,
ADD COLUMN     "storeRatingAverage" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "storeRatingCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "storeProductCount" INTEGER,
ADD COLUMN     "storeResponseRatePercent" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "storeBadgeLabel" TEXT,
ADD COLUMN     "storeBadgeEnabled" BOOLEAN NOT NULL DEFAULT false;
