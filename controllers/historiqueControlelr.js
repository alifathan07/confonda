import prisma from "../db.js";
export const indexHis = async (req, res) => {
  try {

    // Parse dates with fallback
  

    // Validate parsed dates
   

    // Fetch cheques
    const cheques = await prisma.cheque.findMany({
      where: {
        statut: { notIn: ['Annulé', 'annulé', 'ANNULE'] },
        dateEcheance: { not: null },
      },
      select: {
        id: true,
        numero: true,
        dateEtablissement: true,
        montant: true,
        chantier : {select: {nom: true}},
        dateEcheance: true,
        validation: true,
        beneficiaire: true,
        statut: true,
        obs: true,
        banque: { select: { name: true } },
      },
      orderBy: { dateEtablissement: 'desc' },
    });

    // Fetch effets
    const effets = await prisma.effet.findMany({
      where: {
        statut: { notIn: ['Annulé', 'annulé', 'ANNULE'] },
        dateEcheance: { not: null },
      },
      select: {
        id: true,
        numero: true,
        dateEtablissement: true,
        montant: true,
        chantier : {select: {nom: true}},
        dateEcheance: true,
        validation: true,
        beneficiaire: true,
        obs: true,
        statut: true,
        banque: { select: { name: true } },
      },
      orderBy: { dateEtablissement: 'desc' },
    });

    // Fetch virements (excluding confonda)
    const virements = await prisma.virement.findMany({
      select: {
        id: true,
        designation: true,
        date: true,
        montant: true,
        chantier : {select: {nom: true}},
        dateReglement: true,
        beneficiaire: true,
        obs: true,
        banque: { select: { name: true } },
        objet: true,
        cause: true,
        rtgs: true,
        srbm: true,
        instantane: true,
        montantLettres: true,
      },
      orderBy: { date: 'desc' },
    });

    // Fetch mise à disposition
    const miseadis = await prisma.miseadis.findMany({
      where: {
        NOT: { date: null },
      },
      select: {
        id: true,
        beneficiaire: true,
        montant: true,
        date: true,
        dateReglement: true,
        chantier : {select: {nom: true}},
        obs: true,
        cin: true,
        objet: true,
        cause: true,
        banque: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
    });

    // Virements de fonds (only confonda)
    // const virementdeFands = await prisma.virement.findMany({
    //   where: {
    //     beneficiaire: { in: ["confonda", "CONFONDA", "Confonda"] },
    //   },
    //   select: {
    //     id: true,
    //     designation: true,
    //     date: true,
    //     montant: true,
    //     dateReglement: true,
    //     beneficiaire: true,
    //     obs: true,
    //     banque: { select: { name: true } },
    //     objet: true,
    //     cause: true,
    //     rtgs: true,
    //     srbm: true,
    //     instantane: true,
    //     montantLettres: true,
    //   },
    //   orderBy: { date: 'desc' },
    // });

    // Fetch fournisseurs and banques
    const fournisseurs = await prisma.fournisseur.findMany();
    const banques = await prisma.banque.findMany();

    // Combine and filter valid records
    const historique = [
      // --- Chèques ---
      ...cheques.map(c => ({
        id: c.id,
        numero: c.numero,
        dateEtablissement: c.dateEtablissement,
        montant: c.montant,
        chantier : c.chantier?.nom || 'Aucun',
        dateEcheance: c.dateEcheance,
        validation: c.validation,
        beneficiaire: c.beneficiaire,
        statut: c.statut,
        obs: c.obs,
        banque: c.banque?.name || 'Aucun',
        type: 'Chèque',
      })),

      // --- Effets ---
      ...effets.map(e => ({
        id: e.id,
        numero: e.numero,
        dateEtablissement: e.dateEtablissement,
        montant: e.montant,
        chantier : e.chantier?.nom || 'Aucun',

        dateEcheance: e.dateEcheance,
        validation: e.validation,
        beneficiaire: e.beneficiaire,
        statut: e.statut,
        obs: e.obs,
        banque: e.banque?.name || 'Aucun',
        type: 'Effet',
      })),

      // --- Virements ---
      ...virements.map(v => ({
        id: v.id,
        numero: v.designation || 'Aucun',
        dateEtablissement: v.date,
        montant: v.montant,
        chantier : v.chantier?.nom || 'Aucun',

        dateEcheance: v.date,
        validation: false,
        beneficiaire: v.beneficiaire,
        statut: 'Aucun',
        obs: v.obs,
        banque: v.banque?.name || 'Aucun',
        type: 'Virement',
      })),

      // --- Virement de Fonds ---
    

      // --- Mise à disposition ---
      ...miseadis.map(m => ({
        id: m.id,
        numero: 'Aucun',
        dateEtablissement: m.date,
        montant: m.montant,
        chantier : m.chantier?.nom || 'Aucun',

        dateEcheance: m.date,
        validation: false,
        beneficiaire: m.beneficiaire,
        statut: 'Aucun',
        obs: m.obs,
        banque: m.banque?.name || 'Aucun',
        type: 'Mise à disposition',
      })),
    ];

    // Sort by dateEtablissement descending
    historique.sort((a, b) => new Date(b.dateEtablissement) - new Date(a.dateEtablissement));

    // Render the template
    res.render('dashboard/tresorerie/historique/index', {
      cheques,
      effets,
      virements,
      fournisseurs,
      banques,
      historique,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Erreur serveur.');
  }
};


export const updateHistoryBanque = async (req, res) => {
  try {
    const { positive, negative, dmlt, banqueId } = req.body;

    // Function to parse French-formatted numbers
    const parseFrenchNumber = (value) => {
      if (value === "" || value == null) return null; // Preserve null/empty values
      // Remove spaces, replace comma with dot, and parse as float
      return parseFloat(value.replace(/\s/g, '').replace(',', '.'));
    };

    // Ensure all arrays are aligned
    const updates = banqueId.map((id, index) => {
      let data = {};

      // Only update fields that have valid values
      if (positive[index] !== "" && positive[index] != null) {
        data.positive = parseFrenchNumber(positive[index]);
      }
      if (negative[index] !== "" && negative[index] != null) {
        data.negative = parseFrenchNumber(negative[index]);
      }
      if (dmlt[index] !== "" && dmlt[index] != null) {
        data.dmlt = parseFrenchNumber(dmlt[index]);
      }

      return {
        id: parseInt(id),
        data,
      };
    });

    // Run updates in parallel
    await Promise.all(
      updates.map(b =>
        prisma.banque.update({
          where: { id: b.id },
          data: b.data,
        })
      )
    );

    res.redirect('/tresorerie/historique');
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la situation bancaire.' });
  }
};