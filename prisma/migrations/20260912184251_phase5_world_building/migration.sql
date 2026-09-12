-- CreateEnum
CREATE TYPE "FamilyRelationType" AS ENUM ('PARENT_OF', 'SPOUSE_OF', 'SIBLING_OF');

-- CreateEnum
CREATE TYPE "MysteryStatus" AS ENUM ('OPEN', 'RESOLVED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RelatableEntityType" ADD VALUE 'TIMELINE_EVENT';
ALTER TYPE "RelatableEntityType" ADD VALUE 'MYSTERY';

-- CreateTable
CREATE TABLE "timeline_events" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "narrativeDate" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "visibility" "Visibility" NOT NULL DEFAULT 'GM_ONLY',
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_event_tags" (
    "timelineEventId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "timeline_event_tags_pkey" PRIMARY KEY ("timelineEventId","tagId")
);

-- CreateTable
CREATE TABLE "campaign_calendars" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "currentDay" INTEGER NOT NULL DEFAULT 1,
    "dayLabel" TEXT NOT NULL DEFAULT 'Dia',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_calendars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "narrative_clocks" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "segments" INTEGER NOT NULL DEFAULT 4,
    "filled" INTEGER NOT NULL DEFAULT 0,
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "narrative_clocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_relations" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "npcAId" TEXT NOT NULL,
    "npcBId" TEXT NOT NULL,
    "relationType" "FamilyRelationType" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "family_relations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mysteries" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "MysteryStatus" NOT NULL DEFAULT 'OPEN',
    "visibility" "Visibility" NOT NULL DEFAULT 'GM_ONLY',
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mysteries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mystery_tags" (
    "mysteryId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "mystery_tags_pkey" PRIMARY KEY ("mysteryId","tagId")
);

-- CreateTable
CREATE TABLE "clues" (
    "id" TEXT NOT NULL,
    "mysteryId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "discovered" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "linkedEntityType" "RelatableEntityType",
    "linkedEntityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clues_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "timeline_events_campaignId_archived_idx" ON "timeline_events"("campaignId", "archived");

-- CreateIndex
CREATE INDEX "timeline_events_campaignId_order_idx" ON "timeline_events"("campaignId", "order");

-- CreateIndex
CREATE INDEX "timeline_event_tags_tagId_idx" ON "timeline_event_tags"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_calendars_campaignId_key" ON "campaign_calendars"("campaignId");

-- CreateIndex
CREATE INDEX "narrative_clocks_campaignId_archived_idx" ON "narrative_clocks"("campaignId", "archived");

-- CreateIndex
CREATE INDEX "family_relations_campaignId_idx" ON "family_relations"("campaignId");

-- CreateIndex
CREATE INDEX "family_relations_npcBId_idx" ON "family_relations"("npcBId");

-- CreateIndex
CREATE UNIQUE INDEX "family_relations_npcAId_npcBId_relationType_key" ON "family_relations"("npcAId", "npcBId", "relationType");

-- CreateIndex
CREATE INDEX "mysteries_campaignId_archived_idx" ON "mysteries"("campaignId", "archived");

-- CreateIndex
CREATE INDEX "mysteries_campaignId_status_idx" ON "mysteries"("campaignId", "status");

-- CreateIndex
CREATE INDEX "mystery_tags_tagId_idx" ON "mystery_tags"("tagId");

-- CreateIndex
CREATE INDEX "clues_mysteryId_order_idx" ON "clues"("mysteryId", "order");

-- AddForeignKey
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_event_tags" ADD CONSTRAINT "timeline_event_tags_timelineEventId_fkey" FOREIGN KEY ("timelineEventId") REFERENCES "timeline_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_event_tags" ADD CONSTRAINT "timeline_event_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_calendars" ADD CONSTRAINT "campaign_calendars_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "narrative_clocks" ADD CONSTRAINT "narrative_clocks_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_relations" ADD CONSTRAINT "family_relations_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_relations" ADD CONSTRAINT "family_relations_npcAId_fkey" FOREIGN KEY ("npcAId") REFERENCES "npcs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_relations" ADD CONSTRAINT "family_relations_npcBId_fkey" FOREIGN KEY ("npcBId") REFERENCES "npcs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mysteries" ADD CONSTRAINT "mysteries_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mystery_tags" ADD CONSTRAINT "mystery_tags_mysteryId_fkey" FOREIGN KEY ("mysteryId") REFERENCES "mysteries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mystery_tags" ADD CONSTRAINT "mystery_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clues" ADD CONSTRAINT "clues_mysteryId_fkey" FOREIGN KEY ("mysteryId") REFERENCES "mysteries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
