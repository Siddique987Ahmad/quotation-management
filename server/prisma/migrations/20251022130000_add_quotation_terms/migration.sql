-- CreateTable
CREATE TABLE "public"."quotation_terms" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "highlight" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotation_terms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quotation_terms_active_sort_idx" ON "public"."quotation_terms"("active", "sortOrder");


