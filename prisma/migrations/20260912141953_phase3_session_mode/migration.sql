-- CreateEnum
CREATE TYPE "SessionLogEntryType" AS ENUM ('NOTE', 'DICE_ROLL', 'COMBAT_EVENT');

-- CreateEnum
CREATE TYPE "CombatantType" AS ENUM ('PC', 'NPC');

-- CreateTable
CREATE TABLE "session_log_entries" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "sessionPlanId" TEXT,
    "type" "SessionLogEntryType" NOT NULL DEFAULT 'NOTE',
    "content" TEXT NOT NULL,
    "clientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_log_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "combat_encounters" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "sessionPlanId" TEXT,
    "name" TEXT NOT NULL,
    "round" INTEGER NOT NULL DEFAULT 1,
    "activeCombatantId" TEXT,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "combat_encounters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "combatants" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CombatantType" NOT NULL DEFAULT 'NPC',
    "initiative" INTEGER NOT NULL DEFAULT 0,
    "hpCurrent" INTEGER,
    "hpMax" INTEGER,
    "conditions" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "combatants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "session_log_entries_campaignId_createdAt_idx" ON "session_log_entries"("campaignId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "session_log_entries_campaignId_clientId_key" ON "session_log_entries"("campaignId", "clientId");

-- CreateIndex
CREATE INDEX "combat_encounters_campaignId_endedAt_idx" ON "combat_encounters"("campaignId", "endedAt");

-- CreateIndex
CREATE INDEX "combatants_encounterId_order_idx" ON "combatants"("encounterId", "order");

-- AddForeignKey
ALTER TABLE "session_log_entries" ADD CONSTRAINT "session_log_entries_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_log_entries" ADD CONSTRAINT "session_log_entries_sessionPlanId_fkey" FOREIGN KEY ("sessionPlanId") REFERENCES "session_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combat_encounters" ADD CONSTRAINT "combat_encounters_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combat_encounters" ADD CONSTRAINT "combat_encounters_sessionPlanId_fkey" FOREIGN KEY ("sessionPlanId") REFERENCES "session_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combatants" ADD CONSTRAINT "combatants_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "combat_encounters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
