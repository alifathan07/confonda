/*
  Warnings:

  - A unique constraint covering the columns `[ice]` on the table `Fournisseur` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Fournisseur_ice_key` ON `Fournisseur`(`ice`);
