-- CreateEnum
CREATE TYPE "SharePermission" AS ENUM ('VIEW', 'EDIT');

-- CreateTable
CREATE TABLE "FileShare" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "sharedById" TEXT NOT NULL,
    "sharedToId" TEXT NOT NULL,
    "permission" "SharePermission" NOT NULL DEFAULT 'VIEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicShare" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "PublicShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FileShare_sharedToId_idx" ON "FileShare"("sharedToId");

-- CreateIndex
CREATE UNIQUE INDEX "FileShare_fileId_sharedToId_key" ON "FileShare"("fileId", "sharedToId");

-- CreateIndex
CREATE UNIQUE INDEX "PublicShare_token_key" ON "PublicShare"("token");

-- CreateIndex
CREATE INDEX "PublicShare_token_idx" ON "PublicShare"("token");

-- CreateIndex
CREATE INDEX "PublicShare_ownerId_idx" ON "PublicShare"("ownerId");

-- AddForeignKey
ALTER TABLE "FileShare" ADD CONSTRAINT "FileShare_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileShare" ADD CONSTRAINT "FileShare_sharedById_fkey" FOREIGN KEY ("sharedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileShare" ADD CONSTRAINT "FileShare_sharedToId_fkey" FOREIGN KEY ("sharedToId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicShare" ADD CONSTRAINT "PublicShare_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicShare" ADD CONSTRAINT "PublicShare_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
