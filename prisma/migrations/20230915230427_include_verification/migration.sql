/*
  Warnings:

  - A unique constraint covering the columns `[verification_code]` on the table `user` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "user" ADD COLUMN     "email_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verification_code" VARCHAR(200),
ADD COLUMN     "verification_code_created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "user_verification_code_key" ON "user"("verification_code");
