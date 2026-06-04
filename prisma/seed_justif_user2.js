import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const targetUserId = 2;
  // Ensure user with id=2 exists (create if missing)
  let user = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!user) {
    try {
      user = await prisma.user.create({
        data: {
          id: targetUserId,
          email: `seed_user${targetUserId}@example.com`,
          password: 'password',
          name: `user${targetUserId}`,
        },
      });
      console.log('Created seed user with id', user.id);
    } catch (e) {
      console.warn('Could not create user with explicit id, trying to find by email/name', e.message);
      user = await prisma.user.findFirst({ where: { OR: [{ email: `seed_user${targetUserId}@example.com` }, { name: `user${targetUserId}` }] } });
      if (!user) throw e;
    }
  } else {
    console.log('User exists with id', user.id);
  }

  // Ensure there's at least one chantier
  let chantier = await prisma.chantier.findFirst();
  if (!chantier) {
    chantier = await prisma.chantier.create({ data: { nom: 'Seed Chantier' } });
    console.log('Created seed chantier id', chantier.id);
  } else {
    console.log('Using chantier id', chantier.id);
  }

  const now = new Date();
  const mois = now.getMonth() + 1;
  const annee = now.getFullYear();
  const designation = `Seed Justif ${mois}-${annee}`;

  // Create justifCaisse
  const justif = await prisma.justifCaisse.create({
    data: {
      mois,
      annee,
      designation,
      soldePrecedent: 0,
      totalRecettes: 0,
      totalDepenses: 0,
      soldeFinal: 0,
      userId: user.id,
      chantierId: chantier.id,
    },
  });
  console.log('Created JustifCaisse id', justif.id);

  // Create 20 depenses
  const depensesData = Array.from({ length: 20 }).map((_, i) => {
    const mj = Number((Math.random() * 1000).toFixed(2));
    const mnj = Number((Math.random() * 200).toFixed(2));
    return {
      natureDepense: `Dépense seed ${i + 1}`,
      montantJustifie: mj,
      montantNonJustifie: mnj,
      observation: `Seeded expense ${i + 1}`,
      dateDepense: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
      numeroPiece: `P-${String(i + 1).padStart(3, '0')}`,
      imputation: `701${(i % 5) + 1}`,
      justifCaisseId: justif.id,
      validation: true,
      validerPar: 'Seeder',
    };
  });

  await prisma.depenseCaisse.createMany({ data: depensesData });
  console.log('Inserted 20 depenses for justifCaisse', justif.id);
  // ===== Create 7 recettes for this justif =====
  const recettesData = Array.from({ length: 7 }).map((_, i) => ({
    source: `Recette seed ${i + 1}`,
    montant: Number((Math.random() * 2000).toFixed(2)),
    dateRecette: new Date(Date.now() - i * 12 * 60 * 60 * 1000),
    userId: user.id,
    justifCaisseId: justif.id,
  }));

  await prisma.recetteCaisse.createMany({ data: recettesData });
  console.log('Inserted 7 recettes for justifCaisse', justif.id);

  // Recalculate totals (recettes + depenses)
  const recettesSums = await prisma.recetteCaisse.aggregate({
    _sum: { montant: true },
    where: { justifCaisseId: justif.id },
  });

  const depensesSums = await prisma.depenseCaisse.aggregate({
    _sum: { montantJustifie: true, montantNonJustifie: true },
    where: { justifCaisseId: justif.id },
  });

  const totalRecettes = recettesSums._sum.montant ?? 0;
  const totalJustifie = depensesSums._sum.montantJustifie ?? 0;
  const totalNonJustifie = depensesSums._sum.montantNonJustifie ?? 0;
  const totalDepenses = Number(totalJustifie) + Number(totalNonJustifie);

  // Update justifCaisse totals
  const updated = await prisma.justifCaisse.update({
    where: { id: justif.id },
    data: {
      totalDepenses,
      totalRecettes,
      soldeFinal: (justif.soldePrecedent ?? 0) + Number(totalRecettes) - totalDepenses,
    },
  });

  console.log('Updated JustifCaisse totals:', {
    id: updated.id,
    totalRecettes: updated.totalRecettes,
    totalDepenses: updated.totalDepenses,
    soldeFinal: updated.soldeFinal,
  });
}

main()
  .catch((e) => {
    console.error('Seeder failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
