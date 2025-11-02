import prisma from "../db.js";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import ExcelJS from "exceljs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ------------------------------------------------------------------ */
/*  INDEX – list all demands (En Attente first)                       */
/* ------------------------------------------------------------------ */
export const indexDemandeFourniture = async (req, res) => {
  const demande = await prisma.demandeFourniture.findMany({
    include: { user: true, items: true, chantier: true },
    orderBy: { id: "desc" },
    
  });

  // “En Attente” first
  const sortedDemande = demande.sort((a, b) => {
    if (a.status === "En Attente" && b.status !== "En Attente") return -1;
    if (a.status !== "En Attente" && b.status === "En Attente") return 1;
    return 0;
  });

  const users = await prisma.user.findMany({ where: { role: "user" } });
  const chantiers = await prisma.chantier.findMany();


  res.render("dashboard/achats/fourniture/index", { demande: sortedDemande, users , chantiers});
};

/* ------------------------------------------------------------------ */
/*  CREATE – show empty form                                          */
/* ------------------------------------------------------------------ */
export const createDemandeFourniture = async (req, res) => {
  const demandeFourniture = await prisma.demandeFourniture.findMany({
    where: { user: { id: req.session.user.id } },
  });

  const lastNumero = demandeFourniture.length
    ? demandeFourniture[demandeFourniture.length - 1].numero
    : 0;

  const numero = lastNumero + 1;

  const user = await prisma.user.findUnique({
    where: { id: req.session.user.id },
    include: { chantier: true },
  });

  const today = new Date().toLocaleDateString("fr-FR");

  res.render("dashboard/achats/fourniture/create", { user, today, numero });
};

/* ------------------------------------------------------------------ */
/*  STORE – create new demand + items                                 */
/* ------------------------------------------------------------------ */
export const storeDemandeFourniture = async (req, res) => {
  try {
    const { date, numero, items } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.session.user.id },
      include: { chantier: true },
    });

    if (!user?.chantierId) {
      return res
        .status(400)
        .json({ success: false, error: "Utilisateur ou chantier non trouvé." });
    }

    // ---- validation -------------------------------------------------
    if (!Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "Les items doivent être un tableau non vide." });
    }

    for (const [i, it] of items.entries()) {
      const designation = (it.designation || "").trim();
      const quantité = parseInt(it.quantité || it.qteDemandee, 10);

      if (!designation) {
        return res
          .status(400)
          .json({ success: false, error: `Désignation requise (item ${i + 1})` });
      }
      if (isNaN(quantité) || quantité <= 0) {
        return res
          .status(400)
          .json({ success: false, error: `Quantité positive requise (item ${i + 1})` });
      }
    }

    // ---- creation ---------------------------------------------------
    const demandeFourniture = await prisma.demandeFourniture.create({
      data: {
        dateDemande: new Date(date),
        numero: parseInt(numero),
        demandeur: user.name,
        user: { connect: { id: req.session.user.id } },
        chantier: { connect: { id: user.chantierId } },
        status: "En Attente",
        color: "blue",
        items: {
          create: items.map((it) => ({
            code: (it.code || "").trim() || null,
            designation: (it.designation || "").trim(),
            unité: (it.unité || it.unite || "").trim() || null,
            quantité: parseInt(it.quantité || it.qteDemandee, 10),
            auPlutot: it.auPlutot || null,
            auPlutart: it.auPlutart || null,
            lot: (it.lot || "").trim() || null,          // <-- added
            observation: (it.observation || "").trim() || null,
          })),
        },
      },
      include: { items: true },
    });

    // redirect to the fresh view (HTML) – you already have a JSON fallback
    return res.redirect(`/achats/fourniture/${demandeFourniture.id}`);
  } catch (error) {
    console.error("storeDemandeFourniture error:", error);
    return res
      .status(500)
      .json({ success: false, error: `Erreur serveur : ${error.message}` });
  }
};

/* ------------------------------------------------------------------ */
/*  SHOW – view a single demand (read-only)                           */
/* ------------------------------------------------------------------ */
export const viewDemandeFourniture = async (req, res) => {
  const { id } = req.params;
  const demandeFourniture = await prisma.demandeFourniture.findUnique({
    where: { id: parseInt(id) },
    include: { user: true, chantier: true, items: true },
  });

  if (!demandeFourniture) {
    return res
      .status(404)
      .json({ success: false, error: "Demande non trouvée." });
  }

  res.render("dashboard/achats/fourniture/view", { demandeFourniture });
};

/* ------------------------------------------------------------------ */
/*  EDIT – load the form with existing data                           */
/* ------------------------------------------------------------------ */
export const editDemandeFourniture = async (req, res) => {
  const { id } = req.params;

  const demandeFourniture = await prisma.demandeFourniture.findUnique({
    where: { id: parseInt(id) },
    include: { user: true, chantier: true, items: true },
  });

  if (!demandeFourniture) {
    return res
      .status(404)
      .render("error", { message: "Demande introuvable." });
  }

  // format date for the <input type="text"> (DD/MM/YYYY)
  const format = (d) => {
    if (!d) return "";
    const date = new Date(d);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const today = format(demandeFourniture.dateDemande);

  res.render("dashboard/achats/fourniture/edit", {
    demandeFourniture,
    today,
  });
};

/* ------------------------------------------------------------------ */
/*  UPDATE – replace header + delete/insert items                     */
/* ------------------------------------------------------------------ */
export const updateDemandeFourniture = async (req, res) => {
  const { id } = req.params;
  const { date, numero, items } = req.body;

  try {
    // ---- validation -------------------------------------------------
    if (!Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "Au moins un item requis." });
    }

    for (const [i, it] of items.entries()) {
      const designation = (it.designation || "").trim();
      const quantité = parseInt(it.quantité || it.qteDemandee, 10);

      if (!designation) {
        return res
          .status(400)
          .json({ success: false, error: `Désignation requise (item ${i + 1})` });
      }
      if (isNaN(quantité) || quantité <= 0) {
        return res
          .status(400)
          .json({ success: false, error: `Quantité positive requise (item ${i + 1})` });
      }
    }

    // ---- update -----------------------------------------------------
    const updated = await prisma.demandeFourniture.update({
      where: { id: parseInt(id) },
      data: {
        dateDemande: new Date(date),
        numero: parseInt(numero),
        // delete old items + create new ones in one transaction
        items: {
          deleteMany: {},
          create: items.map((it) => ({
            code: (it.code || "").trim() || null,
            designation: (it.designation || "").trim(),
            unité: (it.unité || it.unite || "").trim() || null,
            quantité: parseInt(it.quantité || it.qteDemandee, 10),
            auPlutot: it.auPlutot || null,
            auPlutart: it.auPlutart || null,
            lot: (it.lot || "").trim() || null,
            observation: (it.observation || "").trim() || null,
          })),
        },
      },
      include: { items: true },
    });
    

    // AJAX response (your view already uses it)
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("updateDemandeFourniture error:", error);
    res
      .status(500)
      .json({ success: false, error: `Erreur serveur : ${error.message}` });
  }
};

/* ------------------------------------------------------------------ */
/*  DELETE – remove a demand (soft-delete if you have a `deletedAt`)  */
/* ------------------------------------------------------------------ */
export const deleteDemandeFourniture = async (req, res) => {
  const { id } = req.params;

  try {
    // Hard delete (cascade will remove items)
    await prisma.demandeFourniture.delete({
      where: { id: parseInt(id) },
    });

    // If you prefer soft-delete, uncomment:
    // await prisma.demandeFourniture.update({
    //   where: { id: parseInt(id) },
    //   data: { deletedAt: new Date() },
    // });

    res.json({ success: true, message: "Demande supprimée." });
  } catch (error) {
    console.error("deleteDemandeFourniture error:", error);
    res
      .status(500)
      .json({ success: false, error: `Erreur serveur : ${error.message}` });
  }
};


export const updateValidationFourniture = async (req, res) => {
  const startTime = Date.now();
  console.log('DEBUT updateValidationFourniture | Timestamp:', new Date().toISOString());

  try {
    // ÉTAPE 1 : Récupération des données
    const { id } = req.params;
    const { validation, validerPar } = req.body;
    const admin = req.session.user;

    console.log('Étape 1 - Params ID:', id);
    console.log('Étape 1 - Body reçu:', { validation, validerPar });
    console.log('Étape 1 - Session admin:', admin ? { id: admin.id, name: admin.name } : 'Aucun');

    // ÉTAPE 2 : Validation du champ obligatoire
    if (validation === undefined) {
      console.warn('ÉCHEC - Champ "validation" manquant');
      return res.status(400).json({
        success: false,
        error: 'Le champ validation est requis',
      });
    }

    // Conversion en booléen
    const validationBool = Boolean(validation);
    console.log('Étape 2 - Validation convertie en booléen:', validationBool);

    // ÉTAPE 3 : Construction du payload
    const updateData = { validation: validationBool };

    if (validationBool) {
      const nameToUse = admin?.name ?? 'Inconnu';
      updateData.validePar = nameToUse;
      console.log('Étape 3 - Validation activée → validePar défini:', nameToUse);
    } else {
      updateData.validePar = null;
      console.log('Étape 3 - Validation désactivée → validePar remis à null');
    }

    console.log('Étape 3 - Payload Prisma final:', updateData);

    // ÉTAPE 4 : Mise à jour Prisma
    console.log('Étape 4 - Exécution Prisma update...');
    const updatedItem = await prisma.itemFourniture.update({
      where: { id: parseInt(id, 10) },
      data: updateData,
    });

    console.log('Étape 4 - Mise à jour réussie ! Item mis à jour:', {
      id: updatedItem.id,
      validation: updatedItem.validation,
      validePar: updatedItem.validePar,
    });

    // ÉTAPE 5 : Réponse au client
    const response = {
      success: true,
      validation: updatedItem.validation,
      validerPar: updatedItem.validePar ?? '-',
    };

    console.log('Étape 5 - Réponse envoyée:', response);
    console.log(`FIN updateValidationFourniture | Durée: ${Date.now() - startTime}ms\n`);

    res.status(200).json(response);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('ERREUR CRITIQUE updateValidationFourniture | Durée:', `${duration}ms`);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('--- FIN ERREUR ---\n');

    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la mise à jour.',
    });
  }
};

export const validateAllFourniture = async (req, res) => {
  try {
    console.log('Request received for validateAllDepenses:', req.params);
    const { fournId } = req.params;
    const admin = req.session.user;
    if (!fournId) {
      console.log('Missing justifId in params');
      return res.status(400).json({ success: false, error: 'justifId est requis' });
    }
    if (!admin || !admin.name) {
      console.log('Missing admin or admin.name:', admin);
      return res.status(401).json({ success: false, error: 'Utilisateur non authentifié ou nom manquant' });
    }

    console.log(`Updating expenses for justifId: ${justifId}, admin: ${admin.name}`);
    // Update all expenses for the given justifId
    const fourniture = await prisma.itemFourniture.updateMany({
      where: { demandeFournitureId: parseInt(fournId) },
      data: {
        validation: true,
        validerPar: admin.name,
      },
    });

    console.log(`Update result: ${fourniture.count} expenses updated`);
    if (fourniture.count === 0) {
      return res.status(404).json({ success: false, error: 'Aucune dépense trouvée pour ce justifId' });
    }

    // Recalculate totals using helper

    res.status(200).json({ 
      success: true, 
      validerPar: admin.name,
      message: `${fourniture.count} dépense(s) validée(s)`,
    });
  } catch (error) {
    console.error('❌ Error validating depenses:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la validation des dépenses.' });
  }
};
/* ------------------------------------------------------------------ */