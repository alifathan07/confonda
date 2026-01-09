/*
  Warnings:

  - Added the required column `agence` to the `Banque` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rib` to the `Banque` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `banque` ADD COLUMN `agence` VARCHAR(191) NOT NULL,
    ADD COLUMN `rib` INTEGER NOT NULL;
