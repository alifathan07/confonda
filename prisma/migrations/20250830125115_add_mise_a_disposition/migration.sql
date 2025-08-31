-- CreateTable
CREATE TABLE `Miseadis` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `designation` VARCHAR(191) NULL,
    `beneficiaire` VARCHAR(191) NULL,
    `montant` DOUBLE NULL,
    `date` DATETIME(3) NULL,
    `dateReglement` DATETIME(3) NULL,
    `obs` VARCHAR(191) NULL,
    `objet` VARCHAR(191) NULL,
    `cause` VARCHAR(191) NULL,
    `rtgs` BOOLEAN NOT NULL DEFAULT false,
    `rib` INTEGER NULL,
    `montantLettres` VARCHAR(191) NULL,
    `fournisseurId` INTEGER NULL,
    `banqueId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Miseadis` ADD CONSTRAINT `Miseadis_fournisseurId_fkey` FOREIGN KEY (`fournisseurId`) REFERENCES `Fournisseur`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Miseadis` ADD CONSTRAINT `Miseadis_banqueId_fkey` FOREIGN KEY (`banqueId`) REFERENCES `Banque`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
