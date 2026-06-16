-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dodoCustomerId" TEXT,
ADD COLUMN     "storageLimit" BIGINT NOT NULL DEFAULT 10737418240,
ADD COLUMN     "subscriptionId" TEXT,
ADD COLUMN     "subscriptionPlan" TEXT NOT NULL DEFAULT 'BASIC';
