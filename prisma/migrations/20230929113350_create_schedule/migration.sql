/*
  Warnings:

  - You are about to drop the column `from_date` on the `schedule_period` table. All the data in the column will be lost.
  - You are about to drop the column `group_id` on the `schedule_period` table. All the data in the column will be lost.
  - You are about to drop the column `to_date` on the `schedule_period` table. All the data in the column will be lost.
  - You are about to drop the column `group_id` on the `schedule_period_availability` table. All the data in the column will be lost.
  - You are about to drop the column `group_id` on the `schedule_period_demand` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `schedule_period_demand` table. All the data in the column will be lost.
  - You are about to drop the column `work_date` on the `schedule_period_demand` table. All the data in the column will be lost.
  - You are about to drop the `group` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_work_group` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `company_id` to the `schedule_period` table without a default value. This is not possible if the table is not empty.
  - Added the required column `owner_id` to the `schedule_period` table without a default value. This is not possible if the table is not empty.
  - Added the required column `worker_count` to the `schedule_period_demand` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "group" DROP CONSTRAINT "group_created_by_fkey";

-- DropForeignKey
ALTER TABLE "schedule_period" DROP CONSTRAINT "schedule_period_group_id_fkey";

-- DropForeignKey
ALTER TABLE "schedule_period_availability" DROP CONSTRAINT "schedule_period_availability_group_id_fkey";

-- DropForeignKey
ALTER TABLE "schedule_period_demand" DROP CONSTRAINT "schedule_period_demand_group_id_fkey";

-- DropForeignKey
ALTER TABLE "schedule_period_demand" DROP CONSTRAINT "schedule_period_demand_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_work_group" DROP CONSTRAINT "user_work_group_group_id_fkey";

-- DropForeignKey
ALTER TABLE "user_work_group" DROP CONSTRAINT "user_work_group_user_id_fkey";

-- AlterTable
ALTER TABLE "schedule_period" DROP COLUMN "from_date",
DROP COLUMN "group_id",
DROP COLUMN "to_date",
ADD COLUMN     "company_id" TEXT NOT NULL,
ADD COLUMN     "owner_id" TEXT NOT NULL,
ADD COLUMN     "repeat" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "schedule_period_availability" DROP COLUMN "group_id";

-- AlterTable
ALTER TABLE "schedule_period_demand" DROP COLUMN "group_id",
DROP COLUMN "user_id",
DROP COLUMN "work_date",
ADD COLUMN     "worker_count" INTEGER NOT NULL;

-- DropTable
DROP TABLE "group";

-- DropTable
DROP TABLE "user_work_group";

-- CreateTable
CREATE TABLE "user_schedule_period" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "schedule_period_id" TEXT NOT NULL,
    "schedule_period_demand_id" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_schedule_period_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "schedule_period" ADD CONSTRAINT "schedule_period_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_schedule_period" ADD CONSTRAINT "user_schedule_period_schedule_period_id_fkey" FOREIGN KEY ("schedule_period_id") REFERENCES "schedule_period"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_schedule_period" ADD CONSTRAINT "user_schedule_period_schedule_period_demand_id_fkey" FOREIGN KEY ("schedule_period_demand_id") REFERENCES "schedule_period_demand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_schedule_period" ADD CONSTRAINT "user_schedule_period_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
