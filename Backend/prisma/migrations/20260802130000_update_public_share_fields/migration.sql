-- AlterTable
ALTER TABLE "PublicShare" ALTER COLUMN "fileId" DROP NOT NULL;
ALTER TABLE "PublicShare" ADD COLUMN IF NOT EXISTS "folderId" TEXT;
ALTER TABLE "PublicShare" ADD COLUMN IF NOT EXISTS "password" TEXT;
ALTER TABLE "PublicShare" ADD COLUMN IF NOT EXISTS "allowDownload" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PublicShare_folderId_idx" ON "PublicShare"("folderId");
CREATE INDEX IF NOT EXISTS "PublicShare_fileId_idx" ON "PublicShare"("fileId");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'PublicShare_folderId_fkey'
    ) THEN
        ALTER TABLE "PublicShare" ADD CONSTRAINT "PublicShare_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
