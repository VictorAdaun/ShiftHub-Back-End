/*
  Warnings:

  - You are about to drop the column `worker_count` on the `schedule_period_demand` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "schedule_period_demand" DROP COLUMN "worker_count";
