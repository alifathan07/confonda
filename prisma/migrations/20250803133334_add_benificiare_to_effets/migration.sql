/*
  Warnings:

  - A unique constraint covering the columns `[numero]` on the table `Effet` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `benificiaire` to the `Effet` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `effet` ADD COLUMN `benificiaire` VARCHAR(191) NOT NULL,
    MODIFY `montant` DOUBLE NULL,
    MODIFY `dateEtablissement` DATETIME(3) NULL,
    MODIFY `dateEcheance` DATETIME(3) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Effet_numero_key` ON `Effet`(`numero`);
