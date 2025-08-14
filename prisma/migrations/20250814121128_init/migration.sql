-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Attestation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fournisseurId` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `dateValidite` DATETIME(3) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `demandeEnvoyee` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
CREATE TABLE `Fournisseur` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `ice` VARCHAR(191) NOT NULL,
    `identifFiscal` VARCHAR(191) NOT NULL,
    `telFournisseur` VARCHAR(191) NOT NULL,
    `contact` VARCHAR(191) NOT NULL,
    `telContact` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Fournisseur_ice_key`(`ice`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Cheque` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `montant` DOUBLE NULL,
    `dateEtablissement` DATETIME(3) NULL,
    `dateEcheance` DATETIME(3) NULL,
    `statut` VARCHAR(191) NOT NULL,
    `dateReglement` DATETIME(3) NULL,
    `fournisseurId` INTEGER NOT NULL,
    `beneficiaire` VARCHAR(191) NOT NULL,
    `banqueId` INTEGER NOT NULL,
    `numero` VARCHAR(191) NOT NULL,
    `obs` VARCHAR(191) NULL,
    `montantLettres` VARCHAR(191) NULL,
    `ville` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Cheque_numero_key`(`numero`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Effet` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `montant` DOUBLE NULL,
    `dateEtablissement` DATETIME(3) NULL,
    `dateEcheance` DATETIME(3) NULL,
    `statut` VARCHAR(191) NOT NULL,
    `dateReglement` DATETIME(3) NULL,
    `fournisseurId` INTEGER NOT NULL,
    `beneficiaire` VARCHAR(191) NOT NULL,
    `banqueId` INTEGER NOT NULL,
    `numero` VARCHAR(191) NOT NULL,
    `obs` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Effet_numero_key`(`numero`),
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
CREATE TABLE `Payavenir` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `designation` VARCHAR(191) NULL,
    `beneficiaire` VARCHAR(191) NULL,
    `montant` DOUBLE NULL,
    `dateEcheance` DATETIME(3) NULL,
    `statut` VARCHAR(191) NULL,
    `dateReglement` DATETIME(3) NULL,
    `obs` VARCHAR(191) NULL,
    `fournisseurId` INTEGER NOT NULL,
    `banqueId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Recavenir` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `designation` VARCHAR(191) NULL,
    `beneficiaire` VARCHAR(191) NULL,
    `montant` DOUBLE NULL,
    `dateEcheance` DATETIME(3) NULL,
    `statut` VARCHAR(191) NULL,
    `dateReglement` DATETIME(3) NULL,
    `obs` VARCHAR(191) NULL,
    `clientId` INTEGER NOT NULL,
    `banqueId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Banque` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `rib` INTEGER NOT NULL,
    `agence` VARCHAR(191) NOT NULL,
    `solde` DOUBLE NOT NULL,
    `dateSolde` DATETIME(3) NOT NULL,
    `positive` DOUBLE NOT NULL DEFAULT 0.0,
    `negative` DOUBLE NOT NULL DEFAULT 0.0,
    `dmlt` DOUBLE NOT NULL DEFAULT 0.0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Client` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `ice` VARCHAR(191) NOT NULL,
    `identifFiscal` VARCHAR(191) NOT NULL,
    `telClient` VARCHAR(191) NOT NULL,
    `contact` VARCHAR(191) NOT NULL,
    `telContact` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Client_ice_key`(`ice`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Attestation` ADD CONSTRAINT `Attestation_fournisseurId_fkey` FOREIGN KEY (`fournisseurId`) REFERENCES `Fournisseur`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE `Cheque` ADD CONSTRAINT `Cheque_fournisseurId_fkey` FOREIGN KEY (`fournisseurId`) REFERENCES `Fournisseur`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Cheque` ADD CONSTRAINT `Cheque_banqueId_fkey` FOREIGN KEY (`banqueId`) REFERENCES `Banque`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Effet` ADD CONSTRAINT `Effet_fournisseurId_fkey` FOREIGN KEY (`fournisseurId`) REFERENCES `Fournisseur`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Effet` ADD CONSTRAINT `Effet_banqueId_fkey` FOREIGN KEY (`banqueId`) REFERENCES `Banque`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prelevement` ADD CONSTRAINT `Prelevement_fournisseurId_fkey` FOREIGN KEY (`fournisseurId`) REFERENCES `Fournisseur`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payavenir` ADD CONSTRAINT `Payavenir_fournisseurId_fkey` FOREIGN KEY (`fournisseurId`) REFERENCES `Fournisseur`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payavenir` ADD CONSTRAINT `Payavenir_banqueId_fkey` FOREIGN KEY (`banqueId`) REFERENCES `Banque`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Recavenir` ADD CONSTRAINT `Recavenir_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Recavenir` ADD CONSTRAINT `Recavenir_banqueId_fkey` FOREIGN KEY (`banqueId`) REFERENCES `Banque`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
