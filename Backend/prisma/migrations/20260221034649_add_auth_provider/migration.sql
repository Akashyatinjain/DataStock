-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('local', 'google', 'otp');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "authProvider" "AuthProvider" NOT NULL DEFAULT 'local';
