-- CreateEnum
CREATE TYPE "TASKASSIGNED" AS ENUM ('SHIFT', 'MEMBERS');

-- CreateEnum
CREATE TYPE "PRIORITY" AS ENUM ('HIGH', 'LOW', 'MEDIUM');

-- CreateEnum
CREATE TYPE "WORKER_TYPE" AS ENUM ('FULL_TIME', 'PART_TIME');

-- CreateEnum
CREATE TYPE "USER_TYPE" AS ENUM ('ADMIN', 'OWNER', 'EMPLOYEE', 'MANAGER', 'ASSISTANT_MANAGER');

-- CreateEnum
CREATE TYPE "DAY_OF_WEEK" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateTable
CREATE TABLE "db_health" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "db_health_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "avatar" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "user_type" "USER_TYPE" NOT NULL,
    "password" VARCHAR(200),
    "password_token" VARCHAR(200),
    "password_token_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "last_day_worked" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "schedule_start_day" "DAY_OF_WEEK" NOT NULL DEFAULT 'MONDAY',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_department" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "department_title" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_role" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "role_title" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group" (
    "id" TEXT NOT NULL,
    "group_name" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "full_time_hours" INTEGER NOT NULL,
    "part_time_hours" INTEGER NOT NULL,
    "max_full_time" INTEGER NOT NULL,
    "max_part_time" INTEGER NOT NULL,
    "max_day_hours" INTEGER NOT NULL,
    "deleted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_work_group" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "workerType" "WORKER_TYPE" NOT NULL,
    "group_id" TEXT NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_work_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_period" (
    "id" TEXT NOT NULL,
    "period_name" TEXT NOT NULL,
    "from_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "to_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "group_id" TEXT NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedule_period_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_period_demand" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "schedule_period_id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "weekDay" "DAY_OF_WEEK" NOT NULL,
    "work_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "from_hour" INTEGER NOT NULL,
    "to_hour" INTEGER NOT NULL,
    "worker_quantity" INTEGER NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedule_period_demand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_period_availability" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "schedule_period_id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "weekDay" "DAY_OF_WEEK" NOT NULL,
    "work_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "from_hour" INTEGER NOT NULL,
    "to_hour" INTEGER NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedule_period_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "is_draft" BOOLEAN NOT NULL DEFAULT false,
    "due_date" TIMESTAMP(3) NOT NULL,
    "assign_type" "TASKASSIGNED" NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_list" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_list_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_task" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "is_task_lead" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_task_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_password_token_key" ON "user"("password_token");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_department" ADD CONSTRAINT "company_department_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_role" ADD CONSTRAINT "company_role_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_role" ADD CONSTRAINT "company_role_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "company_department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group" ADD CONSTRAINT "group_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_work_group" ADD CONSTRAINT "user_work_group_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_work_group" ADD CONSTRAINT "user_work_group_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_period" ADD CONSTRAINT "schedule_period_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_period_demand" ADD CONSTRAINT "schedule_period_demand_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_period_demand" ADD CONSTRAINT "schedule_period_demand_schedule_period_id_fkey" FOREIGN KEY ("schedule_period_id") REFERENCES "schedule_period"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_period_demand" ADD CONSTRAINT "schedule_period_demand_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_period_availability" ADD CONSTRAINT "schedule_period_availability_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_period_availability" ADD CONSTRAINT "schedule_period_availability_schedule_period_id_fkey" FOREIGN KEY ("schedule_period_id") REFERENCES "schedule_period"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_period_availability" ADD CONSTRAINT "schedule_period_availability_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_list" ADD CONSTRAINT "task_list_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_task" ADD CONSTRAINT "employee_task_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_task" ADD CONSTRAINT "employee_task_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
