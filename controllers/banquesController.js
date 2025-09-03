import prisma from "../db.js";

export const showCreate = (req, res) => {
    res.render('dashboard/tresorerie/banques/create');
};
export const createBanque = async (req, res) => {
  try {
    const { name, rib, agence } = req.body;

    // Convert RIB to string to match Prisma schema
    const ribString = String(rib);

    await prisma.banque.create({
      data: {
        name: name,
        rib: ribString, // ✅ now it's a string
        agence: agence,
        solde: 0,
        positive: 0,
        negative: 0,
        dmlt: 0,
        dateSolde: new Date(),
      }
    });

    res.redirect(req.header('Referer') || '/tresorerie');
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la création des banques.' });
  }
};


export const displayBanques = async(req, res) => {
    try {
        const banques = await prisma.banque.findMany();
        res.render('dashboard/tresorerie/index', { banques : banques });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de la récupération des banques.' });
    }
}
export const displayBanquesForcheques = async(req, res) => {
    try {
        const banques = await prisma.banque.findMany();
        res.json(banques);
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de la récupération des banques.' });
    }
}
export const getSituationBancaire = async (req, res) => {
    try {
      const { from, to } = req.query;
  
      const banques = await prisma.banque.findMany({
        select: {
          id: true,
          name: true,
          rib: true,
          agence: true,
          positive: true,
          negative: true,
          dmlt: true,
        },
      });
      const fromDate = from ? new Date(from) : new Date('1900-01-01');
      const toDate = to ? new Date(to) : new Date('2100-01-01');
  
      const cheques = await prisma.cheque.findMany({
        where: {
          statut: { in: ['En Circulation', 'Impayé'] },
          dateEcheance: {
            gte: fromDate,
            lte: toDate,
          },
        },
        select: {
          id: true,
          numero: true,
          dateEtablissement: true,
          montant: true,
          dateEcheance: true,
          beneficiaire: true,
          statut: true,
          obs : true,
          banque: {
            select: { name: true },
          },
        },
        orderBy: {
          dateEcheance: 'asc',
        },
      });
      console.log(cheques);
      const effets = await prisma.effet.findMany({
        where: {
          statut: { in: ['En Circulation', 'Impayé'] },
          dateEcheance: {
            gte: fromDate,
            lte: toDate,
          },
        },
        select: {
          id: true,
          numero: true,
          dateEtablissement: true,
          montant: true,
          dateEcheance: true,
          beneficiaire: true,
          obs : true,
          statut: true,
          banque: {
            select: { name: true },
          },
        },
        orderBy: {
          dateEcheance: 'asc',
        },
      });
      
      const payavenirs = await prisma.payavenir.findMany({
        where: {
          statut: { in: ["échu", "impayé", "non échu"] },
          dateEcheance: {
            gte: fromDate,
            lte: toDate,
          },
        },
        select: {
          id: true,
          designation: true,
          montant: true,
          dateEcheance: true,
          statut: true,
          dateReglement: true,
          fournisseur: {
            select: { name: true },
          },
          banque: {
            select: { name: true },
          },
        },
        orderBy: {
          dateEcheance: 'asc',
        },
      });

      const recavenirs = await prisma.recavenir.findMany({
        where: {
          statut: { in: ["échu", "impayé", "non échu"] },
          dateEcheance: {
            gte: fromDate,
            lte: toDate,
          },
        },
        select: {
          id: true,
          designation: true,
          montant: true,
          dateEcheance: true,
          statut: true,
          dateReglement: true,
          client: {
            select: { name: true },
          },
          banque: {
            select: { name: true },
          },
        },
        orderBy: {
          dateEcheance: 'asc',
        },
      });
      const fournisseurs = await prisma.fournisseur.findMany({
        select: { id: true, name: true },
        
        orderBy: {
          name: 'asc',
        }
      });
      const clients = await prisma.client.findMany({
        select: { id: true, name: true },
        
        orderBy: {
          name: 'asc',
        }
      });
     
      res.render('dashboard/tresorerie/situation/index', {
        banques,
        cheques,
        effets,
        payavenirs,
        recavenirs,
        from,
        to,
        fournisseurs,
        clients,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Erreur serveur.');
    }
  };
export const updateSituationBancaire = async (req, res) => {
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

    res.redirect('/tresorerie/situation');
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la situation bancaire.' });
  }
};

export const deleteBanque = async(req,res) => {
  const {id} = req.body;
  await prisma.banque.delete({
    where: { id: parseInt(id) },
  });
  
  res.json('success')
}



export const updateChequeInStituation = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      
      obs,
    } = req.body;

    

   
    const data = {};

    
    if (obs !== undefined) data.obs = obs;

    // 🛠️ Update cheque
    const cheque = await prisma.cheque.update({
      where: { id: parseInt(id) },
      data
    });

    console.log(`✅ Cheque updated successfully: ${id}`);
    res.redirect('/tresorerie/situation')

  } catch (error) {
    console.error('❌ Error updating cheque:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: "Erreur lors de la mise à jour du chèque." });
  }
};
export const updateEffetInStituation = async (req, res) => {
  try {
    const { id } = req.params;
    const {obs} = req.body;
    const data = {};
    if (obs !== undefined) data.obs = obs;

    // 🛠️ Update cheque
    const effet = await prisma.effet.update({
      where: { id: parseInt(id) },
      data
    });

    console.log(`✅ Effet updated successfully: ${id}`);
    res.redirect('/tresorerie/situation')

  } catch (error) {
    console.error('❌ Error updating effet:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: "Erreur lors de la mise à jour du effet." });
  }
};




// export const getSituationBancaire = async (req, res) => {
//     const { id } = req.params; // banque id
  
//     const banque = await prisma.banque.findUnique({
//       where: { id: parseInt(id) },
//       include: {
//         cheques: true
//       }
//     });
//     console.log(banque);
  
//     if (!banque) return res.status(404).send('Banque not found');
  
//     const totalCheques = banque.cheques
//       .filter(c => c.statut === 'en circulation')
//       .reduce((sum, c) => sum + c.montant, 0);
  
//     const situation = banque.soldeInitial - totalCheques;
  
//     res.render("dashboard/tresorerie/situation/index");
//   };
  