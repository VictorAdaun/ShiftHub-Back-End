/*
  Warnings:

  - Added the required column `company_id` to the `task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `task` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "task" ADD COLUMN     "company_id" TEXT NOT NULL,
ADD COLUMN     "user_id" TEXT NOT NULL;
