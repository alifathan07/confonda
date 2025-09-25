import prisma from "../db.js";
export const indexHis = async (req, res) => {
  try {
    const { from, to } = req.query;

    // Parse dates with fallback
    const fromDate = from ? new Date(from) : new Date('1900-01-01');
    const toDate = to ? new Date(to) : new Date('2100-01-01');

    // Validate parsed dates
    if (isNaN(fromDate) || isNaN(toDate)) {
      return res.status(400).send('Invalid date format in query parameters.');
    }

    // Common where clause for date filtering
    const dateFilter = {
      dateEtablissement: {
        gte: fromDate,
        lte: toDate,
      },
    };

    // Fetch cheques
    const cheques = await prisma.cheque.findMany({
      where: {
        dateEtablissement: {
          gte: fromDate,
          lte: toDate,
          not: null,
        },
        statut: { not: 'Annulé' },

        dateEcheance: { not: null },
      },
      select: {
        id: true,
        numero: true,
        dateEtablissement: true,
        montant: true,
        dateEcheance: true,
        validation: true,
        beneficiaire: true,
        statut: true,
        obs: true,
        banque: {
          select: { name: true },
        },
      },
      orderBy: {
        dateEtablissement: 'desc',
      },
    });

    // Fetch effets
    const effets = await prisma.effet.findMany({
      where: {
        dateEtablissement: {
          gte: fromDate,
          lte: toDate,
          not: null,
        },
        statut: { not: 'Annulé' },
        dateEcheance: { not: null },
      },
      select: {
        id: true,
        numero: true,
        dateEtablissement: true,
        montant: true,
        dateEcheance: true,
        validation: true,
        beneficiaire: true,
        obs: true,
        statut: true,
        banque: {
          select: { name: true },
        },
      },
      orderBy: {
        dateEtablissement: 'desc',
      },
    });

    // Fetch virements (aligned with schema)
    const virements = await prisma.virement.findMany({
      where: {
        date: {
          gte: fromDate,
          lte: toDate,
          not: null, // Remove this line
        },
      },
      select: {
        id: true,
        designation: true, // Using designation instead of numero
        date: true, // Maps to dateEtablissement
        montant: true,
        dateReglement: true, // Maps to dateEcheance
        beneficiaire: true,
        obs: true,
        banque: {
          select: { name: true },
        },
        // Include other fields if needed in the template
        objet: true,
        cause: true,
        rtgs: true,
        srbm: true,
        instantane: true,
        montantLettres: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Fetch mise a dsisposition
    const miseadis = await prisma.miseadis.findMany({
      where: {
        date: {
          gte: fromDate,
          lte: toDate,
        },
        NOT: {
          date: null,
        },
      },
      select: {
        id: true,
        beneficiaire: true,
        montant: true,
        date: true,
        dateReglement: true,
        obs: true,
        cin: true,
        objet: true,
        cause: true,
        banque: {
          select: { name: true },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
    
    // Fetch fournisseurs and banques
    const fournisseurs = await prisma.fournisseur.findMany();
    const banques = await prisma.banque.findMany();

    // Combine and filter valid records
    const historique = [
      ...cheques
        .filter(c => c.dateEtablissement && c.dateEcheance && !isNaN(new Date(c.dateEtablissement)) && !isNaN(new Date(c.dateEcheance)))
        .map(c => ({
          id: c.id,
          numero: c.numero,
          dateEtablissement: c.dateEtablissement,
          montant: c.montant,
          dateEcheance: c.dateEcheance,
          validation: c.validation,
          beneficiaire: c.beneficiaire,
          statut: c.statut,
          obs: c.obs,
          banque: c.banque?.name || 'Aucun',
          type: 'cheque',
        })),
      ...effets
        .filter(e => e.dateEtablissement && e.dateEcheance && !isNaN(new Date(e.dateEtablissement)) && !isNaN(new Date(e.dateEcheance)))
        .map(e => ({
          id: e.id,
          numero: e.numero,
          dateEtablissement: e.dateEtablissement,
          montant: e.montant,
          dateEcheance: e.dateEcheance,
          validation: e.validation,
          beneficiaire: e.beneficiaire,
          statut: e.statut,
          obs: e.obs,
          banque: e.banque?.name || 'Aucun',
          type: 'effet',
        })),
      ...virements
        .filter(v => v.date &&  !isNaN(new Date(v.date)))
        .map(v => ({
          id: v.id,
          numero: v.designation || 'Aucun', 
          dateEtablissement: v.date,
          montant: v.montant,
          dateEcheance: v.dateReglement,
          validation: false,
          beneficiaire: v.beneficiaire,
          statut: 'Aucun',
          obs: v.obs,
          banque: v.banque?.name || 'Aucun',
          type: 'virement',
        })),
        ...miseadis
        .filter(m => m.date && !isNaN(new Date(m.date)))
        .map(m => ({
          id: m.id,
          numero:  'Aucun',
          dateEtablissement: m.date,
          montant: m.montant,
          dateEcheance: m.dateEcheance || m.date,

          validation: false,
          beneficiaire: m.beneficiaire,
          statut: 'Aucun',
          obs: m.obs,
          banque: m.banque?.name || 'Aucun',
          type: 'mise a disposition',
        }))
      
    ];
    
    // Sort by dateEtablissement descending (last record first)
    historique.sort((a, b) => new Date(b.dateEtablissement) - new Date(a.dateEtablissement));
    

    // Render the template
    res.render('dashboard/tresorerie/historique/index', {
      cheques,
      effets,
      virements,
      from,
      to,
      fournisseurs,
      banques,
      historique,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Erreur serveur.');
  }
};