-- CreateEnum
CREATE TYPE "RollTableKind" AS ENUM ('GENERIC', 'LOOT');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RelatableEntityType" ADD VALUE 'MONSTER';
ALTER TYPE "RelatableEntityType" ADD VALUE 'ITEM';
ALTER TYPE "RelatableEntityType" ADD VALUE 'POWER';

-- CreateTable
CREATE TABLE "monsters" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "isBoss" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "canonStatus" "CanonStatus" NOT NULL DEFAULT 'DRAFT',
    "visibility" "Visibility" NOT NULL DEFAULT 'GM_ONLY',
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monsters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monster_attributes" (
    "id" TEXT NOT NULL,
    "monsterId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "monster_attributes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monster_tags" (
    "monsterId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "monster_tags_pkey" PRIMARY KEY ("monsterId","tagId")
);

-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "category" TEXT,
    "description" TEXT,
    "effect" TEXT,
    "canonStatus" "CanonStatus" NOT NULL DEFAULT 'DRAFT',
    "visibility" "Visibility" NOT NULL DEFAULT 'GM_ONLY',
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_tags" (
    "itemId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "item_tags_pkey" PRIMARY KEY ("itemId","tagId")
);

-- CreateTable
CREATE TABLE "powers" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cost" TEXT,
    "description" TEXT,
    "effect" TEXT,
    "canonStatus" "CanonStatus" NOT NULL DEFAULT 'DRAFT',
    "visibility" "Visibility" NOT NULL DEFAULT 'GM_ONLY',
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "powers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "power_tags" (
    "powerId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "power_tags_pkey" PRIMARY KEY ("powerId","tagId")
);

-- CreateTable
CREATE TABLE "roll_tables" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "kind" "RollTableKind" NOT NULL DEFAULT 'GENERIC',
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roll_tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roll_table_entries" (
    "id" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roll_table_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "monsters_campaignId_archived_idx" ON "monsters"("campaignId", "archived");

-- CreateIndex
CREATE INDEX "monsters_campaignId_favorite_idx" ON "monsters"("campaignId", "favorite");

-- CreateIndex
CREATE INDEX "monster_attributes_monsterId_order_idx" ON "monster_attributes"("monsterId", "order");

-- CreateIndex
CREATE INDEX "monster_tags_tagId_idx" ON "monster_tags"("tagId");

-- CreateIndex
CREATE INDEX "items_campaignId_archived_idx" ON "items"("campaignId", "archived");

-- CreateIndex
CREATE INDEX "items_campaignId_favorite_idx" ON "items"("campaignId", "favorite");

-- CreateIndex
CREATE INDEX "item_tags_tagId_idx" ON "item_tags"("tagId");

-- CreateIndex
CREATE INDEX "powers_campaignId_archived_idx" ON "powers"("campaignId", "archived");

-- CreateIndex
CREATE INDEX "powers_campaignId_favorite_idx" ON "powers"("campaignId", "favorite");

-- CreateIndex
CREATE INDEX "power_tags_tagId_idx" ON "power_tags"("tagId");

-- CreateIndex
CREATE INDEX "roll_tables_campaignId_archived_idx" ON "roll_tables"("campaignId", "archived");

-- CreateIndex
CREATE INDEX "roll_tables_campaignId_kind_idx" ON "roll_tables"("campaignId", "kind");

-- CreateIndex
CREATE INDEX "roll_table_entries_tableId_order_idx" ON "roll_table_entries"("tableId", "order");

-- AddForeignKey
ALTER TABLE "monsters" ADD CONSTRAINT "monsters_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monster_attributes" ADD CONSTRAINT "monster_attributes_monsterId_fkey" FOREIGN KEY ("monsterId") REFERENCES "monsters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monster_tags" ADD CONSTRAINT "monster_tags_monsterId_fkey" FOREIGN KEY ("monsterId") REFERENCES "monsters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monster_tags" ADD CONSTRAINT "monster_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_tags" ADD CONSTRAINT "item_tags_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_tags" ADD CONSTRAINT "item_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "powers" ADD CONSTRAINT "powers_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "power_tags" ADD CONSTRAINT "power_tags_powerId_fkey" FOREIGN KEY ("powerId") REFERENCES "powers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "power_tags" ADD CONSTRAINT "power_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roll_tables" ADD CONSTRAINT "roll_tables_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roll_table_entries" ADD CONSTRAINT "roll_table_entries_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "roll_tables"("id") ON DELETE CASCADE ON UPDATE CASCADE;
