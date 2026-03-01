/*
  Warnings:

  - A unique constraint covering the columns `[nicknameSlug]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "nicknameSlug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_nicknameSlug_key" ON "User"("nicknameSlug");
