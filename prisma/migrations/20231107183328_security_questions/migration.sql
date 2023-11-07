-- CreateTable
CREATE TABLE "security_questions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "question_one" TEXT,
    "question_two" TEXT,
    "answer_one" TEXT,
    "answer_two" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_questions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "security_questions" ADD CONSTRAINT "security_questions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
