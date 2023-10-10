/*
  Warnings:

  - Added the required column `timeFrame` to the `schedule_period_demand` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "schedule_period_demand" ADD COLUMN     "timeFrame" "TIME_OF_DAY" NOT NULL;
