import prisma from "./db.js";


async function main() {
    console.log('🚀 Starting migration of existing cheques...');

    // 1. Find all cheques that have a chantierId but NO allocations yet
    // This prevents creating duplicates if you run the script twice
    const cheques = await prisma.cheque.findMany({
        where: {
            chantierId: { not: null },
            allocations: { none: {} }
        }
    });

    console.log(`Found ${cheques.length} cheques to migrate.`);

    let count = 0;
    for (const cheque of cheques) {
        // 2. Create an allocation for each
        // We take the FULL amount of the cheque and assign it to that single chantier
        if (cheque.montant) {
            await prisma.chequeAllocation.create({
                data: {
                    chequeId: cheque.id,
                    chantierId: cheque.chantierId,
                    montant: cheque.montant
                }
            });
            count++;
            if (count % 10 === 0) process.stdout.write('.');
        }
    }

    console.log(`\n✅ Migration complete! ${count} cheques migrated.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
