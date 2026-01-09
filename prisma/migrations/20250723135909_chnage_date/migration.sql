/*
  Warnings:

  - You are about to alter the column `dateSolde` on the `banque` table. The data in that column could be lost. The data in that column will be cast from `DateTime(3)` to `DateTime(0)`.

*/
-- AlterTable
ALTER TABLE `banque` MODIFY `dateSolde` DATETIME(0) NOT NULL;
