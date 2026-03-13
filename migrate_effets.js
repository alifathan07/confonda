import prisma from "./db.js";

async function main() {
  console.log('🚀 Starting migration of existing effets...');

  // 1. Find all effets that have a chantierId but NO allocations yet
  // This prevents creating duplicates if you run the script twice
  const effets = await prisma.effet.findMany({
    where: {
      chantierId: { not: null },
      allocations: { none: {} },
    },
  });

  console.log(`Found ${effets.length} effets to migrate.`);

  let count = 0;
  for (const effet of effets) {
    // 2. Create an allocation for each
    // We take the FULL amount of the effet and assign it to that single chantier
    if (effet.montant) {
      await prisma.effetAllocation.create({
        data: {
          effetId: effet.id,
          chantierId: effet.chantierId,
          montant: effet.montant,
        },
      });

      count++;
      if (count % 10 === 0) process.stdout.write('.');
    }
  }

  console.log(`\n✅ Migration complete! ${count} effets migrated.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
