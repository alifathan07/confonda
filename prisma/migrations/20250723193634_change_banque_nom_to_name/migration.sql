/*
  Warnings:

  - You are about to drop the `reglement` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `reglement` DROP FOREIGN KEY `Reglement_chequeBanqueId_fkey`;

-- DropForeignKey
ALTER TABLE `reglement` DROP FOREIGN KEY `Reglement_effetBanqueId_fkey`;

-- DropForeignKey
ALTER TABLE `reglement` DROP FOREIGN KEY `Reglement_factureId_fkey`;

-- DropTable
DROP TABLE `reglement`;

-- CreateTable
CREATE TABLE `Cheque` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `montant` DOUBLE NOT NULL,
    `dateEtablissement` DATETIME(3) NOT NULL,
    `dateEcheance` DATETIME(3) NOT NULL,
    `statut` VARCHAR(191) NOT NULL,
    `dateReglement` DATETIME(3) NULL,
    `fournisseurId` INTEGER NOT NULL,
    `banqueId` INTEGER NOT NULL,
    `numero` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Effet` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `montant` DOUBLE NOT NULL,
    `dateEtablissement` DATETIME(3) NOT NULL,
    `dateEcheance` DATETIME(3) NOT NULL,
    `statut` VARCHAR(191) NOT NULL,
    `dateReglement` DATETIME(3) NULL,
    `fournisseurId` INTEGER NOT NULL,
    `banqueId` INTEGER NOT NULL,
    `numero` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Cheque` ADD CONSTRAINT `Cheque_fournisseurId_fkey` FOREIGN KEY (`fournisseurId`) REFERENCES `Fournisseur`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Cheque` ADD CONSTRAINT `Cheque_banqueId_fkey` FOREIGN KEY (`banqueId`) REFERENCES `Banque`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Effet` ADD CONSTRAINT `Effet_fournisseurId_fkey` FOREIGN KEY (`fournisseurId`) REFERENCES `Fournisseur`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Effet` ADD CONSTRAINT `Effet_banqueId_fkey` FOREIGN KEY (`banqueId`) REFERENCES `Banque`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
