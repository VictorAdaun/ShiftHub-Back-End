/*
  Warnings:

  - You are about to drop the column `due_date` on the `task` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id]` on the table `security_questions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "TIME_OFF_REQUEST" AS ENUM ('VACATION', 'HEALTH', 'PERSONAL', 'MATERNITY_OR_PATERNITY', 'BEREAVEMENT', 'HOLIDAY', 'UNPAID', 'COMPENSATORY_TIME_OFF', 'JURY_DUTY', 'MILITARY_LEAVE', 'EDUCATION_OR_TRAINING', 'EMERGENCY', 'ADMINISTRATIVE', 'EXTENDED', 'PAID_TIME_OFF');

-- CreateEnum
CREATE TYPE "STATUS" AS ENUM ('PENDING', 'APPROVED', 'DENIED', 'EXPIRED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "NOTIFICATION_TYPE" AS ENUM ('TASK', 'SHIFT');

-- AlterTable
ALTER TABLE "task" DROP COLUMN "due_date",
ADD COLUMN     "end_date" TIMESTAMP(3),
ADD COLUMN     "start_date" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "location" VARCHAR(200);

-- CreateTable
CREATE TABLE "time_off" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "type" "TIME_OFF_REQUEST",
    "status" "STATUS" NOT NULL DEFAULT 'PENDING',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,

    CONSTRAINT "time_off_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "swap_shifts" (
    "id" TEXT NOT NULL,
    "requester_id" TEXT NOT NULL,
    "requester_shift_id" TEXT NOT NULL,
    "reciever_id" TEXT NOT NULL,
    "reciever_shift_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "status" "STATUS" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "swap_shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "trigger_user_id" TEXT NOT NULL,
    "activity" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "type" "NOTIFICATION_TYPE" NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "security_questions_user_id_key" ON "security_questions"("user_id");

-- AddForeignKey
ALTER TABLE "time_off" ADD CONSTRAINT "time_off_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_off" ADD CONSTRAINT "time_off_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swap_shifts" ADD CONSTRAINT "swap_shifts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swap_shifts" ADD CONSTRAINT "swap_shifts_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swap_shifts" ADD CONSTRAINT "swap_shifts_reciever_id_fkey" FOREIGN KEY ("reciever_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swap_shifts" ADD CONSTRAINT "swap_shifts_requester_shift_id_fkey" FOREIGN KEY ("requester_shift_id") REFERENCES "user_schedule_period"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swap_shifts" ADD CONSTRAINT "swap_shifts_reciever_shift_id_fkey" FOREIGN KEY ("reciever_shift_id") REFERENCES "user_schedule_period"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_trigger_user_id_fkey" FOREIGN KEY ("trigger_user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
