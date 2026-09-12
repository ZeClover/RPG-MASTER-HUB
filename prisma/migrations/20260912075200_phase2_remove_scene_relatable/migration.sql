-- AlterEnum
BEGIN;
CREATE TYPE "RelatableEntityType_new" AS ENUM ('NPC', 'LOCATION', 'FACTION', 'LORE_PAGE', 'QUEST', 'PLOT_THREAD', 'CONSEQUENCE');
ALTER TABLE "relationships" ALTER COLUMN "sourceType" TYPE "RelatableEntityType_new" USING ("sourceType"::text::"RelatableEntityType_new");
ALTER TABLE "relationships" ALTER COLUMN "targetType" TYPE "RelatableEntityType_new" USING ("targetType"::text::"RelatableEntityType_new");
ALTER TYPE "RelatableEntityType" RENAME TO "RelatableEntityType_old";
ALTER TYPE "RelatableEntityType_new" RENAME TO "RelatableEntityType";
DROP TYPE "public"."RelatableEntityType_old";
COMMIT;
