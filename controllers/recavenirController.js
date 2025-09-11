import prisma from "../db.js";

export const showRecavenir = async (req, res) => {
    const recavenirs = await prisma.recavenir.findMany({
        include: {
          banque: true,
          client: true
        },
      });
    const banques = await prisma.banque.findMany();
    const clients = await prisma.client.findMany();
    res.render('dashboard/tresorerie/reglements/recavenir/index', { recavenirs : recavenirs , banques , clients });
}


export const createRecavenir = async (req, res) => {
    try {
      console.log('🆕 Creating recette a venir...', req.body);
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
  
      // Find or create client
      let client = await prisma.client.findFirst({
        where: { name: beneficiaire },
      });
  
      if (!client) {
        client = await prisma.client.create({
          data: {
            name: beneficiaire,
            ice: `ICE_${Date.now()}`,
            identifFiscal: `FISCAL_${Date.now()}`,
            telClient: 'Default',
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
  
      const recavenir = await prisma.recavenir.create({
        data: {
          designation,
          montant: parseFloat(montant),
          dateEcheance: dateEcheance ?  new Date(dateEcheance) : null,
          dateReglement: dateReglement ? new Date(dateReglement) : null,
          statut,
          obs,
          client: { connect: { id: client.id } },
          banque: { connect: { id: findBanque.id } },
        },
      });
  
      console.log(`✅ Payement à venir created successfully: ${recavenir.id}`);
      res.json(recavenir);
    } catch (error) {
      console.error('❌ Error creating recavenir:', {
        error: error.message,
        stack: error.stack,
        body: req.body,
      });
      res.status(500).json({ error: "Erreur lors de la création du payavenir." });
    }
  };



export const deleteRecavenir = async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`🗑️ Deleting recavenir with ID: ${id}`);
      
      await prisma.recavenir.delete({
        where: { id: parseInt(id) },
      });
      console.log(`✅ Recavenir deleted successfully: ${id}`);
      res.json({ message: "Recavenir supprimé avec succès." });
    } catch (error) {
      console.error('❌ Error deleting recavenir:', {
        error: error.message,
        stack: error.stack,
        recavenirId: req.params.id
      });
      res.status(500).json({ error: "Erreur lors de la suppression du recavenir." });
    }
  };
export const updateRecavenir = async (req, res) => {
try {
    const { id } = req.params;
    const { designation, banque, beneficiaire, montant, dateEcheance, statut, dateReglement, obs } = req.body;
    console.log(`🔄 Updating recavenir ${id}...`);
    const updatedRecavenir = await prisma.recavenir.findUnique({ where: { id: parseInt(id) } });
    if (!updatedRecavenir) {
    return res.status(404).json({ error: "Recavenir non trouvé." });
    }

    let client = await prisma.client.findFirst({ where: { name: beneficiaire } });

    if (!client) {
    client = await prisma.client.create({
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

    const recavenir = await prisma.recavenir.update({
    where: { id: parseInt(id) },
    data: { 
        designation,
        montant: parseFloat(montant),
        dateEcheance: new Date(dateEcheance),
        dateReglement: dateReglement ? new Date(dateReglement) : new Date("2025-10-02"),
        statut,
        obs,
        client: { connect: { id: client.id } },
        banque: { connect: { id: findBanque.id } },
    },
    });
    console.log(`✅ Recavenir updated successfully: ${id}`);
    res.json(recavenir);
} catch (error) {
    console.error('❌ Error updating recavenir:', {
    error: error.message,
    stack: error.stack,
    recavenirId: req.params.id,
    newStatut: req.body.statut
    });
    res.status(500).json({ error: "Erreur lors de la mise à jour du recavenir." });
}
};

export const updateRecavenirStatut = async (req, res) => {
    try {
      const { id } = req.params;
      const { statut } = req.body;
      console.log(`🔄 Updating statut for recavenir ${id} to: ${statut}`);
      
      const recavenir = await prisma.recavenir.update({
        where: { id: parseInt(id) },
        data: { statut },
      });
      console.log(`✅ Recavenir statut updated successfully: ${id} -> ${statut}`);
      res.redirect(`/tresorerie/recettes_a_venir/banque/${recavenir.banqueId}`);
    } catch (error) {
      console.error('❌ Error updating recavenir statut:', {
        error: error.message,
        stack: error.stack,
        recavenirId: req.params.id,
        newStatut: req.body.statut
      });
      res.status(500).json({ error: "Erreur lors de la mise à jour du statut." });
    }
  };

