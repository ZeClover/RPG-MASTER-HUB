-- CreateEnum
CREATE TYPE "SessionPlanStatus" AS ENUM ('PLANNING', 'READY', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SceneStatus" AS ENUM ('PLANNED', 'PLAYED', 'CUT');

-- CreateEnum
CREATE TYPE "QuestStatus" AS ENUM ('NOT_STARTED', 'ACTIVE', 'COMPLETED', 'FAILED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "PlotThreadStatus" AS ENUM ('ACTIVE', 'DORMANT', 'RESOLVED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "ConsequenceStatus" AS ENUM ('PENDING', 'TRIGGERED', 'RESOLVED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RelatableEntityType" ADD VALUE 'SCENE';
ALTER TYPE "RelatableEntityType" ADD VALUE 'QUEST';
ALTER TYPE "RelatableEntityType" ADD VALUE 'PLOT_THREAD';
ALTER TYPE "RelatableEntityType" ADD VALUE 'CONSEQUENCE';

-- CreateTable
CREATE TABLE "session_plans" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sessionNumber" INTEGER,
    "plannedDate" TIMESTAMP(3),
    "pitch" TEXT,
    "gmNotes" TEXT,
    "status" "SessionPlanStatus" NOT NULL DEFAULT 'PLANNING',
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_items" (
    "id" TEXT NOT NULL,
    "sessionPlanId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenes" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "sessionPlanId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "readAloud" TEXT,
    "goal" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" "SceneStatus" NOT NULL DEFAULT 'PLANNED',
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quests" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "objective" TEXT,
    "reward" TEXT,
    "status" "QuestStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "visibility" "Visibility" NOT NULL DEFAULT 'GM_ONLY',
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plot_threads" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "PlotThreadStatus" NOT NULL DEFAULT 'ACTIVE',
    "importance" "RelationshipImportance" NOT NULL DEFAULT 'MEDIUM',
    "visibility" "Visibility" NOT NULL DEFAULT 'GM_ONLY',
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plot_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consequences" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "trigger" TEXT,
    "description" TEXT,
    "status" "ConsequenceStatus" NOT NULL DEFAULT 'PENDING',
    "visibility" "Visibility" NOT NULL DEFAULT 'GM_ONLY',
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quest_tags" (
    "questId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "quest_tags_pkey" PRIMARY KEY ("questId","tagId")
);

-- CreateTable
CREATE TABLE "plot_thread_tags" (
    "plotThreadId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "plot_thread_tags_pkey" PRIMARY KEY ("plotThreadId","tagId")
);

-- CreateTable
CREATE TABLE "consequence_tags" (
    "consequenceId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "consequence_tags_pkey" PRIMARY KEY ("consequenceId","tagId")
);

-- CreateIndex
CREATE INDEX "session_plans_campaignId_archived_idx" ON "session_plans"("campaignId", "archived");

-- CreateIndex
CREATE INDEX "session_plans_campaignId_status_idx" ON "session_plans"("campaignId", "status");

-- CreateIndex
CREATE INDEX "checklist_items_sessionPlanId_idx" ON "checklist_items"("sessionPlanId");

-- CreateIndex
CREATE INDEX "scenes_campaignId_idx" ON "scenes"("campaignId");

-- CreateIndex
CREATE INDEX "scenes_sessionPlanId_order_idx" ON "scenes"("sessionPlanId", "order");

-- CreateIndex
CREATE INDEX "quests_campaignId_archived_idx" ON "quests"("campaignId", "archived");

-- CreateIndex
CREATE INDEX "quests_campaignId_status_idx" ON "quests"("campaignId", "status");

-- CreateIndex
CREATE INDEX "plot_threads_campaignId_archived_idx" ON "plot_threads"("campaignId", "archived");

-- CreateIndex
CREATE INDEX "plot_threads_campaignId_status_idx" ON "plot_threads"("campaignId", "status");

-- CreateIndex
CREATE INDEX "consequences_campaignId_archived_idx" ON "consequences"("campaignId", "archived");

-- CreateIndex
CREATE INDEX "consequences_campaignId_status_idx" ON "consequences"("campaignId", "status");

-- CreateIndex
CREATE INDEX "quest_tags_tagId_idx" ON "quest_tags"("tagId");

-- CreateIndex
CREATE INDEX "plot_thread_tags_tagId_idx" ON "plot_thread_tags"("tagId");

-- CreateIndex
CREATE INDEX "consequence_tags_tagId_idx" ON "consequence_tags"("tagId");

-- AddForeignKey
ALTER TABLE "session_plans" ADD CONSTRAINT "session_plans_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_sessionPlanId_fkey" FOREIGN KEY ("sessionPlanId") REFERENCES "session_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenes" ADD CONSTRAINT "scenes_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenes" ADD CONSTRAINT "scenes_sessionPlanId_fkey" FOREIGN KEY ("sessionPlanId") REFERENCES "session_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quests" ADD CONSTRAINT "quests_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plot_threads" ADD CONSTRAINT "plot_threads_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consequences" ADD CONSTRAINT "consequences_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quest_tags" ADD CONSTRAINT "quest_tags_questId_fkey" FOREIGN KEY ("questId") REFERENCES "quests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quest_tags" ADD CONSTRAINT "quest_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plot_thread_tags" ADD CONSTRAINT "plot_thread_tags_plotThreadId_fkey" FOREIGN KEY ("plotThreadId") REFERENCES "plot_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plot_thread_tags" ADD CONSTRAINT "plot_thread_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consequence_tags" ADD CONSTRAINT "consequence_tags_consequenceId_fkey" FOREIGN KEY ("consequenceId") REFERENCES "consequences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consequence_tags" ADD CONSTRAINT "consequence_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
