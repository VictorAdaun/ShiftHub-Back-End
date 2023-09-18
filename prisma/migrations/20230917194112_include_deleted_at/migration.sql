-- AlterEnum
ALTER TYPE "TASK_STATUS" ADD VALUE 'TO_DO';

-- AlterTable
ALTER TABLE "company" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "company_department" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "company_role" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "employee_task" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "group" ALTER COLUMN "deleted_at" DROP NOT NULL,
ALTER COLUMN "deleted_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "task" ALTER COLUMN "is_draft" SET DEFAULT true,
ALTER COLUMN "due_date" DROP NOT NULL,
ALTER COLUMN "assign_type" DROP NOT NULL;

-- AlterTable
ALTER TABLE "task_list" ADD COLUMN     "deleted_at" TIMESTAMP(3);
