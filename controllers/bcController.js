import prisma from "../db.js";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mailTransporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "abfathan@gmail.com",
    pass: "ftaq bvph apmq qofe",
  },
});

const normalizeNumber = (value) => {
  if (typeof value === 'number') return value;
  if (value === null || value === undefined) return 0;
  const cleaned = String(value)
    .trim()
    .replace(/[^0-9.,-]/g, '')
    .replace(/\s/g, '')
    .replace(',', '.');
  const n = parseFloat(cleaned);
  return Number.isNaN(n) ? 0 : n;
};

export const postBcDemandeFourniture = async (req, res) => {
  try {
    const { demandeId, items } = req.body;

    if (!demandeId || !items || items.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "Aucun article ou demande invalide" });
    }

    const demandeIdInt = parseInt(demandeId);
 

    

    // Group items by fournisseur
    const itemsByFournisseur = items.reduce((acc, { itemId, fournisseurId }) => {
      const fid = parseInt(fournisseurId);
      const iid = parseInt(itemId);
      if (!fid || !iid) return acc;
      if (!acc[fid]) acc[fid] = [];
      acc[fid].push(iid);
      return acc;
    }, {});

    // Fetch all selected demandeFourniture items in one query
    const itemIds = items.map((i) => parseInt(i.itemId)).filter(Boolean);
    
    const demandeItems = await prisma.itemFourniture.findMany({
      where: {
        id: { in: itemIds },
        demandeFournitureId: demandeIdInt,
      },
      select: {
        id: true,
        designation: true,
        unité: true,
        quantité: true,
        observation: true,
        lot: true,
        demandeFournitureId: true,
      },
    });

    if (demandeItems.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "Aucun article trouvé dans la demande" });
    }

    const itemMap = Object.fromEntries(demandeItems.map((item) => [item.id, item]));

    const createdBcIds = [];

    // Simple generation of numero: timestamp-based for now
    const baseNumero = Date.now();
    let offset = 0;

    for (const [fournisseurIdStr, itemIdsForFournisseur] of Object.entries(
      itemsByFournisseur
    )) {
      const fournisseurId = parseInt(fournisseurIdStr);

      const fournisseur = await prisma.fournisseur.findUnique({
        where: { id: fournisseurId },
      });

      if (!fournisseur) continue;

      const validItemIds = itemIdsForFournisseur.filter((id) => itemMap[id]);
      if (validItemIds.length === 0) continue;

      const lignesToCreate = validItemIds.map((id) => {
        const a = itemMap[id];
        const quantiteInt = parseInt(a.quantité || "0") || 1;

        return {
          designation: a.designation,
          unite: a.unité || "",
          quantite: quantiteInt,
          prixUnitaire: null,
          totalHt: null,
        };
      });

      const numero = baseNumero + offset; // placeholder; adapt later if needed
      offset += 1;
      const demandeFournitureId = demandeItems[0].demandeFournitureId;
      const demand = await prisma.demandeFourniture.findUnique({
        where: { id: demandeFournitureId },
        select: { chantierId: true, demandeur: true },
      });
      const chantierId = demand.chantierId;
      const demandeur = demand.demandeur;
      


      const newBc = await prisma.bondeCommande.create({
        data: {
          date: new Date(),
          numero,
          fournisseurId,
          chantierId,
          demandeur,
          commandesItems: {
            create: lignesToCreate,
          },
        },
        select: { id: true },
      });

      createdBcIds.push(newBc.id);
    }

    if (createdBcIds.length === 0) {
      return res.status(400).json({
        success: false,
        error:
          "Aucun bon de commande créé (fournisseurs ou articles invalides)",
      });
    }

    return res.status(201).json({
      success: true,
      count: createdBcIds.length,
      bonCommandeIds: createdBcIds,
      primaryId: createdBcIds[0],
      message: `${createdBcIds.length} bon(s) de commande créé(s)`,
    });
  } catch (err) {
    console.error("Erreur création bon de commande:", err);
    return res
      .status(500)
      .json({ success: false, error: "Erreur serveur" });
  }
};




export const generateBcPDF = async (req, res) => {
  const { id } = req.params;
  const bcId = parseInt(id, 10);
  if (Number.isNaN(bcId)) return res.status(400).send("ID invalide");

  try {
    const bc = await prisma.bondeCommande.findUnique({
      where: { id: bcId },
      include: { fournisseur: true, commandesItems: true, chantier: true },
    });
    if (!bc) return res.status(404).send("Bon de commande non trouvé");

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=bonCommande_${bc.id}.pdf`);
    doc.pipe(res);

    const pageWidth = 595.28;
    const margin = 50;
    const contentWidth = pageWidth - margin * 2;

    // Colors
    const blue = "#0052CC";
    const blueLight = "#f3f8ff";
    const gray900 = "#1f2937";
    const gray800 = "#374151";
    const gray600 = "#6b7280";
    const borderColor = "#e5e7eb";

    const logoPath = path.join(__dirname, "../public/img/logo-4.png");
    const signaturePath = path.join(__dirname, "../public/img/signature.png");

    let y = margin;

    // =========================
    // HEADER BACKGROUND (first, so nothing draws over it)
    // =========================
    const headerHeight = 150;
    doc.rect(margin - 10, y - 10, contentWidth + 20, headerHeight)
       .fillOpacity(0.15)
       .fill(blueLight)
       .fillOpacity(1);

    // Logo
    let logoHeight = 0;
    if (fs.existsSync(logoPath)) {
      try {
        doc.image(logoPath, margin, y + 10, { width: 80 });
        logoHeight = 80;
      } catch (_) {}
    }

    // Title & subtitle
    doc.font("Helvetica-Bold")
       .fontSize(28)
       .fillColor(gray900)
       .text("Bon de Commande", margin, y + logoHeight + 20);

    const dateStr = new Date(bc.date).toLocaleDateString("fr-FR", {
      weekday: "long", day: "numeric", month: "long", year: "numeric"
    });
    doc.font("Helvetica-Bold")
       .fontSize(11)
       .fillColor(blue)
       .text(`N° ${bc.id} • ${dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}`, margin, doc.y + 8);

    // =========================
    // SUPPLIER BOX (on the right)
    // =========================
   // Supplier Box (Premium UI)
const supplierBox = {
  x: pageWidth - margin - 220,
  y: y + 15,
  w: 220,
  h: 125
};

// Border + background
doc.save()
   .lineWidth(2)
   .strokeColor(blue)
   .roundedRect(supplierBox.x, supplierBox.y, supplierBox.w, supplierBox.h, 14)
   .stroke();

// Soft background
doc.fillColor("#F8FBFF")
   .roundedRect(supplierBox.x, supplierBox.y, supplierBox.w, supplierBox.h, 14)
   .fill();

// Blue header strip
const headerHeightBox = 32;
doc.fillColor(blue)
   .roundedRect(supplierBox.x, supplierBox.y, supplierBox.w, headerHeightBox, 14)
   .fill();

// Header text
doc.font("Helvetica-Bold").fontSize(11).fillColor("#ffffff")
   .text("Fournisseur", supplierBox.x + 15, supplierBox.y + 10);

// Separator line inside box
doc.moveTo(supplierBox.x + 10, supplierBox.y + headerHeightBox + 5)
   .lineTo(supplierBox.x + supplierBox.w - 10, supplierBox.y + headerHeightBox + 5)
   .lineWidth(1)
   .strokeColor("#d1d9e6")
   .stroke();

// Supplier name
doc.font("Helvetica-Bold").fontSize(10).fillColor(gray900)
   .text(bc.fournisseur?.name || "-", supplierBox.x + 15, supplierBox.y + headerHeightBox + 15, { width: 190 });

// Email
doc.font("Helvetica").fontSize(9).fillColor(gray600)
   .text(bc.fournisseur?.email || "-", supplierBox.x + 15, supplierBox.y + headerHeightBox + 35, { width: 190 });

// Phone
doc.font("Helvetica").fontSize(9).fillColor(gray600)
   .text(bc.fournisseur?.telFournisseur || "Non renseigné", supplierBox.x + 15, supplierBox.y + headerHeightBox + 52, { width: 190 });

doc.restore();

y += headerHeight + 30;

    // =========================
    // TABLE
    // =========================
    const colWidths = [40, 190, 60, 70, 85, 50];
    const rowHeight = 30;
    const tableTop = y;

    // Header background
    doc.rect(margin, y, contentWidth, rowHeight).fill(blue);

    const headers = ["N°", "Désignation", "Unité", "Quantité", "Prix unitaire HT", "Total HT"];
    let x = margin;

    headers.forEach((h, i) => {
      doc.font("Helvetica-Bold").fontSize(8).fillColor("#ffffff")
         .text(h.toUpperCase(), x + 8, y + 10, {
           width: colWidths[i] - 5,
           align: i === 0 || i >= 3 ? "center" : "left"
         });
      x += colWidths[i];
    });

    y += rowHeight;

    // Rows
    bc.commandesItems.forEach((item, idx) => {
      const rowY = y;
      const bg = idx % 2 === 0 ? "#ffffff" : "#f9fafb";
      doc.rect(margin, rowY, contentWidth, rowHeight).fill(bg);

      let cellX = margin;
      colWidths.forEach(w => {
        doc.rect(cellX, rowY, w, rowHeight).lineWidth(0.5).stroke(borderColor);
        cellX += w;
      });

      cellX = margin;

      // N° circle
      doc.circle(cellX + 20, rowY + 15, 12).fill(blue);
      doc.font("Helvetica-Bold").fontSize(10).fillColor("#fff")
         .text(String(idx + 1), cellX + 13, rowY + 10, { width: 14, align: "center" });

      cellX += colWidths[0];
      // Désignation
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor(gray900)
         .text(item.designation || "-", cellX + 8, rowY + 10, { width: colWidths[1] - 16 });

      cellX += colWidths[1];
      // Unité
      doc.font("Helvetica").fontSize(8.5).fillColor(gray800)
         .text(item.unite || "-", cellX + 8, rowY + 10, { width: colWidths[2] - 16, align: "center" });

      cellX += colWidths[2];
      // Quantité pill
      const qty = String(item.quantite || 0);
      doc.roundedRect(cellX + 10, rowY + 8, 50, 16, 8).fill("#e2e8f0");
      doc.font("Helvetica-Bold").fontSize(9).fillColor(gray900)
         .text(qty, cellX + 10, rowY + 10, { width: 50, align: "center" });

      cellX += colWidths[3];
      // Prix unitaire
      const pu = (item.prixUnitaire || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      doc.font("Helvetica").fontSize(8.5).fillColor(gray900)
         .text(pu, cellX + 8, rowY + 10, { width: colWidths[4] - 16, align: "right" });

      cellX += colWidths[4];
      // Total HT
      const total = ((item.quantite || 0) * (item.prixUnitaire || 0))
        .toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      doc.font("Helvetica").fontSize(8.5).fillColor(gray900)
         .text(total, cellX + 8, rowY + 10, { width: colWidths[5] - 16, align: "right" });

      y += rowHeight;
    });

    y += 30;

    // =========================
    // TOTALS BOX
    // =========================
    const totalsWidth = 270;
    const totalsX = pageWidth - margin - totalsWidth;

    const totalHt = bc.totalHt || 0;
    const tauxRemise = bc.tauxRemise || 0;
    const montantRemise = totalHt * tauxRemise / 100;
    const netCommercial = totalHt - montantRemise;
    const tauxTva = bc.tauxTva || 20;
    const montantTva = netCommercial * tauxTva / 100;
    const totalTtc = netCommercial + montantTva;

    const totals = [
      { label: "Total HT", value: totalHt },
      { label: `Remise (${tauxRemise} %)`, value: -montantRemise },
      { label: "Net commercial", value: netCommercial },
      { label: `TVA (${tauxTva} %)`, value: montantTva },
      { label: "Total TTC", value: totalTtc, bold: true }
    ];

    totals.forEach((t, i) => {
      const lineY = y + i * 22;
      if (t.bold) {
        doc.rect(totalsX - 10, lineY - 4, totalsWidth + 20, 28)
           .fill("#f0f7ff");
      }
      doc.font(t.bold ? "Helvetica-Bold" : "Helvetica")
         .fontSize(t.bold ? 11 : 10)
         .fillColor(gray900)
         .text(t.label, totalsX, lineY + (t.bold ? 6 : 4));

      const valStr = Math.abs(t.value).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      doc.font(t.bold ? "Helvetica-Bold" : "Helvetica")
         .fontSize(t.bold ? 13 : 10)
         .fillColor(t.bold ? blue : gray900)
         .text(valStr + " MAD", totalsX, lineY + (t.bold ? 6 : 4), {
           width: totalsWidth - 20,
           align: "right"
         });
    });

    y += totals.length * 22 + 30;

    // =========================
    // MONTANT EN LETTRES
    // =========================
    doc.roundedRect(margin, y, contentWidth, 40, 12)
       .fill("#f8fbff")
       .stroke("#dbeafe");

    doc.font("Helvetica-Bold").fontSize(10).fillColor("#1e40af")
       .text("Montant en lettres :", margin + 20, y + 14);

    doc.font("Helvetica-Oblique").fontSize(10).fillColor(gray900)
       .text(bc.montantLettre || "—", margin + 140, y + 14, { width: contentWidth - 160 });

    y += 70;

    // =========================
    // USER + CHANTIER BOXES
    // =========================
    const boxW = (contentWidth - 30) / 2;
    const boxH = 80;

    // User
    doc.roundedRect(margin, y, boxW, boxH, 12).lineWidth(2).stroke("#e2e8f0").fill("#ffffff");
    doc.font("Helvetica-Bold").fontSize(10).fillColor(blue).text("Demandeur", margin + 20, y + 20);
    doc.font("Helvetica-Bold").fontSize(11).fillColor(gray900)
       .text(bc.demandeur || "-", margin + 20, y + 45, { width: boxW - 40 });

    // Chantier
    doc.roundedRect(margin + boxW + 30, y, boxW, boxH, 12).lineWidth(2).stroke("#e2e8f0").fill("#ffffff");
    doc.font("Helvetica-Bold").fontSize(10).fillColor(blue).text("Chantier", margin + boxW + 50, y + 20);
    doc.font("Helvetica-Bold").fontSize(11).fillColor(gray900)
       .text(bc.chantier?.nom || "Non renseigné", margin + boxW + 50, y + 45, { width: boxW - 40 });

    y += boxH + 50;

    // =========================
    // SIGNATURES (background AFTER everything else)
    // =========================
    doc.rect(margin - 10, y - 20, contentWidth + 20, 130)
       .fillOpacity(0.15)
       .fill(blueLight)
       .fillOpacity(1);

    const sigW = (contentWidth - 40) / 2;
    const sigH = 100;

    // Fournisseur signature box
    doc.roundedRect(margin, y, sigW, sigH, 12)
       .lineWidth(2)
       .stroke("#c3d4e9")
       .fill("#ffffff");

    doc.font("Helvetica-Bold").fontSize(9).fillColor(gray600)
       .text("CACHET & SIGNATURE DU FOURNISSEUR", margin, y + sigH + 10, {
         width: sigW, align: "center"
       });

    // Responsable achats
    const sig2X = margin + sigW + 40;
    doc.roundedRect(sig2X, y, sigW, sigH, 12)
       .lineWidth(2)
       .stroke("#c3d4e9")
       .fill("#ffffff");

    if (fs.existsSync(signaturePath)) {
      try {
        doc.image(signaturePath, sig2X + 20, y + 10, {
          width: sigW - 40,
          height: sigH - 30,
          align: "center",
          valign: "center"
        });
      } catch (_) {}
    }

    doc.font("Helvetica-Bold").fontSize(9).fillColor(gray600)
       .text("LE RESPONSABLE ACHATS", sig2X, y + sigH + 10, {
         width: sigW, align: "center"
       });

    doc.end();
  } catch (err) {
    console.error("Erreur PDF BC:", err);
    res.status(500).send("Erreur génération PDF");
  }
};



 // Replace your current sendBcEmail with this one
export const sendBcEmail = async (req, res) => {
  const { id } = req.params;
  const { email } = req.body || {};
  const bcId = parseInt(id, 10);

  if (!email) {
    return res.status(400).json({ success: false, error: "Email destinataire manquant" });
  }
  if (Number.isNaN(bcId)) {
    return res.status(400).json({ success: false, error: "ID invalide" });
  }

  try {
    const bc = await prisma.bondeCommande.findUnique({
      where: { id: bcId },
      include: { fournisseur: true, commandesItems: true, chantier: true },
    });

    if (!bc) return res.status(404).json({ success: false, error: "Bon de commande non trouvé" });

    // === Generate PDF identical to generateBcPDF ===
    const chunks = [];
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", async () => {
      const pdfBuffer = Buffer.concat(chunks);

      try {
        await mailTransporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: email,
          subject: `Bon de Commande #${bc.id}`,
          text: `Bonjour,\n\nVeuillez trouver ci-joint le bon de commande #${bc.id}.\n\nCordialement,`,
          attachments: [
            {
              filename: `bonCommande_${bc.id}.pdf`,
              content: pdfBuffer,
            },
          ],
        });
        res.json({ success: true });
      } catch (mailErr) {
        console.error("Erreur envoi email:", mailErr);
        res.status(500).json({ success: false, error: "Erreur envoi email" });
      }
    });

    const pageWidth = 595.28;
    const margin = 50;
    const contentWidth = pageWidth - margin * 2;

    const blue = "#0052CC";
    const blueLight = "#f3f8ff";
    const gray900 = "#1f2937";
    const gray800 = "#374151";
    const gray600 = "#6b7280";
    const borderColor = "#e5e7eb";

    const logoPath = path.join(__dirname, "../public/img/logo-4.png");
    const signaturePath = path.join(__dirname, "../public/img/signature.png");

    let y = margin;

    // HEADER BACKGROUND
    const headerHeight = 150;
    doc.rect(margin - 10, y - 10, contentWidth + 20, headerHeight)
       .fillOpacity(0.15)
       .fill(blueLight)
       .fillOpacity(1);

    // Logo
    if (fs.existsSync(logoPath)) {
      try { doc.image(logoPath, margin, y + 10, { width: 80 }); } catch (_) {}
    }

    // Title
    doc.font("Helvetica-Bold").fontSize(28).fillColor(gray900)
       .text("Bon de Commande", margin, y + 100);

    const dateStr = new Date(bc.date).toLocaleDateString("fr-FR", {
      weekday: "long", day: "numeric", month: "long", year: "numeric"
    });
    doc.font("Helvetica-Bold").fontSize(11).fillColor(blue)
       .text(`N° ${bc.id} • ${dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}`, margin, doc.y + 8);

    // SUPPLIER BOX
    const supplierBox = { x: pageWidth - margin - 220, y: y + 15, w: 220, h: 125 };
    doc.save()
       .lineWidth(2).strokeColor(blue)
       .roundedRect(supplierBox.x, supplierBox.y, supplierBox.w, supplierBox.h, 14).stroke();
    doc.fillColor("#F8FBFF").roundedRect(supplierBox.x, supplierBox.y, supplierBox.w, supplierBox.h, 14).fill();

    const headerHeightBox = 32;
    doc.fillColor(blue).roundedRect(supplierBox.x, supplierBox.y, supplierBox.w, headerHeightBox, 14).fill();
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#ffffff").text("Fournisseur", supplierBox.x + 15, supplierBox.y + 10);
    doc.moveTo(supplierBox.x + 10, supplierBox.y + headerHeightBox + 5)
       .lineTo(supplierBox.x + supplierBox.w - 10, supplierBox.y + headerHeightBox + 5)
       .lineWidth(1).strokeColor("#d1d9e6").stroke();

    doc.font("Helvetica-Bold").fontSize(10).fillColor(gray900)
       .text(bc.fournisseur?.name || "-", supplierBox.x + 15, supplierBox.y + headerHeightBox + 15, { width: 190 });
    doc.font("Helvetica").fontSize(9).fillColor(gray600)
       .text(bc.fournisseur?.email || "-", supplierBox.x + 15, supplierBox.y + headerHeightBox + 35, { width: 190 });
    doc.font("Helvetica").fontSize(9).fillColor(gray600)
       .text(bc.fournisseur?.telFournisseur || "Non renseigné", supplierBox.x + 15, supplierBox.y + headerHeightBox + 52, { width: 190 });
    doc.restore();

    y += headerHeight + 30;

    // TABLE
    const colWidths = [40, 190, 60, 70, 85, 50];
    const rowHeight = 30;
    const tableTop = y;

    doc.rect(margin, y, contentWidth, rowHeight).fill(blue);
    const headers = ["N°", "Désignation", "Unité", "Quantité", "Prix unitaire HT", "Total HT"];
    let x = margin;
    headers.forEach((h, i) => {
      doc.font("Helvetica-Bold").fontSize(8).fillColor("#ffffff")
         .text(h.toUpperCase(), x + 8, y + 10, { width: colWidths[i] - 5, align: i === 0 || i >= 3 ? "center" : "left" });
      x += colWidths[i];
    });

    y += rowHeight;

    bc.commandesItems.forEach((item, idx) => {
      const rowY = y;
      const bg = idx % 2 === 0 ? "#ffffff" : "#f9fafb";
      doc.rect(margin, rowY, contentWidth, rowHeight).fill(bg);

      let cellX = margin;
      colWidths.forEach(w => { doc.rect(cellX, rowY, w, rowHeight).lineWidth(0.5).stroke(borderColor); cellX += w; });
      cellX = margin;

      // N° circle
      doc.circle(cellX + 20, rowY + 15, 12).fill(blue);
      doc.font("Helvetica-Bold").fontSize(10).fillColor("#fff").text(String(idx + 1), cellX + 13, rowY + 10, { width: 14, align: "center" });
      cellX += colWidths[0];

      // Désignation
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor(gray900).text(item.designation || "-", cellX + 8, rowY + 10, { width: colWidths[1] - 16 });
      cellX += colWidths[1];

      // Unité
      doc.font("Helvetica").fontSize(8.5).fillColor(gray800).text(item.unite || "-", cellX + 8, rowY + 10, { width: colWidths[2] - 16, align: "center" });
      cellX += colWidths[2];

      // Quantité pill
      const qty = String(item.quantite || 0);
      doc.roundedRect(cellX + 10, rowY + 8, 50, 16, 8).fill("#e2e8f0");
      doc.font("Helvetica-Bold").fontSize(9).fillColor(gray900).text(qty, cellX + 10, rowY + 10, { width: 50, align: "center" });
      cellX += colWidths[3];

      // Prix unitaire
      const pu = (item.prixUnitaire || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      doc.font("Helvetica").fontSize(8.5).fillColor(gray900).text(pu, cellX + 8, rowY + 10, { width: colWidths[4] - 16, align: "right" });
      cellX += colWidths[4];

      // Total HT
      const total = ((item.quantite || 0) * (item.prixUnitaire || 0)).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      doc.font("Helvetica").fontSize(8.5).fillColor(gray900).text(total, cellX + 8, rowY + 10, { width: colWidths[5] - 16, align: "right" });

      y += rowHeight;
    });
      y += 30;

   // =========================
    // TOTALS BOX
    // =========================
    const totalsWidth = 270;
    const totalsX = pageWidth - margin - totalsWidth;

    const totalHt = bc.totalHt || 0;
    const tauxRemise = bc.tauxRemise || 0;
    const montantRemise = totalHt * tauxRemise / 100;
    const netCommercial = totalHt - montantRemise;
    const tauxTva = bc.tauxTva || 20;
    const montantTva = netCommercial * tauxTva / 100;
    const totalTtc = netCommercial + montantTva;

    const totals = [
      { label: "Total HT", value: totalHt },
      { label: `Remise (${tauxRemise} %)`, value: -montantRemise },
      { label: "Net commercial", value: netCommercial },
      { label: `TVA (${tauxTva} %)`, value: montantTva },
      { label: "Total TTC", value: totalTtc, bold: true }
    ];

    totals.forEach((t, i) => {
      const lineY = y + i * 22;
      if (t.bold) {
        doc.rect(totalsX - 10, lineY - 4, totalsWidth + 20, 28)
           .fill("#f0f7ff");
      }
      doc.font(t.bold ? "Helvetica-Bold" : "Helvetica")
         .fontSize(t.bold ? 11 : 10)
         .fillColor(gray900)
         .text(t.label, totalsX, lineY + (t.bold ? 6 : 4));

      const valStr = Math.abs(t.value).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      doc.font(t.bold ? "Helvetica-Bold" : "Helvetica")
         .fontSize(t.bold ? 13 : 10)
         .fillColor(t.bold ? blue : gray900)
         .text(valStr + " MAD", totalsX, lineY + (t.bold ? 6 : 4), {
           width: totalsWidth - 20,
           align: "right"
         });
    });

    y += totals.length * 22 + 30;

    // =========================
    // MONTANT EN LETTRES
    // =========================
    doc.roundedRect(margin, y, contentWidth, 40, 12)
       .fill("#f8fbff")
       .stroke("#dbeafe");

    doc.font("Helvetica-Bold").fontSize(10).fillColor("#1e40af")
       .text("Montant en lettres :", margin + 20, y + 14);

    doc.font("Helvetica-Oblique").fontSize(10).fillColor(gray900)
       .text(bc.montantLettre || "—", margin + 140, y + 14, { width: contentWidth - 160 });

    y += 70;

    // =========================
    // USER + CHANTIER BOXES
    // =========================
    const boxW = (contentWidth - 30) / 2;
    const boxH = 80;

    // User
    doc.roundedRect(margin, y, boxW, boxH, 12).lineWidth(2).stroke("#e2e8f0").fill("#ffffff");
    doc.font("Helvetica-Bold").fontSize(10).fillColor(blue).text("Demandeur", margin + 20, y + 20);
    doc.font("Helvetica-Bold").fontSize(11).fillColor(gray900)
       .text(bc.demandeur || "-", margin + 20, y + 45, { width: boxW - 40 });

    // Chantier
    doc.roundedRect(margin + boxW + 30, y, boxW, boxH, 12).lineWidth(2).stroke("#e2e8f0").fill("#ffffff");
    doc.font("Helvetica-Bold").fontSize(10).fillColor(blue).text("Chantier", margin + boxW + 50, y + 20);
    doc.font("Helvetica-Bold").fontSize(11).fillColor(gray900)
       .text(bc.chantier?.nom || "Non renseigné", margin + boxW + 50, y + 45, { width: boxW - 40 });

    y += boxH + 50;

    // =========================
    // SIGNATURES (background AFTER everything else)
    // =========================
    doc.rect(margin - 10, y - 20, contentWidth + 20, 130)
       .fillOpacity(0.15)
       .fill(blueLight)
       .fillOpacity(1);

    const sigW = (contentWidth - 40) / 2;
    const sigH = 100;

    // Fournisseur signature box
    doc.roundedRect(margin, y, sigW, sigH, 12)
       .lineWidth(2)
       .stroke("#c3d4e9")
       .fill("#ffffff");

    doc.font("Helvetica-Bold").fontSize(9).fillColor(gray600)
       .text("CACHET & SIGNATURE DU FOURNISSEUR", margin, y + sigH + 10, {
         width: sigW, align: "center"
       });

    // Responsable achats
    const sig2X = margin + sigW + 40;
    doc.roundedRect(sig2X, y, sigW, sigH, 12)
       .lineWidth(2)
       .stroke("#c3d4e9")
       .fill("#ffffff");

    if (fs.existsSync(signaturePath)) {
      try {
        doc.image(signaturePath, sig2X + 20, y + 10, {
          width: sigW - 40,
          height: sigH - 30,
          align: "center",
          valign: "center"
        });
      } catch (_) {}
    }

    doc.font("Helvetica-Bold").fontSize(9).fillColor(gray600)
       .text("LE RESPONSABLE ACHATS", sig2X, y + sigH + 10, {
         width: sigW, align: "center"
       });

    doc.end();
  } catch (err) {
    console.error("Erreur génération PDF BC (email):", err);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
};


export const viewBc = async (req, res) => {
  try {
    const { id } = req.params;
    const bc = await prisma.bondeCommande.findUnique({
      where: { id: parseInt(id) },
      include: {
        commandesItems: true,
        fournisseur: true,
        chantier: true,
      }
    });
    if (!bc) {
      return res.status(404).json({ success: false, error: "Bon de commande non trouvée" });
    }
    res.render('dashboard/achats/bc/index', { bc });
  } catch (err) {
    console.error('Erreur affichage bon de commande:', err);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
};
export const editBc = async (req, res) => {
  try {
    const { id } = req.params;
    const bc = await prisma.bondeCommande.findUnique({
      where: { id: parseInt(id) },
      include: {
        commandesItems: true,
        fournisseur: true,
        chantier: true,
      }
    });
    if (!bc) {
      return res.status(404).json({ success: false, error: "Bon de commande non trouvée" });
    }
    const fournisseurs = await prisma.fournisseur.findMany()
    res.render('dashboard/achats/bc/edit', { bc, fournisseurs });
  } catch (err) {
    console.error('Erreur affichage bon de commande:', err);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
};
export const updateBc = async (req, res) => { 
  try {
    const { id } = req.params;
    const { supplier, date, montantLettres, tauxRemise, tauxTva, commandesItems = [] } = req.body || {};

    const bcId = parseInt(id);
    const fournisseurId = parseInt(supplier);
    const jsDate = new Date(date);

    if (!bcId || Number.isNaN(bcId)) {
      return res.status(400).json({ success: false, error: "ID invalide" });
    }
    if (!fournisseurId || Number.isNaN(fournisseurId)) {
      return res.status(400).json({ success: false, error: "Fournisseur invalide" });
    }
    if (!(jsDate instanceof Date) || isNaN(jsDate.getTime())) {
      return res.status(400).json({ success: false, error: "Date invalide" });
    }

    const lignesArray = Array.isArray(commandesItems) ? commandesItems : [];

    const existing = lignesArray
      .filter((l) => l && l.id)
      .map((l) => ({
        id: Number(l.id),
        designation: String(l.designation || "").trim(),
        unite: String(l.unite || ""),
        quantite: Number.parseInt(l.quantite) || 0,
        prixUnitaire: normalizeNumber(l.prixUnitaire),
      }))
      .filter((l) => Number.isInteger(l.id) && l.id > 0);

    const toCreate = lignesArray
      .filter((l) => !l || !l.id)
      .map((l) => ({
        designation: String(l?.designation || "").trim(),
        unite: String(l?.unite || ""),
        quantite: Number.parseInt(l?.quantite) || 0,
        prixUnitaire: normalizeNumber(l?.prixUnitaire),
      }))
      .filter((l) => l.designation);

    const allLines = [...existing, ...toCreate];
    let totalHt = 0;
    allLines.forEach((l) => {
      const q = l.quantite || 0;
      const p = l.prixUnitaire || 0;
      totalHt += q * p;
    });

    const remiseRate = parseFloat(tauxRemise) || 0; 
    const tvaRate = parseFloat(tauxTva) || 0;
    const montantRemise = totalHt * (remiseRate > 0 ? remiseRate : 0) / 100;
    const netCommercial = totalHt - montantRemise;
    const montantTva = netCommercial * (tvaRate > 0 ? tvaRate : 0) / 100;
    const totalTtc = netCommercial + montantTva;

    const updatedBc = await prisma.bondeCommande.update({
      where: { id: bcId },
      data: {
        date: jsDate,
        fournisseur: { connect: { id: fournisseurId } },
        totalHt,
        tauxRemise: remiseRate,
        netCommercial,
        tauxTva: tvaRate,
        totalTtc,
        montantLettre : montantLettres,
        commandesItems: {
          create: toCreate,
          update: existing.map((l) => ({
            where: { id: l.id },
            data: {
              designation: l.designation,
              unite: l.unite,
              quantite: l.quantite,
              prixUnitaire: l.prixUnitaire,
              totalHt: (l.quantite || 0) * (l.prixUnitaire || 0),
            },
          })),
        },
      },
      include: {
        commandesItems: true,
        fournisseur: true,
      },
    });

    return res.json({
      success: true,
      message: "Bon de commande mis à jour avec succès",
      bc: updatedBc,
    });
  } catch (error) {
    console.error("Erreur mise à jour bon de commande:", error);
    return res.status(500).json({ success: false, error: "Erreur serveur" });
  }
}

export const deleteBcItem = async (req, res) => {
  const { id } = req.params;
  try {
    const itemId = parseInt(id);
    if (!itemId || Number.isNaN(itemId)) {
      return res.status(400).json({ success: false, error: "ID invalide" });
    }

    await prisma.commandesItems.delete({
      where: { id: itemId },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error("Erreur suppression article BC:", error);
    return res.status(500).json({ success: false, error: "Erreur serveur" });
  }
};

export const createBcForm = async (req, res) => {
  try {
    const fournisseurs = await prisma.fournisseur.findMany();
    const chantiers = await prisma.chantier.findMany();
    res.render('dashboard/achats/bc/create', { fournisseurs, chantiers });
  } catch (error) {
    console.error("Erreur affichage formulaire BC:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
};
export const storeBc = async (req, res) => {
  try {
    const { supplier, date, tauxRemise, montantLettre, tauxTva, commandesItems = [] } = req.body || {};

    const fournisseurId = parseInt(supplier);
    const jsDate = new Date(date);

    if (!fournisseurId || Number.isNaN(fournisseurId)) {
      return res.status(400).json({ success: false, error: "Fournisseur invalide" });
    }
    if (!(jsDate instanceof Date) || isNaN(jsDate.getTime())) {
      return res.status(400).json({ success: false, error: "Date invalide" });
    }

    const lignesArray = Array.isArray(commandesItems) ? commandesItems : [];

    const toCreate = lignesArray
      .map((l) => ({
        designation: String(l?.designation || "").trim(),
        unite: String(l?.unite || ""),
        quantite: Number.parseInt(l?.quantite) || 0,
        prixUnitaire: normalizeNumber(l?.prixUnitaire),
      }))
      .filter((l) => l.designation);

    let totalHt = 0;
    toCreate.forEach((l) => {
      const q = l.quantite || 0;
      const p = l.prixUnitaire || 0;
      totalHt += q * p;
    });

    const remiseRate = parseFloat(tauxRemise) || 0;
    const tvaRate = parseFloat(tauxTva) || 0;
    const montantRemise = totalHt * (remiseRate > 0 ? remiseRate : 0) / 100;
    const netCommercial = totalHt - montantRemise;
    const montantTva = netCommercial * (tvaRate > 0 ? tvaRate : 0) / 100;
    const totalTtc = netCommercial + montantTva;

    const numero = Date.now();

    const bc = await prisma.bondeCommande.create({
      data: {
        date: jsDate,
        numero,
        totalHt,
        tauxRemise: remiseRate,
        netCommercial,
        tauxTva: tvaRate,
        totalTtc,
        montantLettre : montantLettre,
        fournisseur: { connect: { id: fournisseurId } },
        commandesItems: {
          create: toCreate.map((l) => ({
            designation: l.designation,
            unite: l.unite,
            quantite: l.quantite,
            prixUnitaire: l.prixUnitaire,
            totalHt: (l.quantite || 0) * (l.prixUnitaire || 0),
          })),
        },
      },
      include: {
        commandesItems: true,
        fournisseur: true,
      },
    });

    return res.json({
      success: true,
      message: "Bon de commande créé avec succès",
      bc,
    });
  } catch (error) {
    console.error("Erreur création BC:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
};