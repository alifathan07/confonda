import prisma from "./db.js";

async function main() {
  console.log("🚀 Starting migration of existing miseadis...");

  // Find all miseadis that have a chantierId but NO allocations yet
  // This prevents creating duplicates if you run the script twice
  const miseadisList = await prisma.miseadis.findMany({
    where: {
      chantierId: { not: null },
      allocations: { none: {} },
    },
  });

  console.log(`Found ${miseadisList.length} miseadis to migrate.`);

  let count = 0;
  for (const m of miseadisList) {
    if (m.montant) {
      await prisma.miseADispositionAllocation.create({
        data: {
          miseadisId: m.id,
          chantierId: m.chantierId,
          montant: m.montant,
        },
      });

      count++;
      if (count % 10 === 0) process.stdout.write(".");
    }
  }

  console.log(`\n✅ Migration complete! ${count} miseadis migrated.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
