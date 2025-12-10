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

    res.redirect('/tresorerie/banques');
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la création des banques.' });
  }
};


export const displayBanques = async (req, res) => {
  try {
    const banques = await prisma.banque.findMany();
    res.render('dashboard/tresorerie/index', { banques: banques });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la récupération des banques.' });
  }
}

export const listBanques = async (req, res) => {
  try {
    const banques = await prisma.banque.findMany({
      orderBy: { name: 'asc' }
    });
    res.render('dashboard/tresorerie/banques/index', { banques });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la récupération des banques.' });
  }
}
export const displayBanquesForcheques = async (req, res) => {
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
        validation: true,
        beneficiaire: true,
        statut: true,
        obs: true,
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
        validation: true,
        beneficiaire: true,
        obs: true,
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
        validation: true,
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
        chantier: {
          select: { nom: true },
        }
      },
      orderBy: {
        client: {
          name: 'asc',
        },
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
    const chantiers = await prisma.chantier.findMany({
      select: { id: true, nom: true },

      orderBy: {
        nom: 'asc',
      }
    })
    console.log(payavenirs)
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
      chantiers,
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

export const deleteBanque = async (req, res) => {
  const idParam = req.params.id || req.body.id;
  await prisma.banque.delete({
    where: { id: parseInt(idParam) },

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

export const updateChequeValidation = async (req, res) => {
  try {
    const { id } = req.params;
    const { validation } = req.body;

    const cheque = await prisma.cheque.update({
      where: { id: parseInt(id) },
      data: { validation: Boolean(validation) }
    });

    console.log(`✅ Cheque ${id} updated successfully -> validation=${cheque.validation}`);
    res.status(200).json({ success: true, validation: cheque.validation });

  } catch (error) {
    console.error('❌ Error updating cheque:', error);
    res.status(500).json({ error: "Erreur lors de la mise à jour du chèque." });
  }
};


export const updateEffetInStituation = async (req, res) => {
  try {
    const { id } = req.params;
    const { obs } = req.body;
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

export const updateEffetValidation = async (req, res) => {
  try {
    const { id } = req.params;
    const { validationEffet } = req.body; // spécifique aux effets

    const effet = await prisma.effet.update({
      where: { id: parseInt(id) },
      data: { validation: Boolean(validationEffet) } // map vers DB
    });

    console.log(`✅ Effet ${id} updated successfully -> validation=${effet.validation}`);
    res.status(200).json({ success: true, validationEffet: effet.validation });

  } catch (error) {
    console.error('❌ Error updating effet:', error);
    res.status(500).json({ error: "Erreur lors de la mise à jour de l'effet." });
  }
};


export const updatePayValidation = async (req, res) => {
  try {
    const { id } = req.params;
    const { validationPayavenir } = req.body; // correspond bien au fetch

    const payavenir = await prisma.payavenir.update({
      where: { id: parseInt(id) },
      data: { validation: Boolean(validationPayavenir) } // mapping propre
    });

    console.log(`✅ Paiement à venir ${id} updated successfully -> validation=${payavenir.validation}`);
    res.status(200).json({ success: true, validationPayavenir: payavenir.validation });

  } catch (error) {
    console.error('❌ Error updating paiement à venir:', error);
    res.status(500).json({ error: "Erreur lors de la mise à jour du paiement à venir." });
  }
};


// ---- Banques CRUD (Edit/Update) ----
export const showEditBanque = async (req, res) => {
  try {
    const { id } = req.params;
    const banque = await prisma.banque.findUnique({
      where: { id: parseInt(id) }
    });
    if (!banque) return res.status(404).send('Banque introuvable');
    res.render('dashboard/tresorerie/banques/edit', { banque });
  } catch (error) {
    console.error(error);
    res.status(500).send('Erreur serveur.');
  }
};

export const updateBanque = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, rib, agence } = req.body;
    const ribString = String(rib);

    await prisma.banque.update({
      where: { id: parseInt(id) },
      data: { name, rib: ribString, agence }
    });

    res.redirect('/tresorerie/banques');
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la banque.' });
  }
};

