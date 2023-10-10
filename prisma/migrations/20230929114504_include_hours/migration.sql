/*
  Warnings:

  - You are about to drop the column `from_hour` on the `schedule_period_demand` table. All the data in the column will be lost.
  - You are about to drop the column `to_hour` on the `schedule_period_demand` table. All the data in the column will be lost.
  - Added the required column `max_hours_after` to the `schedule_period` table without a default value. This is not possible if the table is not empty.
  - Added the required column `max_hours_before` to the `schedule_period` table without a default value. This is not possible if the table is not empty.
  - Added the required column `end_time` to the `schedule_period_demand` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_time` to the `schedule_period_demand` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "schedule_period" ADD COLUMN     "max_hours_after" INTEGER NOT NULL,
ADD COLUMN     "max_hours_before" INTEGER NOT NULL,
ADD COLUMN     "published" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "schedule_period_demand" DROP COLUMN "from_hour",
DROP COLUMN "to_hour",
ADD COLUMN     "end_time" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "start_time" TIMESTAMP(3) NOT NULL;
