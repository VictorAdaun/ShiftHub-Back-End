/*
  Warnings:

  - Added the required column `timeFrame` to the `time_off` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "time_off" ADD COLUMN     "timeFrame" TEXT NOT NULL;
