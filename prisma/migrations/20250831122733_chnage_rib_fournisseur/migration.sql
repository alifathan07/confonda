-- DropIndex
DROP INDEX `Fournisseur_rib_key` ON `fournisseur`;

-- AlterTable
ALTER TABLE `fournisseur` MODIFY `rib` VARCHAR(191) NOT NULL;
