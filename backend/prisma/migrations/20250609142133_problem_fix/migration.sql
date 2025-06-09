/*
  Warnings:

  - You are about to drop the column `passwordChangedAt` on the `Submission` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "SheetProblem" DROP CONSTRAINT "SheetProblem_userId_fkey";

-- AlterTable
ALTER TABLE "PlaylistProblem" ADD CONSTRAINT "PlaylistProblem_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Submission" DROP COLUMN "passwordChangedAt";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordChangedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "ProblemSolved_userId_idx" ON "ProblemSolved"("userId");

-- CreateIndex
CREATE INDEX "ProblemSolved_problemId_idx" ON "ProblemSolved"("problemId");

-- CreateIndex
CREATE INDEX "SheetProblem_userId_idx" ON "SheetProblem"("userId");

-- CreateIndex
CREATE INDEX "SheetProblem_sheetId_idx" ON "SheetProblem"("sheetId");

-- CreateIndex
CREATE INDEX "Submission_userId_idx" ON "Submission"("userId");

-- CreateIndex
CREATE INDEX "Submission_problemId_idx" ON "Submission"("problemId");

-- AddForeignKey
ALTER TABLE "SheetProblem" ADD CONSTRAINT "SheetProblem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
