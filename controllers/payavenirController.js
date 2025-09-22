import prisma from "../db.js";

export const showPayavenir = async (req, res) => {
    const payavenirs = await prisma.payavenir.findMany({
      orderBy: { id: 'desc' },
        include: {
          banque: true,
          fournisseur: true,
          chantier: true
        },
      });
    const banques = await prisma.banque.findMany();
    const fournisseurs = await prisma.fournisseur.findMany()
    const chantiers = await prisma.chantier.findMany()
    res.render('dashboard/tresorerie/reglements/payavenir/index', { payavenirs : payavenirs , banques , fournisseurs , chantiers });
}

export const createPayavenir = async (req, res) => {
  try {
    console.log('🆕 Creating new effet...', req.body);
    const { designation, banque, beneficiaire, montant, dateEcheance, statut, dateReglement, obs, chantier } = req.body;

    // Validate required fields
    if (!beneficiaire) {
      return res.status(400).json({ error: "Bénéficiaire est requis." });
    }
    if (!banque) {
      return res.status(400).json({ error: "Banque est requise." });
    }
    if (montant === undefined || montant === null || montant === '') {
      return res.status(400).json({ error: "Montant est requis." });
    }
    if (!chantier) {
      return res.status(400).json({ error: "Chantier est requis." });
    }

    // Parse montant
    const parsedMontant = typeof montant === 'string' ? parseFloat(montant.replace(/,/g, '.')) : montant;
    if (isNaN(parsedMontant)) {
      return res.status(400).json({ error: "Montant doit être un nombre valide." });
    }

    // Parse dates
    let parsedDateEcheance = null;
    if (dateEcheance && dateEcheance !== '') {
      parsedDateEcheance = new Date(dateEcheance);
      if (isNaN(parsedDateEcheance)) {
        return res.status(400).json({ error: "Date d'échéance invalide." });
      }
    }

    let parsedDateReglement = null;
    if (dateReglement && dateReglement !== '') {
      parsedDateReglement = new Date(dateReglement);
      if (isNaN(parsedDateReglement)) {
        return res.status(400).json({ error: "Date de règlement invalide." });
      }
    }

    // Find or create fournisseur
    let fournisseur = await prisma.fournisseur.findFirst({
      where: { name: beneficiaire },
    });

    if (!fournisseur) {
      fournisseur = await prisma.fournisseur.create({
        data: {
          name: beneficiaire,
          ice: `ICE_${Date.now()}`,
          rib: `RIB_${Date.now()}`,
          identifFiscal: `FISCAL_${Date.now()}`,
          telFournisseur: 'Default',
          contact: 'Default',
          telContact: 'Default',
        },
      });
    }

    // Find or create banque
    let findBanque = await prisma.fournisseur.findFirst({
      where: { name: banque },
    });

    if (!findBanque) {
      findBanque = await prisma.banque.create({
        data: {
          name: banque,
          rib: "0",
          agence: 'Default Agence',
          solde: 0,
          dateSolde: new Date(),
          positive: 0,
          negative: 0,
          dmlt: 0,
        },
      });
    }

    const data = {
      designation: designation || null,
      montant: parsedMontant,
      dateEcheance: parsedDateEcheance,
      dateReglement: parsedDateReglement,
      statut: statut || null,
      obs: obs || null,
      fournisseur: { connect: { id: fournisseur.id } },
      banque: { connect: { id: findBanque.id } },
      chantier: { connect: { id: chantier.id } },
    };

    const payavenir = await prisma.payavenir.create({ data });

    console.log(`✅ Payement à venir created successfully: ${payavenir.id}`);
    res.json(payavenir);
  } catch (error) {
    console.error('❌ Error creating payavenir:', {
      error: error.message,
      stack: error.stack,
      body: req.body,
    });
    res.status(500).json({ error: "Erreur lors de la création du payavenir." });
  }
};

export const deletePayavenir = async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`🗑️ Deleting payavenir with ID: ${id}`);
      
      await prisma.payavenir.delete({
        where: { id: parseInt(id) },
      });
      console.log(`✅ Payavenir deleted successfully: ${id}`);
      res.json({ message: "Payavenir supprimé avec succès." });
    } catch (error) {
      console.error('❌ Error deleting payavenir:', {
        error: error.message,
        stack: error.stack,
        payavenirId: req.params.id
      });
      res.status(500).json({ error: "Erreur lors de la suppression du payavenir." });
    }
};

export const updatePayavenir = async (req, res) => {
  try {
    const { id } = req.params;
    const { designation, banque, beneficiaire, montant, dateEcheance, statut, dateReglement, obs, chantier } = req.body;
    console.log(`🔄 Updating payavenir ${id}...`);

    const existingPayavenir = await prisma.payavenir.findUnique({ where: { id: parseInt(id) } });
    if (!existingPayavenir) {
      return res.status(404).json({ error: "Payavenir non trouvé." });
    }

    const data = {};

    // Handle optional fields
    if ('designation' in req.body) data.designation = designation || null;
    if ('statut' in req.body) data.statut = statut || null;
    if ('obs' in req.body) data.obs = obs || null;
    if ('chantier' in req.body) data.chantier = { connect: { id: parseInt(chantier) } };

    // Handle montant
    if ('montant' in req.body) {
      if (montant === undefined || montant === null || montant === '') {
        return res.status(400).json({ error: "Montant est requis." });
      }
      const parsedMontant = typeof montant === 'string' ? parseFloat(montant.replace(/,/g, '.')) : montant;
      if (isNaN(parsedMontant)) {
        return res.status(400).json({ error: "Montant doit être un nombre valide." });
      }
      data.montant = parsedMontant;
    }

    // Handle dateEcheance
    if ('dateEcheance' in req.body) {
      if (dateEcheance === null || dateEcheance === '') {
        data.dateEcheance = null;
      } else {
        const parsedDate = new Date(dateEcheance);
        if (isNaN(parsedDate)) {
          return res.status(400).json({ error: "Date d'échéance invalide." });
        }
        data.dateEcheance = parsedDate;
      }
    }

    // Handle dateReglement
    if ('dateReglement' in req.body) {
      if (dateReglement === null || dateReglement === '') {
        data.dateReglement = null;
      } else {
        const parsedDate = new Date(dateReglement);
        if (isNaN(parsedDate)) {
          return res.status(400).json({ error: "Date de règlement invalide." });
        }
        data.dateReglement = parsedDate;
      }

    }


    // Handle beneficiaire
    if ('beneficiaire' in req.body && beneficiaire) {
      let fournisseur = await prisma.fournisseur.findFirst({
        where: { name: beneficiaire },
      });

      if (!fournisseur) {
        fournisseur = await prisma.fournisseur.create({
          data: {
            name: beneficiaire,
            ice: `ICE_${Date.now()}`,
            rib: `RIB_${Date.now()}`,
            identifFiscal: `FISCAL_${Date.now()}`,
            telFournisseur: 'Default',
            contact: 'Default',
            telContact: 'Default',
          },
        });
      }
      data.fournisseur = { connect: { id: fournisseur.id } };
    } else {
      return res.status(400).json({ error: "Bénéficiaire est requis." });
    }

    // Handle banque
    if ('banque' in req.body && banque) {
      let findBanque = await prisma.banque.findFirst({
        where: { name: banque },
      });

      if (!findBanque) {
        findBanque = await prisma.banque.create({
          data: {
            name: banque,
            rib: "0",
            agence: 'Default Agence',
            solde: 0,
            dateSolde: new Date(),
            positive: 0,
            negative: 0,
            dmlt: 0,
          },
        });
      }
      data.banque = { connect: { id: findBanque.id } };
    } else {
      return res.status(400).json({ error: "Banque est requise." });
    }


    const payavenir = await prisma.payavenir.update({
      where: { id: parseInt(id) },
      data,
    });

    console.log(`✅ Payavenir updated successfully: ${id}`);
    res.json(payavenir);
  } catch (error) {
    console.error('❌ Error updating payavenir:', {
      error: error.message,
      stack: error.stack,
      payavenirId: req.params.id,
      body: req.body,
    });
    res.status(500).json({ error: "Erreur lors de la mise à jour du payavenir." });
  }
};

export const updatePayavenirStatut = async (req, res) => {
    try {
      const { id } = req.params;
      const { statut } = req.body;
      console.log(`🔄 Updating statut for payavenir ${id} to: ${statut}`);
      
      const payavenir = await prisma.payavenir.update({
        where: { id: parseInt(id) },
        data: { statut },
      });
      console.log(`✅ Payavenir statut updated successfully: ${id} -> ${statut}`);
      res.json(payavenir);
    } catch (error) {
      console.error('❌ Error updating payavenir statut:', {
        error: error.message,
        stack: error.stack,
        payavenirId: req.params.id,
        newStatut: req.body.statut
      });
      res.status(500).json({ error: "Erreur lors de la mise à jour du statut." });
    }
};