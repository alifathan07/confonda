import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const randPick = (arr) => arr[randInt(0, arr.length - 1)];
  const round2 = (n) => Math.round(n * 100) / 100;

  await prisma.chantier.upsert({
    where: { nom: 'siege' },
    update: {},
    create: { nom: 'siege', clientId: null }
  });

  const existingChantiers = await prisma.chantier.findMany({ select: { id: true, nom: true } });
  if (existingChantiers.length < 6) {
    const toCreate = ['Chantier A', 'Chantier B', 'Chantier C', 'Chantier D', 'Chantier E']
      .filter((n) => !existingChantiers.some((c) => c.nom === n));
    if (toCreate.length) {
      await prisma.chantier.createMany({
        data: toCreate.map((nom) => ({ nom, clientId: null })),
        skipDuplicates: true
      });
    }
  }

  const banquesCount = await prisma.banque.count();
  if (banquesCount === 0) {
    await prisma.banque.createMany({
      data: [
        {
          name: 'CIH',
          rib: '123456789012345678901234',
          agence: 'Agence 1',
          solde: 500000,
          dateSolde: new Date(),
          positive: 0,
          negative: 0,
          dmlt: 0
        },
        {
          name: 'BMCE',
          rib: '223456789012345678901234',
          agence: 'Agence 2',
          solde: 350000,
          dateSolde: new Date(),
          positive: 0,
          negative: 0,
          dmlt: 0
        }
      ]
    });
  }

  const fournisseursCount = await prisma.fournisseur.count();
  if (fournisseursCount === 0) {
    await prisma.fournisseur.createMany({
      data: Array.from({ length: 5 }).map((_, i) => ({
        name: `Fournisseur ${i + 1}`,
        email: `fournisseur${i + 1}@example.com`,
        ice: `ICE${String(i + 1).padStart(3, '0')}`,
        rib: `${i + 1}`.repeat(24).slice(0, 24),
        agence: `Agence F${i + 1}`,
        banque: 'Banque',
        objet: 'Objet',
        identifFiscal: `IF${String(i + 1).padStart(3, '0')}`,
        telFournisseur: `06000000${String(i + 1).padStart(2, '0')}`,
        contact: `Contact ${i + 1}`,
        telContact: `06111111${String(i + 1).padStart(2, '0')}`
      }))
    });
  }

  const [banques, fournisseurs, chantiers] = await Promise.all([
    prisma.banque.findMany({ select: { id: true, name: true } }),
    prisma.fournisseur.findMany({ select: { id: true, name: true } }),
    prisma.chantier.findMany({ select: { id: true, nom: true } })
  ]);

  if (!banques.length) throw new Error('No banques found to seed cheques.');
  if (!fournisseurs.length) throw new Error('No fournisseurs found to seed cheques.');
  if (!chantiers.length) throw new Error('No chantiers found to seed cheques.');

  const baseNumero = `SEED-${Date.now()}`;
  for (let i = 0; i < 20; i++) {
    const banque = randPick(banques);
    const fournisseur = randPick(fournisseurs);

    const montant = round2(randInt(1500, 60000) + Math.random());
    const allocCount = Math.min(randInt(1, 3), chantiers.length);
    const selectedChantiers = [...chantiers]
      .sort(() => Math.random() - 0.5)
      .slice(0, allocCount);

    const amounts = [];
    let remaining = montant;
    for (let k = 0; k < allocCount; k++) {
      if (k === allocCount - 1) {
        amounts.push(round2(remaining));
      } else {
        const maxPart = Math.max(0.01, remaining - (allocCount - k - 1) * 0.01);
        const part = round2(Math.max(0.01, Math.random() * maxPart));
        amounts.push(part);
        remaining = round2(remaining - part);
      }
    }

    const numero = `${baseNumero}-${String(i + 1).padStart(3, '0')}`;

    const cheque = await prisma.cheque.create({
      data: {
        montant,
        dateEtablissement: new Date(Date.now() - randInt(0, 30) * 24 * 60 * 60 * 1000),
        dateEcheance: new Date(Date.now() + randInt(5, 60) * 24 * 60 * 60 * 1000),
        statut: 'en circulation',
        dateReglement: null,
        fournisseurId: fournisseur.id,
        beneficiaire: fournisseur.name,
        validation: false,
        banqueId: banque.id,
        chantierId: selectedChantiers[0]?.id ?? null,
        numero,
        obs: `Seed cheque ${i + 1}`,
        montantLettres: null,
        ville: 'Casablanca'
      }
    });

    await prisma.chequeAllocation.createMany({
      data: selectedChantiers.map((ch, idx) => ({
        chequeId: cheque.id,
        chantierId: ch.id,
        montant: amounts[idx]
      }))
    });
  }

  console.log('✅ Seed finished: 20 cheques + allocations created');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
