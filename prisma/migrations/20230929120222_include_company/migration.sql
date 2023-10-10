-- AddForeignKey
ALTER TABLE "schedule_period" ADD CONSTRAINT "schedule_period_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
