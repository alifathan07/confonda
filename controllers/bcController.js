import prisma from "../db.js";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import { fileURLToPath } from "url";
import { log } from "console";

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
      return res.status(400).json({
        success: false,
        error: "Aucun article ou demande invalide"
      });
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

    // Fetch all demande items once
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
      },
    });

    if (demandeItems.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Aucun article trouvé dans la demande"
      });
    }

    const itemMap = Object.fromEntries(
      demandeItems.map((i) => [i.id, i])
    );

    const createdBcIds = [];
    const baseNumero = Date.now();
    let offset = 0;

    for (const [fournisseurIdStr, itemIdsForFournisseur] of Object.entries(itemsByFournisseur)) {
      const fournisseurId = parseInt(fournisseurIdStr);

      const fournisseur = await prisma.fournisseur.findUnique({
        where: { id: fournisseurId },
      });

      if (!fournisseur) continue;

      const validItemIds = itemIdsForFournisseur.filter((id) => itemMap[id]);
      if (validItemIds.length === 0) continue;

      // Prepare items for commandesItems.create
      const lignesToCreate = validItemIds.map((id) => {
        const a = itemMap[id];
        const q = parseInt(a.quantité || "1");

        return {
          designation: a.designation,
          unite: a.unité || "",
          quantite: q,
        };
      });

      // Fetch chantier + demandeur from demandeFourniture
      const demandInfo = await prisma.demandeFourniture.findUnique({
        where: { id: demandeIdInt },
        select: { chantierId: true, demandeur: true },
      });

      const chantierId = demandInfo.chantierId;
      const demandeur = demandInfo.demandeur;

      // Create BC + commandesItems
      const newBc = await prisma.bondeCommande.create({
        data: {
          date: new Date(),
          fournisseurId,
          chantierId,
          demandeur,
          commandesItems: { create: lignesToCreate },
        },
        include: { commandesItems: true }, // important to create chantier allocations
      });

      // Create chantier allocations (BondeCommandeChantierItem)
      for (const item of newBc.commandesItems) {
        await prisma.bondeCommandeChantierItem.create({
          data: {
            bondeCommandeId: newBc.id,
            chantierId,
            itemId: item.id,
            qty: item.quantite,
            montant: null,
          },
        });
      }

      createdBcIds.push(newBc.id);
    }

    if (createdBcIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Aucun bon de commande créé"
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
    return res.status(500).json({
      success: false,
      error: "Erreur serveur"
    });
  }
};


export const deleteBc = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ success: false, error: 'ID invalide' });
    }

    await prisma.commandesItems.deleteMany({ where: { bondeCommandeId: id } });
    await prisma.bondeCommande.delete({ where: { id } });

    return res.json({ success: true });
  } catch (error) {
    console.error('Erreur suppression Bon De Commande:', error);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};


export const listBc = async (req, res) => {
  try {
    const bc = await prisma.bondeCommande.findMany({
      include: {
        commandesItems: {
          include: {
            BondeCommandeChantierItem: { include: { chantier: true } }
          }
        },
        fournisseur: true,
        // include direct chantier relation if present
        chantier: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    if (!bc) {
      return res.status(404).json({ success: false, error: "Bon de commande non trouvée" });
    }
    res.render('dashboard/achats/bc/list', { bc });
  } catch (err) {

    console.error('Erreur affichage bon de commande:', err);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
};


export const generateBcPDF = async (req, res) => {
  const { id } = req.params;
  const bcId = parseInt(id, 10);

  if (Number.isNaN(bcId)) {
    return res.status(400).json({ success: false, error: "ID invalide" });
  }

  try {
    // 1. Fetch Data
    const bc = await prisma.bondeCommande.findUnique({
      where: { id: bcId },
      include: {
        fournisseur: true,
        commandesItems: true,
        chantier: true,
      },
    });

    if (!bc) {
      return res.status(404).json({ success: false, error: "Bon de commande non trouvé" });
    }

    // 2. Setup PDF Document
    const doc = new PDFDocument({ size: "A4", margin: 40, bufferPages: true });

    // Response Headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=bonCommande_${bc.id}.pdf`
    );

    doc.pipe(res);

    // 3. Constants & Styling
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;

    const colors = {
      blue: "#0052CC",
      blueLight: "#f3f8ff",
      gray900: "#1f2937",
      gray800: "#374151",
      gray600: "#6b7280",
      border: "#e5e7eb",
      white: "#ffffff",
      tableHeader: "#0052CC",
      rowEven: "#ffffff",
      rowOdd: "#f9fafb",
    };

    const logoPath = path.join(__dirname, "../public/img/logo-4.png");
    const signaturePath = path.join(__dirname, "../public/img/signature.png");

    const headerHeight = 130;
    const footerHeight = 180; // Demandeur/Chantier + Signatures
    const rowHeight = 30;
    const colWidths = [40, 190, 60, 70, 85, 70];

    // 4. Helper Functions

    const drawHeader = () => {
      const y = margin;

      // Background for header
      doc.rect(margin - 10, y - 10, contentWidth + 20, headerHeight)
        .fillOpacity(0.15).fill(colors.blueLight).fillOpacity(1);

      // Logo
      if (fs.existsSync(logoPath)) {
        try {
          doc.image(logoPath, margin, y + 10, { width: 80 });
        } catch (e) {
          console.error("Error loading logo:", e);
        }
      }

      // Title
      doc.font("Helvetica-Bold").fontSize(24).fillColor(colors.gray900)
        .text("Bon de Commande", margin, y + 80);

      // Date & ID
      const dateStr = new Date(bc.date).toLocaleDateString("fr-FR", {
        weekday: "long", day: "numeric", month: "long", year: "numeric"
      });
      doc.font("Helvetica-Bold").fontSize(10).fillColor(colors.blue)
        .text(`N° ${bc.id} • ${dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}`, margin, y + 110);

      // Supplier Box
      const supplierBoxW = 220;
      const supplierBoxH = 110;
      const supplierBoxX = pageWidth - margin - supplierBoxW;
      const supplierBoxY = y + 10;

      // Box container
      doc.save()
        .lineWidth(1.5).strokeColor(colors.blue)
        .roundedRect(supplierBoxX, supplierBoxY, supplierBoxW, supplierBoxH, 10).stroke();
      doc.fillColor(colors.white)
        .roundedRect(supplierBoxX, supplierBoxY, supplierBoxW, supplierBoxH, 10).fill();

      // Header of box
      const boxHeaderH = 28;
      doc.fillColor(colors.blue)
        .roundedRect(supplierBoxX, supplierBoxY, supplierBoxW, boxHeaderH, 10).fill();
      // Fix corners for header
      doc.rect(supplierBoxX, supplierBoxY + 10, supplierBoxW, boxHeaderH - 10).fill(colors.blue);
      doc.roundedRect(supplierBoxX, supplierBoxY, supplierBoxW, boxHeaderH, 10).fill(colors.blue);

      doc.font("Helvetica-Bold").fontSize(10).fillColor(colors.white)
        .text("Fournisseur", supplierBoxX + 10, supplierBoxY + 8);

      // Supplier Info
      const infoY = supplierBoxY + boxHeaderH + 10;
      doc.font("Helvetica-Bold").fontSize(10).fillColor(colors.gray900)
        .text(bc.fournisseur?.name || "-", supplierBoxX + 10, infoY, { width: supplierBoxW - 20 });

      doc.font("Helvetica").fontSize(9).fillColor(colors.gray600)
        .text(bc.fournisseur?.email || "-", supplierBoxX + 10, infoY + 20, { width: supplierBoxW - 20 });

      doc.font("Helvetica").fontSize(9).fillColor(colors.gray600)
        .text(bc.fournisseur?.telFournisseur || "Non renseigné", supplierBoxX + 10, infoY + 35, { width: supplierBoxW - 20 });

      doc.restore();
    };

    const drawFooter = (yPosition) => {
      // If yPosition is not provided, place at bottom of page
      const startY = yPosition || (pageHeight - margin - footerHeight);

      // Demandeur & Chantier Boxes
      const boxW = (contentWidth - 20) / 2;
      const boxH = 60;

      // Demandeur
      doc.roundedRect(margin, startY, boxW, boxH, 8).lineWidth(1).stroke(colors.border);
      doc.font("Helvetica-Bold").fontSize(10).fillColor(colors.blue)
        .text("Demandeur", margin + 10, startY + 10);
      doc.font("Helvetica-Bold").fontSize(10).fillColor(colors.gray900)
        .text(bc.demandeur || "-", margin + 10, startY + 30, { width: boxW - 20 });

      // Chantier
      doc.roundedRect(margin + boxW + 20, startY, boxW, boxH, 8).lineWidth(1).stroke(colors.border);
      doc.font("Helvetica-Bold").fontSize(10).fillColor(colors.blue)
        .text("Chantier", margin + boxW + 30, startY + 10);
      doc.font("Helvetica-Bold").fontSize(10).fillColor(colors.gray900)
        .text(bc.chantier?.nom || "-", margin + boxW + 30, startY + 30, { width: boxW - 20 });

      // Signatures
      const sigY = startY + boxH + 15;
      const sigH = 80;
      const sigW = (contentWidth - 20) / 2;

      // Cachet & Signature Fournisseur
      doc.roundedRect(margin, sigY, sigW, sigH, 8).lineWidth(1).stroke("#c3d4e9");
      doc.font("Helvetica-Bold").fontSize(9).fillColor(colors.gray600)
        .text("CACHET & SIGNATURE DU FOURNISSEUR", margin, sigY + sigH - 20, { width: sigW, align: "center" });

      // Responsable Achats
      const sig2X = margin + sigW + 20;
      doc.roundedRect(sig2X, sigY, sigW, sigH, 8).lineWidth(1).stroke("#c3d4e9");

      if (fs.existsSync(signaturePath)) {
        try {
          doc.image(signaturePath, sig2X + (sigW - 100) / 2, sigY + 10, { width: 100, height: 50, fit: [100, 50] });
        } catch (e) {
          console.error("Error loading signature:", e);
        }
      }

      doc.font("Helvetica-Bold").fontSize(9).fillColor(colors.gray600)
        .text("LE RESPONSABLE ACHATS", sig2X, sigY + sigH - 20, { width: sigW, align: "center" });
    };

    const drawTableHeader = (y) => {
      doc.rect(margin, y, contentWidth, rowHeight).fill(colors.tableHeader);
      const headers = ["N°", "Désignation", "Unité", "Quantité", "P.U. HT", "Total HT"];
      let x = margin;
      headers.forEach((h, i) => {
        doc.font("Helvetica-Bold").fontSize(9).fillColor(colors.white)
          .text(h, x + 5, y + 10, { width: colWidths[i] - 10, align: i === 0 || i >= 3 ? "center" : "left" });
        x += colWidths[i];
      });
      return y + rowHeight;
    };

    const drawTableRow = (y, item, index) => {
      const bg = index % 2 === 0 ? colors.rowEven : colors.rowOdd;
      doc.rect(margin, y, contentWidth, rowHeight).fill(bg);

      let x = margin;
      // Borders
      colWidths.forEach(w => {
        doc.rect(x, y, w, rowHeight).lineWidth(0.5).stroke(colors.border);
        x += w;
      });

      x = margin;

      // N°
      doc.circle(x + 20, y + 15, 10).fill(colors.blue);
      doc.font("Helvetica-Bold").fontSize(9).fillColor(colors.white)
        .text(String(index + 1), x, y + 10, { width: colWidths[0], align: "center" });
      x += colWidths[0];

      // Désignation
      doc.font("Helvetica-Bold").fontSize(9).fillColor(colors.gray900)
        .text(item.designation || "-", x + 5, y + 10, { width: colWidths[1] - 10, lineBreak: false, ellipsis: true });
      x += colWidths[1];

      // Unité
      doc.font("Helvetica").fontSize(9).fillColor(colors.gray800)
        .text(item.unite || "-", x, y + 10, { width: colWidths[2], align: "center" });
      x += colWidths[2];

      // Quantité
      doc.roundedRect(x + 10, y + 6, colWidths[3] - 20, 18, 9).fill("#e2e8f0");
      doc.font("Helvetica-Bold").fontSize(9).fillColor(colors.gray900)
        .text(String(item.quantite || 0), x, y + 10, { width: colWidths[3], align: "center" });
      x += colWidths[3];

      // P.U.
      const pu = (item.prixUnitaire || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      doc.font("Helvetica").fontSize(9).fillColor(colors.gray900)
        .text(pu, x, y + 10, { width: colWidths[4] - 5, align: "right" });
      x += colWidths[4];

      // Total HT
      const total = ((item.quantite || 0) * (item.prixUnitaire || 0)).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      doc.font("Helvetica").fontSize(9).fillColor(colors.gray900)
        .text(total, x, y + 10, { width: colWidths[5] - 5, align: "right" });

      return y + rowHeight;
    };

    const drawTotals = (y) => {
      const totalsWidth = 250;
      const totalsX = pageWidth - margin - totalsWidth;

      const totalHt = bc.totalHt || 0;
      const tauxRemise = bc.tauxRemise || 0;
      const montantRemise = totalHt * tauxRemise / 100;
      const netCommercial = totalHt - montantRemise;
      const tauxTva = bc.tauxTva || 20;
      const montantTva = netCommercial * tauxTva / 100;
      const totalTtc = netCommercial + montantTva;

      const lines = [
        { label: "Total HT", value: totalHt },
        { label: `Remise (${tauxRemise}%)`, value: -montantRemise },
        { label: "Net Commercial", value: netCommercial },
        { label: `TVA (${tauxTva}%)`, value: montantTva },
        { label: "Total TTC", value: totalTtc, bold: true, size: 12 },
      ];

      const boxHeight = lines.length * 20 + 20;

      doc.roundedRect(totalsX, y, totalsWidth, boxHeight, 10)
        .fillAndStroke(colors.blueLight, "#dbeafe");

      let currentY = y + 10;
      lines.forEach(line => {
        doc.font(line.bold ? "Helvetica-Bold" : "Helvetica")
          .fontSize(line.size || 10)
          .fillColor(line.bold ? colors.blue : colors.gray900)
          .text(line.label, totalsX + 10, currentY);

        const valStr = Math.abs(line.value).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " MAD";
        doc.text(valStr, totalsX + 10, currentY, { width: totalsWidth - 20, align: "right" });

        currentY += 20;
      });

      return y + boxHeight;
    };

    const drawMontantLettres = (y) => {
      const height = 40;
      doc.roundedRect(margin, y, contentWidth, height, 8)
        .fill(colors.blueLight).stroke("#dbeafe");

      doc.font("Helvetica-Bold").fontSize(10).fillColor(colors.blue)
        .text("Montant en lettres :", margin + 15, y + 14);

      doc.font("Helvetica-Oblique").fontSize(10).fillColor(colors.gray900)
        .text(bc.montantLettre || "—", margin + 130, y + 14);

      return y + height;
    };

    // 5. Main Render Logic

    let currentY = margin + headerHeight + 20;
    drawHeader();

    // Table Logic
    const items = bc.commandesItems || [];
    const isMultiPage = items.length > 7;

    currentY = drawTableHeader(currentY);

    for (let i = 0; i < items.length; i++) {
      // Check for overflow
      // Only trigger new page if isMultiPage is true AND we are running out of space
      // We reserve space for the footer if we are on the last page (or potentially last)
      // But if isMultiPage is false, we try to squeeze it in (it should fit by design for <= 7 items)

      const spaceNeeded = rowHeight;
      // If we are in multi-page mode, we need to ensure we don't hit the footer area
      // If we are NOT in multi-page mode, we just print (assuming it fits)

      const effectivePageHeight = pageHeight - margin;
      const footerZoneHeight = footerHeight + 50; // Buffer

      if (isMultiPage && (currentY + spaceNeeded > effectivePageHeight - footerZoneHeight)) {
        doc.addPage();
        drawHeader();
        currentY = margin + headerHeight + 20;
        currentY = drawTableHeader(currentY);
      }

      currentY = drawTableRow(currentY, items[i], i);
    }

    // Totals & Montant en lettres
    const totalsHeight = 140;
    const montantHeight = 50;
    const bottomBlockHeight = totalsHeight + montantHeight;

    // Check if we have space for Totals + Montant + Footer
    // If not, and we are allowed to add pages (isMultiPage), we add a page.
    // If !isMultiPage, we still might have to add a page if it physically doesn't fit, 
    // but we'll try to keep it together.

    const spaceForFooter = footerHeight + 20;
    const spaceNeededForEnd = bottomBlockHeight + spaceForFooter;
    const spaceRemaining = pageHeight - margin - currentY;

    if (spaceRemaining < spaceNeededForEnd) {
      if (isMultiPage) {
        doc.addPage();
        drawHeader();
        currentY = margin + headerHeight + 20;
      }
      // If !isMultiPage, we hope it fits. If it really doesn't, PDFKit might just overflow or we should force a page.
      // But requirement says "all items are rendered on a single page". It doesn't say "totals must be on same page as items if items <= 7".
      // However, usually "single page" means the whole doc.
      // With 7 items, currentY ~ 130 + 20 + 30 + (7*30) = 390.
      // Space needed ~ 200 (totals) + 180 (footer) = 380.
      // 390 + 380 = 770. Page height 841. It fits.
    } else {
      currentY += 20; // Spacing after table
    }

    // Draw Totals
    currentY = drawTotals(currentY);
    currentY += 10;

    // Draw Montant en lettres
    currentY = drawMontantLettres(currentY);

    // Draw Footer at bottom of the current (last) page
    // We use the fixed footer height to position it at the bottom
    drawFooter();

    doc.end();

  } catch (error) {
    console.error("Error generating BC PDF:", error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: "Erreur lors de la génération du PDF" });
    }
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
      try { doc.image(logoPath, margin, y + 10, { width: 80 }); } catch (_) { }
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

    // 1. Calculate total block height
    const totalRowsHeight = totals.length * 22 + 10;   // adjust padding
    const blockY = y - 4;                              // start a bit above
    const blockX = totalsX - 10;
    const blockWidth = totalsWidth + 20;

    // 2. Draw one big rounded rectangle
    doc.roundedRect(blockX, blockY, blockWidth, totalRowsHeight, 10)
      .fillAndStroke("#f0f7ff", "#dbeafe");

    // 3. Print each total line INSIDE the same shape
    totals.forEach((t, i) => {
      const lineY = y + i * 22;

      doc.font(t.bold ? "Helvetica-Bold" : "Helvetica")
        .fontSize(t.bold ? 11 : 10)
        .fillColor(gray900)
        .text(t.label, totalsX, lineY + (t.bold ? 6 : 4));

      const valStr = Math.abs(t.value).toLocaleString("fr-FR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });

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
      } catch (_) { }
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
    const chantiers = await prisma.chantier.findMany();
    const bc = await prisma.bondeCommande.findUnique({
      where: { id: parseInt(id) },
      include: {
        commandesItems: {
          include: {
            BondeCommandeChantierItem: {   // ✅ correct relation name
              include: { chantier: true }  // Include chantier details
            }
          }
        },
        fournisseur: true,
      }
    });


    if (!bc) {
      return res.status(404).json({ success: false, error: "Bon de commande non trouvée" });
    }
    const fournisseurs = await prisma.fournisseur.findMany()
    res.render('dashboard/achats/bc/edit', { bc, fournisseurs, chantiers });
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

    // Separate existing vs toCreate, AND extract distribution data
    const existing = lignesArray
      .filter((l) => l && l.id)
      .map((l) => ({
        id: Number(l.id),
        designation: String(l.designation || "").trim(),
        unite: String(l.unite || ""),
        quantite: Number.parseInt(l.quantite) || 0,
        prixUnitaire: normalizeNumber(l.prixUnitaire),
        chantierDistribution: l.chantierDistribution || [] // Capture distribution
      }))
      .filter((l) => Number.isInteger(l.id) && l.id > 0);

    const toCreate = lignesArray
      .filter((l) => !l || !l.id)
      .map((l) => ({
        designation: String(l?.designation || "").trim(),
        unite: String(l?.unite || ""),
        quantite: Number.parseInt(l?.quantite) || 0,
        prixUnitaire: normalizeNumber(l?.prixUnitaire),
        chantierDistribution: l?.chantierDistribution || [] // Capture distribution
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

    // First, perform the main update on BC and items (create/update fields)
    // We ignore distribution in this step
    await prisma.bondeCommande.update({
      where: { id: bcId },
      data: {
        date: jsDate,
        fournisseur: { connect: { id: fournisseurId } },
        totalHt,
        tauxRemise: remiseRate,
        netCommercial,
        tauxTva: tvaRate,
        totalTtc,
        montantLettre: montantLettres,
        commandesItems: {
          create: toCreate.map(l => ({
            designation: l.designation,
            unite: l.unite,
            quantite: l.quantite,
            prixUnitaire: l.prixUnitaire,
            totalHt: l.quantite * l.prixUnitaire
          })),
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
      }
    });

    // Second, reload the BC with all its items to sync distribution items
    // We need to match back 'toCreate' items (which now have IDs) and 'existing' items
    const updatedBcWithItems = await prisma.bondeCommande.findUnique({
      where: { id: bcId },
      include: { commandesItems: true }
    });

    if (!updatedBcWithItems) {
      return res.status(404).json({ success: false, error: "Bon de commande introuvable après mise à jour" });
    }

    // Process distribution for each current item in DB
    for (const item of updatedBcWithItems.commandesItems) {
      // Find the source data for this item.
      // 1. Try to find in 'existing' by ID
      let sourceData = existing.find(e => e.id === item.id);

      // 2. If not found (meaning it was just created), try to find in 'toCreate' by details
      // This is a heuristic: matching by designation + amounts. Ideally we'd have a temp ID, but this usually works.
      if (!sourceData) {
        sourceData = toCreate.find(c =>
          c.designation === item.designation &&
          Math.abs(c.quantite - item.quantite) < 0.001 &&
          Math.abs(c.prixUnitaire - item.prixUnitaire) < 0.001
        );
      }

      if (sourceData && Array.isArray(sourceData.chantierDistribution)) {
        // Clear old distribution
        await prisma.bondeCommandeChantierItem.deleteMany({
          where: { itemId: item.id }
        });

        // Insert new distribution
        for (const dist of sourceData.chantierDistribution) {
          await prisma.bondeCommandeChantierItem.create({
            data: {
              bondeCommandeId: bcId,
              itemId: item.id,
              chantierId: parseInt(dist.chantierId),
              qty: parseInt(dist.qty) || 0,
              montant: parseFloat(dist.montant) || 0
            }
          });
        }
      }
    }

    // Final fetch to return complete structure
    const finalBc = await prisma.bondeCommande.findUnique({
      where: { id: bcId },
      include: {
        commandesItems: {
          include: { BondeCommandeChantierItem: true }
        },
        fournisseur: true,
      },
    });

    return res.json({
      success: true,
      message: "Bon de commande mis à jour avec succès",
      bc: finalBc,
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

export const updateBcItemDistribution = async (req, res) => {
  try {
    const itemId = parseInt(req.params.itemId);
    if (!itemId || Number.isNaN(itemId)) {
      return res.status(400).json({ success: false, error: 'Item ID invalide' });
    }

    const { distribution } = req.body || {};
    const distArray = Array.isArray(distribution) ? distribution : [];

    // Ensure item exists and get parent BC id
    const item = await prisma.commandesItems.findUnique({ where: { id: itemId } });
    if (!item) return res.status(404).json({ success: false, error: 'Article introuvable' });

    const bcId = item.bondeCommandeId;

    // Remove existing distributions for this item
    await prisma.bondeCommandeChantierItem.deleteMany({ where: { itemId } });

    // Insert new distributions
    for (const d of distArray) {
      const chantierId = parseInt(d.chantierId);
      const qty = parseInt(d.qty) || 0;
      const montant = normalizeNumber(d.montant || 0);
      if (!chantierId) continue;
      await prisma.bondeCommandeChantierItem.create({
        data: {
          bondeCommandeId: bcId,
          itemId,
          chantierId,
          qty,
          montant,
        }
      });
    }

    // Return updated distributions for this item
    const updated = await prisma.bondeCommandeChantierItem.findMany({ where: { itemId } });
    return res.json({ success: true, distribution: updated });
  } catch (error) {
    console.error('Erreur mise à jour distribution article BC:', error);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
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
    const { supplier, date, tauxRemise, montantLettre, tauxTva, commandesItems = [], distributionData = [] } = req.body || {};

    const fournisseurId = parseInt(supplier);
    const jsDate = new Date(date);

    if (!fournisseurId || Number.isNaN(fournisseurId)) {
      return res.status(400).json({ success: false, error: "Fournisseur invalide" });
    }
    if (!(jsDate instanceof Date) || isNaN(jsDate.getTime())) {
      return res.status(400).json({ success: false, error: "Date invalide" });
    }

    const lignesArray = Array.isArray(commandesItems) ? commandesItems : [];
    const data = Array.isArray(distributionData) ? distributionData : [];
    const toCreate = lignesArray
      .map((l) => ({
        designation: String(l?.designation || "").trim(),
        unite: String(l?.unite || ""),
        quantite: Number.parseInt(l?.quantite) || 0,
        prixUnitaire: normalizeNumber(l?.prixUnitaire),
        chantierDistribution: l?.chantierDistribution || [],
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

    // Step 1: Create BC + items
    const bc = await prisma.bondeCommande.create({
      data: {
        date: jsDate,
        numero,
        totalHt,
        tauxRemise: remiseRate,
        netCommercial,
        tauxTva: tvaRate,
        totalTtc,
        montantLettre,
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
      include: { commandesItems: true, fournisseur: true },
    });

    // Step 2: Create the distribution (BondeCommandeChantierItem)
    for (const item of bc.commandesItems) {
      const itemDistribution = toCreate.find(l => l.designation === item.designation)?.chantierDistribution || [];
      for (const d of itemDistribution) {
        await prisma.bondeCommandeChantierItem.create({
          data: {
            bondeCommandeId: bc.id,
            itemId: item.id,
            chantierId: parseInt(d.chantierId),
            qty: parseInt(d.qty) || 0,
            montant: parseFloat(d.montant) || 0,
          },
        });
      }
    }




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

export const updateBcItem = async (req, res) => {
  try {
    const itemId = parseInt(req.params.itemId);
    if (!itemId || Number.isNaN(itemId)) {
      return res.status(400).json({ success: false, error: 'Item ID invalide' });
    }

    const { designation, unite, quantite, prixUnitaire } = req.body || {};

    // Ensure item exists
    const item = await prisma.commandesItems.findUnique({ where: { id: itemId } });
    if (!item) return res.status(404).json({ success: false, error: 'Article introuvable' });

    // Update item fields
    const updatedItem = await prisma.commandesItems.update({
      where: { id: itemId },
      data: {
        designation: designation !== undefined ? designation : item.designation,
        unite: unite !== undefined ? unite : item.unite,
        quantite: quantite !== undefined ? parseInt(quantite) || 0 : item.quantite,
        prixUnitaire: prixUnitaire !== undefined ? normalizeNumber(prixUnitaire) : item.prixUnitaire,
      }
    });

    return res.json({ success: true, item: updatedItem });
  } catch (error) {
    console.error('Erreur mise à jour article BC:', error);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};
