-- CreateTable
CREATE TABLE `Fournisseur` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `adresse` VARCHAR(191) NOT NULL,
    `ice` VARCHAR(191) NOT NULL,
    `identif_fiscal` VARCHAR(191) NOT NULL,
    `tel_fournisseur` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `contact` VARCHAR(191) NOT NULL,
    `tel_contact` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Fournisseur_ice_key`(`ice`),
    UNIQUE INDEX `Fournisseur_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Reglement` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('CHECK', 'EFFET', 'PRELEVEMENT', 'VIREMENT', 'ESPECES') NOT NULL,
    `dateReglement` DATETIME(3) NOT NULL,
    `fournisseurId` INTEGER NOT NULL,
    `montant` DOUBLE NULL,
    `numeroPiece` VARCHAR(191) NULL,
    `beneficiaire` VARCHAR(191) NULL,
    `dateEcheance` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Reglement` ADD CONSTRAINT `Reglement_fournisseurId_fkey` FOREIGN KEY (`fournisseurId`) REFERENCES `Fournisseur`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
