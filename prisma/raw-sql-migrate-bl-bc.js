/**
 * Raw SQL Migration Script: BL-BC Many-to-Many
 * Queries the actual database table directly to get bondeCommandeId values
 * and migrates them to the join table
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
  try {
    console.log('Starting raw SQL migration: BL-BC Many-to-Many...');

    // 1. Query the actual database table directly for bondeCommandeId values
    // This works even if Prisma schema no longer has the field
    const blsWithBc = await prisma.$queryRaw`
      SELECT id, bondeCommandeId 
      FROM BondeLivraison 
      WHERE bondeCommandeId IS NOT NULL
    `;

    console.log(`Found ${blsWithBc.length} BLs with BC associations`);

    if (blsWithBc.length === 0) {
      console.log('No data found to migrate. The column may have been dropped already.');
      return;
    }

    // 2. Create join table records for each
    const created = [];
    const errors = [];

    for (const bl of blsWithBc) {
      try {
        // Check if link already exists
        const existing = await prisma.bondeLivraisonBondeCommande.findFirst({
          where: {
            bondeLivraisonId: bl.id,
            bondeCommandeId: bl.bondeCommandeId
          }
        });

        if (existing) {
          console.log(`⚠️  Link already exists: BL ${bl.id} <-> BC ${bl.bondeCommandeId}`);
          continue;
        }

        // Create the link
        const link = await prisma.bondeLivraisonBondeCommande.create({
          data: {
            bondeLivraisonId: bl.id,
            bondeCommandeId: bl.bondeCommandeId
          }
        });
        created.push(link);
        console.log(`✅ Created link: BL ${bl.id} <-> BC ${bl.bondeCommandeId}`);

      } catch (err) {
        console.error(`❌ Error creating link BL ${bl.id} <-> BC ${bl.bondeCommandeId}:`, err.message);
        errors.push({ blId: bl.id, bcId: bl.bondeCommandeId, error: err.message });
      }
    }

    console.log(`\n========================================`);
    console.log(`Migration Results:`);
    console.log(`========================================`);
    console.log(`✅ Created: ${created.length} links`);
    console.log(`❌ Errors:  ${errors.length}`);
    
    if (errors.length > 0) {
      console.log(`\nFailed relationships:`);
      errors.forEach(e => console.log(`  - BL ${e.blId} <-> BC ${e.bcId}: ${e.error}`));
    }

    console.log(`\nNext: Verify in Prisma Studio or your app`);
    console.log(`   npx prisma studio`);
    console.log(`========================================`);

  } catch (error) {
    console.error('Migration failed:', error.message);
    if (error.message.includes('Unknown column')) {
      console.error('\nThe bondeCommandeId column has already been dropped from the database.');
      console.error('Data is lost. Use manual-migrate-bl-bc.js to recreate relationships.');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
