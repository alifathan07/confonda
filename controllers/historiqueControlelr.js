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
        allocations: {
          select: {
            montant: true,
            chantierId: true,
            chantier: { select: { nom: true } },
          },
        },
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

    // Fetch telepaimentPrelevement
   

    // Fetch virements (excluding confonda)
    const virements = await prisma.virement.findMany({
      select: {
        id: true,
        designation: true,
        date: true,
        montant: true,
        chantier : {select: {nom: true}},
        allocations: {
          select: {
            montant: true,
            chantierId: true,
            chantier: { select: { nom: true } },
          },
        },
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

    const telepaimentPrelevement = await prisma.telepaimentPrelevement.findMany({
      select: {
        id: true,
        dateEtablissement: true,
        montant: true,
        chantier : {select: {nom: true}},
        banque: { select: { name: true } },
        fournisseur: { select: { name: true } },
        observation: true,
        type: true,
      },
      orderBy: { dateEtablissement: 'desc' },
    });

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
        chantier: (() => {
          const allocs = Array.isArray(c.allocations) ? c.allocations : [];
          const names = allocs
            .map(a => (a && a.chantier && a.chantier.nom) ? String(a.chantier.nom).trim() : '')
            .filter(Boolean);

          if (names.length) {
            return Array.from(new Set(names)).join(', ');
          }

          return c.chantier?.nom || 'Aucun';
        })(),
        chantierLines: (() => {
          const allocs = Array.isArray(c.allocations) ? c.allocations : [];
          const map = new Map();
          for (const a of allocs) {
            const nom = (a && a.chantier && a.chantier.nom) ? String(a.chantier.nom).trim() : '';
            if (!nom) continue;
            const prev = map.get(nom) || 0;
            map.set(nom, prev + Number(a.montant || 0));
          }

          const lines = Array.from(map.entries()).map(([nom, montant]) => ({ nom, montant }));
          if (lines.length) return lines;

          if (c.chantier?.nom) {
            return [{ nom: c.chantier.nom, montant: Number(c.montant || 0) }];
          }
          return [];
        })(),
        chantierNames: (() => {
          const allocs = Array.isArray(c.allocations) ? c.allocations : [];
          const names = allocs
            .map(a => (a && a.chantier && a.chantier.nom) ? String(a.chantier.nom).trim() : '')
            .filter(Boolean);
          if (names.length) return Array.from(new Set(names));
          if (c.chantier?.nom) return [String(c.chantier.nom)];
          return [];
        })(),
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
        chantierLines: [],
        chantierNames: e.chantier?.nom ? [String(e.chantier.nom)] : [],

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
        chantier: (() => {
          const allocs = Array.isArray(v.allocations) ? v.allocations : [];
          const names = allocs
            .map(a => (a && a.chantier && a.chantier.nom) ? String(a.chantier.nom).trim() : '')
            .filter(Boolean);

          if (names.length) {
            return Array.from(new Set(names)).join(', ');
          }

          return v.chantier?.nom || 'Aucun';
        })(),
        chantierLines: (() => {
          const allocs = Array.isArray(v.allocations) ? v.allocations : [];
          const map = new Map();
          for (const a of allocs) {
            const nom = (a && a.chantier && a.chantier.nom) ? String(a.chantier.nom).trim() : '';
            if (!nom) continue;
            const prev = map.get(nom) || 0;
            map.set(nom, prev + Number(a.montant || 0));
          }

          const lines = Array.from(map.entries()).map(([nom, montant]) => ({ nom, montant }));
          if (lines.length) return lines;

          if (v.chantier?.nom) {
            return [{ nom: v.chantier.nom, montant: Number(v.montant || 0) }];
          }
          return [];
        })(),
        chantierNames: (() => {
          const allocs = Array.isArray(v.allocations) ? v.allocations : [];
          const names = allocs
            .map(a => (a && a.chantier && a.chantier.nom) ? String(a.chantier.nom).trim() : '')
            .filter(Boolean);
          if (names.length) return Array.from(new Set(names));
          if (v.chantier?.nom) return [String(v.chantier.nom)];
          return [];
        })(),
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
        chantierLines: [],
        chantierNames: m.chantier?.nom ? [String(m.chantier.nom)] : [],
        
        dateEcheance: m.date,
        validation: false,
        beneficiaire: m.beneficiaire,
        statut: 'Aucun',
        obs: m.obs,
        banque: m.banque?.name || 'Aucun',
        type: 'Mise à disposition',
      })),

      // --- Telepaiment Prelevement ---
      ...telepaimentPrelevement.map(t => ({
        id: t.id,
        numero: "Aucun",
        dateEtablissement: t.dateEtablissement,
        montant: t.montant,
        chantier : t.chantier?.nom || 'Aucun',
        chantierLines: [],
        chantierNames: t.chantier?.nom ? [String(t.chantier.nom)] : [],
        dateEcheance: null,
        beneficiaire: t.fournisseur?.name || 'Aucun',
        obs: t.observation,
        banque: t.banque?.name || 'Aucun',
        type: t.type || 'télépaiment',
      })),
    ];

    // Sort by dateEtablissement descending
    historique.sort((a, b) => new Date(b.dateEtablissement) - new Date(a.dateEtablissement));
    const encaissements = await prisma.encaissementRecu.findMany({
      orderBy: { dateEtablissement: 'desc' },
      select: {
        id: true,
        dateEtablissement: true,
        type : true,
        montant: true,
        client: { select: { name: true } },
        chantier: { select: { nom: true } },
        banque: { select: { name: true } },
        observation: true,
      },
    });
  
    const clients = await prisma.client.findMany();
    const chantiers = await prisma.chantier.findMany();
    // Render the template
    res.render('dashboard/tresorerie/historique/index', {
      cheques,
      effets,
      virements,
      fournisseurs,
      banques,
      historique,
      encaissements,
      clients,
      chantiers,
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




export const saveEncaissement = async (req, res) => {
  try {
    const {
      id,
      dateEtablissement,
      banqueId,
      chantierId,
      clientId,
      montant,
      observation,
      type,
      nDeFactureRG,
      RG,
      Ras_TVA,
      Autres,
      ResteAPayer
    } = req.body;

    if (!dateEtablissement || !banqueId || !clientId || !montant) {
      return res.status(400).json({ message: 'Champs obligatoires manquants' });
    }

    if (id) {
      // Update existing encaissement
      const updated = await prisma.encaissementRecu.update({
        where: { id: Number(id) },
        data: {
          dateEtablissement: new Date(dateEtablissement),
          banqueId: Number(banqueId),
          chantierId: chantierId ? Number(chantierId) : null,
          clientId: Number(clientId),
          montant: parseFloat(montant),
          observation,
          type,
          nDeFactureRG,
          RG,
          Ras_TVA,
          Autres,
          ResteAPayer
        }
      });
      res.json({ message: 'Encaissement mis à jour avec succès', encaissement: updated });
    } else {
      // Create new encaissement
      const newEncaissement = await prisma.encaissementRecu.create({
        data: {
          dateEtablissement: new Date(dateEtablissement),
          banqueId: Number(banqueId),
          chantierId: chantierId ? Number(chantierId) : null,
          clientId: Number(clientId),
          montant: parseFloat(montant),
          observation,
          type,
          nDeFactureRG,
          RG,
          Ras_TVA,
          Autres,
          ResteAPayer
        }
      });
      res.json({ message: 'Encaissement ajouté', encaissement: newEncaissement });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Delete an encaissement
export const deleteEncaissement = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'ID manquant' });

    await prisma.encaissementRecu.delete({ where: { id: Number(id) } });
    res.json({ message: 'Encaissement supprimé avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

