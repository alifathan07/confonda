import prisma from "./db.js";

async function main() {
  console.log('🚀 Starting migration of existing virements...');

  // 1. Find all virements that have a chantierId but NO allocations yet
  // This prevents creating duplicates if you run the script twice
  const virements = await prisma.virement.findMany({
    where: {
      chantierId: { not: null },
      allocations: { none: {} },
    },
  });

  console.log(`Found ${virements.length} virements to migrate.`);

  let count = 0;
  for (const virement of virements) {
    // 2. Create an allocation for each
    // We take the FULL amount of the virement and assign it to that single chantier
    if (virement.montant) {
      await prisma.virementAllocation.create({
        data: {
          virementId: virement.id,
          chantierId: virement.chantierId,
          montant: virement.montant,
        },
      });

      count++;
      if (count % 10 === 0) process.stdout.write('.');
    }
  }

  console.log(`\n✅ Migration complete! ${count} virements migrated.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
