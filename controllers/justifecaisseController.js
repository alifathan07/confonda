import prisma from "../db.js";

// Helper: Get previous month's soldé
const getPreviousSolde = async (userId, chantierId, mois, annee) => {
  let prevMois = mois - 1;
  let prevAnnee = annee;
  if (prevMois === 0) {
    prevMois = 12;
    prevAnnee -= 1;
  }
  const prevJustif = await prisma.justifCaisse.findFirst({
    where: { userId, chantierId, mois: prevMois, annee: prevAnnee },
    select: { soldeFinal: true },
  });
  return prevJustif?.soldeFinal ?? 0;
};

// Render create page
export const createJustifCaisse = async (req, res) => {
    try {
      const user = req.session.user;
      if (!user || !user.name || !user.chantierId) {
        console.error("User session invalid:", req.session.user);
        return res.status(403).render("error", { error: "Utilisateur non authentifié ou données manquantes" });
      }
  
      const chantier = await prisma.chantier.findUnique({ where: { id: user.chantierId } });
      if (!chantier || !chantier.nom) {
        console.error("Chantier not found for ID:", user.chantierId);
        return res.status(404).render("error", { error: "Chantier non trouvé" });
      }
  
      const defaultJustifCaisse = {
        soldePrecedent: 0,
        totalRecettes: 0,
        totalDepenses: 0,
        soldeFinal: 0,
        depenses: [],
        designation: "",
      };
  
      console.log("Rendering create.ejs with:", { user, chantier, justifCaisse: defaultJustifCaisse });
  
      res.render("dashboard/achats/caisse/justifecaisse/create", {
        user: { ...user, recettes: [], depenses: [] },
        chantier,
        justifCaisse: defaultJustifCaisse,
      });
    } catch (error) {
      console.error("Error in createJustifCaisse:", error);
      res.status(500).render("error", { error: "Erreur lors du chargement de la page" });
    }
  };
// Create/Update recettes
export const createOrUpdateRecettes = async (req, res) => {
  try {
    const { responsable, chantier, designation, items } = req.body;
    const user = req.session.user;
    if (!user || user.name !== responsable) {
      return res.status(403).json({ success: false, error: "Utilisateur non autorisé" });
    }

    const chantierRecord = await prisma.chantier.findFirst({ where: { nom: chantier } });
    if (!chantierRecord) {
      return res.status(400).json({ success: false, error: "Chantier invalide" });
    }

    // Parse designation (e.g., "Mars-2025" -> mois: 3, annee: 2025)
    const [moisStr, anneeStr] = designation.split("-");
    const moisIndex = [
      "Janvier",
      "Février",
      "Mars",
      "Avril",
      "Mai",
      "Juin",
      "Juillet",
      "Août",
      "Septembre",
      "Octobre",
      "Novembre",
      "Décembre",
    ].indexOf(moisStr);
    if (moisIndex === -1) {
      return res.status(400).json({ success: false, error: "Mois invalide" });
    }
    const mois = moisIndex + 1;
    const annee = parseInt(anneeStr);

    // Get or create JustifCaisse
    let justifCaisse = await prisma.justifCaisse.findFirst({
      where: { userId: user.id, chantierId: chantierRecord.id, mois, annee },
    });

    if (!justifCaisse) {
      const soldePrecedent = await getPreviousSolde(user.id, chantierRecord.id, mois, annee);
      justifCaisse = await prisma.justifCaisse.create({
        data: {
          mois,
          annee,
          designation: `Justification Caisse ${moisStr} ${annee}`,
          soldePrecedent,
          userId: user.id,
          chantierId: chantierRecord.id,
        },
      });
    }

    // Create recettes
    await prisma.recetteCaisse.createMany({
      data: items.map((item) => ({
        source: item.source,
        montant: parseFloat(item.montant),
        dateRecette: new Date(item.dateRecette),
        justifCaisseId: justifCaisse.id,
      })),
    });

    // Update totals
    const totalRecettes = await prisma.recetteCaisse.aggregate({
      _sum: { montant: true },
      where: { justifCaisseId: justifCaisse.id },
    });
    const totalDepenses = await prisma.depenseCaisse.aggregate({
      _sum: {
        montantJustifie: true,
        montantNonJustifie: true,
      },
      where: { justifCaisseId: justifCaisse.id },
    });
    const totalDepensesValue =
      (totalDepenses._sum.montantJustifie ?? 0) +
      (totalDepenses._sum.montantNonJustifie ?? 0);

    await prisma.justifCaisse.update({
      where: { id: justifCaisse.id },
      data: {
        totalRecettes: totalRecettes._sum.montant ?? 0,
        totalDepenses: totalDepensesValue,
        soldeFinal: justifCaisse.soldePrecedent + (totalRecettes._sum.montant ?? 0) - totalDepensesValue,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete recette
export const deleteRecette = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.session.user;
    const recette = await prisma.recetteCaisse.findUnique({ where: { id: parseInt(id) } });
    if (!recette || recette.justifCaisse.userId !== user.id) {
      return res.status(403).json({ success: false, error: "Non autorisé" });
    }

    await prisma.recetteCaisse.delete({ where: { id: parseInt(id) } });

    // Update totals
    const justifCaisse = await prisma.justifCaisse.findUnique({
      where: { id: recette.justifCaisseId },
    });
    const totalRecettes = await prisma.recetteCaisse.aggregate({
      _sum: { montant: true },
      where: { justifCaisseId: justifCaisse.id },
    });
    const totalDepenses = await prisma.depenseCaisse.aggregate({
      _sum: {
        montantJustifie: true,
        montantNonJustifie: true,
      },
      where: { justifCaisseId: justifCaisse.id },
    });
    const totalDepensesValue =
      (totalDepenses._sum.montantJustifie ?? 0) +
      (totalDepenses._sum.montantNonJustifie ?? 0);

    await prisma.justifCaisse.update({
      where: { id: justifCaisse.id },
      data: {
        totalRecettes: totalRecettes._sum.montant ?? 0,
        totalDepenses: totalDepensesValue,
        soldeFinal: justifCaisse.soldePrecedent + (totalRecettes._sum.montant ?? 0) - totalDepensesValue,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create/Update depenses
// In justifCaisseController.js
export const createOrUpdateDepenses = async (req, res) => {
    try {
      const { responsable, chantier, designation, items } = req.body;
      const user = req.session.user;
      console.log('Received depenses:', { responsable, chantier, designation, items }); // Debug
      if (!user || user.name !== responsable) {
        console.error('Unauthorized user:', { sessionUser: user?.name, responsable });
        return res.status(403).json({ success: false, error: 'Utilisateur non autorisé' });
      }
  
      const chantierRecord = await prisma.chantier.findFirst({ where: { nom: chantier } });
      if (!chantierRecord) {
        console.error('Invalid chantier:', chantier);
        return res.status(400).json({ success: false, error: 'Chantier invalide' });
      }
  
      // Parse designation
      const [moisStr, anneeStr] = designation.split('-');
      const moisIndex = [
        'Janvier',
        'Février',
        'Mars',
        'Avril',
        'Mai',
        'Juin',
        'Juillet',
        'Août',
        'Septembre',
        'Octobre',
        'Novembre',
        'Décembre',
      ].indexOf(moisStr);
      if (moisIndex === -1) {
        console.error('Invalid month:', designation);
        return res.status(400).json({ success: false, error: 'Mois invalide' });
      }
      const mois = moisIndex + 1;
      const annee = parseInt(anneeStr);
  
      // Get or create JustifCaisse
      let justifCaisse = await prisma.justifCaisse.findFirst({
        where: { userId: user.id, chantierId: chantierRecord.id, mois, annee },
      });
  
      if (!justifCaisse) {
        const soldePrecedent = await getPreviousSolde(user.id, chantierRecord.id, mois, annee);
        justifCaisse = await prisma.justifCaisse.create({
          data: {
            mois,
            annee,
            designation: `Justification Caisse ${moisStr} ${annee}`,
            soldePrecedent,
            userId: user.id,
            chantierId: chantierRecord.id,
          },
        });
      }
  
      // Create or update depenses
      for (const item of items) {
        const data = {
          dateDepense: new Date(item.date),
          numeroPiece: item.numeroPiece, // Fixed: Match frontend field
          imputation: item.imputation,
          natureDepense: item.natureDepense,
          montantJustifie: parseFloat(item.montantJustifie) || 0, // Fixed: Match frontend field
          montantNonJustifie: parseFloat(item.montantNonJustifie) || 0, // Fixed: Match frontend field
          justifCaisseId: justifCaisse.id,
        };
        console.log('Processing depense:', data); // Debug
        if (item._id) {
          await prisma.depenseCaisse.update({
            where: { id: parseInt(item._id) },
            data,
          });
        } else {
          await prisma.depenseCaisse.create({ data });
        }
      }
  
      // Update totals
      const totalRecettes = await prisma.recetteCaisse.aggregate({
        _sum: { montant: true },
        where: { justifCaisseId: justifCaisse.id },
      });
      const totalDepenses = await prisma.depenseCaisse.aggregate({
        _sum: {
          montantJustifie: true,
          montantNonJustifie: true,
        },
        where: { justifCaisseId: justifCaisse.id },
      });
      const totalDepensesValue =
        (totalDepenses._sum.montantJustifie || 0) +
        (totalDepenses._sum.montantNonJustifie || 0);
      console.log('Totals:', { // Debug
        totalRecettes: totalRecettes._sum.montant || 0,
        totalDepenses: totalDepensesValue,
        soldePrecedent: justifCaisse.soldePrecedent,
        soldeFinal: justifCaisse.soldePrecedent + (totalRecettes._sum.montant || 0) - totalDepensesValue,
      });
  
      await prisma.justifCaisse.update({
        where: { id: justifCaisse.id },
        data: {
          totalRecettes: totalRecettes._sum.montant || 0,
          totalDepenses: totalDepensesValue,
          soldeFinal: justifCaisse.soldePrecedent + (totalRecettes._sum.montant || 0) - totalDepensesValue,
        },
      });
  
      res.json({ success: true });
    } catch (error) {
      console.error('Error in createOrUpdateDepenses:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  };

// Delete depense
export const deleteDepense = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.session.user;
    const depense = await prisma.depenseCaisse.findUnique({ where: { id: parseInt(id) } });
    if (!depense || depense.justifCaisse.userId !== user.id) {
      return res.status(403).json({ success: false, error: "Non autorisé" });
    }

    await prisma.depenseCaisse.delete({ where: { id: parseInt(id) } });

    // Update totals
    const justifCaisse = await prisma.justifCaisse.findUnique({
      where: { id: depense.justifCaisseId },
    });
    const totalRecettes = await prisma.recetteCaisse.aggregate({
      _sum: { montant: true },
      where: { justifCaisseId: justifCaisse.id },
    });
    const totalDepenses = await prisma.depenseCaisse.aggregate({
      _sum: {
        montantJustifie: true,
        montantNonJustifie: true,
      },
      where: { justifCaisseId: justifCaisse.id },
    });
    const totalDepensesValue =
      (totalDepenses._sum.montantJustifie ?? 0) +
      (totalDepenses._sum.montantNonJustifie ?? 0);

    await prisma.justifCaisse.update({
      where: { id: justifCaisse.id },
      data: {
        totalRecettes: totalRecettes._sum.montant ?? 0,
        totalDepenses: totalDepensesValue,
        soldeFinal: justifCaisse.soldePrecedent + (totalRecettes._sum.montant ?? 0) - totalDepensesValue,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// List justifications (for list view)
export const listJustifCaisse = async (req, res) => {
  try {
    const user = req.session.user;
    const justifications = await prisma.justifCaisse.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        mois: true,
        annee: true,
        designation: true,
      },
      orderBy: [
        { annee: "desc" },
        { mois: "desc" },
      ],
    });

    const months = [
      "Janvier",
      "Février",
      "Mars",
      "Avril",
      "Mai",
      "Juin",
      "Juillet",
      "Août",
      "Septembre",
      "Octobre",
      "Novembre",
      "Décembre",
    ];

    const formattedJustifications = justifications.map((j) => ({
      id: j.id,
      mois: months[j.mois - 1],
      annee: j.annee,
      display: `${months[j.mois - 1]} ${j.annee}`,
    }));

    res.render("dashboard/achats/caisse/justifecaisse/list", {
      user,
      justifications: formattedJustifications,
    });
  } catch (error) {
    console.error(error);
    res.status(500).render("error", { error: "Erreur lors du chargement des justifications" });
  }
};

// View details of a justification
export const viewJustifCaisse = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.session.user;
    const justifCaisse = await prisma.justifCaisse.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: { select: { name: true } },
        chantier: { select: { nom: true } },
        recettes: true,
        depenses: true,
      },
    });

    if (!justifCaisse || justifCaisse.userId !== user.id) {
      return res.status(403).render("error", { error: "Accès non autorisé" });
    }

    // Format for frontend (match create page)
    const formattedRecettes = justifCaisse.recettes.map((r) => ({
      _id: r.id,
      dateRecette: r.dateRecette,
      source: r.source,
      montant: r.montant,
    }));

    const formattedDepenses = justifCaisse.depenses.map((d) => ({
      _id: d.id,
      date: d.dateDepense,
      numeroDuPiece: d.numeroPiece,
      imputation: d.imputation,
      montant: (d.montantJustifie ?? 0) + (d.montantNonJustifie ?? 0),
      natureDepense: d.natureDepense,
      justifier: d.montantJustifie,
      nonJustifier: d.montantNonJustifie,
    }));
    

    res.render("dashboard/achats/caisse/justifecaisse/create", {
      user: { ...user, recettes: formattedRecettes, depenses: formattedDepenses },
      justifCaisse,
      chantier: justifCaisse.chantier,
    });
  } catch (error) {
    console.error(error);
    res.status(500).render("error", { error: "Erreur lors du chargement des détails" });
  }
};


// Add to justifCaisseController.js
export const saveAllData = async (req, res) => {
    try {
      const { responsable, chantier, designation, recettes, depenses } = req.body;
      const user = req.session.user;
      if (!user || user.name !== responsable) {
        return res.status(403).json({ success: false, error: "Utilisateur non autorisé" });
      }
  
      const chantierRecord = await prisma.chantier.findFirst({ where: { nom: chantier } });
      if (!chantierRecord) {
        return res.status(400).json({ success: false, error: "Chantier invalide" });
      }
  
      // Parse designation (e.g., "Mars-2025" -> mois: 3, annee: 2025)
      const [moisStr, anneeStr] = designation.split("-");
      const moisIndex = [
        "Janvier",
        "Février",
        "Mars",
        "Avril",
        "Mai",
        "Juin",
        "Juillet",
        "Août",
        "Septembre",
        "Octobre",
        "Novembre",
        "Décembre",
      ].indexOf(moisStr);
      if (moisIndex === -1) {
        return res.status(400).json({ success: false, error: "Mois invalide" });
      }
      const mois = moisIndex + 1;
      const annee = parseInt(anneeStr);
  
      // Get or create JustifCaisse
      let justifCaisse = await prisma.justifCaisse.findFirst({
        where: { userId: user.id, chantierId: chantierRecord.id, mois, annee },
      });
  
      if (!justifCaisse) {
        const soldePrecedent = await getPreviousSolde(user.id, chantierRecord.id, mois, annee);
        justifCaisse = await prisma.justifCaisse.create({
          data: {
            mois,
            annee,
            designation: `Justification Caisse ${moisStr} ${annee}`,
            soldePrecedent,
            userId: user.id,
            chantierId: chantierRecord.id,
          },
        });
      }
  
      // Create recettes if provided
      if (recettes && recettes.length > 0) {
        await prisma.recetteCaisse.createMany({
          data: recettes.map((item) => ({
            source: item.source,
            montant: parseFloat(item.montant),
            dateRecette: new Date(item.dateRecette),
            justifCaisseId: justifCaisse.id,
          })),
        });
      }
  
      // Create or update dépenses
      if (depenses && depenses.length > 0) {
        for (const item of depenses) {
          const data = {
            dateDepense: new Date(item.date),
            numeroPiece: item.numeroPiece,
            imputation: item.imputation,
            natureDepense: item.natureDepense,
            montantJustifie: parseFloat(item.montantJustifie) || 0,
            montantNonJustifie: parseFloat(item.montantNonJustifie) || 0,
            justifCaisseId: justifCaisse.id,
          };
          if (item._id) {
            await prisma.depenseCaisse.update({
              where: { id: parseInt(item._id) },
              data,
            });
          } else {
            await prisma.depenseCaisse.create({ data });
          }
        }
      }
  
      // Update totals
      const totalRecettes = await prisma.recetteCaisse.aggregate({
        _sum: { montant: true },
        where: { justifCaisseId: justifCaisse.id },
      });
      const totalDepenses = await prisma.depenseCaisse.aggregate({
        _sum: {
          montantJustifie: true,
          montantNonJustifie: true,
        },
        where: { justifCaisseId: justifCaisse.id },
      });
      const totalDepensesValue =
        (totalDepenses._sum.montantJustifie || 0) +
        (totalDepenses._sum.montantNonJustifie || 0);
  
      await prisma.justifCaisse.update({
        where: { id: justifCaisse.id },
        data: {
          totalRecettes: totalRecettes._sum.montant || 0,
          totalDepenses: totalDepensesValue,
          soldeFinal: justifCaisse.soldePrecedent + (totalRecettes._sum.montant || 0) - totalDepensesValue,
        },
      });
  
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: error.message });
    }
  };