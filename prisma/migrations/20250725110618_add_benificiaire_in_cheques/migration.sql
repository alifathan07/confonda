/*
  Warnings:

  - Added the required column `benificiaire` to the `Cheque` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `cheque` ADD COLUMN `benificiaire` VARCHAR(191) NOT NULL;
