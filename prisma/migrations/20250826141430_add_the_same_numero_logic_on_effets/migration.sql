/*
  Warnings:

  - A unique constraint covering the columns `[banqueId,numero]` on the table `Effet` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `Effet_numero_key` ON `effet`;

-- CreateIndex
CREATE UNIQUE INDEX `Effet_banqueId_numero_key` ON `Effet`(`banqueId`, `numero`);
