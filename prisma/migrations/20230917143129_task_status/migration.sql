/*
  Warnings:

  - Changed the type of `assign_type` on the `task` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "TASK_STATUS" AS ENUM ('COMPLETED', 'OVERDUE', 'IN_PROGRESS');

-- CreateEnum
CREATE TYPE "TASK_ASSIGNED" AS ENUM ('SHIFT', 'MEMBERS');

-- AlterEnum
ALTER TYPE "PRIORITY" ADD VALUE 'VERY_HIGH';

-- AlterTable
ALTER TABLE "task" ADD COLUMN     "status" "TASK_STATUS" NOT NULL DEFAULT 'IN_PROGRESS',
DROP COLUMN "assign_type",
ADD COLUMN     "assign_type" "TASK_ASSIGNED" NOT NULL;

-- DropEnum
DROP TYPE "TASKASSIGNED";
