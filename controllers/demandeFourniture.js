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




  res.render("dashboard/achats/fourniture/index", {
    demande: sortedDemande,
    users,
    chantiers,

  });
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
  const listfourniture = await prisma.fourniture_list.findMany();
  res.render("dashboard/achats/fourniture/create", { user, today, numero, chantiers, listfourniture });
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

    // ---- validation & preparation -----------------------------------
    let parsedItems = items;
    if (typeof items === 'string') {
      try {
        parsedItems = JSON.parse(items);
      } catch (e) {
        return res.status(400).json({ success: false, error: "Format des items invalide." });
      }
    }

    if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
      return res.status(400).json({ success: false, error: "Les items doivent être un tableau non vide." });
    }

    const processedItems = [];
    const files = req.files || [];
    let fileIndex = 0;

    for (const [i, it] of parsedItems.entries()) {
      const designation = (it.designation || "").trim();
      const qtyRaw = (it.quantité || it.quantite || "").trim();
      let prixUnitaire = null;
      if (it.lot) {
        // Use findFirst because reference is unlikely to be unique in schema, or safe default
        // Also must await the promise
        const fournitureItem = await prisma.fourniture_list.findFirst({
          where: { reference: it.lot },
          select: { prixUnitaire: true },
        });
        if (fournitureItem && fournitureItem.prixUnitaire) {
          prixUnitaire = Number(fournitureItem.prixUnitaire);
        }
      }
      if (!designation) {
        return res.status(400).json({ success: false, error: `Désignation requise (item ${i + 1})` });
      }

      const quantité = qtyRaw.replace(/[^0-9]/g, '');
      if (!quantité || parseInt(quantité, 10) <= 0) {
        return res.status(400).json({ success: false, error: `Quantité invalide ou ≤ 0 (item ${i + 1})` });
      }

      // Handle image assignment
      let imagePath = null;
      // Use tempImage flag to sync with uploaded files list
      // Frontend must set tempImage=true and append file ONLY if file exists
      if (it.tempImage && fileIndex < files.length) {
        imagePath = `/uploads/fournitures/${files[fileIndex].filename}`;
        fileIndex++;
      }

      processedItems.push({
        ...it,
        quantité: quantité,
        prixUnitaire: prixUnitaire,
        image: imagePath
      });
    }

    // ---- creation ---------------------------------------------------
    const parsedDate = date ? new Date(date) : new Date();
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ success: false, error: "Date invalide" });
    }

    const totalHt = processedItems.reduce((acc, it) => acc + (parseInt(it.quantité, 10) * (it.prixUnitaire || 0)), 0);
    const tva = totalHt * 0.20;
    const totalTTC = totalHt + tva;

    const demandeFourniture = await prisma.demandeFourniture.create({
      data: {
        dateDemande: parsedDate,
        numero: parseInt(numero, 10),
        demandeur: user.name,
        user: { connect: { id: req.session.user.id } },
        chantier: { connect: { id: chantierId } },
        status: "En Attente",
        color: "blue",
        totalHt: totalHt,
        Tva: tva,
        totalTTC: totalTTC,
        items: {
          create: processedItems.map((it) => ({
            code: (it.code || "").trim() || null,
            designation: (it.designation || "").trim(),
            unité: (it.unité || it.unite || "").trim() || null,
            quantité: it.quantité,
            auPlutot: it.auPlutot || null,
            auPlutart: it.auPlutart || null,
            lot: (it.lot || "").trim() || null,
            prixU: it.prixUnitaire || null,
            totalHt: (it.quantité * it.prixUnitaire) || null,
            observation: (it.observation || "").trim() || null,
            imputation: (it.imputation || "").trim() || null,
            image: it.image,
            validation: null,
            validepar: null,
            delaisPaiement: null
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


export const updateDemandeFourniture = async (req, res) => {
  const { id } = req.params;
  const { date, numero, items, newImageCount } = req.body;
  console.log("before any lanch :", items);


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

      // ---- Fetch Price logic ----
      let prixUnitaire = null;
      if (it.lot) {
        const fournitureItem = await prisma.fourniture_list.findFirst({
          where: { reference: it.lot },
          select: { prixUnitaire: true },
        });
        if (fournitureItem && fournitureItem.prixUnitaire) {
          prixUnitaire = Number(fournitureItem.prixUnitaire);
        }
      }
      it.prixUnitaire = prixUnitaire;
    }

    // ---- Calculate Global Totals ----
    const totalHt = parsedItems.reduce((acc, it) => acc + (parseInt(it.quantité, 10) * (it.prixUnitaire || 0)), 0);
    const tva = totalHt * 0.20;
    const totalTTC = totalHt + tva;

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
              imputation: (it.imputation || "").trim() || null,
              quantité: it.quantité,
              auPlutot: it.auPlutot || null,
              auPlutart: it.auPlutart || null,
              lot: (it.lot || "").trim() || null,
              observation: (it.observation || "").trim() || null,
              image: imagePath,
              validation: null,
              validepar: null,
              delaisPaiement: null,
              prixU: it.prixUnitaire || null,
              totalHt: (it.quantité * it.prixUnitaire) || null,
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
              imputation: (it.imputation || "").trim() || null,
              quantité: it.quantité,
              auPlutot: it.auPlutot || null,
              auPlutart: it.auPlutart || null,
              lot: (it.lot || "").trim() || null,
              observation: (it.observation || "").trim() || null,
              image: imagePath,
              validation: current?.validation ?? null,
              validepar: current?.validepar ?? null,
              delaisPaiement: current?.delaispaiment ?? null,
              prixU: it.prixUnitaire || null,
              totalHt: (it.quantité * it.prixUnitaire) || null,
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
          dateDemande: parsedDate,
          numero: parseInt(numero, 10),
          totalHt: totalHt,
          Tva: tva,
          totalTTC: totalTTC,
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

/* -------------------------- UPDATE STATUS (Manual) -------------------------- */
export const updateDemandeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const admin = req.session?.user;

    // -------------------------------------------------
    // 1. Basic validation
    // -------------------------------------------------
    if (!admin) {
      return res.status(401).json({ success: false, error: 'Utilisateur non authentifié' });
    }

    if (!["admin", "grandadmin"].includes(admin.role)) {
      return res.status(403).json({ success: false, error: 'Accès refusé' });
    }

    if (!status) {
      return res.status(400).json({ success: false, error: 'Statut requis' });
    }

    const demandeId = parseInt(id, 10);
    if (isNaN(demandeId)) {
      return res.status(400).json({ success: false, error: 'ID invalide' });
    }

    // -------------------------------------------------
    // 2. Determine color based on status
    // -------------------------------------------------
    let color = "blue"; // default
    if (status === "Validé") {
      color = "green";
    } else if (status === "Refusé") {
      color = "red";
    } else if (status === "En Attente") {
      color = "blue";
    } else if (status === "Versée") {
      color = "green";
    } else if (status === "Annulée") {
      color = "gray";
    }

    // -------------------------------------------------
    // 3. Update demande status
    // -------------------------------------------------
    const updated = await prisma.demandeFourniture.update({
      where: { id: demandeId },
      data: { status, color },
    });

    // -------------------------------------------------
    // 4. Success response
    // -------------------------------------------------
    res.json({ success: true, data: updated });

  } catch (error) {
    console.error('updateDemandeStatus error:', error);

    // Prisma record-not-found
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Demande non trouvée' });
    }

    // Any other error
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
    });
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
    // 2. Update in DB - Handle null values
    // -------------------------------------------------
    let validationValue;
    if (validation === "null" || validation === null || validation === "null") {
      validationValue = null;  // En attent
    } else if (validation === "0" || validation === 0 || validation === false) {
      validationValue = false;     // Refusé 
    } else {
      validationValue = true;     // Validé (default for any other value)
    }

    const data = {
      validation: validationValue,
      validepar: admin.name,
    };

    const idDemande = await prisma.itemFourniture.findUnique({
      where: { id: itemId },
      select: { demandeFournitureId: true }
    });

    const demande = await prisma.demandeFourniture.findUnique({
      where: { id: parseInt(idDemande.demandeFournitureId) }
    });

    if (!demande) return res.status(404).json({ success: false, error: "Demande introuvable" });

    const updated = await prisma.itemFourniture.update({
      where: { id: itemId },
      data,
    });

    // -------------------------------------------------
    // 3. Update demande status based on all items
    // -------------------------------------------------
    const allItems = await prisma.itemFourniture.findMany({
      where: { demandeFournitureId: parseInt(idDemande.demandeFournitureId) },
      select: { validation: true }
    });

    const anyPending = allItems.some(i => i.validation === null || i.validation === undefined);
    const anyValidated = allItems.some(i => i.validation === true);
    const allRefused = allItems.every(i => i.validation === false);

    let finalStatus = "En Attente";
    let finalColor = "blue";

    if (anyPending) {
      finalStatus = "En Attente";
      finalColor = "blue";
    } else if (anyValidated) {
      finalStatus = "Validé";
      finalColor = "green";
    } else if (allRefused) {
      finalStatus = "Refusé";
      finalColor = "red";
    }

    await prisma.demandeFourniture.update({
      where: { id: parseInt(demande.id) },
      data: { status: finalStatus, color: finalColor },
    });

    // -------------------------------------------------
    // 4. Success response
    // -------------------------------------------------
    res.json({ success: true, data: updated });

  } catch (error) {
    console.error('updateValidationFourniture error:', error);

    // Prisma record-not-found
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Article non trouvé' });
    }

    // Any other error
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
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

    const itemId = parseInt(id, 10);
    if (Number.isNaN(itemId)) {
      return res.status(400).json({ success: false, error: "ID invalide" });
    }

    const sessionUser = req.session?.user;
    if (!sessionUser) {
      return res.status(401).json({ success: false, error: "Non authentifié" });
    }

    const item = await prisma.itemFourniture.findUnique({
      where: { id: itemId },
      select: { id: true, demandeFourniture: { select: { userId: true } } },
    });

    if (!item) {
      return res.status(404).json({ success: false, error: "Article introuvable" });
    }

    if (sessionUser.role === 'user' && item.demandeFourniture?.userId !== sessionUser.id) {
      return res.status(403).json({ success: false, error: "Accès refusé" });
    }

    const imagePath = `/uploads/fournitures/${req.file.filename}`;
    const updated = await prisma.itemFourniture.update({
      where: { id: itemId },
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
    const itemId = parseInt(id, 10);
    if (Number.isNaN(itemId)) {
      return res.status(400).json({ success: false, error: "ID invalide" });
    }

    const sessionUser = req.session?.user;
    if (!sessionUser) {
      return res.status(401).json({ success: false, error: "Non authentifié" });
    }

    const item = await prisma.itemFourniture.findUnique({
      where: { id: itemId },
      select: { image: true, demandeFourniture: { select: { userId: true } } },
    });
    if (!item?.image) return res.status(404).json({ success: false, error: "Image introuvable" });

    if (sessionUser.role === 'user' && item.demandeFourniture?.userId !== sessionUser.id) {
      return res.status(403).json({ success: false, error: "Accès refusé" });
    }

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
export const generateDemandeFourniturePDF = async (req, res) => {
  const demandeId = parseInt(req.params.id, 10);
  if (Number.isNaN(demandeId)) {
    return res.status(400).send("ID invalide");
  }

  try {
    const demande = await prisma.demandeFourniture.findUnique({
      where: { id: demandeId },
      include: {
        chantier: true,
        items: true,
      },
    });

    if (!demande) {
      return res.status(404).send("Demande non trouvée");
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=demande_fourniture_${demande.id}.pdf`
    );

    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 10,
    });
    doc.pipe(res);

    const pageW = 841.89;
    const pageH = 595.28;
    const margin = 10;
    const contentW = pageW - margin * 2;
    const thin = 0.5;
    const thick = 1.5;

    const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "";
    const logoPath = path.join(__dirname, "../public/img/logo-4.png");

    function parseNumber(value) {
      if (value === undefined || value === null || value === "") return "";
      const num = Number(value);
      if (isNaN(num)) {
        return String(value).replace(/\//g, ' ');
      }
      const parts = num.toFixed(2).split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
      return parts.join(',').replace(/\//g, ' ');
    }

    // --- LAYOUT CONSTANTS ---
    const headerH = 70;
    const infoH = 28;
    const tableHeaderH = 44; // 22 + 22
    const summaryTableH = 40; // Horizontal summary table (2 rows: labels + values)
    const signatureH = 90;
    const footerH = summaryTableH + signatureH + 20; // Fixed footer height

    // Calculate available space for items on first page and continuation pages
    const firstPageItemsLimit = pageH - margin - headerH - infoH - tableHeaderH - footerH - 10;
    const continuationPageItemsLimit = pageH - margin - tableHeaderH - footerH - 10;

    // --- COLUMN DEFINITIONS ---
    const col = {
      code: 60,
      des: 200,
      lot: 70,
      unit: 40,
      qd: 50,
      pu: 60,
      tht: 70,
      d1: 65,
      d2: 65,
    };
    col.obs = contentW - Object.values(col).reduce((a, b) => a + b, 0);

    const x = {};
    let acc = margin;
    Object.entries(col).forEach(([k, w]) => {
      x[k] = acc;
      acc += w;
    });

    // --- DRAWING HELPERS ---

    const drawFirstPageHeader = () => {
      // Page Border
      doc.rect(margin, margin, contentW, pageH - margin * 2).lineWidth(thick).stroke();

      // Main Header
      const leftW = 110;
      const rightW = 150;
      const centerW = contentW - leftW - rightW;

      doc.rect(margin, margin, contentW, headerH).lineWidth(thick).stroke();
      doc.moveTo(margin + leftW, margin).lineTo(margin + leftW, margin + headerH).lineWidth(thick).stroke();
      doc.moveTo(margin + leftW + centerW, margin).lineTo(margin + leftW + centerW, margin + headerH).lineWidth(thick).stroke();

      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, margin + 20, margin + 8, { width: 85 });
      }

      doc.font("Helvetica-Bold").fontSize(20).text("DEMANDE DE FOURNITURES", margin + leftW, margin + 22, { width: centerW, align: "center" });

      doc.fontSize(10).font("Helvetica");
      doc.text("Code : EN 53 02 001", margin + leftW + centerW + 15, margin + 12);
      doc.text("Version : 02", margin + leftW + centerW + 15, margin + 28);
      doc.text("Date : 27/01/2016", margin + leftW + centerW + 15, margin + 44);

      // Info Row
      const infoY = margin + headerH;
      doc.rect(margin, infoY, contentW, infoH).lineWidth(thick).stroke();
      const splitX = margin + contentW * 0.65 - 90;
      doc.moveTo(splitX, infoY).lineTo(splitX, infoY + infoH).stroke();

      doc.fontSize(12);
      doc.text("Code / Chantier :", margin + 10, infoY + 8);
      doc.text(demande.chantier?.nom || "", margin + 120, infoY + 8);
      doc.text("Date :", splitX + 10, infoY + 8);
      doc.text(fmtDate(demande.dateDemande), splitX + 55, infoY + 8);
      doc.text(`N° : ${(demande.numero || demande.id).toString().padStart(3, "0")}/${new Date().getFullYear()}`, splitX + 120, infoY + 8);
      doc.text(`${demande.demandeur || ""}`, splitX + 220, infoY + 8);
    };

    const drawContinuationPageBorder = () => {
      // Page Border only (no header)
      doc.rect(margin, margin, contentW, pageH - margin * 2).lineWidth(thick).stroke();
    };

    const drawTableHeader = (startY) => {
      const h1 = 22;
      const h2 = 22;

      // Header Border
      doc.rect(margin, startY, contentW, h1 + h2).lineWidth(thick).stroke();

      // Vertical lines WITHIN header
      Object.values(x).forEach((vx) => {
        doc.moveTo(vx, startY).lineTo(vx, startY + h1 + h2).lineWidth(thin).stroke();
      });
      doc.moveTo(margin + contentW, startY).lineTo(margin + contentW, startY + h1 + h2).lineWidth(thin).stroke();

      // Headers Text
      doc.fontSize(10);
      doc.text("Code\narticle", x.code + 2, startY + 4, { width: col.code, align: "center" });
      doc.text("Désignations", x.des, startY + 12, { width: col.des, align: "center" });
      doc.text("Unité", x.unit, startY + 12, { width: col.unit, align: "center" });
      doc.text("Quantité", x.qd, startY + 12, { width: col.qd, align: "center" });
      doc.text("P.U. HT", x.pu, startY + 12, { width: col.pu, align: "center" });
      doc.text("Total HT", x.tht, startY + 12, { width: col.tht, align: "center" });
      doc.text("Date de livraison", x.d1, startY + 4, { width: col.d1 + col.d2, align: "center" });
      doc.text("Reference", x.lot, startY + 12, { width: col.lot, align: "center" });
      doc.text("Recommandations et Observations", x.obs, startY + 4, { width: col.obs, align: "center" });

      doc.fontSize(9);
      doc.text("Au plutôt", x.d1, startY + h1 + 6, { width: col.d1, align: "center" });
      doc.text("Au plus tard", x.d2, startY + h1 + 6, { width: col.d2, align: "center" });
    };

    const drawVerticalGridLines = (topY, bottomY) => {
      Object.values(x).forEach((vx) => {
        doc.moveTo(vx, topY).lineTo(vx, bottomY).lineWidth(thin).stroke();
      });
      // Right border
      doc.moveTo(margin + contentW, topY).lineTo(margin + contentW, bottomY).lineWidth(thin).stroke();
      // Bottom border for this section
      doc.moveTo(margin, bottomY).lineTo(margin + contentW, bottomY).lineWidth(thin).stroke();
    };

    const calculateRowHeight = (item) => {
      const baseRowH = 22;
      let maxHeight = baseRowH;
      const columnsToCheck = [
        { text: item.code, width: col.code },
        { text: item.designation, width: col.des },
        { text: item.lot, width: col.lot },
        { text: item.observation, width: col.obs },
        { text: item.unité || item.unite, width: col.unit },
        { text: item.quantité || item.quantite, width: col.qd },
        { text: item.auPlutot ? fmtDate(item.auPlutot) : "", width: col.d1 },
        { text: item.auPlutart ? fmtDate(item.auPlutart) : "", width: col.d2 },
        { text: parseNumber(item.prixU), width: col.pu },
        { text: parseNumber(item.totalHt), width: col.tht }
      ];
      columnsToCheck.forEach(colData => {
        if (colData.text) {
          const textHeight = doc.heightOfString(String(colData.text), { width: colData.width - 4 });
          maxHeight = Math.max(maxHeight, textHeight + 10);
        }
      });
      return maxHeight;
    };

    const drawFixedFooter = (isLastPage = false) => {
      // Calculate footer position (always at bottom of page)
      const footerStartY = pageH - margin - footerH;

      // Draw Summary Table (Horizontal Layout - 3 columns side by side)
      const summaryTableH = 40; // Height for 2 rows (labels + values)

      // Make table narrower (60% of content width) and center it horizontally
      const tableWidth = contentW * 0.6;
      const tableX = margin + (contentW - tableWidth) / 2; // Center horizontally
      const sumY = footerStartY;

      // Define 3 equal columns for the summary
      const colWidth = tableWidth / 3;

      doc.fontSize(10);

      // Draw the summary table border
      doc.rect(tableX, sumY, tableWidth, summaryTableH).lineWidth(thick).stroke();

      // Draw vertical separators for 3 columns
      for (let i = 1; i < 3; i++) {
        doc.moveTo(tableX + colWidth * i, sumY).lineTo(tableX + colWidth * i, sumY + summaryTableH).stroke();
      }

      // Draw horizontal separator (between labels and values)
      const labelRowH = 20;
      doc.moveTo(tableX, sumY + labelRowH).lineTo(tableX + tableWidth, sumY + labelRowH).stroke();

      // Calculate TVA rate
      const tvaRate = demande.totalHt > 0 ? ((demande.Tva / demande.totalHt) * 100) : 20;

      // Define labels and values (3 columns now)
      const columns = isLastPage ? [
        { label: "Total HT", value: parseNumber(demande.totalHt) + " DH" },
        { label: "Montant TVA (" + parseNumber(tvaRate) + "%)", value: parseNumber(demande.Tva) + " DH" },
        { label: "Total TTC", value: parseNumber(demande.totalTTC) + " DH", bold: true }
      ] : [
        { label: "Total HT", value: "XX" },
        { label: "Montant TVA (%)", value: "XX" },
        { label: "Total TTC", value: "XX", bold: true }
      ];

      // Draw labels (top row)
      columns.forEach((col, i) => {
        doc.font("Helvetica").fontSize(9);
        doc.text(col.label, tableX + colWidth * i + 5, sumY + 5, {
          width: colWidth - 10,
          align: "center"
        });
      });

      // Draw values (bottom row)
      columns.forEach((col, i) => {
        if (col.bold) doc.font("Helvetica-Bold");
        else doc.font("Helvetica");
        doc.fontSize(10);
        doc.text(col.value, tableX + colWidth * i + 5, sumY + labelRowH + 5, {
          width: colWidth - 10,
          align: "center"
        });
      });

      const summaryY = sumY + summaryTableH + 20; // Gap after summary

      // --- SIGNATURES ---
      const sigY = summaryY;
      const sigH = 90;

      // Grid for signatures
      doc.fontSize(11).font("Helvetica");
      doc.rect(margin, sigY, contentW, sigH).lineWidth(thick).stroke();

      const sigW = contentW / 4;
      for (let i = 1; i < 4; i++) {
        doc.moveTo(margin + sigW * i, sigY).lineTo(margin + sigW * i, sigY + sigH).stroke();
      }

      ["Magasinier", "Conducteur des travaux", "Chef Chantier", "Service Approvisionnement"]
        .forEach((t, i) => {
          doc.rect(margin + sigW * i + 5, sigY + 5, sigW - 10, sigH - 10).lineWidth(0.5).stroke();
          doc.text(t, margin + sigW * i + 10, sigY + sigH - 25, { width: sigW - 10, align: "left" });

          const lineY = sigY + 45;
          doc.moveTo(margin + sigW * i + 15, lineY).lineTo(margin + sigW * (i + 1) - 15, lineY).lineWidth(0.8).stroke();
        });
    };

    // --- INITIAL RENDER (FIRST PAGE) ---
    drawFirstPageHeader();
    let tableY = margin + headerH + infoH;
    drawTableHeader(tableY);

    let currentY = tableY + tableHeaderH;
    let tableStartOnCurrentPage = currentY;
    let isFirstPage = true;
    doc.fontSize(11);

    // --- ITEMS LOOP ---
    for (const item of demande.items || []) {
      const rowHeight = calculateRowHeight(item);
      const itemsLimit = isFirstPage ? firstPageItemsLimit : continuationPageItemsLimit;
      const itemsBottomY = isFirstPage ? (margin + headerH + infoH + tableHeaderH + itemsLimit) : (margin + tableHeaderH + itemsLimit);

      // Check for Page Break
      if (currentY + rowHeight > itemsBottomY) {
        // Draw grid lines for previous page
        drawVerticalGridLines(tableStartOnCurrentPage, currentY);

        // Draw fixed footer on current page (not last page, show XX)
        drawFixedFooter(false);

        // New page (continuation - no header)
        doc.addPage();
        drawContinuationPageBorder();

        tableY = margin;
        drawTableHeader(tableY);

        currentY = tableY + tableHeaderH;
        tableStartOnCurrentPage = currentY;
        isFirstPage = false;
        doc.fontSize(11);
      }

      // Draw horizontal separator
      doc.moveTo(margin, currentY).lineTo(margin + contentW, currentY).lineWidth(thin).stroke();

      // Render Text
      const textTopPadding = 5;
      const textY = currentY + textTopPadding;

      doc.text(item.code || "", x.code + 2, textY, { width: col.code, align: "center" });
      doc.text(item.designation || "", x.des + 2, textY, { width: col.des, align: "left" });
      doc.text(item.lot || "", x.lot, textY, { width: col.lot, align: "center" });
      doc.text(item.unité || item.unite || "", x.unit, textY, { width: col.unit, align: "center" });
      doc.text(item.quantité || item.quantite || "", x.qd, textY, { width: col.qd, align: "center" });
      doc.text(parseNumber(item.prixU), x.pu, textY, { width: col.pu, align: "center" });
      doc.text(parseNumber(item.totalHt), x.tht, textY, { width: col.tht, align: "center" });
      doc.text(item.auPlutot ? fmtDate(item.auPlutot) : "", x.d1, textY, { width: col.d1, align: "center" });
      doc.text(item.auPlutart ? fmtDate(item.auPlutart) : "", x.d2, textY, { width: col.d2, align: "center" });
      doc.text(item.observation || "", x.obs + 2, textY, { width: col.obs, align: "left" });

      currentY += rowHeight;
    }

    // Draw final grid lines for the last page
    drawVerticalGridLines(tableStartOnCurrentPage, currentY);

    // Draw fixed footer on last page (show real values)
    drawFixedFooter(true);

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur génération PDF");
  }
};

export const addpricingforDemande = async (req, res) => {
  const { id } = req.params;
  const { items, tauxTva, delaispaiement } = req.body;

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

    // -------------------------------------------------
    // 2. Validate items and pricing
    // -------------------------------------------------
    if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
      return res.status(400).json({ success: false, error: "Au moins un item requis." });
    }

    for (const [i, it] of parsedItems.entries()) {
      if (!it.id || isNaN(parseInt(it.id))) {
        return res.status(400).json({ success: false, error: `ID item manquant (ligne ${i + 1})` });
      }
      const prixU = parseFloat(String(it.prixU || '0').replace(',', '.'));
      if (isNaN(prixU) || prixU < 0) {
        return res.status(400).json({ success: false, error: `Prix U invalide (ligne ${i + 1})` });
      }
      it.prixU = prixU;
    }

    // -------------------------------------------------
    // 3. Validate TVA rate
    // -------------------------------------------------
    let effectiveTva = 0;
    if (tauxTva !== undefined && tauxTva !== null && String(tauxTva).trim() !== '') {
      const tva = parseFloat(String(tauxTva).replace(',', '.'));
      if (isNaN(tva) || tva < 0 || tva > 100) {
        return res.status(400).json({ success: false, error: 'TVA invalide (0-100)' });
      }
      effectiveTva = tva;
    }

    // -------------------------------------------------
    // 4. Fetch existing items
    // -------------------------------------------------
    const existingItems = await prisma.itemFourniture.findMany({
      where: { demandeFournitureId: parseInt(id, 10) },
      select: { id: true, quantité: true },
    });

    const existingMap = new Map(existingItems.map(item => [item.id, item]));

    // -------------------------------------------------
    // 5. Prepare updates and calculate totals
    // -------------------------------------------------
    let totalHtDemande = 0;
    const updatePromises = parsedItems.map(it => {
      const itemId = parseInt(it.id);
      const existing = existingMap.get(itemId);
      if (!existing) {
        throw new Error(`Item ${itemId} non trouvé`);
      }
      const qty = existing.quantité;
      const totalHt = qty * it.prixU;
      totalHtDemande += totalHt;

      return prisma.itemFourniture.update({
        where: { id: itemId },
        data: {
          prixU: it.prixU,
          totalHt,
          delaisPaiement: it.delaisPaiement ?? delaispaiement
        },
      });
    });

    // -------------------------------------------------
    // 6. Update demande totals
    // -------------------------------------------------
    const montantTva = totalHtDemande * (effectiveTva / 100);
    const totalTtc = totalHtDemande + montantTva;

    // -------------------------------------------------
    // 7. Execute transaction
    // -------------------------------------------------
    await prisma.$transaction([
      ...updatePromises,
      prisma.demandeFourniture.update({
        where: { id: parseInt(id, 10) },
        data: {
          totalHt: totalHtDemande,
          Tva: montantTva,
          totalTTC: totalTtc,
        },
      }),
    ]);

    res.json({ success: true, message: 'Pricing mis à jour avec succès' });

  } catch (error) {
    console.error('Error in addpricingforDemande:', error);
    res.status(500).json({ success: false, error: error.message || 'Erreur interne du serveur' });
  }
};

