/*
  Warnings:

  - A unique constraint covering the columns `[rib]` on the table `Fournisseur` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `rib` to the `Fournisseur` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `fournisseur` ADD COLUMN `rib` INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Fournisseur_rib_key` ON `Fournisseur`(`rib`);
