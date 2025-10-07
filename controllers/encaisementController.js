import prisma from "../db.js";

// Index route
export const  indexEncaissement = async (req, res) => {
    try {
        const encaissement = await prisma.encaissementRecu.findMany({
            include: {
                chantier: true,
                banque: true,
                client : true,               
            },
            orderBy: { dateEtablissement: 'desc' },
        });
        const banques = await prisma.banque.findMany();
        const chantiers = await prisma.chantier.findMany();
        res.render('dashboard/tresorerie/reglements/encaisement/index', {encaissement, banques, chantiers });
    } catch (error) {
        console.error('Error loading encaissement:', error);
        res.status(500).send('Erreur lors du chargement des données').end();
    }
};  
export const createEncaissement = async (req, res) => {
    try {
      let {
        dateEtablissement,
        type,
        banque,
        beneficiaire,
        montant,
        chantierId,
        nDeFactureRG,
        RG,
        Ras_TVA,
        Autres,
        ResteAPayer,
      } = req.body;
  
      // Debug logs
      console.log("Received data:", req.body);
      console.log("chantierId:", chantierId, "type:", typeof chantierId);
  
      // --- Find or create Client ---
      let existClient = await prisma.client.findFirst({
        where: { name: beneficiaire },
      });
  
      if (!existClient) {
        existClient = await prisma.client.create({
          data: {
            name: beneficiaire,
            ice: Math.floor(Math.random() * 1_000_000).toString(),
            identifFiscal: Math.floor(Math.random() * 1_000_000).toString(),
            email: "",
            contact: "",
            telContact: "",
            telClient: "",
            address: "",
          },
        });
      }
  
      // --- Find or create Banque ---
      console.log(`🏦 Looking for banque: ${banque}`);
      let existBanque = await prisma.banque.findFirst({
        where: { name: banque },
      });
  
      if (!existBanque) {
        existBanque = await prisma.banque.create({
          data: {
            name: banque,
            rib: 123456789,
            agence: "Default Agence",
            solde: 0,
            dateSolde: new Date(),
            positive: 0,
            negative: 0,
            dmlt: 0,
          },
        });
      }
  
      // --- Create Encaissement ---
      const encaissement = await prisma.encaissementRecu.create({
        data: {
          dateEtablissement: dateEtablissement
            ? new Date(dateEtablissement)
            : null,
          type,
          montant: montant ? parseFloat(montant) : null,
          nDeFactureRG: nDeFactureRG || "",
          RG: RG || "",
          Ras_TVA: Ras_TVA || "",
          Autres: Autres || "",
          ResteAPayer: ResteAPayer || "",
          banque: { connect: { id: Number(existBanque.id) } },
          client: { connect: { id: Number(existClient.id) } },
          chantier: chantierId
            ? { connect: { id: Number(chantierId) } }
            : undefined,
        },
      });
  
      console.log("✅ Encaissement created:", encaissement);
      res.status(200).json({ message: "Encaissement created successfully" });
    } catch (error) {
      console.error("Error creating encaissement:", error);
      res
        .status(500)
        .send("Erreur lors de la création de l'encaissement")
        .end();
    }
  };
  


  export const updateEncaissement = async (req, res) => {
   

   let {
        dateEtablissement,
        type,
        banque,
        beneficiaire,
        montant,
        chantierId,
        nDeFactureRG,
        RG,
        Ras_TVA,
        Autres,
        ResteAPayer,
      } = req.body;

  
      // Debug logs
      console.log("Received data:", req.body);
      console.log("chantierId:", chantierId, "type:", typeof chantierId);
  
      // --- Find or create Client ---
      let existClient = await prisma.client.findFirst({
        where: { name: beneficiaire },
      });
  
      if (!existClient) {
        existClient = await prisma.client.create({
          data: {
            name: beneficiaire,
            ice: Math.floor(Math.random() * 1_000_000).toString(),
            identifFiscal: Math.floor(Math.random() * 1_000_000).toString(),
            email: "",
            contact: "",
            telContact: "",
            telClient: "",
            address: "",
          },
        });
      }
  
      // --- Find or create Banque ---
      console.log(`🏦 Looking for banque: ${banque}`);
      let existBanque = await prisma.banque.findFirst({
        where: { name: banque },
      });
  
      if (!existBanque) {
        existBanque = await prisma.banque.create({
          data: {
            name: banque,
            rib: 123456789,
            agence: "Default Agence",
            solde: 0,
            dateSolde: new Date(),
            positive: 0,
            negative: 0,
            dmlt: 0,
          },
        });
      }
      const id = req.params.id
   
  
      // --- update Encaissement ---
       const encaissement = await prisma.encaissementRecu.update({
        where: {
            id: parseInt(id)
        },
        data: {
          dateEtablissement: dateEtablissement
            ? new Date(dateEtablissement)
            : null,
          type,
          montant: montant ? parseFloat(montant) : null,
          nDeFactureRG: nDeFactureRG || "",
          RG: RG || "",
          Ras_TVA: Ras_TVA || "",
          Autres: Autres || "",
          ResteAPayer: ResteAPayer || "",
          banque: { connect: { id: Number(existBanque.id) } },
          client: { connect: { id: Number(existClient.id) } },
          chantier: chantierId
            ? { connect: { id: Number(chantierId) } }
            : undefined,
        },
      });
  
      console.log("✅ Encaissement Updated:", encaissement);
      res.status(200).json({ message: "Encaissement Updated successfully" });
  };
  

  


  
  export const deleteEncaissement = async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`Deleting encaissement with ID: ${id}`);
      await prisma.encaissementRecu.delete({
        where: { id: parseInt(id) },
      });
      console.log(`Encaissement deleted successfully: ${id}`);
      res.status(200).json({ message: "Encaissement deleted successfully" });
    } catch (error) {
      console.error("Error deleting encaissement:", error);
      res
        .status(500)
        .send("Erreur lors de la suppression de l'encaissement")
        .end();
    }
  };
