-- CreateEnum
CREATE TYPE "CanonStatus" AS ENUM ('DRAFT', 'PROPOSED', 'APPROVED', 'CANON', 'OBSOLETE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('GM_ONLY', 'PLAYERS', 'PUBLIC');

-- CreateEnum
CREATE TYPE "IdeaState" AS ENUM ('NEW', 'INTERESTING', 'DEVELOPING', 'USED', 'ARCHIVED', 'DISCARDED');

-- CreateEnum
CREATE TYPE "RelatableEntityType" AS ENUM ('NPC', 'LOCATION', 'FACTION', 'LORE_PAGE');

-- CreateEnum
CREATE TYPE "RelationshipImportance" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "npcs" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "age" TEXT,
    "species" TEXT,
    "gender" TEXT,
    "appearance" TEXT,
    "personality" TEXT,
    "history" TEXT,
    "goals" TEXT,
    "fears" TEXT,
    "secrets" TEXT,
    "narrativeStatus" TEXT,
    "gmNotes" TEXT,
    "canonStatus" "CanonStatus" NOT NULL DEFAULT 'DRAFT',
    "visibility" "Visibility" NOT NULL DEFAULT 'GM_ONLY',
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "npcs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "description" TEXT,
    "locationType" TEXT,
    "notes" TEXT,
    "parentLocationId" TEXT,
    "canonStatus" "CanonStatus" NOT NULL DEFAULT 'DRAFT',
    "visibility" "Visibility" NOT NULL DEFAULT 'GM_ONLY',
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "factions" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "factionType" TEXT,
    "description" TEXT,
    "history" TEXT,
    "goals" TEXT,
    "resources" TEXT,
    "secrets" TEXT,
    "notes" TEXT,
    "canonStatus" "CanonStatus" NOT NULL DEFAULT 'DRAFT',
    "visibility" "Visibility" NOT NULL DEFAULT 'GM_ONLY',
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "factions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lore_pages" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "imageUrl" TEXT,
    "category" TEXT,
    "canonStatus" "CanonStatus" NOT NULL DEFAULT 'DRAFT',
    "visibility" "Visibility" NOT NULL DEFAULT 'GM_ONLY',
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lore_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ideas" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "state" "IdeaState" NOT NULL DEFAULT 'NEW',
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ideas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "npc_tags" (
    "npcId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "npc_tags_pkey" PRIMARY KEY ("npcId","tagId")
);

-- CreateTable
CREATE TABLE "location_tags" (
    "locationId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "location_tags_pkey" PRIMARY KEY ("locationId","tagId")
);

-- CreateTable
CREATE TABLE "faction_tags" (
    "factionId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "faction_tags_pkey" PRIMARY KEY ("factionId","tagId")
);

-- CreateTable
CREATE TABLE "lore_page_tags" (
    "lorePageId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "lore_page_tags_pkey" PRIMARY KEY ("lorePageId","tagId")
);

-- CreateTable
CREATE TABLE "idea_tags" (
    "ideaId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "idea_tags_pkey" PRIMARY KEY ("ideaId","tagId")
);

-- CreateTable
CREATE TABLE "relationships" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "sourceType" "RelatableEntityType" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetType" "RelatableEntityType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "importance" "RelationshipImportance",
    "visibility" "Visibility" NOT NULL DEFAULT 'GM_ONLY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "relationships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "npcs_campaignId_archived_idx" ON "npcs"("campaignId", "archived");

-- CreateIndex
CREATE INDEX "npcs_campaignId_favorite_idx" ON "npcs"("campaignId", "favorite");

-- CreateIndex
CREATE INDEX "locations_campaignId_archived_idx" ON "locations"("campaignId", "archived");

-- CreateIndex
CREATE INDEX "locations_campaignId_favorite_idx" ON "locations"("campaignId", "favorite");

-- CreateIndex
CREATE INDEX "locations_parentLocationId_idx" ON "locations"("parentLocationId");

-- CreateIndex
CREATE INDEX "factions_campaignId_archived_idx" ON "factions"("campaignId", "archived");

-- CreateIndex
CREATE INDEX "factions_campaignId_favorite_idx" ON "factions"("campaignId", "favorite");

-- CreateIndex
CREATE INDEX "lore_pages_campaignId_archived_idx" ON "lore_pages"("campaignId", "archived");

-- CreateIndex
CREATE INDEX "lore_pages_campaignId_favorite_idx" ON "lore_pages"("campaignId", "favorite");

-- CreateIndex
CREATE INDEX "ideas_campaignId_archived_idx" ON "ideas"("campaignId", "archived");

-- CreateIndex
CREATE INDEX "ideas_campaignId_state_idx" ON "ideas"("campaignId", "state");

-- CreateIndex
CREATE UNIQUE INDEX "tags_campaignId_slug_key" ON "tags"("campaignId", "slug");

-- CreateIndex
CREATE INDEX "npc_tags_tagId_idx" ON "npc_tags"("tagId");

-- CreateIndex
CREATE INDEX "location_tags_tagId_idx" ON "location_tags"("tagId");

-- CreateIndex
CREATE INDEX "faction_tags_tagId_idx" ON "faction_tags"("tagId");

-- CreateIndex
CREATE INDEX "lore_page_tags_tagId_idx" ON "lore_page_tags"("tagId");

-- CreateIndex
CREATE INDEX "idea_tags_tagId_idx" ON "idea_tags"("tagId");

-- CreateIndex
CREATE INDEX "relationships_campaignId_sourceType_sourceId_idx" ON "relationships"("campaignId", "sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "relationships_campaignId_targetType_targetId_idx" ON "relationships"("campaignId", "targetType", "targetId");

-- AddForeignKey
ALTER TABLE "npcs" ADD CONSTRAINT "npcs_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_parentLocationId_fkey" FOREIGN KEY ("parentLocationId") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factions" ADD CONSTRAINT "factions_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lore_pages" ADD CONSTRAINT "lore_pages_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ideas" ADD CONSTRAINT "ideas_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "npc_tags" ADD CONSTRAINT "npc_tags_npcId_fkey" FOREIGN KEY ("npcId") REFERENCES "npcs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "npc_tags" ADD CONSTRAINT "npc_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_tags" ADD CONSTRAINT "location_tags_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_tags" ADD CONSTRAINT "location_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faction_tags" ADD CONSTRAINT "faction_tags_factionId_fkey" FOREIGN KEY ("factionId") REFERENCES "factions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faction_tags" ADD CONSTRAINT "faction_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lore_page_tags" ADD CONSTRAINT "lore_page_tags_lorePageId_fkey" FOREIGN KEY ("lorePageId") REFERENCES "lore_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lore_page_tags" ADD CONSTRAINT "lore_page_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idea_tags" ADD CONSTRAINT "idea_tags_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "ideas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idea_tags" ADD CONSTRAINT "idea_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
