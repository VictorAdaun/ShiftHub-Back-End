/*
  Warnings:

  - Added the required column `year` to the `user_schedule_period` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "user_schedule_period" ADD COLUMN     "year" INTEGER NOT NULL;
