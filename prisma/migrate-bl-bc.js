import prisma from "../db.js";

async function main() {
    console.log('🚀 Starting migration of existing BL-BC relationships...');

    // 1. Query raw SQL to find all BLs that have a bondeCommandeId
    // This gets data directly from the database table
    const blsWithBc = await prisma.$queryRaw`
        SELECT id, bondeCommandeId 
        FROM BondeLivraison 
        WHERE bondeCommandeId IS NOT NULL
    `;

    console.log(`Found ${blsWithBc.length} BLs to migrate.`);

    let count = 0;
    for (const bl of blsWithBc) {
        // 2. Check if link already exists (idempotent)
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

        // 3. Create the join table entry
        await prisma.bondeLivraisonBondeCommande.create({
            data: {
                bondeLivraisonId: bl.id,
                bondeCommandeId: bl.bondeCommandeId
            }
        });
        
        count++;
        console.log(`✅ Created link: BL ${bl.id} <-> BC ${bl.bondeCommandeId}`);
        
        if (count % 10 === 0) process.stdout.write('.');
    }

    console.log(`\n✅ Migration complete! ${count} BL-BC relationships migrated.`);
}

main()
    .catch(e => {
        console.error('❌ Migration failed:', e.message);
        if (e.message.includes('Unknown column')) {
            console.error('The bondeCommandeId column has been dropped. Data is lost.');
        }
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
