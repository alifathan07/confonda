import prisma from "../db.js";

export const indexChantiers = async (req, res) => {
    const chantiers = await prisma.chantier.findMany({
      include : {
          client : true
      }
    });
    const clients = await prisma.client.findMany();
    res.render('dashboard/ventes/chantiers/index', { chantiers , clients });
}
export const postChantier = async (req, res) => {
  const clientId = parseInt(req.params.clientId);
  const { nom, objet, montantContratHt, natureContrat, numContrat } = req.body;

  const chantierExist = await prisma.chantier.findUnique({
    where: { nom }
  });

  if (chantierExist) {
    await prisma.chantier.update({
      where: { id: chantierExist.id },
      data: {
        nom,
        objet,
        montantContratHt: parseFloat(montantContratHt),
        natureContrat,
        numContrat,
        client: {
          connect: { id: clientId }
        }
      }
    });

    return res.redirect(`/ventes/clients/${clientId}`);
  } else {
    await prisma.chantier.create({
      data: {
        nom,
        objet,
        montantContratHt: parseFloat(montantContratHt),
        natureContrat,
        numContrat,
        client: {
          connect: { id: clientId }
        }
      }
    });

    return res.redirect(`/ventes/clients/${clientId}`);
  }
};

export const showChantierDetails = async (req , res) => {
  const clientId = parseInt(req.params.clientId);
  const chantierId = parseInt(req.params.chantierId);
  const chantier = await prisma.chantier.findUnique({
    where: {
      id: chantierId
    },
    include: {
      items: true
    }
  });
  const clients = await prisma.client.findUnique({
    where: {
      id: clientId
    }
  });

  res.render('dashboard/ventes/client/clientboard/chantierboard/index', { chantier , clients });
}
export const postChantierItems = async (req, res) => {
  const chantierId = parseInt(req.params.chantierId);
  const items = req.body.items; // array of items

  if (!items || items.length === 0) {
    return res.json({ success: false, message: "Aucun item à ajouter" });
  }

  try {
    // Use Prisma createMany
    await prisma.chantierItem.createMany({
      data: items.map(i => ({
        natureTravaux: i.natureTravaux,
        numPrix: i.numPrix || null,
        designation: i.designation,
        unite: i.unite || null,
        qte: i.qte,
        prixUnitaire: i.prixUnitaire,
        totalHt: i.qte * i.prixUnitaire,
        chantierId: chantierId
      }))
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Erreur lors de l'ajout" });
  }
};

export const updateChantier = async(req, res) => {
  
  try {
    const { nom,objet,montantContratHt,natureContrat,numContrat } = req.body;
    const chantierId = parseInt(req.params.chantierId);
    await prisma.chantier.update({
      where: {
        id: chantierId
      },
      data: {
        nom,
        objet,
        montantContratHt: parseFloat(montantContratHt),
        natureContrat,
        numContrat
      }
    })
    res.redirect(`/ventes/clients/${req.params.clientId}`);
  } catch (error) {
    console.log('Error : ' , error)
    res.status(500).send('Erreur lors de la mise à jour du chantier');
  }
}

export const destroyChantier = async(req , res) => {
  try {
    const chantierId = parseInt(req.params.chantierId);
    await prisma.chantier.delete({
      where: {
        id: chantierId
      }
    })
    res.redirect(`/ventes/clients/${req.params.clientId}`);
  } catch (error) {
    console.log('Error : ' , error)
    res.status(500).send('Erreur lors de la suppression du chantier');
  }
}

export const destroyChantierDetails = async (req, res) => {
    try {
      const chantierItemId = parseInt(req.params.chantierItemId);
      await prisma.chantierItem.delete({
        where: {
          id: chantierItemId
        }
      })
      res.status(200).send("updated"); 
    } catch (error) {
      console.log('Error : ' , error)
      res.status(500).send('Erreur lors de la suppression du chantier');
    }
}
