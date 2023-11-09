/*
  Warnings:

  - Added the required column `company_id` to the `user_schedule_period` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "user_schedule_period" ADD COLUMN     "company_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "user_schedule_period" ADD CONSTRAINT "user_schedule_period_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
