import prisma from "../db.js"
import PDFDocument from "pdfkit";
import fs from "fs";
import path, { parse } from 'path';
import { fileURLToPath } from 'url';
import { PassThrough } from "stream";
import { whatsappService } from "../services/whatssapservice.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import ExcelJS from 'exceljs';
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

  // Sum depenses where validation === true
  const depensesSum = await prisma.depenseCaisse.aggregate({
    _sum: { montantJustifie: true, montantNonJustifie: true },
    where: { justifCaisseId, validation: true }, // Only validated depenses
  });
  const totalDepenses = (depensesSum._sum.montantJustifie ?? 0) + (depensesSum._sum.montantNonJustifie ?? 0);

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
    const chantierIdRaw = req.query.chantierId ?? req.body?.chantierId;
    const chantierId = chantierIdRaw ? parseInt(chantierIdRaw) : NaN;
    if (!user || !user.name || !chantierIdRaw || Number.isNaN(chantierId)) {
      console.error("User session invalid:", req.session.user);
      return res
        .status(403)
        .render("error", { error: "Utilisateur non authentifié ou données manquantes" });
    }

    const lastJustif = await prisma.justifCaisse.findFirst({
      where: { userId: user.id, chantierId },
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
    const designation = `Justif.Caisse ${nextMonth} ${nextYear}`;

    const chantier = await prisma.chantier.findUnique({
      where: { id: chantierId },
    });

    if (!chantier) {
      console.error("Chantier not found for ID:", chantierId);
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
      user: { ...user, role: user.role, recettes: [], depenses: [] },
      chantier,
      justifCaisse: defaultJustifCaisse,
      designation,
    });
  } catch (error) {
    console.error("Error in createJustifCaisse:", error);
    try {
      res.status(500).render("error", { error: "Erreur lors du chargement de la page" });
    } catch {
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
    const chantierId = parseInt(req.body.chantierId);
    if (!chantierId || Number.isNaN(chantierId)) {
      return res.status(400).json({ success: false, error: "chantierId manquant ou invalide" });
    }

    // Get the last JustifCaisse for this user + chantier
    const last = await prisma.justifCaisse.findFirst({
      where: { userId: user.id, chantierId: chantierId },
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
    const soldePrecedent = await getPreviousSolde(user.id, chantierId, nextMois, nextAnnee);

    // Create the new record
    const justifCaisse = await prisma.justifCaisse.create({
      data: {
        mois: nextMois,
        annee: nextAnnee,
        designation,
        soldePrecedent,
        userId: user.id,
        chantierId: chantierId,
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
    if (!recette) {
      return res.status(403).json({ success: false, error: "Aucune Caisse" });
    }

    await prisma.recetteCaisse.delete({ where: { id: parseInt(id) } });

    // Update totals using helper
    const { totalRecettes, totalDepenses, soldeFinal } = await recalculateAndUpdateTotals(recette.justifCaisseId);

    res.json({
      success: true,
      totals: { totalRecettes, totalDepenses, soldeFinal }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create/Update depenses
export const createOrUpdateDepenses = async (req, res) => {
  try {
    const { responsable, chantier, designation, items } = req.body;
    const user = req.session.user;

    if (!user || user.name !== responsable) {
      return res.status(403).json({
        success: false,
        error: "Utilisateur non autorisé",
      });
    }

    const chantierRecord = await prisma.chantier.findFirst({
      where: { nom: chantier },
    });

    if (!chantierRecord) {
      return res.status(400).json({
        success: false,
        error: "Chantier invalide",
      });
    }

    const [moisStr, anneeStr] = designation.split("-");

    const moisIndex = [
      "Janvier","Février","Mars","Avril","Mai","Juin",
      "Juillet","Août","Septembre","Octobre","Novembre","Décembre"
    ].indexOf(moisStr);

    if (moisIndex === -1) {
      return res.status(400).json({
        success: false,
        error: "Mois invalide",
      });
    }

    const mois = moisIndex + 1;
    const annee = parseInt(anneeStr);

    let justifCaisse = await prisma.justifCaisse.findFirst({
      where: {
        userId: user.id,
        chantierId: chantierRecord.id,
        mois,
        annee,
      },
    });

    if (!justifCaisse) {
      const soldePrecedent = await getPreviousSolde(
        user.id,
        chantierRecord.id,
        mois,
        annee
      );

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

    const changeLogs = [];

    for (const item of items) {

      const data = {
        dateDepense: new Date(item.date),
        numeroPiece: item.numeroPiece,
        imputation: item.imputation,
        natureDepense: item.natureDepense,
        montantJustifie: parseFloat(item.montantJustifie) || 0,
        montantNonJustifie: parseFloat(item.montantNonJustifie) || 0,
        validation: true,
        justifCaisseId: justifCaisse.id,
      };

      if (item._id) {

        const existing = await prisma.depenseCaisse.findUnique({
          where: { id: parseInt(item._id) },
        });

        const changes = [];

        if (
          existing.dateDepense.getTime() !== data.dateDepense.getTime()
        ) {
          changes.push(
            `Date: ${existing.dateDepense.toLocaleDateString("fr-FR")} → ${data.dateDepense.toLocaleDateString("fr-FR")}`
          );
        }

        if (existing.numeroPiece !== data.numeroPiece) {
          changes.push(
            `NumeroPiece: ${existing.numeroPiece} → ${data.numeroPiece}`
          );
        }

        if (existing.imputation !== data.imputation) {
          changes.push(
            `Imputation: ${existing.imputation} → ${data.imputation}`
          );
        }

        if (existing.natureDepense !== data.natureDepense) {
          changes.push(
            `Nature: ${existing.natureDepense} → ${data.natureDepense}`
          );
        }

        if (existing.montantJustifie !== data.montantJustifie) {
          changes.push(
            `MontantJustifie: ${existing.montantJustifie} → ${data.montantJustifie}`
          );
        }

        if (existing.montantNonJustifie !== data.montantNonJustifie) {
          changes.push(
            `MontantNonJustifie: ${existing.montantNonJustifie} → ${data.montantNonJustifie}`
          );
        }

        await prisma.depenseCaisse.update({
          where: { id: parseInt(item._id) },
          data,
        });

        if (changes.length > 0) {
          changeLogs.push(
            `✏️ Modification ligne ${item._id}\n${changes.join("\n")}`
          );
        }

      } else {

        const created = await prisma.depenseCaisse.create({
          data,
        });

        changeLogs.push(
          `➕ Nouvelle dépense ajoutée
NumeroPiece: ${created.numeroPiece}
Date: ${created.dateDepense.toLocaleDateString("fr-FR")}
MontantJustifie: ${created.montantJustifie}
MontantNonJustifie: ${created.montantNonJustifie}`
        );
      }
    }

    const { totalRecettes, totalDepenses, soldeFinal } =
      await recalculateAndUpdateTotals(justifCaisse.id);

    /*
      SEND ONE WHATSAPP NOTIFICATION
    */

    if (changeLogs.length > 0) {

      (async () => {
        try {

          const recipients =
            await prisma.whatsAppNotificationRecipient.findMany({
              where: {
                active: true,
                notifyJustiffecaisse: true,
              },
              select: { phone: true },
            });

          const numbers = recipients
            .map((r) => r.phone)
            .filter(Boolean);

          if (!numbers.length) return;

          const message = `📢 Justification de caisse mise à jour

Utilisateur: ${user.name}
Chantier: ${chantierRecord.nom}
Date: ${new Date().toLocaleDateString("fr-FR")}

Changements:
${changeLogs.join("\n\n")}
`;

          const pdfBuffer =
            await generateJustifCaissePDFBuffer(
              justifCaisse.id
            );

          const filename = `JustifCaisse_${justifCaisse.id}.pdf`;

          await Promise.allSettled(
            numbers.map((number) =>
              whatsappService.sendMessage(number, message, {
                data: pdfBuffer,
                filename,
                mimetype: "application/pdf",
              })
            )
          );

        } catch (err) {
          console.error(
            "WhatsApp notification failed:",
            err
          );
        }
      })();
    }

    res.json({
      success: true,
      totals: {
        totalRecettes,
        totalDepenses,
        soldeFinal,
      },
    });

  } catch (error) {

    console.error(
      "Error in createOrUpdateDepenses:",
      error
    );

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
// Delete depense
export const deleteDepense = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.session.user;
    const depense = await prisma.depenseCaisse.findUnique({ where: { id: parseInt(id) } });
    if (!depense || depense.userId !== user.id) {
      return res.status(403).json({ success: false, error: 'Accès refusé — vous n\'êtes pas autorisé à supprimer cette dépense.' });
    }

    await prisma.depenseCaisse.delete({ where: { id: parseInt(id) } });

    // Recalculate totals using helper
    const { totalRecettes, totalDepenses, soldeFinal } = await recalculateAndUpdateTotals(depense.justifCaisseId);

    res.json({
      success: true,
      totals: { totalRecettes, totalDepenses, soldeFinal }
    });
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
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
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
          validation: true, // Default to true as per your logic
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
    const { totalRecettes, totalDepenses, soldeFinal } = await recalculateAndUpdateTotals(justifCaisse.id);

    res.json({
      success: true,
      totals: { totalRecettes, totalDepenses, soldeFinal }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Fetch all justifCaisse
export const getAllJustifCaisse = async (req, res) => {
  try {

    const justifCaisse = await prisma.justifCaisse.findMany({
      where: { userId: req.session.user.id, chantierId: parseInt(req.params.chantierId) },
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
    const lastDesignation = await prisma.justifCaisse.findFirst({
      where: { userId: req.session.user.id, chantierId: parseInt(req.params.chantierId) },
      select: {
        designation: true,
      },
      orderBy: [
        { annee: "desc" },
        { mois: "desc" },
      ],
    });
    const chantier = await prisma.chantier.findUnique({
      where: { id: parseInt(req.params.chantierId) },
    });
    const userId = req.session.user.id;
    res.render("dashboard/achats/caisse/justifecaisse/index", {
      justifCaisse,
      lastDesignation,
      chantier: chantier.id,
      userId
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
};

export const adminUserList = async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.render("dashboard/achats/caisse/justifecaisse/userlist", {
      users,
      justifs: [],
      chantiers: [],
      selectedUserId: null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const justifeCaisseListUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    if (!userId || isNaN(userId)) {
      return res.status(400).render("error", { error: "ID utilisateur invalide" });
    }

    const justifCaisse = await prisma.justifCaisse.findMany({
      where: { userId },
      select: {
        id: true,
        mois: true,
        annee: true,
        designation: true,
        soldePrecedent: true,
        soldeFinal: true,
        totalDepenses: true,
        totalRecettes: true,
        chantier: { select: { id: true, nom: true } },
        user: { select: { id: true, name: true } },
      },
      orderBy: [
        { annee: "desc" },
        { mois: "desc" },
      ],
    });

    const lastDesignation = await prisma.justifCaisse.findFirst({
      where: { userId },
      select: {
        designation: true,
      },
      orderBy: [
        { annee: "desc" },
        { mois: "desc" },
      ],
    });
    // Get all chantiers for filter dropdown
    const chantiers = await prisma.chantier.findMany();
    console.log('Chantiers found:', chantiers.length);

    res.render("dashboard/achats/caisse/justifecaisse/listjustife", {
      justifCaisse,
      lastDesignation,
      userId,
      chantiers,
    });
  } catch (error) {
    console.error("Error in justifeCaisseListUser:", error);
    res.status(500).render("error", { error: "Erreur lors du chargement des justifications de caisse" });
  }
};

// Controller


// Controller
export const createJustifCaisseAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const chantierIdRaw = req.query?.chantierId ?? req.body?.chantierId;
    const chantierId = chantierIdRaw !== undefined && chantierIdRaw !== null && chantierIdRaw !== "" ? parseInt(chantierIdRaw) : NaN;

    // Fetch the user
    const userRecord = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });

    if (!userRecord || !userRecord.name) {
      console.error("User invalid or missing data:", userRecord);
      return res
        .status(403)
        .render("error", { error: "Utilisateur non authentifié ou données manquantes" });
    }

    // Find the last Justif for this user and the selected chantier (if provided)
    const lastJustif = (!Number.isNaN(chantierId))
      ? await prisma.justifCaisse.findFirst({
        where: {
          userId: parseInt(userId),
          chantierId,
        },
        orderBy: { id: "desc" },
        select: { designation: true },
      })
      : null;

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


    const chantiers = await prisma.chantier.findMany();

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
      chantiers,
      justifCaisse: defaultJustifCaisse,
      designation,
      chantierId: !Number.isNaN(chantierId) ? chantierId : null,
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

    // --- Validate userId ---
    const parsedUserId = parseInt(userId, 10);
    if (isNaN(parsedUserId)) {
      return res.status(400).render("error", { error: "ID utilisateur invalide" });
    }

    // --- Validate id (if not 'new') ---
    let parsedId = null;
    if (id !== "new") {
      parsedId = parseInt(id, 10);
      if (isNaN(parsedId)) {
        return res.status(400).render("error", { error: "ID justification invalide" });
      }
    }

    const admin = req.session.user;

    // --- Verify admin ---
    if (!["admin", "grandadmin"].includes(admin.role)) {
      return res.status(403).render("error", { error: "Accès refusé — réservé à l’administrateur." });
    }

    // --- Fetch the user ---
    const user = await prisma.user.findUnique({ where: { id: parsedUserId } });
    if (!user) {
      return res.status(404).render("error", { error: "Utilisateur non trouvé" });
    }

    const months = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];

    let justifCaisse = null;
    let formattedRecettes = [], formattedDepenses = [], designation = "";

    if (id === "new") {
      // --- Handle new justification creation ---
      const lastJustif = await prisma.justifCaisse.findFirst({
        where: {
          userId: parsedUserId,
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
        soldePrecedent: await getPreviousSolde(parsedUserId, user.chantierId, months.indexOf(nextMonth) + 1, nextYear),
        totalRecettes: 0,
        totalDepenses: 0,
        soldeFinal: 0,
        mois: months.indexOf(nextMonth) + 1,
        annee: nextYear,
        designation,
      };

    } else {
      // --- Fetch existing justification ---
      justifCaisse = await prisma.justifCaisse.findUnique({
        where: { id: parsedId },
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

      // --- Recalculate totals to ensure accuracy ---
      const { totalRecettes, totalDepenses, soldeFinal } = await recalculateAndUpdateTotals(justifCaisse.id);

      justifCaisse.totalRecettes = totalRecettes;
      justifCaisse.totalDepenses = totalDepenses;
      justifCaisse.soldeFinal = soldeFinal;

      // --- Format for frontend ---
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

    // --- Fetch chantiers ---
    const chantiers = await prisma.chantier.findMany();

    res.render("dashboard/achats/caisse/justifecaisse/adminpart", {
      user: { ...user, recettes: formattedRecettes, depenses: formattedDepenses },
      justifCaisse,
      chantiers,
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
    const { responsable, chantierId, designation, items, justifId, soldePrecedent } = req.body;
    const admin = req.session.user;

    const parsedSoldePrecedent =
      soldePrecedent !== undefined && soldePrecedent !== null && soldePrecedent !== ""
        ? parseFloat(soldePrecedent)
        : null;

    if (parsedSoldePrecedent !== null && (Number.isNaN(parsedSoldePrecedent) || parsedSoldePrecedent < 0)) {
      return res.status(400).json({ success: false, error: "Solde précédent invalide." });
    }

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
    const chantier = await prisma.chantier.findUnique({ where: { id: parseInt(chantierId) } });
    if (!chantier) {
      return res.status(404).json({ success: false, error: 'Chantier non trouvé.' });
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
        chantierId: chantier.id,
        mois,
        annee,
      },
    });

    if (!justifCaisse) {
      let finalSoldePrecedent;
      if (parsedSoldePrecedent !== null) {
        finalSoldePrecedent = parsedSoldePrecedent;
      } else {
        finalSoldePrecedent = await getPreviousSolde(parseInt(userId), chantier.id, mois, annee);
      }

      justifCaisse = await prisma.justifCaisse.create({
        data: {
          mois,
          annee,
          designation: `${moisStr}-${annee}`,
          soldePrecedent: finalSoldePrecedent,
          userId: parseInt(userId),
          chantierId: parseInt(chantierId),
        },
      });
    } else if (id !== "new" && justifId && parseInt(justifId) !== justifCaisse.id) {
      return res.status(400).json({ success: false, error: 'justifId ne correspond pas à la justification existante.' });
    }

    if (justifCaisse && parsedSoldePrecedent !== null) {
      justifCaisse = await prisma.justifCaisse.update({
        where: { id: justifCaisse.id },
        data: { soldePrecedent: parsedSoldePrecedent },
      });
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

export const updateSoldePrecedentAdmin = async (req, res) => {
  try {
    const { userId, id } = req.params;
    const { chantierId, designation, justifId, soldePrecedent } = req.body;
    const admin = req.session.user;

    const parsedSoldePrecedent =
      soldePrecedent !== undefined && soldePrecedent !== null && soldePrecedent !== ""
        ? parseFloat(soldePrecedent)
        : null;

    if (parsedSoldePrecedent === null || Number.isNaN(parsedSoldePrecedent) || parsedSoldePrecedent < 0) {
      return res.status(400).json({ success: false, error: "Solde précédent invalide." });
    }

    if (!["admin", "grandadmin"].includes(admin.role)) {
      return res.status(403).json({ success: false, error: "Accès refusé — réservé à l’administrateur." });
    }

    const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
    if (!user) {
      return res.status(404).json({ success: false, error: "Utilisateur non trouvé." });
    }

    if (!chantierId || !designation) {
      return res.status(400).json({ success: false, error: "Données manquantes ou invalides." });
    }

    const chantierRecord = await prisma.chantier.findFirst({ where: { id: parseInt(chantierId) } });
    if (!chantierRecord) {
      return res.status(400).json({ success: false, error: "Chantier invalide." });
    }

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
    if (moisIndex === -1 || !anneeStr || Number.isNaN(parseInt(anneeStr))) {
      return res.status(400).json({ success: false, error: "Designation invalide." });
    }
    const mois = moisIndex + 1;
    const annee = parseInt(anneeStr);

    let justifCaisse = await prisma.justifCaisse.findFirst({
      where: {
        userId: parseInt(userId),
        chantierId: parseInt(chantierId),
        mois,
        annee,
      },
    });

    if (!justifCaisse) {
      justifCaisse = await prisma.justifCaisse.create({
        data: {
          mois,
          annee,
          designation: `${moisStr}-${annee}`,
          soldePrecedent: parsedSoldePrecedent,
          userId: parseInt(userId),
          chantierId: parseInt(chantierId),
        },
      });
    } else if (id !== "new" && justifId && parseInt(justifId) !== justifCaisse.id) {
      return res.status(400).json({ success: false, error: "justifId ne correspond pas à la justification existante." });
    }

    justifCaisse = await prisma.justifCaisse.update({
      where: { id: justifCaisse.id },
      data: {
        soldePrecedent: parsedSoldePrecedent,
        designation: `${moisStr}-${annee}`,
      },
    });

    const { totalRecettes, totalDepenses, soldeFinal } = await recalculateAndUpdateTotals(justifCaisse.id);

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
    console.error("Error in updateSoldePrecedentAdmin:", error);
    return res.status(500).json({ success: false, error: "Erreur lors de la mise à jour du solde précédent." });
  }
};

export const addJustifCaisseAdminAuto = async (req, res) => {
  try {
    const { userId } = req.params;
    const admin = req.session.user;
    const chantierIdRaw = req.body?.chantierId ?? req.query?.chantierId;
    const chantierId = chantierIdRaw ? parseInt(chantierIdRaw, 10) : NaN;

    // Verify admin role
    if (!["admin", "grandadmin"].includes(admin.role)) {
      return res.status(403).json({ success: false, error: 'Accès refusé — réservé à l’administrateur.' });
    }

    // Validate userId
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utilisateur non trouvé.' });
    }
    if (!chantierIdRaw || Number.isNaN(chantierId)) {
      return res.status(400).json({ success: false, error: 'chantierId manquant ou invalide.' });
    }

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



export const addJustifCaisseUserFirstTime = async (req, res) => {
  try {
    const userId = parseInt(req.body.userId);
    const chantierId = parseInt(req.body.chantierId);
    const mois = parseInt(req.body.mois);


    // Validate userId
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utilisateur non trouvé.' });
    }
    if (!chantierId || Number.isNaN(chantierId)) {
      return res.status(400).json({ success: false, error: 'chantierId manquant ou invalide.' });
    }

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
      nextMois = mois;
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

    if (validation === undefined) {
      return res.status(400).json({ success: false, error: 'Le champ validation est requis' });
    }
    if (validerPar && typeof validerPar !== 'string') {
      return res.status(400).json({ success: false, error: 'validerPar doit être une chaîne' });
    }

    // Ensure validation is a boolean (true/false) as expected by Prisma
    const validationBool = Boolean(validation);
    const stringName = admin.name;
    const depense = await prisma.depenseCaisse.update({
      where: { id: parseInt(id) },
      data: {
        validation: validationBool,
        validerPar: stringName,
      },
    });

    // Recalculate totals using helper
    const { totalRecettes, totalDepenses, soldeFinal } = await recalculateAndUpdateTotals(depense.justifCaisseId);

    res.status(200).json({
      success: true,
      validation: depense.validation,
      validerPar: depense.validerPar,
      totals: { totalRecettes, totalDepenses, soldeFinal }
    });
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

    if (!justifId) {
      console.log('Missing justifId in params');
      return res.status(400).json({ success: false, error: 'justifId est requis' });
    }
    if (!admin || !admin.name) {
      console.log('Missing admin or admin.name:', admin);
      return res.status(401).json({ success: false, error: 'Utilisateur non authentifié ou nom manquant' });
    }

    console.log(`Updating expenses for justifId: ${justifId}, admin: ${admin.name}`);
    // Update all expenses for the given justifId
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

export const generateJustifCaissePDF = async (req, res) => {
  const { id } = req.params;
  const user = req.session.user;

  if (!user) return res.sendStatus(403);

  const justif = await prisma.justifCaisse.findUnique({
    where: { id: Number(id) },
    include: {
      recettes: true,
      depenses: true,
      user: { select: { name: true } },
      chantier: { select: { nom: true } },
    },
  });

  if (!justif) return res.sendStatus(404);
  if (justif.userId !== user.id && !["admin", "grandadmin"].includes(user.role))
    return res.sendStatus(403);

  const doc = new PDFDocument({ size: "A4", margin: 40, bufferPages: true });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=JustifCaisse_${id}.pdf`
  );
  doc.pipe(res);

  const PAGE_WIDTH = 595.28;
  const PAGE_HEIGHT = 841.89;
  const MARGIN = 40;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
  const FOOTER_HEIGHT = 70;

  const getPageBottomY = () => PAGE_HEIGHT - MARGIN - FOOTER_HEIGHT;

  const ensureSpace = (currentY, neededHeight, onNewPage) => {
    if (currentY + neededHeight <= getPageBottomY()) return currentY;
    doc.addPage();
    drawHeader();
    return onNewPage();
  };

  const drawHeader = () => {
    const logo = path.join(process.cwd(), "public/img/logo-4.png");
    if (fs.existsSync(logo)) doc.image(logo, MARGIN, 30, { width: 90 });

    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor("#000")
      .text("JUSTIFICATIFS DE CAISSE", 0, 40, { align: "center" });

    doc
      .fontSize(9)
      .fillColor("#000")
      .text(`N° : J-${justif.id}`, PAGE_WIDTH - 160, 40)
      .text(`Date : ${new Date().toLocaleDateString("fr-FR")}`, PAGE_WIDTH - 160, 55);
  };

  const drawInfoBox = (yPosition) => {
    let y = yPosition || 110;
    doc.rect(MARGIN, y, CONTENT_WIDTH, 90).stroke();

    doc.font("Helvetica-Bold").text("Informations", MARGIN + 5, y + 5);
    doc.font("Helvetica").fontSize(10);

    doc.text(`Responsable : ${justif.user?.name ?? "-"}`, MARGIN + 10, y + 25);
    doc.text(`Chantier : ${justif.chantier?.nom ?? "-"}`, MARGIN + 10, y + 40);
    doc.text(`Mois : ${justif.designation ?? "-"}`, PAGE_WIDTH / 2, y + 25);
    doc.text(
      `Solde Précédent : ${Number(justif.soldePrecedent).toFixed(2)} MAD`,
      MARGIN + 10,
      y + 55
    );
    doc.text(
      `Solde Final : ${Number(justif.soldeFinal).toFixed(2)} MAD`,
      PAGE_WIDTH / 2,
      y + 55
    );
    return y + 105;
  };

  const drawFooter = (yPosition) => {
    const fy = yPosition || (PAGE_HEIGHT - MARGIN - FOOTER_HEIGHT);
    doc.rect(0, fy, PAGE_WIDTH, FOOTER_HEIGHT).fill("#8B0000");

    doc
      .fillColor("#fff")
      .fontSize(8)
      .text(
        "82, angle Bd Abdelmoumen et rue Soumaya, Casablanca — Tél 0522-23-39-70",
        0,
        fy + 20,
        { align: "center", width: PAGE_WIDTH }
      );
    doc.text(
      "Fax: 0522-23-42-60 | Capital: 18 500 000 DH | ICE: 001526422000063",
      0,
      fy + 35,
      { align: "center", width: PAGE_WIDTH }
    );
  };

  const drawRecettesTable = (yPosition) => {
    if (!justif.recettes || justif.recettes.length === 0) return yPosition;

    const cols = [
      { label: "Date", w: 100 },
      { label: "Source", w: 250 },
      { label: "Montant", w: 100 },
    ];

    const minRowH = 22;
    const tableX = MARGIN;

    const getRowHeight = (values) => {
      doc.font("Helvetica").fontSize(9);
      let maxHeight = minRowH;
      cols.forEach((c, i) => {
        const text = values[i] ?? "";
        const textHeight = doc.heightOfString(String(text), {
          width: c.w - 8,
          align: i === 2 ? "right" : "left",
        });
        maxHeight = Math.max(maxHeight, textHeight + 12);
      });
      return maxHeight;
    };

    const drawRow = (yy, values, bold = false) => {
      let x = tableX;
      doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(9);

      let maxHeight = minRowH;
      cols.forEach((c, i) => {
        const textHeight = doc.heightOfString(values[i] || "", {
          width: c.w - 8,
          align: i === 2 ? "right" : "left",
        });
        maxHeight = Math.max(maxHeight, textHeight + 12);
      });

      cols.forEach((c, i) => {
        doc.rect(x, yy, c.w, maxHeight).stroke();
        doc.text(values[i], x + 4, yy + 6, {
          width: c.w - 8,
          align: i === 2 ? "right" : "left",
        });
        x += c.w;
      });

      return maxHeight;
    };

    doc.font("Helvetica-Bold").fontSize(12).fillColor("#000")
      .text("RECETTES", MARGIN, yPosition);
    yPosition += 25;

    const headerValues = cols.map(c => c.label);
    const headerHeightMeasured = getRowHeight(headerValues);
    yPosition = ensureSpace(yPosition, headerHeightMeasured, () => (MARGIN + 80));
    const headerHeight = drawRow(yPosition, headerValues, true);
    yPosition += headerHeight;

    let totalRecettes = 0;
    justif.recettes.forEach(r => {
      totalRecettes += Number(r.montant ?? 0);
      const rowValues = [
        new Date(r.dateRecette).toLocaleDateString("fr-FR"),
        r.source ?? "",
        Number(r.montant ?? 0).toFixed(2),
      ];
      const rowHeightMeasured = getRowHeight(rowValues);
      yPosition = ensureSpace(yPosition, rowHeightMeasured, () => {
        const startY = MARGIN + 80;
        doc.font("Helvetica-Bold").fontSize(12).fillColor("#000")
          .text("RECETTES", MARGIN, startY);
        return startY + 25;
      });
      const rowHeight = drawRow(yPosition, rowValues);
      yPosition += rowHeight;
    });

    const totalValues = ["TOTAL", "", totalRecettes.toFixed(2)];
    const totalHeightMeasured = getRowHeight(totalValues);
    yPosition = ensureSpace(yPosition, totalHeightMeasured, () => {
      const startY = MARGIN + 80;
      doc.font("Helvetica-Bold").fontSize(12).fillColor("#000")
        .text("RECETTES", MARGIN, startY);
      return startY + 25;
    });
    const totalHeight = drawRow(yPosition, totalValues, true);
    yPosition += totalHeight + 20;

    return yPosition;
  };

  const drawDepensesTable = (yPosition) => {
    const cols = [
      { label: "Date", w: 70 },
      { label: "N° Pièce", w: 60 },
      { label: "Nature Dépense", w: 170 },
      { label: "Imputation", w: 70 },
      { label: "Justifié", w: 70 },
      { label: "Non Justifié", w: 70 },
    ];

    const minRowH = 22;
    const tableX = MARGIN;

    const drawRow = (yy, values, bold = false) => {
      let x = tableX;
      doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(9);

      let maxHeight = minRowH;
      cols.forEach((c, i) => {
        const textHeight = doc.heightOfString(values[i] || "", {
          width: c.w - 8,
          align: i >= 4 ? "right" : "left",
        });
        maxHeight = Math.max(maxHeight, textHeight + 12);
      });

      cols.forEach((c, i) => {
        doc.rect(x, yy, c.w, maxHeight).stroke();
        doc.text(values[i], x + 4, yy + 6, {
          width: c.w - 8,
          align: i >= 4 ? "right" : "left",
        });
        x += c.w;
      });

      return maxHeight;
    };

    const getRowHeight = (values) => {
      doc.font("Helvetica").fontSize(9);
      let maxHeight = minRowH;
      cols.forEach((c, i) => {
        const text = values[i] ?? "";
        const textHeight = doc.heightOfString(String(text), {
          width: c.w - 8,
          align: i >= 4 ? "right" : "left",
        });
        maxHeight = Math.max(maxHeight, textHeight + 12);
      });
      return maxHeight;
    };

    doc.font("Helvetica-Bold").fontSize(12).fillColor("#000")
      .text("DÉPENSES", MARGIN, yPosition);
    yPosition += 25;

    const headerHeight = drawRow(yPosition, cols.map(c => c.label), true);
    yPosition += headerHeight;

    return { yPosition, drawRow, cols, minRowH, getRowHeight };
  };

  // Main logic
  drawHeader();
  let currentY = drawInfoBox(110);

  // Recettes - Add recettes table if data exists
  if (justif.recettes && justif.recettes.length > 0) {
    currentY = drawRecettesTable(currentY);
  }

  // Depenses
  const depensesTable = drawDepensesTable(currentY);
  currentY = depensesTable.yPosition;

  let totalJ = 0;
  let totalNJ = 0;

  for (const d of justif.depenses) {
    totalJ += Number(d.montantJustifie ?? 0);
    totalNJ += Number(d.montantNonJustifie ?? 0);

    const rowValues = [
      new Date(d.dateDepense).toLocaleDateString("fr-FR"),
      d.numeroPiece ?? "",
      d.natureDepense ?? "",
      d.imputation ?? "",
      Number(d.montantJustifie ?? 0).toFixed(2),
      Number(d.montantNonJustifie ?? 0).toFixed(2),
    ];

    const measured = depensesTable.getRowHeight(rowValues);
    currentY = ensureSpace(currentY, measured, () => {
      const startY = MARGIN + 80;
      return drawDepensesTable(startY).yPosition - 25;
    });

    const rowHeight = depensesTable.drawRow(currentY, rowValues);
    currentY += rowHeight;
  }

  // Empty rows
  for (let i = 0; i < 8; i++) {
    currentY = ensureSpace(currentY, depensesTable.minRowH, () => {
      const startY = MARGIN + 80;
      return drawDepensesTable(startY).yPosition - 25;
    });
    const rowHeight = depensesTable.drawRow(currentY, ["", "", "", "", "", ""]);
    currentY += rowHeight;
  }

  // Totals - ensure we have space for both rows
  const totalRowValues = ["TOTAL", "", "", "", totalJ.toFixed(2), totalNJ.toFixed(2)];
  const totalGeneralRowValues = ["TOTAL GÉNÉRAL", "", "", "", "", (totalJ + totalNJ).toFixed(2)];
  const totalsBlockHeight = depensesTable.getRowHeight(totalRowValues) + depensesTable.getRowHeight(totalGeneralRowValues);
  currentY = ensureSpace(currentY, totalsBlockHeight, () => (MARGIN + 80));

  const totalRowHeight = depensesTable.drawRow(currentY, totalRowValues, true);
  currentY += totalRowHeight;

  // General Total
  depensesTable.drawRow(currentY, totalGeneralRowValues, true);

  drawFooter();
  doc.end();
};

const generateJustifCaissePDFBuffer = async (id) => {
  const justif = await prisma.justifCaisse.findUnique({
    where: { id: Number(id) },
    include: {
      recettes: true,
      depenses: true,
      user: { select: { name: true } },
      chantier: { select: { nom: true } },
    },
  });

  if (!justif) throw new Error('Justification non trouvée');

  const chunks = [];
  const pass = new PassThrough();
  pass.on('data', (c) => chunks.push(c));
  const finished = new Promise((resolve, reject) => {
    pass.on('end', resolve);
    pass.on('error', reject);
  });

  const doc = new PDFDocument({ size: "A4", margin: 40, bufferPages: true });
  doc.pipe(pass);

  const PAGE_WIDTH = 595.28;
  const PAGE_HEIGHT = 841.89;
  const MARGIN = 40;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
  const FOOTER_HEIGHT = 70;

  const getPageBottomY = () => PAGE_HEIGHT - MARGIN - FOOTER_HEIGHT;

  const ensureSpace = (currentY, neededHeight, onNewPage) => {
    if (currentY + neededHeight <= getPageBottomY()) return currentY;
    doc.addPage();
    drawHeader();
    return onNewPage();
  };

  const drawHeader = () => {
    const logo = path.join(process.cwd(), "public/img/logo-4.png");
    if (fs.existsSync(logo)) doc.image(logo, MARGIN, 30, { width: 90 });

    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor("#000")
      .text("JUSTIFICATIFS DE CAISSE", 0, 40, { align: "center" });

    doc
      .fontSize(9)
      .fillColor("#000")
      .text(`N° : J-${justif.id}`, PAGE_WIDTH - 160, 40)
      .text(`Date : ${new Date().toLocaleDateString("fr-FR")}`, PAGE_WIDTH - 160, 55);
  };

  const drawInfoBox = (yPosition) => {
    let y = yPosition || 110;
    doc.rect(MARGIN, y, CONTENT_WIDTH, 90).stroke();

    doc.font("Helvetica-Bold").text("Informations", MARGIN + 5, y + 5);
    doc.font("Helvetica").fontSize(10);

    doc.text(`Responsable : ${justif.user?.name ?? "-"}`, MARGIN + 10, y + 25);
    doc.text(`Chantier : ${justif.chantier?.nom ?? "-"}`, MARGIN + 10, y + 40);
    doc.text(`Mois : ${justif.designation ?? "-"}`, PAGE_WIDTH / 2, y + 25);
    doc.text(
      `Solde Précédent : ${Number(justif.soldePrecedent).toFixed(2)} MAD`,
      MARGIN + 10,
      y + 55
    );
    doc.text(
      `Solde Final : ${Number(justif.soldeFinal).toFixed(2)} MAD`,
      PAGE_WIDTH / 2,
      y + 55
    );
    return y + 105;
  };

  const drawFooter = (yPosition) => {
    const fy = yPosition || (PAGE_HEIGHT - MARGIN - FOOTER_HEIGHT);
    doc.rect(0, fy, PAGE_WIDTH, FOOTER_HEIGHT).fill("#8B0000");

    doc
      .fillColor("#fff")
      .fontSize(8)
      .text(
        "82, angle Bd Abdelmoumen et rue Soumaya, Casablanca — Tél 0522-23-39-70",
        0,
        fy + 20,
        { align: "center", width: PAGE_WIDTH }
      );
    doc.text(
      "Fax: 0522-23-42-60 | Capital: 18 500 000 DH | ICE: 001526422000063",
      0,
      fy + 35,
      { align: "center", width: PAGE_WIDTH }
    );
  };

  const drawRecettesTable = (yPosition) => {
    if (!justif.recettes || justif.recettes.length === 0) return yPosition;

    const cols = [
      { label: "Date", w: 100 },
      { label: "Source", w: 250 },
      { label: "Montant", w: 100 },
    ];

    const minRowH = 22;
    const tableX = MARGIN;

    const getRowHeight = (values) => {
      doc.font("Helvetica").fontSize(9);
      let maxHeight = minRowH;
      cols.forEach((c, i) => {
        const text = values[i] ?? "";
        const textHeight = doc.heightOfString(String(text), {
          width: c.w - 8,
          align: i === 2 ? "right" : "left",
        });
        maxHeight = Math.max(maxHeight, textHeight + 12);
      });
      return maxHeight;
    };

    const drawRow = (yy, values, bold = false) => {
      let x = tableX;
      doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(9);

      let maxHeight = minRowH;
      cols.forEach((c, i) => {
        const textHeight = doc.heightOfString(values[i] || "", {
          width: c.w - 8,
          align: i === 2 ? "right" : "left",
        });
        maxHeight = Math.max(maxHeight, textHeight + 12);
      });

      cols.forEach((c, i) => {
        doc.rect(x, yy, c.w, maxHeight).stroke();
        doc.text(values[i], x + 4, yy + 6, {
          width: c.w - 8,
          align: i === 2 ? "right" : "left",
        });
        x += c.w;
      });

      return maxHeight;
    };

    doc.font("Helvetica-Bold").fontSize(12).fillColor("#000")
      .text("RECETTES", MARGIN, yPosition);
    yPosition += 25;

    const headerValues = cols.map(c => c.label);
    const headerHeightMeasured = getRowHeight(headerValues);
    yPosition = ensureSpace(yPosition, headerHeightMeasured, () => (MARGIN + 80));
    const headerHeight = drawRow(yPosition, headerValues, true);
    yPosition += headerHeight;

    let totalRecettes = 0;
    justif.recettes.forEach(r => {
      totalRecettes += Number(r.montant ?? 0);
      const rowValues = [
        new Date(r.dateRecette).toLocaleDateString("fr-FR"),
        r.source ?? "",
        Number(r.montant ?? 0).toFixed(2),
      ];
      const rowHeightMeasured = getRowHeight(rowValues);
      yPosition = ensureSpace(yPosition, rowHeightMeasured, () => {
        const startY = MARGIN + 80;
        doc.font("Helvetica-Bold").fontSize(12).fillColor("#000")
          .text("RECETTES", MARGIN, startY);
        return startY + 25;
      });
      const rowHeight = drawRow(yPosition, rowValues);
      yPosition += rowHeight;
    });

    const totalValues = ["TOTAL", "", totalRecettes.toFixed(2)];
    const totalHeightMeasured = getRowHeight(totalValues);
    yPosition = ensureSpace(yPosition, totalHeightMeasured, () => {
      const startY = MARGIN + 80;
      doc.font("Helvetica-Bold").fontSize(12).fillColor("#000")
        .text("RECETTES", MARGIN, startY);
      return startY + 25;
    });
    const totalHeight = drawRow(yPosition, totalValues, true);
    yPosition += totalHeight + 20;

    return yPosition;
  };

  const drawDepensesTable = (yPosition) => {
    const cols = [
      { label: "Date", w: 70 },
      { label: "N° Pièce", w: 60 },
      { label: "Nature Dépense", w: 170 },
      { label: "Imputation", w: 70 },
      { label: "Justifié", w: 70 },
      { label: "Non Justifié", w: 70 },
    ];

    const minRowH = 22;
    const tableX = MARGIN;

    const drawRow = (yy, values, bold = false) => {
      let x = tableX;
      doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(9);

      let maxHeight = minRowH;
      cols.forEach((c, i) => {
        const textHeight = doc.heightOfString(values[i] || "", {
          width: c.w - 8,
          align: i >= 4 ? "right" : "left",
        });
        maxHeight = Math.max(maxHeight, textHeight + 12);
      });

      cols.forEach((c, i) => {
        doc.rect(x, yy, c.w, maxHeight).stroke();
        doc.text(values[i], x + 4, yy + 6, {
          width: c.w - 8,
          align: i >= 4 ? "right" : "left",
        });
        x += c.w;
      });

      return maxHeight;
    };

    const getRowHeight = (values) => {
      doc.font("Helvetica").fontSize(9);
      let maxHeight = minRowH;
      cols.forEach((c, i) => {
        const text = values[i] ?? "";
        const textHeight = doc.heightOfString(String(text), {
          width: c.w - 8,
          align: i >= 4 ? "right" : "left",
        });
        maxHeight = Math.max(maxHeight, textHeight + 12);
      });
      return maxHeight;
    };

    doc.font("Helvetica-Bold").fontSize(12).fillColor("#000")
      .text("DÉPENSES", MARGIN, yPosition);
    yPosition += 25;

    const headerHeight = drawRow(yPosition, cols.map(c => c.label), true);
    yPosition += headerHeight;

    return { yPosition, drawRow, cols, minRowH, getRowHeight };
  };

  // Main logic
  drawHeader();
  let currentY = drawInfoBox(110);

  // Recettes - Add recettes table if data exists
  if (justif.recettes && justif.recettes.length > 0) {
    currentY = drawRecettesTable(currentY);
  }

  // Depenses
  const depensesTable = drawDepensesTable(currentY);
  currentY = depensesTable.yPosition;

  let totalJ = 0;
  let totalNJ = 0;

  for (const d of justif.depenses) {
    totalJ += Number(d.montantJustifie ?? 0);
    totalNJ += Number(d.montantNonJustifie ?? 0);

    const rowValues = [
      new Date(d.dateDepense).toLocaleDateString("fr-FR"),
      d.numeroPiece ?? "",
      d.natureDepense ?? "",
      d.imputation ?? "",
      Number(d.montantJustifie ?? 0).toFixed(2),
      Number(d.montantNonJustifie ?? 0).toFixed(2),
    ];

    const measured = depensesTable.getRowHeight(rowValues);
    currentY = ensureSpace(currentY, measured, () => {
      const startY = MARGIN + 80;
      return drawDepensesTable(startY).yPosition - 25;
    });

    const rowHeight = depensesTable.drawRow(currentY, rowValues);
    currentY += rowHeight;
  }

  // Empty rows
  for (let i = 0; i < 8; i++) {
    currentY = ensureSpace(currentY, depensesTable.minRowH, () => {
      const startY = MARGIN + 80;
      return drawDepensesTable(startY).yPosition - 25;
    });
    const rowHeight = depensesTable.drawRow(currentY, ["", "", "", "", "", ""]);
    currentY += rowHeight;
  }

  // Totals - ensure we have space for both rows
  const totalRowValues = ["TOTAL", "", "", "", totalJ.toFixed(2), totalNJ.toFixed(2)];
  const totalGeneralRowValues = ["TOTAL GÉNÉRAL", "", "", "", "", (totalJ + totalNJ).toFixed(2)];
  const totalsBlockHeight = depensesTable.getRowHeight(totalRowValues) + depensesTable.getRowHeight(totalGeneralRowValues);
  currentY = ensureSpace(currentY, totalsBlockHeight, () => (MARGIN + 80));

  const totalRowHeight = depensesTable.drawRow(currentY, totalRowValues, true);
  currentY += totalRowHeight;

  // General Total
  depensesTable.drawRow(currentY, totalGeneralRowValues, true);

  drawFooter();
  doc.end();

  await finished;
  return Buffer.concat(chunks);
};

export const generateJustifCaisseExcel = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.session.user;

    if (!user) return res.status(403).json({ success: false, error: "Utilisateur non authentifié" });

    const justifCaisse = await prisma.justifCaisse.findUnique({
      where: { id: parseInt(id) },
      include: {
        recettes: true,
        depenses: true,
        user: { select: { name: true } },
        chantier: { select: { nom: true } },
      },
    });

    if (!justifCaisse) return res.status(404).json({ success: false, error: "Justification non trouvée" });

    if (justifCaisse.userId !== user.id && !["admin", "grandadmin"].includes(user.role))
      return res.status(403).json({ success: false, error: "Accès refusé" });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Dépenses');

    // ===== HEADER =====
    sheet.mergeCells('A1', 'F1');
    sheet.getCell('A1').value = `Justification Caisse: ${justifCaisse.designation}`;
    sheet.getCell('A1').font = { bold: true, size: 14 };
    sheet.getCell('A1').alignment = { horizontal: 'center' };

    sheet.addRow([]);
    sheet.addRow(['Chantier', justifCaisse.chantier?.nom || '-', 'Responsable', justifCaisse.user?.name || '-', 'Mois', justifCaisse.designation.split(' ').slice(-2).join(' ')]);
    sheet.addRow([]);

    // ===== TABLE HEADER =====
    const headers = ['Date', 'N° Piece', 'Nature de la Dépense', 'Imputation', 'Justifié', 'Non Justifié'];
    const headerRow = sheet.addRow(headers);

    // Style headers
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFA52A2A' }
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // ===== DATA ROWS =====
    justifCaisse.depenses.forEach(depense => {
      const row = sheet.addRow([
        new Date(depense.dateDepense).toLocaleDateString('fr-FR'),
        depense.numeroPiece || '-',
        depense.natureDepense || '-',
        depense.imputation || '-',
        Number(depense.montantJustifie ?? 0),
        Number(depense.montantNonJustifie ?? 0),
      ]);

      const fillColor = sheet.lastRow.number % 2 === 0 ? 'FFF9F9F9' : 'FFFFFFFF';
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: fillColor }
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // ===== TOTALS ROW =====
    const totalJustifie = justifCaisse.depenses.reduce((sum, d) => sum + Number(d.montantJustifie ?? 0), 0);
    const totalNonJustifie = justifCaisse.depenses.reduce((sum, d) => sum + Number(d.montantNonJustifie ?? 0), 0);
    const totalRow = sheet.addRow(['TOTAL', '', '', '', totalJustifie, totalNonJustifie]);
    totalRow.font = { bold: true };
    totalRow.alignment = { horizontal: 'right' };
    totalRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    sheet.columns.forEach(col => { col.width = 20; });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=JustifCaisse-${justifCaisse.designation}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error("Erreur lors de la génération de l'Excel :", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const listChantierUser = async (req, res) => {
  const user = req.session.user;
  const chantiers = await prisma.chantier.findMany();
  res.render('dashboard/achats/caisse/justifecaisse/chantierlist', { chantiers })
}