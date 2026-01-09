/*
  Warnings:

  - A unique constraint covering the columns `[numero]` on the table `Cheque` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Cheque_numero_key` ON `Cheque`(`numero`);
