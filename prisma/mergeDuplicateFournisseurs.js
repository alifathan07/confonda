import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const normalizeName = (name) => {
  if (!name) return '';
  return String(name)
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
};

const pickPrimary = (items) => {
  // Prefer the supplier with most relations, then oldest (smallest id)
  const score = (f) => {
    const rel =
      (f._count?.cheques || 0) +
      (f._count?.effets || 0) +
      (f._count?.prelevements || 0) +
      (f._count?.telepaimentPrelevement || 0) +
      (f._count?.commandes || 0) +
      (f._count?.attestations || 0) +
      (f._count?.demandeandfournisseur || 0) +
      (f._count?.payavenir || 0) +
      (f._count?.virements || 0);
    return rel;
  };

  return [...items].sort((a, b) => {
    const sb = score(b);
    const sa = score(a);
    if (sb !== sa) return sb - sa;
    return Number(a.id) - Number(b.id);
  })[0];
};

const mergeGroup = async (tx, primaryId, duplicateIds) => {
  const dupIds = duplicateIds.map(Number).filter((n) => Number.isFinite(n));
  if (!dupIds.length) return;

  // Every model in schema.prisma that has fournisseurId
  await tx.attestation.updateMany({ where: { fournisseurId: { in: dupIds } }, data: { fournisseurId: primaryId } });
  await tx.cheque.updateMany({ where: { fournisseurId: { in: dupIds } }, data: { fournisseurId: primaryId } });
  await tx.effet.updateMany({ where: { fournisseurId: { in: dupIds } }, data: { fournisseurId: primaryId } });
  await tx.prelevement.updateMany({ where: { fournisseurId: { in: dupIds } }, data: { fournisseurId: primaryId } });
  await tx.payavenir.updateMany({ where: { fournisseurId: { in: dupIds } }, data: { fournisseurId: primaryId } });
  await tx.telepaimentPrelevement.updateMany({ where: { fournisseurId: { in: dupIds } }, data: { fournisseurId: primaryId } });

  // Optional FK
  await tx.virement.updateMany({ where: { fournisseurId: { in: dupIds } }, data: { fournisseurId: primaryId } });

  // join table
  await tx.demandeandfournisseur.updateMany({ where: { fournisseurId: { in: dupIds } }, data: { fournisseurId: primaryId } });

  // commandes
  await tx.bondeCommande.updateMany({ where: { fournisseurId: { in: dupIds } }, data: { fournisseurId: primaryId } });

  // Now safe to delete duplicates
  await tx.fournisseur.deleteMany({ where: { id: { in: dupIds } } });
};

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  const fournisseurs = await prisma.fournisseur.findMany({
    select: {
      id: true,
      name: true,
      ice: true,
      rib: true,
      createdAt: true,
      _count: {
        select: {
          cheques: true,
          effets: true,
          prelevements: true,
          telepaimentPrelevement: true,
          commandes: true,
          attestations: true,
          demandeandfournisseur: true,
          payavenir: true,
          virements: true,
        },
      },
    },
  });

  const groups = new Map();
  for (const f of fournisseurs) {
    const key = normalizeName(f.name);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(f);
  }

  const duplicates = [...groups.entries()].filter(([, list]) => list.length > 1);

  if (!duplicates.length) {
    console.log('No duplicate suppliers found.');
    return;
  }

  console.log(`Duplicate groups found: ${duplicates.length}`);

  const mergePlan = duplicates.map(([key, list]) => {
    const primary = pickPrimary(list);
    const dupes = list.filter((x) => x.id !== primary.id);
    return {
      key,
      primary,
      duplicateIds: dupes.map((d) => d.id),
    };
  });

  for (const g of mergePlan) {
    console.log(`[GROUP] "${g.key}" -> keep ${g.primary.id} (${g.primary.name}), merge [${g.duplicateIds.join(', ')}]`);
  }

  if (dryRun) {
    console.log('Dry-run mode enabled. No changes were written.');
    return;
  }

  await prisma.$transaction(async (tx) => {
    for (const g of mergePlan) {
      console.log(`[MERGE] keep ${g.primary.id} <- [${g.duplicateIds.join(', ')}]`);
      await mergeGroup(tx, g.primary.id, g.duplicateIds);
    }
  });

  console.log('Done.');
}

main()
  .catch((e) => {
    console.error('Merge failed:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
