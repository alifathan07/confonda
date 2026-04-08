/**
 * Manual Migration Script: BL-BC Many-to-Many
 * Hardcode your known BL-BC relationships below and run this script
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ==========================================
// ADD YOUR KNOWN BL-BC RELATIONSHIPS HERE
// Format: { blId: X, bcId: Y }
// ==========================================
const knownRelationships = [
  // Example: { blId: 1, bcId: 5 },
  // Example: { blId: 2, bcId: 3 },
  // Add your actual relationships below:
  
];

async function migrate() {
  try {
    console.log('Starting manual BL-BC relationship creation...');
    console.log(`Found ${knownRelationships.length} relationships to create\n`);

    const created = [];
    const errors = [];

    for (const rel of knownRelationships) {
      try {
        // Check if BL exists
        const bl = await prisma.bondeLivraison.findUnique({
          where: { id: rel.blId }
        });
        if (!bl) {
          console.log(`❌ BL ${rel.blId} not found, skipping...`);
          errors.push({ ...rel, reason: 'BL not found' });
          continue;
        }

        // Check if BC exists
        const bc = await prisma.bondeCommande.findUnique({
          where: { id: rel.bcId }
        });
        if (!bc) {
          console.log(`❌ BC ${rel.bcId} not found, skipping...`);
          errors.push({ ...rel, reason: 'BC not found' });
          continue;
        }

        // Check if link already exists
        const existing = await prisma.bondeLivraisonBondeCommande.findFirst({
          where: {
            bondeLivraisonId: rel.blId,
            bondeCommandeId: rel.bcId
          }
        });

        if (existing) {
          console.log(`⚠️  Link BL ${rel.blId} <-> BC ${rel.bcId} already exists`);
          continue;
        }

        // Create the link
        const link = await prisma.bondeLivraisonBondeCommande.create({
          data: {
            bondeLivraisonId: rel.blId,
            bondeCommandeId: rel.bcId
          }
        });
        created.push(link);
        console.log(`✅ Created link: BL ${rel.blId} <-> BC ${rel.bcId}`);

        // Update BL status to Actif if not already
        if (bl.status !== 'Actif') {
          await prisma.bondeLivraison.update({
            where: { id: rel.blId },
            data: { status: 'Actif' }
          });
          console.log(`   Updated BL ${rel.blId} status to 'Actif'`);
        }

      } catch (err) {
        console.error(`❌ Error creating link BL ${rel.blId} <-> BC ${rel.bcId}:`, err.message);
        errors.push({ ...rel, reason: err.message });
      }
    }

    console.log(`\n========================================`);
    console.log(`Migration Results:`);
    console.log(`========================================`);
    console.log(`✅ Created: ${created.length} links`);
    console.log(`❌ Errors:  ${errors.length}`);
    
    if (errors.length > 0) {
      console.log(`\nFailed relationships:`);
      errors.forEach(e => console.log(`  - BL ${e.blId} <-> BC ${e.bcId}: ${e.reason}`));
    }

    console.log(`\n========================================`);
    console.log('Next steps:');
    console.log('1. Update BC statuses if needed:');
    console.log('   npx prisma db execute --stdin');
    console.log('2. Restart your application');
    console.log(`========================================`);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
