-- AlterTable
ALTER TABLE "clues" ADD COLUMN     "sharedWithPlayers" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "handouts" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "imageUrl" TEXT,
    "revealed" BOOLEAN NOT NULL DEFAULT false,
    "revealedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "handouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "handouts_campaignId_revealed_idx" ON "handouts"("campaignId", "revealed");

-- AddForeignKey
ALTER TABLE "handouts" ADD CONSTRAINT "handouts_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
