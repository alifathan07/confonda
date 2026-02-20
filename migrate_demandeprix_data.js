import prisma from "./db.js";

// ─── Migration Script: Convert old DemandeDePrix logic to new demandeandfournisseur model ─────────────────────

/**
 * This script migrates existing DemandeDePrix data to work with the new 
 * demandeandfournisseur join table model in Prisma schema
 */

async function migrateDemandePrixData() {
  try {
    console.log('🔄 Starting migration of DemandeDePrix data...');

    // 1. Get all existing DemandeDePrix records
    const allDemandePrix = await prisma.demandeDePrix.findMany({
      include: {
        articles: true
      }
    });

    console.log(`📊 Found ${allDemandePrix.length} DemandeDePrix records`);

    // 2. For each DemandeDePrix, create corresponding demandeandfournisseur records
    for (const dp of allDemandePrix) {
      console.log(`🔄 Processing DemandeDePrix #${dp.id}`);

      // Check if this DemandeDePrix already has demandeandfournisseur records
      const existingRelations = await prisma.demandeandfournisseur.findMany({
        where: { demandeDePrixId: dp.id }
      });

      if (existingRelations.length > 0) {
        console.log(`⚠️  DemandeDePrix #${dp.id} already has ${existingRelations.length} supplier relations, skipping...`);
        continue;
      }

      // If old logic had a single fournisseur (from old schema), migrate it
      // This is a fallback - you may need to adjust based on your actual data
      if (dp.fournisseurId) {
        console.log(`📝 Migrating single supplier relation for DemandeDePrix #${dp.id}`);
        
        await prisma.demandeandfournisseur.create({
          data: {
            demandeDePrixId: dp.id,
            fournisseurId: dp.fournisseurId,
            status: 'envoyer', // Default status
            emailSentAt: dp.sentByEmail ? new Date() : null
          }
        });

        console.log(`✅ Migrated DemandeDePrix #${dp.id} -> Fournisseur #${dp.fournisseurId}`);
      } else {
        console.log(`ℹ️  DemandeDePrix #${dp.id} has no supplier to migrate`);
      }
    }

    // 3. Verify migration
    const totalRelations = await prisma.demandeandfournisseur.count();
    console.log(`📈 Total demandeandfournisseur relations after migration: ${totalRelations}`);

    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Helper function to create a new DemandeDePrix with multiple suppliers
 * using the new demandeandfournisseur model
 */
async function createDemandePrixWithSuppliers(demandePrixData, supplierIds) {
  try {
    console.log(`📝 Creating new DemandeDePrix with ${supplierIds.length} suppliers`);

    // 1. Create the main DemandeDePrix record
    const newDemandePrix = await prisma.demandeDePrix.create({
      data: {
        date: demandePrixData.date || new Date(),
        devisPath: demandePrixData.devisPath || null,
        sentByEmail: demandePrixData.sentByEmail || false,
        articles: {
          create: demandePrixData.articles || []
        }
      }
    });

    console.log(`✅ Created DemandeDePrix #${newDemandePrix.id}`);

    // 2. Create supplier relations
    const supplierRelations = supplierIds.map(supplierId => ({
      demandeDePrixId: newDemandePrix.id,
      fournisseurId: supplierId,
      status: 'en attent', // Default status
      emailSentAt: null
    }));

    await prisma.demandeandfournisseur.createMany({
      data: supplierRelations
    });

    console.log(`✅ Created ${supplierRelations.length} supplier relations for DemandeDePrix #${newDemandePrix.id}`);

    return newDemandePrix;

  } catch (error) {
    console.error('❌ Failed to create DemandeDePrix with suppliers:', error);
    throw error;
  }
}

/**
 * Helper function to get DemandeDePrix with flattened supplier data
 * (for use in controllers to maintain compatibility with existing EJS templates)
 */
async function getDemandePrixWithFlattenedSuppliers(id) {
  try {
    const demandePrix = await prisma.demandeDePrix.findUnique({
      where: { id },
      include: {
        articles: true,
        demandeandfournisseur: {
          include: {
            fournisseur: true
          }
        }
      }
    });

    if (!demandePrix) {
      return null;
    }

    // Flatten the supplier data for template compatibility
    const fournisseurs = demandePrix.demandeandfournisseur
      .map(df => df.fournisseur)
      .filter(Boolean);

    const fournisseurIds = fournisseurs.map(f => f.id);

    // Add flattened data to the object
    const flattenedDemandePrix = {
      ...demandePrix,
      fournisseurs,
      fournisseurIds,
      // Keep single fournisseur for backward compatibility
      fournisseur: fournisseurs[0] || null
    };

    return flattenedDemandePrix;

  } catch (error) {
    console.error('❌ Failed to get DemandeDePrix with flattened suppliers:', error);
    throw error;
  }
}

/**
 * Helper function to update DemandePrix suppliers
 */
async function updateDemandePrixSuppliers(demandePrixId, supplierIds) {
  try {
    console.log(`🔄 Updating suppliers for DemandeDePrix #${demandePrixId}`);

    // 1. Delete existing relations
    await prisma.demandeandfournisseur.deleteMany({
      where: { demandeDePrixId }
    });

    // 2. Create new relations
    const newRelations = supplierIds.map(supplierId => ({
      demandeDePrixId,
      fournisseurId: supplierId,
      status: 'en attent',
      emailSentAt: null
    }));

    await prisma.demandeandfournisseur.createMany({
      data: newRelations
    });

    console.log(`✅ Updated DemandeDePrix #${demandePrixId} with ${supplierIds.length} suppliers`);

  } catch (error) {
    console.error('❌ Failed to update DemandeDePrix suppliers:', error);
    throw error;
  }
}

// ─── USAGE EXAMPLES ────────────────────────────────────────────────────────────────────────────────

/*
// 1. Run migration for existing data
await migrateDemandePrixData();

// 2. Create new DemandeDePrix with multiple suppliers
const newDP = await createDemandePrixWithSuppliers(
  {
    date: new Date(),
    devisPath: '/path/to/devis.pdf',
    sentByEmail: false,
    articles: [
      {
        designation: 'Article 1',
        reference: 'REF001',
        unite: 'PC',
        quantite: 10,
        prixUnitaire: 100.0
      }
    ]
  },
  [1, 2, 3] // supplier IDs
);

// 3. Get DemandeDePrix with flattened suppliers (for EJS templates)
const dpWithSuppliers = await getDemandePrixWithFlattenedSuppliers(123);
console.log(dpWithSuppliers.fournisseurs); // Array of suppliers
console.log(dpWithSuppliers.fournisseurIds); // Array of supplier IDs

// 4. Update suppliers for existing DemandeDePrix
await updateDemandePrixSuppliers(123, [4, 5, 6]);
*/

// Export functions for use in other files
export {
  migrateDemandePrixData,
  createDemandePrixWithSuppliers,
  getDemandePrixWithFlattenedSuppliers,
  updateDemandePrixSuppliers
};

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateDemandePrixData();
}
