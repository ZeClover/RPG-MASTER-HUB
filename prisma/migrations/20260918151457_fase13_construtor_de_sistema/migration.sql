-- CreateEnum
CREATE TYPE "SheetSectionKind" AS ENUM ('ATTRIBUTES', 'RESOURCES', 'SKILLS', 'CONDITIONS', 'FORMULAS', 'CUSTOM_TEXT');

-- CreateTable
CREATE TABLE "attribute_defs" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "defaultValue" INTEGER NOT NULL DEFAULT 0,
    "gmOnly" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attribute_defs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_defs" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "defaultMax" INTEGER NOT NULL DEFAULT 0,
    "gmOnly" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resource_defs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_defs" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "relatedAttributeId" TEXT,
    "defaultBonus" INTEGER NOT NULL DEFAULT 0,
    "gmOnly" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_defs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "condition_defs" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "condition_defs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roll_formula_defs" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "formula" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roll_formula_defs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sheet_sections" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "kind" "SheetSectionKind" NOT NULL,
    "title" TEXT NOT NULL,
    "customText" TEXT,
    "gmOnly" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sheet_sections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "attribute_defs_campaignId_order_idx" ON "attribute_defs"("campaignId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "attribute_defs_campaignId_key_key" ON "attribute_defs"("campaignId", "key");

-- CreateIndex
CREATE INDEX "resource_defs_campaignId_order_idx" ON "resource_defs"("campaignId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "resource_defs_campaignId_key_key" ON "resource_defs"("campaignId", "key");

-- CreateIndex
CREATE INDEX "skill_defs_campaignId_order_idx" ON "skill_defs"("campaignId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "skill_defs_campaignId_key_key" ON "skill_defs"("campaignId", "key");

-- CreateIndex
CREATE INDEX "condition_defs_campaignId_order_idx" ON "condition_defs"("campaignId", "order");

-- CreateIndex
CREATE INDEX "roll_formula_defs_campaignId_order_idx" ON "roll_formula_defs"("campaignId", "order");

-- CreateIndex
CREATE INDEX "sheet_sections_campaignId_order_idx" ON "sheet_sections"("campaignId", "order");

-- AddForeignKey
ALTER TABLE "attribute_defs" ADD CONSTRAINT "attribute_defs_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_defs" ADD CONSTRAINT "resource_defs_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_defs" ADD CONSTRAINT "skill_defs_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_defs" ADD CONSTRAINT "skill_defs_relatedAttributeId_fkey" FOREIGN KEY ("relatedAttributeId") REFERENCES "attribute_defs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "condition_defs" ADD CONSTRAINT "condition_defs_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roll_formula_defs" ADD CONSTRAINT "roll_formula_defs_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sheet_sections" ADD CONSTRAINT "sheet_sections_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
