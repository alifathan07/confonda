import prisma from "../db.js";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import ExcelJS from "exceljs";
import multer from "multer";
import { fileURLToPath } from 'url';
import { error } from "console";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* -------------------------- MULTER -------------------------- */
export const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads/fournitures';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});
export const uploadFour = multer({ storage });

/* -------------------------- LIST -------------------------- */
export const indexDemandeFourniture = async (req, res) => {
  const demande = await prisma.demandeFourniture.findMany({
    include: { user: true, items: true, chantier: true },
    orderBy: { id: "desc" },
  });

  const sortedDemande = demande.sort((a, b) => {
    if (a.status === "En Attente" && b.status !== "En Attente") return -1;
    if (a.status !== "En Attente" && b.status === "En Attente") return 1;
    return 0;
  });

  const users = await prisma.user.findMany({ where: { role: "user" } });
  const chantiers = await prisma.chantier.findMany();

  res.render("dashboard/achats/fourniture/index", { demande: sortedDemande, users, chantiers });
};

/* -------------------------- CREATE FORM -------------------------- */
export const createDemandeFourniture = async (req, res) => {
  const last = await prisma.demandeFourniture.findMany({
    where: { user: { id: req.session.user.id } },
    orderBy: { numero: "desc" },
    take: 1,
  });
  const numero = (last[0]?.numero || 0) + 1;
  const user = await prisma.user.findUnique({
    where: { id: req.session.user.id },
  });
  const chantiers = await prisma.chantier.findMany();
  const today = new Date().toISOString().slice(0, 10);
  res.render("dashboard/achats/fourniture/create", { user, today, numero, chantiers });
};

/* -------------------------- STORE -------------------------- */
// controllers/demandeFournitureController.js

export const storeDemandeFourniture = async (req, res) => {
  try {
    const { date, numero, items, chantierId: chantierIdRaw } = req.body;

    const chantierId = chantierIdRaw ? parseInt(chantierIdRaw, 10) : NaN;
    if (!chantierIdRaw || Number.isNaN(chantierId)) {
      return res.status(400).json({ success: false, error: "Chantier manquant ou invalide." });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.session.user.id },
    });

    if (!user) {
      return res.status(400).json({ success: false, error: "Utilisateur non trouvé." });
    }

    const chantier = await prisma.chantier.findUnique({
      where: { id: chantierId },
      select: { id: true },
    });
    if (!chantier) {
      return res.status(400).json({ success: false, error: "Chantier non trouvé." });
    }

    // ---- validation -------------------------------------------------
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: "Les items doivent être un tableau non vide." });
    }

    for (const [i, it] of items.entries()) {
      const designation = (it.designation || "").trim();
      const qtyRaw = (it.quantité || it.quantite || "").trim();

      if (!designation) {
        return res.status(400).json({ success: false, error: `Désignation requise (item ${i + 1})` });
      }

      const quantité = qtyRaw.replace(/[^0-9]/g, '');
      if (!quantité || parseInt(quantité, 10) <= 0) {
        return res.status(400).json({ success: false, error: `Quantité invalide ou ≤ 0 (item ${i + 1})` });
      }

      it.quantité = quantité; // ← string propre
    }

    // ---- creation ---------------------------------------------------
    const parsedDate = date ? new Date(date) : new Date();
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ success: false, error: "Date invalide" });
    }

    const demandeFourniture = await prisma.demandeFourniture.create({
      data: {
        dateDemande: parsedDate,
        numero: parseInt(numero, 10),
        demandeur: user.name,
        user: { connect: { id: req.session.user.id } },
        chantier: { connect: { id: chantierId } },
        status: "En Attente",
        color: "blue",
        items: {
          create: items.map((it) => ({
            code: (it.code || "").trim() || null,
            designation: (it.designation || "").trim(),
            unité: (it.unité || it.unite || "").trim() || null,
            quantité: it.quantité, // ← "50", "100", etc.
            auPlutot: it.auPlutot || null,
            auPlutart: it.auPlutart || null,
            lot: (it.lot || "").trim() || null,
            observation: (it.observation || "").trim() || null,
            imputation: (it.imputation || "").trim() || null,
            image: it.tempImage || null,
          })),
        },
      },
      include: { items: true },
    });

    return res.json({ success: true, redirect: `/achats/fourniture/${demandeFourniture.id}` });
  } catch (error) {
    console.error("storeDemandeFourniture error:", error);
    return res.status(500).json({ success: false, error: `Erreur serveur : ${error.message}` });
  }
};

import { parse } from 'date-fns';

export const updateDemandeFourniture = async (req, res) => {
  const { id } = req.params;
  const { date, numero, items, newImageCount } = req.body;

  try {
    // -------------------------------------------------
    // 1. Parse items (JSON string or array)
    // -------------------------------------------------
    let parsedItems = [];
    if (typeof items === 'string') {
      parsedItems = JSON.parse(items);
    } else if (Array.isArray(items)) {
      parsedItems = items;
    } else {
      return res.status(400).json({ success: false, error: "Items invalides." });
    }

    const fileCount = parseInt(newImageCount) || 0;
    let fileIndex = 0;

    // -------------------------------------------------
    // 2. Validate every item
    // -------------------------------------------------
    if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
      return res.status(400).json({ success: false, error: "Au moins un item." });
    }

    for (const [i, it] of parsedItems.entries()) {
      const designation = (it.designation || "").trim();
      const qtyRaw = (it.quantité || it.quantite || "").trim();

      if (!designation) {
        return res.status(400).json({ success: false, error: `Désignation manquante (ligne ${i + 1})` });
      }

      const quantité = qtyRaw.replace(/[^0-9]/g, '');
      if (!quantité || parseInt(quantité, 10) <= 0) {
        return res.status(400).json({ success: false, error: `Quantité invalide (ligne ${i + 1})` });
      }

      it.quantité = quantité;
    }

    // -------------------------------------------------
    // 3. Get existing items from DB
    // -------------------------------------------------
    const existing = await prisma.itemFourniture.findMany({
      where: { demandeFournitureId: parseInt(id, 10) },
      select: { id: true, image: true, validation: true, validepar: true },
    });

    const existingIds = existing.map(e => e.id);
    const incomingIds = parsedItems
      .filter(it => it.id && !isNaN(parseInt(it.id)))
      .map(it => parseInt(it.id));

    const idsToDelete = existingIds.filter(e => !incomingIds.includes(e));

    // -------------------------------------------------
    // 4. Transaction – delete / create / update
    // -------------------------------------------------
    await prisma.$transaction(async (tx) => {
      // ---- DELETE removed rows ----
      if (idsToDelete.length) {
        await tx.itemFourniture.deleteMany({ where: { id: { in: idsToDelete } } });
      }

      // ---- CREATE new rows ----
      const newItems = parsedItems.filter(it => !it.id || isNaN(parseInt(it.id)));
      if (newItems.length) {
        await tx.itemFourniture.createMany({
          data: newItems.map(it => {
            let imagePath = it.tempImage || null;
            if (fileIndex < fileCount && req.files && req.files[fileIndex]) {
              imagePath = `/uploads/fournitures/${req.files[fileIndex].filename}`;
              fileIndex++;
            }
            return {
              demandeFournitureId: parseInt(id, 10),
              code: (it.code || "").trim() || null,
              designation: (it.designation || "").trim(),
              unité: (it.unite || "").trim() || null,
              quantité: it.quantité,
              auPlutot: it.auPlutot || null,
              auPlutart: it.auPlutart || null,
              lot: (it.lot || "").trim() || null,
              observation: (it.observation || "").trim() || null,
              image: imagePath,
              validation: false,
              validepar: null,
            };
          }),
        });
      }

      // ---- UPDATE existing rows ----
      const updatePromises = parsedItems
        .filter(it => it.id && !isNaN(parseInt(it.id)))
        .map(async it => {
          const itemId = parseInt(it.id);
          const current = existing.find(e => e.id === itemId);

          // ---- Image handling ----
          let imagePath = current?.image;
          if (it.tempImage) imagePath = it.tempImage;
          if (fileIndex < fileCount && req.files && req.files[fileIndex]) {
            imagePath = `/uploads/fournitures/${req.files[fileIndex].filename}`;
            fileIndex++;
          }

          // ---- Validation handling (admin only) ----
          const validation =
            it.validation !== undefined ? Boolean(it.validation) : (current?.validation ?? false);

          return tx.itemFourniture.update({
            where: { id: itemId },
            data: {
              code: (it.code || "").trim() || null,
              designation: (it.designation || "").trim(),
              unité: (it.unite || "").trim() || null,
              quantité: it.quantité,
              auPlutot: it.auPlutot || null,
              auPlutart: it.auPlutart || null,
              lot: (it.lot || "").trim() || null,
              observation: (it.observation || "").trim() || null,
              image: imagePath,
              validation,
              validepar: current?.validepar ?? null,
            },
          });
        });

      await Promise.all(updatePromises);

      // ---- Update header (date / numero) ----
      let parsedDate;
      if (date) {
        // Try ISO first
        parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
          // Try DD/MM/YYYY
          const [day, month, year] = date.split('/');
          if (!day || !month || !year) {
            return res.status(400).json({ success: false, error: "Date invalide" });
          }
          parsedDate = new Date(`${year}-${month}-${day}`);
        }
      } else {
        parsedDate = new Date();
      }

      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ success: false, error: "Date invalide" });
      }

      await tx.demandeFourniture.update({
        where: { id: parseInt(id, 10) },
        data: {
          dateDemande: parsedDate,
          numero: parseInt(numero, 10),
        },
      });
    });

    return res.json({ success: true });
  } catch (e) {
    console.error("updateDemandeFourniture ERROR:", e);
    res.status(500).send({ success: false, error: e.message });
  }
};

/* -------------------------- VIEW -------------------------- */
export const viewDemandeFourniture = async (req, res) => {
  const { id } = req.params;
  const demandeFourniture = await prisma.demandeFourniture.findUnique({
    where: { id: parseInt(id) },
    include: { user: true, chantier: true, items: true },
  });
  if (!demandeFourniture) return res.status(404).json({ success: false, error: "Introuvable." });
  res.render("dashboard/achats/fourniture/view", { demandeFourniture });
};

/* -------------------------- EDIT FORM -------------------------- */
export const editDemandeFourniture = async (req, res) => {
  const { id } = req.params;
  const demandeFourniture = await prisma.demandeFourniture.findUnique({
    where: { id: parseInt(id) },
    include: { user: true, chantier: true, items: true },
  });
  if (!demandeFourniture) return res.status(404).render("error", { message: "Demande introuvable." });

  const format = d => {
    if (!d) return "";
    const date = new Date(d);
    return `${String(date.getDate()).padStart(2, "0"

    )}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
  };
  const today = format(demandeFourniture.dateDemande);

  res.render("dashboard/achats/fourniture/edit", { demandeFourniture, today });
};

/* -------------------------- UPDATE -------------------------- */


/* -------------------------- DELETE -------------------------- */
export const deleteDemandeFourniture = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.demandeFourniture.delete({ where: { id: parseInt(id) } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

/* -------------------------- VALIDATION (single) -------------------------- */
// controllers/fournitureController.js  (or wherever you keep it)

export const updateValidationFourniture = async (req, res) => {
  try {
    const { id } = req.params;
    const { validation } = req.body;
    const admin = req.session?.user;


    // -------------------------------------------------
    // 1. Basic validation
    // -------------------------------------------------
    if (!admin) {
      return res.status(401).json({ success: false, error: 'Utilisateur non authentifié' });
    }

    if (validation === undefined) {
      return res.status(400).json({ success: false, error: 'Champ "validation" requis' });
    }

    const itemId = parseInt(id, 10);
    if (isNaN(itemId)) {
      return res.status(400).json({ success: false, error: 'ID invalide' });
    }

    // -------------------------------------------------
    // 2. Update in DB
    // -------------------------------------------------
    const data = {
      validation: Boolean(validation),   // true / false
      validepar: admin.name,

    };
    const idDemande = await prisma.itemFourniture.findUnique({ where: { id: itemId }, select: { demandeFournitureId: true } });
    const demande = await prisma.demandeFourniture.findUnique({ where: { id: parseInt(idDemande.demandeFournitureId) } });
    if (!demande) return res.status(404).json({ success: false, error: "Demande introuvable" });



    const updated = await prisma.itemFourniture.update({
      where: { id: itemId },
      data,
    });
    const udateDemande = await prisma.demandeFourniture.update({
      where: { id: parseInt(demande.id) },
      data: { status: "Validé", color: "green" },
    });




    // -------------------------------------------------
    // 3. Success response
    // -------------------------------------------------
    res.json({ success: true, data: updated });

  } catch (error) {
    // -------------------------------------------------
    // 4. All errors → JSON (never HTML)
    // -------------------------------------------------
    console.error('updateValidationFourniture error:', error);

    // Prisma record-not-found
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Article non trouvé' });
    }

    // Any other error
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      // optional: detail: error.message   (remove in production)
    });
  }
};
/* -------------------------- VALIDATE ALL -------------------------- */
export const validateAllFourniture = async (req, res) => {
  const { id } = req.params;
  const admin = req.session.user;

  const demande = await prisma.demandeFourniture.findUnique({ where: { id: parseInt(id) } });
  if (!demande) return res.status(404).json({ success: false, error: "Demande introuvable" });

  const upd = await prisma.itemFourniture.updateMany({
    where: { demandeFournitureId: parseInt(id) },
    data: { validation: true, validepar: admin.name },
  });
  const udateDemande = await prisma.demandeFourniture.update({
    where: { id: parseInt(id) },
    data: { status: "Validé", color: "green" },
  });

  res.json({ success: true, count: upd.count });
};

/* -------------------------- IMAGE UPLOAD (existing item) -------------------------- */
export const uploadImageFourniture = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ success: false, error: "Fichier manquant" });

    const imagePath = `/uploads/fournitures/${req.file.filename}`;
    const updated = await prisma.itemFourniture.update({
      where: { id: parseInt(id) },
      data: { image: imagePath },
    });

    res.json({ success: true, data: updated });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: e.message });
  }
};

/* -------------------------- TEMP IMAGE UPLOAD (new rows) -------------------------- */
export const uploadTempImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: "Fichier manquant" });

    const imagePath = `/uploads/fournitures/${req.file.filename}`;
    res.json({ success: true, data: { image: imagePath } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: e.message });
  }
};

/* -------------------------- IMAGE DOWNLOAD -------------------------- */
export const downloadImageFourniture = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await prisma.itemFourniture.findUnique({
      where: { id: parseInt(id) },
      select: { image: true },
    });
    if (!item?.image) return res.status(404).json({ success: false, error: "Image introuvable" });

    const filePath = path.resolve(__dirname, '..', item.image.replace(/^\//, ''));
    await fs.promises.access(filePath);
    const filename = path.basename(filePath);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.sendFile(filePath);
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: e.message });
  }
};




export const uploadImageFournitures = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    const itemId = parseInt(id, 10);
    if (isNaN(itemId)) {
      return res.status(400).json({ success: false, error: "ID invalide." });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: "Aucun fichier reçu." });
    }

    const imagePath = `/uploads/fournitures/${req.file.filename}`;

    // Check if item exists
    const updated = await prisma.itemFourniture.update({
      where: { id: itemId },
      data: { image: imagePath },
    });

    res.json({
      success: true,
      message: "Image uploadée avec succès.",
      data: updated,
    });
  } catch (error) {
    console.error("Erreur uploadImageFourniture:", error.message, error.stack);

    // Specific Prisma error
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: "Article non trouvé." });
    }

    res.status(500).json({ success: false, error: "Erreur serveur lors de l'upload." });
  }
};