/*
  Warnings:

  - You are about to drop the column `adresse` on the `fournisseur` table. All the data in the column will be lost.
  - You are about to drop the column `contact` on the `fournisseur` table. All the data in the column will be lost.
  - You are about to drop the column `ice` on the `fournisseur` table. All the data in the column will be lost.
  - You are about to drop the column `identif_fiscal` on the `fournisseur` table. All the data in the column will be lost.
  - You are about to drop the column `tel_contact` on the `fournisseur` table. All the data in the column will be lost.
  - You are about to drop the column `tel_fournisseur` on the `fournisseur` table. All the data in the column will be lost.
  - You are about to drop the column `fournisseurId` on the `reglement` table. All the data in the column will be lost.
  - You are about to drop the column `numeroPiece` on the `reglement` table. All the data in the column will be lost.
  - You are about to alter the column `type` on the `reglement` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(0))` to `VarChar(191)`.
  - Added the required column `dateEtablissement` to the `Reglement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `statut` to the `Reglement` table without a default value. This is not possible if the table is not empty.
  - Made the column `montant` on table `reglement` required. This step will fail if there are existing NULL values in that column.
  - Made the column `dateEcheance` on table `reglement` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `reglement` DROP FOREIGN KEY `Reglement_fournisseurId_fkey`;

-- DropIndex
DROP INDEX `Fournisseur_email_key` ON `fournisseur`;

-- DropIndex
DROP INDEX `Fournisseur_ice_key` ON `fournisseur`;

-- DropIndex
DROP INDEX `Reglement_fournisseurId_fkey` ON `reglement`;

-- AlterTable
ALTER TABLE `fournisseur` DROP COLUMN `adresse`,
    DROP COLUMN `contact`,
    DROP COLUMN `ice`,
    DROP COLUMN `identif_fiscal`,
    DROP COLUMN `tel_contact`,
    DROP COLUMN `tel_fournisseur`,
    ADD COLUMN `address` VARCHAR(191) NULL,
    ADD COLUMN `phone` VARCHAR(191) NULL,
    MODIFY `email` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `reglement` DROP COLUMN `fournisseurId`,
    DROP COLUMN `numeroPiece`,
    ADD COLUMN `chequeBanqueId` INTEGER NULL,
    ADD COLUMN `dateEtablissement` DATETIME(3) NOT NULL,
    ADD COLUMN `effetBanqueId` INTEGER NULL,
    ADD COLUMN `factureId` INTEGER NULL,
    ADD COLUMN `numero` VARCHAR(191) NULL,
    ADD COLUMN `statut` VARCHAR(191) NOT NULL,
    MODIFY `type` VARCHAR(191) NOT NULL,
    MODIFY `dateReglement` DATETIME(3) NULL,
    MODIFY `montant` DOUBLE NOT NULL,
    MODIFY `dateEcheance` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `user` MODIFY `name` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `DemandeDePrix` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fournisseurId` INTEGER NOT NULL,
    `devisPath` VARCHAR(191) NULL,
    `sentByEmail` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Article` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `designation` VARCHAR(191) NOT NULL,
    `demandeDePrixId` INTEGER NULL,
    `commandeId` INTEGER NULL,
    `factureId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Commande` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `numero` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fournisseurId` INTEGER NOT NULL,
    `modeReglement` VARCHAR(191) NOT NULL,
    `delaiReglement` VARCHAR(191) NULL,
    `blPath` VARCHAR(191) NULL,
    `facturePath` VARCHAR(191) NULL,
    `sentByEmail` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Commande_numero_key`(`numero`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Facture` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `numero` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `designation` VARCHAR(191) NOT NULL,
    `prixTTC` DOUBLE NOT NULL,
    `modeReglement` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Facture_numero_key`(`numero`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Affectation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `chantier` VARCHAR(191) NOT NULL,
    `montant` DOUBLE NOT NULL,
    `factureId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Prelevement` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fournisseurId` INTEGER NOT NULL,
    `dateEcheance` DATETIME(3) NOT NULL,
    `montant` DOUBLE NOT NULL,
    `dateFinEcheance` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AutreReglement` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NOT NULL,
    `montant` DOUBLE NOT NULL,
    `dateEcheance` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Banque` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NOT NULL,
    `solde` DOUBLE NOT NULL,
    `dateSolde` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `DemandeDePrix` ADD CONSTRAINT `DemandeDePrix_fournisseurId_fkey` FOREIGN KEY (`fournisseurId`) REFERENCES `Fournisseur`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Article` ADD CONSTRAINT `Article_demandeDePrixId_fkey` FOREIGN KEY (`demandeDePrixId`) REFERENCES `DemandeDePrix`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Article` ADD CONSTRAINT `Article_commandeId_fkey` FOREIGN KEY (`commandeId`) REFERENCES `Commande`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Article` ADD CONSTRAINT `Article_factureId_fkey` FOREIGN KEY (`factureId`) REFERENCES `Facture`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Commande` ADD CONSTRAINT `Commande_fournisseurId_fkey` FOREIGN KEY (`fournisseurId`) REFERENCES `Fournisseur`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Affectation` ADD CONSTRAINT `Affectation_factureId_fkey` FOREIGN KEY (`factureId`) REFERENCES `Facture`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reglement` ADD CONSTRAINT `Reglement_chequeBanqueId_fkey` FOREIGN KEY (`chequeBanqueId`) REFERENCES `Banque`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reglement` ADD CONSTRAINT `Reglement_effetBanqueId_fkey` FOREIGN KEY (`effetBanqueId`) REFERENCES `Banque`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reglement` ADD CONSTRAINT `Reglement_factureId_fkey` FOREIGN KEY (`factureId`) REFERENCES `Facture`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prelevement` ADD CONSTRAINT `Prelevement_fournisseurId_fkey` FOREIGN KEY (`fournisseurId`) REFERENCES `Fournisseur`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
