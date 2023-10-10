/*
  Warnings:

  - Added the required column `timeOfDay` to the `schedule_period_availability` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TIME_OF_DAY" AS ENUM ('MORNING', 'AFTERNOON', 'EVENING');

-- AlterTable
ALTER TABLE "schedule_period_availability" ADD COLUMN     "timeOfDay" "TIME_OF_DAY" NOT NULL;
