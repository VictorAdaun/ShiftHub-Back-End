/*
  Warnings:

  - The values [ADMIN,OWNER,ASSISTANT_MANAGER] on the enum `USER_TYPE` will be removed. If these variants are still used in the database, this will fail.
  - Made the column `role_id` on table `user` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "USER_TYPE_new" AS ENUM ('EMPLOYEE', 'MANAGER');
ALTER TABLE "user" ALTER COLUMN "user_type" TYPE "USER_TYPE_new" USING ("user_type"::text::"USER_TYPE_new");
ALTER TYPE "USER_TYPE" RENAME TO "USER_TYPE_old";
ALTER TYPE "USER_TYPE_new" RENAME TO "USER_TYPE";
DROP TYPE "USER_TYPE_old";
COMMIT;

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "role_id" SET NOT NULL,
ALTER COLUMN "password_token_created_at" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "company_role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
