import prisma from '../db.js';

async function deduplicateSuppliers() {
  console.log('=== Starting Supplier Deduplication ===\n');

  // Step 1: Find all suppliers with duplicate names
  const suppliers = await prisma.fournisseur.findMany({
    select: { id: true, name: true }
  });

  // Group by name (case-insensitive)
  const nameGroups = {};
  suppliers.forEach(s => {
    const key = s.name.toLowerCase().trim();
    if (!nameGroups[key]) nameGroups[key] = [];
    nameGroups[key].push(s);
  });

  // Find duplicates
  const duplicates = Object.entries(nameGroups).filter(([_, arr]) => arr.length > 1);
  
  if (duplicates.length === 0) {
    console.log('No duplicate suppliers found!');
    return;
  }

  console.log(`Found ${duplicates.length} groups of duplicate suppliers:\n`);
  
  let totalMoved = 0;

  for (const [name, group] of duplicates) {
    console.log(`Processing: "${group[0].name}"`);
    console.log(`  IDs to merge: ${group.map(s => s.id).join(', ')}`);
    
    // Keep the first one as master
    const masterId = group[0].id;
    const duplicateIds = group.slice(1).map(s => s.id);
    
    console.log(`  Keeping ID: ${masterId}, Deleting: ${duplicateIds.join(', ')}`);
    
    // Move related data to master
    // 1. BondeCommande (BC)
    const bcCount = await prisma.bondeCommande.updateMany({
      where: { fournisseurId: { in: duplicateIds } },
      data: { fournisseurId: masterId }
    });
    console.log(`  - Moved ${bcCount.count} Bon de Commande(s)`);
    totalMoved += bcCount.count;

    // 2. BondeLivraison
    const blCount = await prisma.bondeLivraison.updateMany({
      where: { fournisseurId: { in: duplicateIds } },
      data: { fournisseurId: masterId }
    });
    console.log(`  - Moved ${blCount.count} Bon de Livraison(s)`);
    totalMoved += blCount.count;

    // 3. Cheque
    const chequeCount = await prisma.cheque.updateMany({
      where: { fournisseurId: { in: duplicateIds } },
      data: { fournisseurId: masterId }
    });
    console.log(`  - Moved ${chequeCount.count} Chèque(s)`);
    totalMoved += chequeCount.count;

    // 4. Effet
    const effetCount = await prisma.effet.updateMany({
      where: { fournisseurId: { in: duplicateIds } },
      data: { fournisseurId: masterId }
    });
    console.log(`  - Moved ${effetCount.count} Effet(s)`);
    totalMoved += effetCount.count;

    // 5. Virement
    const virementCount = await prisma.virement.updateMany({
      where: { fournisseurId: { in: duplicateIds } },
      data: { fournisseurId: masterId }
    });
    console.log(`  - Moved ${virementCount.count} Virement(s)`);
    totalMoved += virementCount.count;

    // 6. Prelevement
    const prelevementCount = await prisma.prelevement.updateMany({
      where: { fournisseurId: { in: duplicateIds } },
      data: { fournisseurId: masterId }
    });
    console.log(`  - Moved ${prelevementCount.count} Prélèvement(s)`);
    totalMoved += prelevementCount.count;

    // 7. Payavenir
    const payavenirCount = await prisma.payavenir.updateMany({
      where: { fournisseurId: { in: duplicateIds } },
      data: { fournisseurId: masterId }
    });
    console.log(`  - Moved ${payavenirCount.count} Payavenir(s)`);
    totalMoved += payavenirCount.count;

    
    

    // 9. Attestation
   
    // 10. DemandeDePrix
    const demandePrixCount = await prisma.demandeandfournisseur.deleteMany({
      where: { fournisseurId: { in: duplicateIds } }
    });
    // Note: This removes associations, not the demand itself
    
  

    // Now delete the duplicates
    const deleted = await prisma.fournisseur.deleteMany({
      where: { id: { in: duplicateIds } }
    });
    console.log(`  - Deleted ${deleted.count} duplicate supplier(s)\n`);
  }

  console.log('=== Deduplication Complete ===');
  console.log(`Total records moved: ${totalMoved}`);
}

deduplicateSuppliers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
