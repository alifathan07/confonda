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

// Helper: Recalculate and update totals for a given justifCaisseId
const recalculateAndUpdateTotals = async (justifCaisseId) => {
  const justifCaisse = await prisma.justifCaisse.findUnique({
    where: { id: justifCaisseId },
  });

  if (!justifCaisse) {
    throw new Error("JustifCaisse not found");
  }

  // Sum recettes
  const recettesSum = await prisma.recetteCaisse.aggregate({
    _sum: { montant: true },
    where: { justifCaisseId },
  });
  const totalRecettes = recettesSum._sum.montant ?? 0;

  // Sum non-justifié (always included)
  const nonJustifieSum = await prisma.depenseCaisse.aggregate({
    _sum: { montantNonJustifie: true },
    where: { justifCaisseId, validation: false },
  });
  const totalNonJustifie = nonJustifieSum._sum.montantNonJustifie ?? 0;

  // Sum justifié only where validation === true
  const justifieSum = await prisma.depenseCaisse.aggregate({
    _sum: { montantJustifie: true },
    where: { justifCaisseId, validation: false },
  });
  const totalJustifie = justifieSum._sum.montantJustifie ?? 0;

  // Total depenses = justifié (validated) + non-justifié
  const totalDepenses = totalJustifie + totalNonJustifie;

  // Update soldeFinal
  const soldeFinal = justifCaisse.soldePrecedent + totalRecettes - totalDepenses;

  await prisma.justifCaisse.update({
    where: { id: justifCaisseId },
    data: {
      totalRecettes,
      totalDepenses,
      soldeFinal,
    },
  });

  return { totalRecettes, totalDepenses, soldeFinal };
};

// Render create page
export const createJustifCaisse = async (req, res) => {
  try {
    const user = req.session.user;
    if (!user || !user.name || !user.chantierId) {
      console.error("User session invalid:", req.session.user);
      return res
        .status(403)
        .render("error", { error: "Utilisateur non authentifié ou données manquantes" });
    }

    const lastJustif = await prisma.justifCaisse.findFirst({
      where: { userId: user.id, chantierId: user.chantierId },
      orderBy: { id: "desc" },
      select: { designation: true },
    });

    const months = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];

    let nextMonth, nextYear;

    if (lastJustif && lastJustif.designation) {
      const designationText = lastJustif.designation.trim();
      console.log("designationText", designationText);

      // Try to find the month name in the text
      const foundMonth = months.find(m => designationText.includes(m));
      const yearMatch = designationText.match(/\b(20\d{2})\b/); // match "2025", "2024", etc.

      if (!foundMonth || !yearMatch) {
        throw new Error(`Invalid designation format: ${designationText}`);
      }

      const prevMonthIndex = months.indexOf(foundMonth);
      const prevYear = parseInt(yearMatch[1], 10);

      const newMonthIndex = (prevMonthIndex + 1) % 12;
      nextMonth = months[newMonthIndex];
      nextYear = newMonthIndex === 0 ? prevYear + 1 : prevYear;
    } else {
      // No previous record → use current date
      const now = new Date();
      nextMonth = months[now.getMonth()];
      nextYear = now.getFullYear();
    }
    const designation = `Justification Caisse ${nextMonth} ${nextYear}`;



    const chantier = await prisma.chantier.findUnique({
      where: { id: user.chantierId },
    });

    if (!chantier) {
      console.error("Chantier not found for ID:", user.chantierId);
      return res.status(404).render("error", { error: "Chantier non trouvé" });
    }

    const defaultJustifCaisse = {
      soldePrecedent: 0,
      totalRecettes: 0,
      totalDepenses: 0,
      soldeFinal: 0,
      depenses: [],
      designation: `${nextMonth}-${nextYear}`,
    };

    console.log("Rendering createJustifCaisse with:", { designation });

    res.render("dashboard/achats/caisse/justifecaisse/create", {
      user: { ...user, role: user.role ,  recettes: [], depenses: [] },
      chantier,
      justifCaisse: defaultJustifCaisse,
      designation,
    });
  } catch (error) {
    console.error("Error in createJustifCaisse:", error);

    // fallback if your "error.ejs" doesn't exist
    if (res.render) {
      try {
        res.status(500).render("error", { error: "Erreur lors du chargement de la page" });
      } catch {
        res.status(500).send("Erreur lors du chargement de la page");
      }
    } else {
      res.status(500).send("Erreur lors du chargement de la page");
    }
  }
};


export const addJustifCaisse = async (req, res) => {
  try {
    const user = req.session.user;
    if (!user) {
      return res.status(403).json({ success: false, error: "Utilisateur non authentifié" });
    }

    const chantier = user.chantierId;

    // Get the last JustifCaisse for this chantier
    const last = await prisma.justifCaisse.findFirst({
      where: { chantierId: chantier },
      orderBy: [{ annee: 'desc' }, { mois: 'desc' }],
    });

    let nextMois, nextAnnee;
    if (last) {
      nextMois = last.mois + 1;
      nextAnnee = last.annee;
      if (nextMois > 12) {
        nextMois = 1;
        nextAnnee++;
      }
    } else {
      // Default if none exist
      const now = new Date();
      nextMois = now.getMonth() + 1;
      nextAnnee = now.getFullYear();
    }

    const moisStr = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ][nextMois - 1];

    const designation = `Justification Caisse ${moisStr} ${nextAnnee}`;

    // Calculate previous solde
    const soldePrecedent = await getPreviousSolde(user.id, chantier, nextMois, nextAnnee);

    // Create the new record
    const justifCaisse = await prisma.justifCaisse.create({
      data: {
        mois: nextMois,
        annee: nextAnnee,
        designation,
        soldePrecedent,
        userId: user.id,
        chantierId: chantier,
      },
    });

    res.json({ success: true, justifCaisse });
  } catch (error) {
    console.error("Error adding JustifCaisse:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};



// Create/Update recettes
export const createOrUpdateRecettes = async (req, res) => {
  try {
    console.log('Session data:', req.session); // Debug session
    const user = req.session.user;
    const { justifId } = req.params; // Get justifId from URL
    const { responsable, chantier, designation, items } = req.body;

    // Validate user session
    if (!user || !user.id || !user.name) {
      console.error('Invalid user session:', {
        sessionUser: user,
        sessionExists: !!req.session, 
        userProperties: user ? Object.keys(user) : null,
      });
      return res.status(403).json({ success: false, error: 'Utilisateur non authentifié ou ID manquant' });
    }

    // Validate user
    const userRecord = await prisma.user.findUnique({ where: { id: parseInt(user.id) } });
    if (!userRecord) {
      console.error('User not found:', user.id);
      return res.status(404).json({ success: false, error: 'Utilisateur non trouvé.' });
    }

    // Validate responsable
    if (userRecord.name !== responsable) {
      console.error('Unauthorized user:', { sessionUserName: userRecord.name, responsable });
      return res.status(403).json({ success: false, error: 'Utilisateur non autorisé' });
    }

    // Validate required fields
    if (!responsable || !chantier || !designation || !items || !Array.isArray(items)) {
      console.error('Missing or invalid required fields:', { responsable, chantier, designation, items });
      return res.status(400).json({ success: false, error: 'Données manquantes ou invalides.' });
    }

    // Validate chantier
    const chantierRecord = await prisma.chantier.findFirst({
      where: { nom: chantier },
    });
    if (!chantierRecord) {
      console.error('Invalid chantier:', chantier);
      return res.status(400).json({ success: false, error: 'Chantier invalide' });
    }

    // Validate designation
    const [moisStr, anneeStr] = designation.split('-');
    const moisIndex = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
    ].indexOf(moisStr);

    if (moisIndex === -1 || !anneeStr || isNaN(parseInt(anneeStr)) || anneeStr.length !== 4) {
      console.error('Invalid designation:', designation);
      return res.status(400).json({ success: false, error: 'Designation invalide' });
    }

    const mois = moisIndex + 1;
    const annee = parseInt(anneeStr);

    // Check for existing justifCaisse by userId, chantierId, mois, and annee
    let justifCaisse = await prisma.justifCaisse.findFirst({
      where: {
        userId: userRecord.id,
        chantierId: chantierRecord.id,
        mois,
        annee,
      },
      include: { chantier: true },
    });

    // If justifId is provided, validate it
    if (justifId && !isNaN(parseInt(justifId))) {
      const justifCaisseById = await prisma.justifCaisse.findUnique({
        where: { id: parseInt(justifId) },
        include: { chantier: true },
      });

      if (justifCaisseById) {
        if (justifCaisseById.userId !== userRecord.id || justifCaisseById.chantierId !== chantierRecord.id) {
          console.error('JustifCaisse does not belong to user or chantier:', {
            justifCaisseUserId: justifCaisseById.userId,
            userId: userRecord.id,
            justifCaisseChantierId: justifCaisseById.chantierId,
            chantierId: chantierRecord.id,
          });
          return res.status(403).json({ success: false, error: 'Justification non autorisée pour cet utilisateur ou chantier' });
        }
        // If justifCaisse was not found by userId, chantierId, mois, and annee, use the one from justifId
        if (!justifCaisse) {
          justifCaisse = justifCaisseById;
        } else if (justifCaisse.id !== parseInt(justifId)) {
          console.error('Mismatch between justifId and existing justifCaisse:', { justifId, existingJustifCaisseId: justifCaisse.id });
          return res.status(400).json({ success: false, error: 'justifId ne correspond pas à la justification existante.' });
        }
      } else {
        console.warn('JustifCaisse not found for ID:', justifId);
      }
    }

    // If no justifCaisse exists, create a new one
    if (!justifCaisse) {
      console.log('Creating new justifCaisse for:', { userId: userRecord.id, chantierId: chantierRecord.id, mois, annee });
      const soldePrecedent = await getPreviousSolde(userRecord.id, chantierRecord.id, mois, annee);
      justifCaisse = await prisma.justifCaisse.create({
        data: {
          mois,
          annee,
          designation: `${moisStr}-${annee}`,
          soldePrecedent,
          userId: userRecord.id,
          chantierId: chantierRecord.id,
        },
      });
    } else {
      // Update designation if changed
      if (justifCaisse.designation !== `${moisStr}-${annee}`) {
        await prisma.justifCaisse.update({
          where: { id: justifCaisse.id },
          data: { designation: `${moisStr}-${annee}`, mois, annee },
        });
      }
    }

    // Process recettes
    for (const item of items) {
      const dateRecette = new Date(item.dateRecette);
      if (isNaN(dateRecette.getTime())) {
        console.error('Invalid dateRecette:', item.dateRecette);
        return res.status(400).json({ success: false, error: `Date de recette invalide pour ${item.source}` });
      }

      const montant = parseFloat(item.montant);
      if (isNaN(montant) || montant <= 0) {
        console.error('Invalid montant:', item.montant);
        return res.status(400).json({ success: false, error: `Montant invalide pour ${item.source}` });
      }

      if (!item.source || item.source.trim() === '') {
        console.error('Missing source:', item.source);
        return res.status(400).json({ success: false, error: `Source manquante pour ${item.source}` });
      }

      const data = {
        source: item.source.trim(),
        userId: justifCaisse.userId,
        montant,
        dateRecette,
        justifCaisseId: justifCaisse.id,
      };

      if (item._id) {
        // Check if the recette exists
        const existingRecette = await prisma.recetteCaisse.findUnique({
          where: { id: parseInt(item._id), justifCaisseId: justifCaisse.id },
        });

        if (existingRecette) {
          // Update existing recette
          await prisma.recetteCaisse.update({
            where: { id: parseInt(item._id), justifCaisseId: justifCaisse.id },
            data,
          });
        } else {
          console.warn(`Recette with ID ${item._id} not found or does not belong to justifCaisse ${justifCaisse.id}. Creating new recette.`);
          await prisma.recetteCaisse.create({ data });
        }
      } else {
        // Create new recette
        await prisma.recetteCaisse.create({ data });
      }
    }

    // Recalculate totals using helper
    const { totalRecettes, totalDepenses, soldeFinal } = await recalculateAndUpdateTotals(justifCaisse.id);

    // Fetch updated recettes
    const updatedRecettes = await prisma.recetteCaisse.findMany({
      where: { justifCaisseId: justifCaisse.id },
      select: {
        id: true,
        dateRecette: true,
        source: true,
        montant: true,
        userId: true,
      },
    });

    // Return updated totals and recettes
    return res.json({
      success: true,
      justifId: justifCaisse.id,
      recettes: updatedRecettes.map((r) => ({
        _id: r.id,
        dateRecette: r.dateRecette,
        source: r.source,
        montant: r.montant,
        userId: r.userId,
      })),
      totals: {
        totalRecettes,
        totalDepenses,
        soldeFinal,
      },
    });
  } catch (error) {
    console.error('Error in createOrUpdateRecettes:', error);
    return res.status(500).json({ success: false, error: 'Erreur lors de l’enregistrement des recettes.' });
  }
};
// Delete recette
export const deleteRecette = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = req.session.user;
    
    const recette = await prisma.recetteCaisse.findUnique({ where: { id: parseInt(id) } });
    const justifCaisseFound = await prisma.justifCaisse.findUnique({ where: { id: recette.justifCaisseId } });
    if (!recette) {
      return res.status(403).json({ success: false, error: "Aucune Caisse" });
    }

    await prisma.recetteCaisse.delete({ where: { id: parseInt(id) } });

    // Recalculate totals using helper
    await recalculateAndUpdateTotals(recette.justifCaisseId);

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
    console.log('Received depenses:', { responsable, chantier, designation, items });

    if (!user || user.name !== responsable) {
      console.error('Unauthorized user:', { sessionUser: user?.name, responsable });
      return res.status(403).json({ success: false, error: 'Utilisateur non autorisé' });
    }

    const chantierRecord = await prisma.chantier.findFirst({ where: { nom: chantier } });
    if (!chantierRecord) {
      console.error('Invalid chantier:', chantier);
      return res.status(400).json({ success: false, error: 'Chantier invalide' });
    }

    const [moisStr, anneeStr] = designation.split('-');
    const moisIndex = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
    ].indexOf(moisStr);
    if (moisIndex === -1) {
      console.error('Invalid month:', designation);
      return res.status(400).json({ success: false, error: 'Mois invalide' });
    }
    const mois = moisIndex + 1;
    const annee = parseInt(anneeStr);

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
      // Use boolean for validation (default false if not provided)
      const validation = item.validation ?? false;
      const data = {
        dateDepense: new Date(item.date),
        numeroPiece: item.numeroPiece,
        imputation: item.imputation,
        natureDepense: item.natureDepense,
        montantJustifie: parseFloat(item.montantJustifie) || 0,
        montantNonJustifie: parseFloat(item.montantNonJustifie) || 0,
        validation,
        justifCaisseId: justifCaisse.id,
      };
      console.log('Processing depense:', data);
      if (item._id) {
        await prisma.depenseCaisse.update({
          where: { id: parseInt(item._id) },
          data,
        });
      } else {
        await prisma.depenseCaisse.create({ data });
      }
    }

    // Recalculate totals using helper
    const { totalRecettes, totalDepenses, soldeFinal } = await recalculateAndUpdateTotals(justifCaisse.id);

    console.log('Totals:', {
      totalRecettes,
      totalDepenses,
      soldePrecedent: justifCaisse.soldePrecedent,
      soldeFinal,
    });

    res.json({ success: true, totals: { totalRecettes, totalDepenses, soldeFinal } });
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
    const Depence_justifCaisse = await prisma.justifCaisse.findUnique({ where: { id: depense.justifCaisseId } });
    if (!depense || Depence_justifCaisse.userId !== user.id) {
      return res.status(403).json({ success: false, error: 'Accès refusé — vous n\'êtes pas autorisé à supprimer cette dépense.' });
    } 

    await prisma.depenseCaisse.delete({ where: { id: parseInt(id) } });

    // Recalculate totals using helper
    await recalculateAndUpdateTotals(depense.justifCaisseId);

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
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
      let moisStr = designation.split("-")[0];
      let anneeStr = designation.split("-")[1];
      
      if (!moisStr || !anneeStr) {
        const latestJustifCaisse = await prisma.justifCaisse.findFirst({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
        });
        if (latestJustifCaisse) {
          moisStr = latestJustifCaisse.designation.split("-")[0];
          anneeStr = latestJustifCaisse.designation.split("-")[1];
        }
      }
      
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
          const validation = item.validation ?? false; // Default to false
          const data = {
            dateDepense: new Date(item.date),
            numeroPiece: item.numeroPiece,
            imputation: item.imputation,
            natureDepense: item.natureDepense,
            montantJustifie: parseFloat(item.montantJustifie) || 0,
            montantNonJustifie: parseFloat(item.montantNonJustifie) || 0,
            validation,
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
  
      // Recalculate totals using helper
      await recalculateAndUpdateTotals(justifCaisse.id);
  
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: error.message });
    }
  };

  // fetch all justife 
export const getAllJustifCaisse = async (req, res) => {
    try {
      const justifCaisse = await prisma.justifCaisse.findMany({
        where: { userId: req.session.user.id },
        select: {
          id: true,
          mois: true,
          annee: true,
          designation: true,
          soldePrecedent: true,
          soldeFinal: true,
          totalDepenses: true,
          totalRecettes: true,
        },
        orderBy: [
          { annee: "desc" },
          { mois: "desc" },
        ],
      });
      const lastDesignation =  await prisma.justifCaisse.findFirst({
        where: { userId: req.session.user.id },
        select: {
          designation: true,
        },
        orderBy: [
          { annee: "desc" },
          { mois: "desc" },
        ],
      });
      res.render("dashboard/achats/caisse/justifecaisse/index", {
        justifCaisse,
        lastDesignation
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: error.message });
    }
};

export const deleteJustifeCaisse = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.justifCaisse.delete({ where: { id: parseInt(id) } });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
}







export const adminUserList = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
          where: {
            role: "user",
          },
            select: {
                id: true,
                name: true,
                email: true,
                chantier : true
            },
        });
        res.render("dashboard/achats/caisse/justifecaisse/userlist", {
            users,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
}

export const justifeCaisseListUser = async (req, res) => {
    try {
      const userId = req.params.id;
        const justifCaisse = await prisma.justifCaisse.findMany({
          where: {
            userId: parseInt(userId),
          },
            select: {
                id: true,
                mois: true,
                annee: true,
                designation: true,
                soldePrecedent: true,
                soldeFinal: true,
                totalDepenses: true,
                totalRecettes: true,
            },
            orderBy: [
              { annee: "desc" },
              { mois: "desc" },
            ],
        });
        const lastDesignation =  await prisma.justifCaisse.findFirst({
          where: { userId: parseInt(userId) },
          select: {
            designation: true,
          },
          orderBy: [
            { annee: "desc" },
            { mois: "desc" },
          ],
        });
        res.render("dashboard/achats/caisse/justifecaisse/listjustife", {
            justifCaisse,
            userId,
            lastDesignation
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
}



// ✅ Controller
export const createJustifCaisseAdmin = async (req, res) => {
  try {
    const { userId } = req.params;

    // Fetch the user
    const userRecord = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });

    if (!userRecord || !userRecord.name || !userRecord.chantierId) {
      console.error("User invalid or missing data:", userRecord);
      return res
        .status(403)
        .render("error", { error: "Utilisateur non authentifié ou données manquantes" });
    }

    // Find the last Justif for this user and chantier
    const lastJustif = await prisma.justifCaisse.findFirst({
      where: {
        userId: parseInt(userId),
        chantierId: userRecord.chantierId,
      },
      orderBy: { id: "desc" },
      select: { designation: true },
    });

    const months = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];

    let nextMonth, nextYear;

    if (lastJustif && lastJustif.designation) {
      const designationText = lastJustif.designation.trim();

      const foundMonth = months.find(m => designationText.includes(m));
      const yearMatch = designationText.match(/\b(20\d{2})\b/);

      if (!foundMonth || !yearMatch) {
        throw new Error(`Invalid designation format: ${designationText}`);
      }

      const prevMonthIndex = months.indexOf(foundMonth);
      const prevYear = parseInt(yearMatch[1], 10);

      const newMonthIndex = (prevMonthIndex + 1) % 12;
      nextMonth = months[newMonthIndex];
      nextYear = newMonthIndex === 0 ? prevYear + 1 : prevYear;
    } else {
      const now = new Date();
      nextMonth = months[now.getMonth()];
      nextYear = now.getFullYear();
    }

    const designation = `${nextMonth}-${nextYear}`;

    // Fetch chantier
    const chantier = await prisma.chantier.findUnique({
      where: { id: userRecord.chantierId },
    });

    if (!chantier) {
      console.error("Chantier not found for ID:", userRecord.chantierId);
      return res.status(404).render("error", { error: "Chantier non trouvé" });
    }

    const defaultJustifCaisse = {
      soldePrecedent: 0,
      totalRecettes: 0,
      totalDepenses: 0,
      soldeFinal: 0,
      depenses: [],
      designation,
    };

    console.log("Rendering createJustifCaisseAdmin with:", { designation });

    res.render("dashboard/achats/caisse/justifecaisse/adminpart", {
      user: { ...userRecord, recettes: [], depenses: [] },
      chantier,
      justifCaisse: defaultJustifCaisse,
      designation,
    });
  } catch (error) {
    console.error("Error in createJustifCaisseAdmin:", error);
    try {
      res.status(500).render("error", { error: "Erreur lors du chargement de la page" });
    } catch {
      res.status(500).send("Erreur lors du chargement de la page");
    }
  }
};

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
      userId: r.userId,
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
      validation: d.validation,
      validerPar: d.validerPar,
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


export const viewJustifCaisseAdmin = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const admin = req.session.user;

    // Verify if admin
    if (!["admin", "grandadmin"].includes(admin.role)) {
      return res.status(403).render("error", { error: "Accès refusé — réservé à l’administrateur." });
    }

    // Fetch the user
    const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
    if (!user) {
      return res.status(404).render("error", { error: "Utilisateur non trouvé" });
    }

    const months = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];

    let justifCaisse, formattedRecettes = [], formattedDepenses = [], designation;

    if (id === "new") {
      // Handle new justification creation
      const lastJustif = await prisma.justifCaisse.findFirst({
        where: {
          userId: parseInt(userId),
          chantierId: user.chantierId,
        },
        orderBy: { id: "desc" },
        select: { designation: true },
      });

      let nextMonth, nextYear;
      if (lastJustif && lastJustif.designation) {
        const designationText = lastJustif.designation.trim();
        const foundMonth = months.find(m => designationText.includes(m));
        const yearMatch = designationText.match(/\b(20\d{2})\b/);

        if (!foundMonth || !yearMatch) {
          throw new Error(`Invalid designation format: ${designationText}`);
        }

        const prevMonthIndex = months.indexOf(foundMonth);
        const prevYear = parseInt(yearMatch[1], 10);
        const newMonthIndex = (prevMonthIndex + 1) % 12;
        nextMonth = months[newMonthIndex];
        nextYear = newMonthIndex === 0 ? prevYear + 1 : prevYear;
      } else {
        const now = new Date();
        nextMonth = months[now.getMonth()];
        nextYear = now.getFullYear();
      }

      designation = `${nextMonth}-${nextYear}`;
      justifCaisse = {
        id: null,
        soldePrecedent: 0,
        totalRecettes: 0,
        totalDepenses: 0,
        soldeFinal: 0,
        mois: months.indexOf(nextMonth) + 1,
        annee: nextYear,
        designation,
      };
    } else {
      // Fetch existing justification
      justifCaisse = await prisma.justifCaisse.findUnique({
        where: { id: parseInt(id) },
        include: {
          user: { select: { name: true } },
          chantier: { select: { nom: true } },
          recettes: true,
          depenses: true,
          
        },
      });

      if (!justifCaisse) {
        return res.status(404).render("error", { error: "Justification non trouvée" });
      }

      // Format for frontend
      formattedRecettes = justifCaisse.recettes.map((r) => ({
        _id: r.id,
        dateRecette: r.dateRecette,
        source: r.source,
        montant: r.montant,
        userId: r.userId,
      }));

      formattedDepenses = justifCaisse.depenses.map((d) => ({
        _id: d.id,
        date: d.dateDepense,
        numeroDuPiece: d.numeroPiece,
        imputation: d.imputation,
        montant: (d.montantJustifie ?? 0) + (d.montantNonJustifie ?? 0),
        natureDepense: d.natureDepense,
        justifier: d.montantJustifie,
        nonJustifier: d.montantNonJustifie,
        validation: d.validation,
        validerPar: d.validerPar,
      }));

      designation = justifCaisse.designation;
    }

    // Fetch chantier
    const chantier = await prisma.chantier.findUnique({
      where: { id: user.chantierId },
    });

    if (!chantier) {
      return res.status(404).render("error", { error: "Chantier non trouvé" });
    }

    res.render("dashboard/achats/caisse/justifecaisse/adminpart", {
      user: { ...user, recettes: formattedRecettes, depenses: formattedDepenses },
      justifCaisse,
      chantier,
      designation,
    });
  } catch (error) {
    console.error(error);
    res.status(500).render("error", { error: "Erreur lors du chargement des détails" });
  }
};

export const saveRecettesAdmin = async (req, res) => {
  try {
    const { userId, id } = req.params;
    const { responsable, chantier, designation, items, justifId, soldePrecedent } = req.body;
    const admin = req.session.user;

    // Verify admin role
    if (!["admin", "grandadmin"].includes(admin.role)) {
      return res.status(403).json({ success: false, error: 'Accès refusé — réservé à l’administrateur.' });
    }

    // Validate userId
    const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utilisateur non trouvé.' });
    }

    // Validate chantier
    const chantierRecord = await prisma.chantier.findFirst({ where: { nom: chantier } });
    if (!chantierRecord) {
      return res.status(400).json({ success: false, error: 'Chantier invalide.' });
    }

    // Validate designation
    const [moisStr, anneeStr] = designation.split('-');
    const moisIndex = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ].indexOf(moisStr);
    if (moisIndex === -1 || !anneeStr || isNaN(parseInt(anneeStr))) {
      return res.status(400).json({ success: false, error: 'Designation invalide.' });
    }
    const mois = moisIndex + 1;
    const annee = parseInt(anneeStr);

    // Validate required fields
    if (!responsable || !chantier || !designation || !items || !Array.isArray(items)) {
      return res.status(400).json({ success: false, error: 'Données manquantes ou invalides.' });
    }

    // Check for existing justifCaisse or create new
    let justifCaisse = await prisma.justifCaisse.findFirst({
      where: {
        userId: parseInt(userId),
        chantierId: chantierRecord.id,
        mois,
        annee,
      },
    });

    if (!justifCaisse) {
      let finalSoldePrecedent;
      if (soldePrecedent !== undefined && !isNaN(parseFloat(soldePrecedent))) {
        finalSoldePrecedent = parseFloat(soldePrecedent);
      } else {
        finalSoldePrecedent = await getPreviousSolde(parseInt(userId), chantierRecord.id, mois, annee);
      }

      justifCaisse = await prisma.justifCaisse.create({
        data: {
          mois,
          annee,
          designation: `${moisStr}-${annee}`,
          soldePrecedent: finalSoldePrecedent,
          userId: parseInt(userId),
          chantierId: chantierRecord.id,
        },
      });
    } else if (id !== "new" && parseInt(justifId) !== justifCaisse.id) {
      return res.status(400).json({ success: false, error: 'justifId ne correspond pas à la justification existante.' });
    }

    // Update or create recettes
    for (const item of items) {
      const { _id, dateRecette, source, montant } = item;
      const parsedMontant = parseFloat(montant);
      if (!dateRecette || !source || isNaN(parsedMontant) || parsedMontant <= 0) {
        return res.status(400).json({ success: false, error: `Données invalides pour la recette: ${source}` });
      }
      if (_id) {
        await prisma.recetteCaisse.update({
          where: { id: parseInt(_id), justifCaisseId: justifCaisse.id },
          data: { dateRecette: new Date(dateRecette), source, montant: parsedMontant },
        });
      } else {
        await prisma.recetteCaisse.create({
          data: {
            userId: parseInt(userId),
            dateRecette: new Date(dateRecette),
            source,
            montant: parsedMontant,
            justifCaisseId: justifCaisse.id,
          },
        });
      }
    }

    // Update justifCaisse designation
    await prisma.justifCaisse.update({
      where: { id: justifCaisse.id },
      data: { designation: `${moisStr}-${annee}` },
    });

    // Recalculate totals using helper
    const { totalRecettes, totalDepenses, soldeFinal } = await recalculateAndUpdateTotals(justifCaisse.id);

    // Return updated totals for frontend
    return res.json({
      success: true,
      justifId: justifCaisse.id,
      totals: {
        totalRecettes,
        totalDepenses,
        soldeFinal,
      },
    });
  } catch (error) {
    console.error('Error in saveRecettesAdmin:', error);
    return res.status(500).json({ success: false, error: 'Erreur lors de l’enregistrement des recettes.' });
  }
};

export const addJustifCaisseAdminAuto = async (req, res) => {
  try {
    const { userId } = req.params;
    const admin = req.session.user;

    // Verify admin role
    if (!["admin", "grandadmin"].includes(admin.role)) {
      return res.status(403).json({ success: false, error: 'Accès refusé — réservé à l’administrateur.' });
    }
    

    // Validate userId
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });
    if (!user || !user.chantierId) {
      return res.status(404).json({ success: false, error: 'Utilisateur non trouvé ou chantier manquant.' });
    }

    const chantierId = user.chantierId;

    // Get the last JustifCaisse for this user and chantier
    const last = await prisma.justifCaisse.findFirst({
      where: { userId: parseInt(userId), chantierId },
      orderBy: [{ annee: 'desc' }, { mois: 'desc' }],
    });

    let nextMois, nextAnnee;
    if (last) {
      nextMois = last.mois + 1;
      nextAnnee = last.annee;
      if (nextMois > 12) {
        nextMois = 1;
        nextAnnee++;
      }
    } else {
      // Default if none exist
      const now = new Date();
      nextMois = now.getMonth() + 1;
      nextAnnee = now.getFullYear();
    }

    const moisStr = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ][nextMois - 1];

    const designation = `Justification Caisse ${moisStr} ${nextAnnee}`;

    // Calculate previous solde
    const soldePrecedent = await getPreviousSolde(parseInt(userId), chantierId, nextMois, nextAnnee);

    // Create the new record
    const justifCaisse = await prisma.justifCaisse.create({
      data: {
        mois: nextMois,
        annee: nextAnnee,
        designation,
        soldePrecedent,
        userId: parseInt(userId),
        chantierId,
      },
    });

    res.json({ success: true, justifCaisse });
  } catch (error) {
    console.error("Error in addJustifCaisseAdmin:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};









export const updateDepenceValidation = async (req, res) => {
  try {
    const { id } = req.params;
    const { validation, validerPar } = req.body;
    const admin = req.session.user;

    // Admin role check
    if (!["grandadmin"].includes(admin.role)) {
      return res.status(403).json({ success: false, error: 'Accès refusé — réservé à l’administrateur.' });
    }

    if (validation === undefined) {
      return res.status(400).json({ success: false, error: 'Le champ validation est requis' });
    }
    if (validerPar && typeof validerPar !== 'string') {
      return res.status(400).json({ success: false, error: 'validerPar doit être une chaîne' });
    }

    // Ensure validation is a boolean
    const validationBool = Boolean(validation);
    const stringName = validerPar || admin.name; // Use provided or admin's name

    // Update the depense
    const depense = await prisma.depenseCaisse.update({
      where: { id: parseInt(id) },
      data: {
        validation: validationBool,
        validerPar: stringName,
      },
    });

    // Recalculate totals for the associated justifCaisse
    await recalculateAndUpdateTotals(depense.justifCaisseId);

    res.status(200).json({ success: true, validation: depense.validation, validerPar: depense.validerPar });
  } catch (error) {
    console.error('❌ Error updating depense:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la mise à jour de la dépense.' });
  }
};
export const validateAllDepenses = async (req, res) => {
  try {
    console.log('Request received for validateAllDepenses:', req.params);
    const { justifId } = req.params;
    const admin = req.session.user;

    // Admin role check
    if (!["grandadmin"].includes(admin.role)) {
      return res.status(403).json({ success: false, error: 'Accès refusé — réservé à l’administrateur.' });
    }

    if (!justifId) {
      console.log('Missing justifId in params');
      return res.status(400).json({ success: false, error: 'justifId est requis' });
    }
    if (!admin || !admin.name) {
      console.log('Missing admin or admin.name:', admin);
      return res.status(401).json({ success: false, error: 'Utilisateur non authentifié ou nom manquant' });
    }

    console.log(`Updating expenses for justifId: ${justifId}, admin: ${admin.name}`);
    // Update all expenses: set validation to true and validerPar
    const depenses = await prisma.depenseCaisse.updateMany({
      where: { justifCaisseId: parseInt(justifId) },
      data: {
        validation: true,
        validerPar: admin.name,
      },
    });

    console.log(`Update result: ${depenses.count} expenses updated`);
    if (depenses.count === 0) {
      return res.status(404).json({ success: false, error: 'Aucune dépense trouvée pour ce justifId' });
    }

    // Recalculate totals using helper
    const { totalRecettes, totalDepenses, soldeFinal } = await recalculateAndUpdateTotals(parseInt(justifId));

    res.status(200).json({ 
      success: true, 
      validerPar: admin.name,
      message: `${depenses.count} dépense(s) validée(s)`,
      totals: { totalRecettes, totalDepenses, soldeFinal }
    });
  } catch (error) {
    console.error('❌ Error validating depenses:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la validation des dépenses.' });
  }
};