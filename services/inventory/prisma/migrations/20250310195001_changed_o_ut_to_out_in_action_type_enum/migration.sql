/*
  Warnings:

  - The values [OUt] on the enum `ActionType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ActionType_new" AS ENUM ('IN', 'OUT');
ALTER TABLE "History" ALTER COLUMN "actionType" TYPE "ActionType_new" USING ("actionType"::text::"ActionType_new");
ALTER TYPE "ActionType" RENAME TO "ActionType_old";
ALTER TYPE "ActionType_new" RENAME TO "ActionType";
DROP TYPE "ActionType_old";
COMMIT;
