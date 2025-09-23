import prisma from "../db.js";

export const showPayavenir = async (req, res) => {
    const payavenirs = await prisma.payavenir.findMany({
      orderBy: { id: 'desc' },
        include: {
          banque: true,
          fournisseur: true
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
      chantierText: chantier || null,
      fournisseur: { connect: { id: fournisseur.id } },
      banque: { connect: { id: findBanque.id } },
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
    console.log('--- updatePayavenir START ---');
    console.log('Incoming params:', req.params);
    console.log('Incoming body:', req.body);

    const { id } = req.params;
    const {
      designation,
      banque,
      beneficiaire,
      montant,
      dateEcheance,
      statut,
      dateReglement,
      obs,
      chantier
    } = req.body;

    // ID validation
    const payavenirId = Number(id);
    console.log('Parsed id ->', payavenirId);
    if (isNaN(payavenirId)) {
      console.log('ERROR: Invalid ID (NaN). Aborting.');
      return res.status(400).json({ error: "ID invalide." });
    }

    console.log(`🔄 Attempting update for payavenir id=${payavenirId}...`);

    // Check existing record
    const existingPayavenir = await prisma.payavenir.findUnique({
      where: { id: payavenirId },
    });
    console.log('Existing payavenir found:', !!existingPayavenir, existingPayavenir ? { id: existingPayavenir.id } : null);
    if (!existingPayavenir) {
      console.log('ERROR: Payavenir not found. Aborting.');
      return res.status(404).json({ error: "Payavenir non trouvé." });
    }

    // Build update object step-by-step and log each step
    const data = {};
    console.log('Will check optional fields…');

    if ('designation' in req.body) {
      data.designation = designation || null;
      console.log('designation present ->', data.designation);
    } else {
      console.log('designation not present in body');
    }

    if ('statut' in req.body) {
      data.statut = statut || null;
      console.log('statut present ->', data.statut);
    } else {
      console.log('statut not present in body');
    }

    if ('obs' in req.body) {
      data.obs = obs || null;
      console.log('obs present ->', data.obs);
    } else {
      console.log('obs not present in body');
    }

    if ('chantier' in req.body) {
      data.chantierText = chantier || null;
      console.log('chantier present ->', data.chantierText);
    } else {
      console.log('chantier not present in body');
    }

    // Montant
    if ('montant' in req.body) {
      console.log('montant raw ->', montant);
      if (montant === undefined || montant === null || montant === '') {
        console.log('ERROR: montant is required but empty.');
        return res.status(400).json({ error: "Montant est requis." });
      }
      const parsedMontant = typeof montant === 'string'
        ? parseFloat(montant.replace(/,/g, '.').replace(/\s+/g, ''))
        : montant;
      console.log('parsedMontant ->', parsedMontant);
      if (isNaN(parsedMontant)) {
        console.log('ERROR: parsedMontant is NaN.');
        return res.status(400).json({ error: "Montant doit être un nombre valide." });
      }
      data.montant = parsedMontant;
    } else {
      console.log('montant not present in body');
    }

    // dateEcheance
    if ('dateEcheance' in req.body) {
      console.log('dateEcheance raw ->', dateEcheance);
      if (!dateEcheance) {
        data.dateEcheance = null;
        console.log('dateEcheance set to null');
      } else {
        const parsedDate = new Date(dateEcheance);
        console.log('dateEcheance parsed Date ->', parsedDate, 'getTime ->', parsedDate.getTime());
        if (isNaN(parsedDate.getTime())) {
          console.log('ERROR: Invalid dateEcheance.');
          return res.status(400).json({ error: "Date d'échéance invalide." });
        }
        data.dateEcheance = parsedDate;
      }
    } else {
      console.log('dateEcheance not present in body');
    }

    // dateReglement
    if ('dateReglement' in req.body) {
      console.log('dateReglement raw ->', dateReglement);
      if (!dateReglement) {
        data.dateReglement = null;
        console.log('dateReglement set to null');
      } else {
        const parsedDate = new Date(dateReglement);
        console.log('dateReglement parsed Date ->', parsedDate, 'getTime ->', parsedDate.getTime());
        if (isNaN(parsedDate.getTime())) {
          console.log('ERROR: Invalid dateReglement.');
          return res.status(400).json({ error: "Date de règlement invalide." });
        }
        data.dateReglement = parsedDate;
      }
    } else {
      console.log('dateReglement not present in body');
    }

    // Beneficiaire handling
    if ('beneficiaire' in req.body) {
      console.log('beneficiaire raw ->', beneficiaire);
      if (!beneficiaire || !String(beneficiaire).trim()) {
        console.log('ERROR: beneficiaire present but empty. Aborting.');
        return res.status(400).json({ error: "Bénéficiaire est requis." });
      }

      console.log('Searching fournisseur by name ->', beneficiaire);
      let fournisseur = await prisma.fournisseur.findFirst({
        where: { name: beneficiaire },
      });
      console.log('fournisseur found ->', !!fournisseur, fournisseur ? { id: fournisseur.id, name: fournisseur.name } : null);

      if (!fournisseur) {
        console.log('No fournisseur found — creating one now...');
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
        console.log('fournisseur created ->', { id: fournisseur.id, name: fournisseur.name });
      }

      data.fournisseur = { connect: { id: fournisseur.id } };
      console.log('Will connect fournisseur ->', fournisseur.id);
    } else {
      console.log('beneficiaire not present in body');
    }

    // Banque handling
    if ('banque' in req.body) {
      console.log('banque raw ->', banque);
      if (!banque || !String(banque).trim()) {
        console.log('ERROR: banque present but empty. Aborting.');
        return res.status(400).json({ error: "Banque est requise." });
      }

      console.log('Searching banque by name ->', banque);
      let findBanque = await prisma.banque.findFirst({
        where: { name: banque },
      });
      console.log('banque found ->', !!findBanque, findBanque ? { id: findBanque.id, name: findBanque.name } : null);

      if (!findBanque) {
        console.log('No banque found — creating one now...');
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
        console.log('banque created ->', { id: findBanque.id, name: findBanque.name });
      }

      data.banque = { connect: { id: findBanque.id } };
      console.log('Will connect banque ->', findBanque.id);
    } else {
      console.log('banque not present in body');
    }

    // Nothing to update?
    const keys = Object.keys(data);
    console.log('Final update data keys:', keys);
    if (keys.length === 0) {
      console.log('No updatable fields provided. Aborting.');
      return res.status(400).json({ error: "Aucun champ à mettre à jour." });
    }

    console.log('Final update payload (data):', data);

    // Perform update
    const payavenir = await prisma.payavenir.update({
      where: { id: payavenirId },
      data,
    });

    console.log('✅ Update succeeded. Updated payavenir:', payavenir);
    console.log('--- updatePayavenir END ---');
    return res.json(payavenir);

  } catch (error) {
    // Extra defensive logging for Prisma / runtime errors
    console.error('❌ Error updating payavenir (catch):');
    console.error('message:', error.message);
    console.error('stack:', error.stack);
    if (error.code) console.error('code:', error.code);
    if (error.meta) console.error('meta:', error.meta);
    console.error('request params:', req.params);
    console.error('request body:', req.body);

    return res.status(500).json({ error: "Erreur lors de la mise à jour du payavenir." });
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
export const updatePayavenirChantier = async (req, res) => {
  try {
    const { id } = req.params;
    const { chantier } = req.body;
    console.log(`🔄 Updating chantier for payavenir ${id} to: ${chantier}`);
    
    const payavenir = await prisma.payavenir.update({
      where: { id: parseInt(id) },
      data: { chantierText : chantier },
    });
    console.log(`✅ Payavenir chantier updated successfully: ${id} -> ${chantier}`);
    res.json(payavenir);
  } catch (error) {
    console.error('❌ Error updating payavenir chantier:', {
      error: error.message,
      stack: error.stack,
      payavenirId: req.params.id,
      newChantier: req.body.chantier
    });
    res.status(500).json({ error: "Erreur lors de la mise à jour du Chantier." });
  }
};