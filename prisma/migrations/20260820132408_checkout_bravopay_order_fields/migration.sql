-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "customerCpf" TEXT,
ADD COLUMN     "customerEmail" TEXT,
ADD COLUMN     "customerName" TEXT,
ADD COLUMN     "customerPhone" TEXT,
ADD COLUMN     "gatewayTransactionId" TEXT,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "shippingAddress" TEXT;
