-- AlterTable
ALTER TABLE `banque` MODIFY `dateSolde` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `cheque` MODIFY `dateEtablissement` DATETIME(3) NULL,
    MODIFY `dateEcheance` DATETIME(3) NULL;
