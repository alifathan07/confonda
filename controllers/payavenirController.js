import prisma from "../db.js";

export const showPayavenir = async (req, res) => {
    const payavenirs = await prisma.payavenir.findMany({
        include: {
          banque: true,
          fournisseur: true
        },
      });
    const banques = await prisma.banque.findMany();
    const fournisseurs = await prisma.fournisseur.findMany()
    res.render('dashboard/tresorerie/reglements/payavenir/index', { payavenirs : payavenirs , banques , fournisseurs });
}

export const createPayavenir = async (req, res) => {
    try {
      console.log('🆕 Creating new effet...', req.body);
      const {
            designation , 
            banque, 
            beneficiaire,
            montant, 
            dateEcheance,
            statut, 
            dateReglement,
            obs
            
      } = req.body;
  
      // Find or create fournisseur
      let fournisseur = await prisma.fournisseur.findFirst({
        where: { name: beneficiaire },
      });
  
      if (!fournisseur) {
        fournisseur = await prisma.fournisseur.create({
          data: {
            name: beneficiaire,
            ice: `ICE_${Date.now()}`,
            rib : `RIB_${Date.now()}`,
            identifFiscal: `FISCAL_${Date.now()}`,
            telFournisseur: 'Default',
            contact: 'Default',
            telContact: 'Default',
          },
        });
      }
  
      // Find or create banque
      let findBanque = await prisma.banque.findFirst({
        where: { name: banque },
      });
  
      if (!findBanque) {
        findBanque = await prisma.banque.create({
          data: {
            name: banque,
            rib: 0,
            agence: 'Default Agence',
            solde: 0,
            dateSolde: new Date(),
            positive: 0,
            negative: 0,
            dmlt: 0,
          },
        });
      }
  
      const payavenir = await prisma.payavenir.create({
        data: {
          designation,
          montant: parseFloat(montant),
          dateEcheance: new Date(dateEcheance),
          dateReglement: dateReglement ? new Date(dateReglement) : null,
          statut,
          obs,
          fournisseur: { connect: { id: fournisseur.id } },
          banque: { connect: { id: findBanque.id } },
        },
      });
  
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
    const { designation, banque, beneficiaire, montant, dateEcheance, statut, dateReglement, obs } = req.body;
    console.log(`🔄 Updating payavenir ${id}...`);
    const updatedPayavenir = await prisma.payavenir.findUnique({ where: { id: parseInt(id) } });
    if (!updatedPayavenir) {
    return res.status(404).json({ error: "Payavenir non trouvé." });
    }

    let fournisseur = await prisma.fournisseur.findFirst({ where: { name: beneficiaire } });

    if (!fournisseur) {
    fournisseur = await prisma.fournisseur.create({
        data: {
        name: beneficiaire,
        ice: `ICE_${Date.now()}`,
        identifFiscal: `FISCAL_${Date.now()}`,
        telFournisseur: 'Default',
        contact: 'Default',
        telContact: 'Default'
        }
    });
    }

    let findBanque = await prisma.banque.findFirst({ where: { name: banque } });

    if (!findBanque) {
    findBanque = await prisma.banque.create({
        data: {
        name: banque,
        rib: 0,
        agence: 'Default Agence',
        solde: 0,
        dateSolde: new Date(),
        positive: 0,
        negative: 0,
        dmlt: 0,
        },
    });
    }

    const payavenir = await prisma.payavenir.update({
    where: { id: parseInt(id) },
    data: { 
        designation,
        montant: parseFloat(montant),
        dateEcheance: new Date(dateEcheance),
        dateReglement: dateReglement ? new Date(dateReglement) : new Date("2025-10-02"),
        statut,
        obs,
        fournisseur: { connect: { id: fournisseur.id } },
        banque: { connect: { id: findBanque.id } },
    },
    });
    console.log(`✅ Payavenir updated successfully: ${id}`);
    res.json(payavenir);
} catch (error) {
    console.error('❌ Error updating payavenir:', {
    error: error.message,
    stack: error.stack,
    payavenirId: req.params.id,
    newStatut: req.body.statut
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
      res.redirect(`/tresorerie/payavenir/banque/${payavenir.banqueId}`);
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
