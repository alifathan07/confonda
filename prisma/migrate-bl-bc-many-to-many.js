/**
 * Migration Script: BL-BC Many-to-Many
 * Run this BEFORE applying the schema changes to migrate existing data
 * 
 * This script migrates the existing bondeCommandeId column in BondeLivraison
 * to the new join table BondeLivraisonBondeCommande
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
  try {
    console.log('Starting migration: BL-BC Many-to-Many...');

    // 1. Find all BLs with an existing bondeCommandeId
    const blsWithBc = await prisma.bondeLivraison.findMany({
      where: { bondeCommandeId: { not: null } },
      select: { id: true, bondeCommandeId: true }
    });

    console.log(`Found ${blsWithBc.length} BLs with BC associations`);

    // 2. Create join table records for each
    const created = [];
    for (const bl of blsWithBc) {
      try {
        const link = await prisma.bondeLivraisonBondeCommande.create({
          data: {
            bondeLivraisonId: bl.id,
            bondeCommandeId: bl.bondeCommandeId
          }
        });
        created.push(link);
        console.log(`Created link: BL ${bl.id} <-> BC ${bl.bondeCommandeId}`);
      } catch (err) {
        // If unique constraint fails, it means the link already exists (idempotent)
        if (err.code === 'P2002') {
          console.log(`Link already exists: BL ${bl.id} <-> BC ${bl.bondeCommandeId}`);
        } else {
          throw err;
        }
      }
    }

    console.log(`\nMigration complete! Created ${created.length} links.`);
    console.log('You can now apply the schema changes to remove bondeCommandeId column.');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
