/*
  Warnings:

  - You are about to drop the column `phone` on the `fournisseur` table. All the data in the column will be lost.
  - Added the required column `contact` to the `Fournisseur` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ice` to the `Fournisseur` table without a default value. This is not possible if the table is not empty.
  - Added the required column `identifFiscal` to the `Fournisseur` table without a default value. This is not possible if the table is not empty.
  - Added the required column `telContact` to the `Fournisseur` table without a default value. This is not possible if the table is not empty.
  - Added the required column `telFournisseur` to the `Fournisseur` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `fournisseur` DROP COLUMN `phone`,
    ADD COLUMN `contact` VARCHAR(191) NOT NULL,
    ADD COLUMN `ice` VARCHAR(191) NOT NULL,
    ADD COLUMN `identifFiscal` VARCHAR(191) NOT NULL,
    ADD COLUMN `telContact` VARCHAR(191) NOT NULL,
    ADD COLUMN `telFournisseur` VARCHAR(191) NOT NULL;
