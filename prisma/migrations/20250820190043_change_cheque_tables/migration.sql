/*
  Warnings:

  - A unique constraint covering the columns `[banqueId,numero]` on the table `Cheque` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `Cheque_numero_key` ON `cheque`;

-- CreateIndex
CREATE UNIQUE INDEX `Cheque_banqueId_numero_key` ON `Cheque`(`banqueId`, `numero`);
