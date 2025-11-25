/*
  Warnings:

  - Added the required column `action` to the `Feedback` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FeedbackAction" AS ENUM ('ACCEPT', 'SAVE', 'SWAP');

-- AlterTable
ALTER TABLE "Feedback" ADD COLUMN     "action" "FeedbackAction" NOT NULL;
