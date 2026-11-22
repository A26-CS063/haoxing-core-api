-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'pemilik');

-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('calon', 'terdaftar', 'aktif', 'batal');

-- CreateEnum
CREATE TYPE "ProgramCategory" AS ENUM ('offline', 'online', 'paket');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('lunas', 'belum');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('masuk', 'keluar');

-- CreateTable
CREATE TABLE "users_db" (
    "user_id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'admin',

    CONSTRAINT "users_db_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "student_db" (
    "student_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "status" "StudentStatus" NOT NULL DEFAULT 'calon',
    "has_pretest" BOOLEAN NOT NULL DEFAULT false,
    "recommended_hsk" TEXT,
    "registered_at" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "managed_by" UUID,

    CONSTRAINT "student_db_pkey" PRIMARY KEY ("student_id")
);

-- CreateTable
CREATE TABLE "pretest_ai_db" (
    "pretest_id" UUID NOT NULL,
    "student_id" TEXT NOT NULL,
    "listening_score" INTEGER NOT NULL,
    "reading_score" INTEGER NOT NULL,
    "vocab_score" INTEGER NOT NULL,
    "predicted_level" TEXT NOT NULL,
    "confidence_score" DOUBLE PRECISION NOT NULL,
    "evaluated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pretest_ai_db_pkey" PRIMARY KEY ("pretest_id")
);

-- CreateTable
CREATE TABLE "program_class_db" (
    "class_id" TEXT NOT NULL,
    "program_code" TEXT NOT NULL,
    "program_name" TEXT NOT NULL,
    "category" "ProgramCategory" NOT NULL,
    "hsk_level" TEXT NOT NULL,
    "price_idr" DECIMAL(12,2) NOT NULL,
    "teacher_laoshi" TEXT NOT NULL,
    "schedule_slot" TEXT NOT NULL,
    "start_day_rule" INTEGER NOT NULL,
    "quota_max" INTEGER NOT NULL,
    "faq_vectors" JSONB,

    CONSTRAINT "program_class_db_pkey" PRIMARY KEY ("class_id")
);

-- CreateTable
CREATE TABLE "enrollment_db" (
    "enrollment_id" UUID NOT NULL,
    "student_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "schedule_slot" TEXT NOT NULL,
    "conflict_checked" BOOLEAN NOT NULL DEFAULT false,
    "quota_verified" BOOLEAN NOT NULL DEFAULT false,
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'belum',
    "paid_amount_idr" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enrollment_db_pkey" PRIMARY KEY ("enrollment_id")
);

-- CreateTable
CREATE TABLE "cashbook_refund_db" (
    "tx_id" TEXT NOT NULL,
    "student_id" TEXT,
    "recorded_by" UUID NOT NULL,
    "tx_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tx_type" "TransactionType" NOT NULL,
    "amount_idr" DECIMAL(12,2) NOT NULL,
    "refund_id" TEXT,
    "had_pretest_flag" BOOLEAN NOT NULL DEFAULT false,
    "refund_reason" TEXT,
    "no_refund_policy" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "cashbook_refund_db_pkey" PRIMARY KEY ("tx_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_db_email_key" ON "users_db"("email");

-- CreateIndex
CREATE UNIQUE INDEX "pretest_ai_db_student_id_key" ON "pretest_ai_db"("student_id");

-- AddForeignKey
ALTER TABLE "student_db" ADD CONSTRAINT "student_db_managed_by_fkey" FOREIGN KEY ("managed_by") REFERENCES "users_db"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pretest_ai_db" ADD CONSTRAINT "pretest_ai_db_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_db"("student_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_db" ADD CONSTRAINT "enrollment_db_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_db"("student_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_db" ADD CONSTRAINT "enrollment_db_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "program_class_db"("class_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cashbook_refund_db" ADD CONSTRAINT "cashbook_refund_db_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_db"("student_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cashbook_refund_db" ADD CONSTRAINT "cashbook_refund_db_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users_db"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
