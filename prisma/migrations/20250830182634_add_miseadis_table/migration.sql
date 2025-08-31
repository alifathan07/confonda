/*
  Warnings:

  - You are about to drop the column `designation` on the `miseadis` table. All the data in the column will be lost.
  - You are about to drop the column `fournisseurId` on the `miseadis` table. All the data in the column will be lost.
  - You are about to drop the column `rib` on the `miseadis` table. All the data in the column will be lost.
  - You are about to drop the column `rtgs` on the `miseadis` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `miseadis` DROP FOREIGN KEY `Miseadis_fournisseurId_fkey`;

-- DropIndex
DROP INDEX `Miseadis_fournisseurId_fkey` ON `miseadis`;

-- AlterTable
ALTER TABLE `miseadis` DROP COLUMN `designation`,
    DROP COLUMN `fournisseurId`,
    DROP COLUMN `rib`,
    DROP COLUMN `rtgs`;
