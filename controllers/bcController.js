import prisma from "../db.js";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import axios from "axios";
import { fileURLToPath } from "url";
import { log } from "console";
import crypto from "crypto";
import { numberToFrenchWords } from "../utils/utils.js";
import ExcelJS from 'exceljs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mailTransporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "confonda@gmail.com",
    pass: "kxdl rgui vvxw eyfw",
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

const PUBLIC_BC_SECRET = process.env.PUBLIC_BC_SECRET || 'confonda_public_bc_secret';

const signPublicBcId = (id) => {
  return crypto
    .createHmac('sha256', PUBLIC_BC_SECRET)
    .update(String(id))
    .digest('hex');
};

const buildPublicBcUrl = (req, bcId) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const sig = signPublicBcId(bcId);
  return `${baseUrl}/public/bc/${bcId}?sig=${sig}`;
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
        lot: true,
        imputation: true
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

    // Compute next BC numero (numero is a String in Prisma schema)
    const recentBcs = await prisma.bondeCommande.findMany({
      select: { numero: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    const currentMaxNumero = recentBcs.reduce((max, bc) => {
      const n = parseInt(bc?.numero, 10);
      return Number.isNaN(n) ? max : Math.max(max, n);
    }, 0);
    let nextNumero = currentMaxNumero + 1;

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
          reference: a.lot,
          imputation: a.imputation

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
          numero: String(nextNumero++),
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
  const isMultiPage = true; // Use multi-page logic by default

  if (Number.isNaN(bcId)) {
    return res.status(400).json({ success: false, error: "ID invalide" });
  }

  try {
    // 1. Fetch Data
    const bc = await prisma.bondeCommande.findUnique({
      where: { id: bcId },
      include: {
        fournisseur: true,
        commandesItems: {
          include: {
            BondeCommandeChantierItem: { include: { chantier: true } }
          }
        },
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
      brand: "#A22C29",
      gray900: "#1f2937",
      gray800: "#374151",
      gray600: "#6b7280",
      border: "#cfd6df",
      borderSoft: "#c3cbd6",
      rowBorder: "#eef1f5",
      white: "#ffffff",
      tableHeader: "#0052CC",
      rowEven: "#ffffff",
      rowOdd: "#f9fafb",
    };

    const logoPath = path.join(__dirname, "../public/img/logo-4.png");
    const signaturePath = path.join(__dirname, "../public/img/signature.png");

    const headerHeight = 150;
    const companyFooterHeight = 100;
    const footerHeight = 184 + 12 + companyFooterHeight;
    const rowHeight = 22;
    const colWidths = [28, 55, 160, 45, 50, 60, 45, 72];

    // 4. Helper Functions

    const sanitizePdfNumber = (s) => String(s || "").replace(/[\u202F\u00A0]/g, " ");
    const fmtMoney = (n) => sanitizePdfNumber(Number(n || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    const fmtPct = (n) => sanitizePdfNumber(Number(n || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

    const tvaRate = normalizeNumber(bc.tauxTva || 0);
    const items = Array.isArray(bc.commandesItems) ? bc.commandesItems : [];
    const computedTotalHt = normalizeNumber(bc.totalHt ?? 0);
    const computedTtc = normalizeNumber(bc.totalTtc ?? 0);
    const computedTva = normalizeNumber((computedTtc || 0) - (computedTotalHt || 0));
    const docDateStr = new Date(bc.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
    const publicBcUrl = buildPublicBcUrl(req, bc.id);

    const drawHeader = async () => {
      const y = margin;

      // Topline (logo left, centered brand block)
      const toplineY = y;
      const toplineH = 70;

      if (fs.existsSync(logoPath)) {
        try {
          doc.image(logoPath, margin, toplineY + 2, { height: 60 });
        } catch (e) {
          console.error("Error loading logo:", e);
        }
      }

      // Centered brand text + vertical separator (mimic bc.ejs)
      const centerX = margin + contentWidth / 2;
      const sepW = 6;
      const sepH = 44;
      const sepX = centerX - sepW / 2;
      const sepY = toplineY + 12;
      doc.rect(sepX, sepY, sepW, sepH).fill(colors.brand);

      doc.font("Helvetica-Bold").fontSize(13).fillColor(colors.brand)
        .text("Construction et Fondation", centerX + 14, toplineY + 18, { align: "left" });
      doc.font("Helvetica").fontSize(9).fillColor(colors.gray600)
        .text("Pour des constructions bien fondées", centerX + 14, toplineY + 36, { align: "left" });

      // Header grid (3 boxes)
      const gridY = toplineY + toplineH + 12;
      const gap = 10;
      const boxW = (contentWidth - gap * 2) / 3;
      const boxH = 68;

      // Meta (left)
      doc.roundedRect(margin, gridY, boxW, boxH, 8).lineWidth(1).stroke(colors.border);
      doc.font("Helvetica-Bold").fontSize(11).fillColor(colors.gray900)
        .text(`BC N° : ${bc.id}`, margin + 10, gridY + 14, { width: boxW - 20 });
      doc.font("Helvetica-Bold").fontSize(11).fillColor(colors.gray900)
        .text(`Date : ${docDateStr}`, margin + 10, gridY + 38, { width: boxW - 20 });

      // QR (center)
      const qrX = margin + boxW + gap;
      doc.roundedRect(qrX, gridY, boxW, boxH, 8).lineWidth(1).stroke(colors.border);
      try {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(publicBcUrl || "")}`;
        const qrResp = await axios.get(qrUrl, { responseType: "arraybuffer" });
        const imgSize = 54;
        const imgX = qrX + (boxW - imgSize) / 2;
        const imgY = gridY + 7;
        doc.image(Buffer.from(qrResp.data), imgX, imgY, { width: imgSize, height: imgSize });
      } catch (e) {
        doc.font("Helvetica").fontSize(7.5).fillColor(colors.gray600)
          .text(publicBcUrl, qrX + 8, gridY + 26, { width: boxW - 16, align: "center", ellipsis: true });
      }

      // Fournisseur (right)
      const cliX = margin + (boxW + gap) * 2;
      doc.roundedRect(cliX, gridY, boxW, boxH, 8).lineWidth(1).stroke(colors.border);
      const lineW = boxW - 16;
      doc.font("Helvetica-Bold").fontSize(9.5).fillColor(colors.gray900)
        .text(bc.fournisseur?.name || "-", cliX + 8, gridY + 8, { width: lineW, ellipsis: true });
      doc.font("Helvetica").fontSize(8.5).fillColor(colors.gray600)
        .text(bc.fournisseur?.email || "-", cliX + 8, gridY + 24, { width: lineW, ellipsis: true });
      doc.font("Helvetica").fontSize(8.5).fillColor(colors.gray600)
        .text(bc.fournisseur?.telFournisseur || "Non renseigné", cliX + 8, gridY + 38, { width: lineW, ellipsis: true });
    };


    const drawChantier = (yPosition) => {
      const startY = yPosition ?? (pageHeight - margin - footerHeight);
      const gap = 12;
      const cardW = (contentWidth - gap) / 2;
      const cardH = 86;

      const chantierX = margin;
      const livraisonX = margin + cardW + gap;

      // Card 1: Chantier
      doc.roundedRect(chantierX, startY, cardW, cardH, 8).lineWidth(1).stroke(colors.borderSoft);
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor(colors.gray900)
        .text("CHANTIER", chantierX + 10, startY + 10, { width: cardW - 20 });
      doc.font("Helvetica").fontSize(9).fillColor(colors.gray800)
        .text((() => {
          const names = new Set();
          if (bc.chantier?.nom) names.add(bc.chantier.nom);
          (bc.commandesItems || []).forEach(it => {
            (it.BondeCommandeChantierItem || []).forEach(bcci => {
              if (bcci?.chantier?.nom) names.add(bcci.chantier.nom);
            });
          });
          return Array.from(names).join(', ') || "-";
        })(), chantierX + 10, startY + 30, { width: cardW - 20, ellipsis: true });

      // Card 2: Livraison (date + lieu in the same card)
      doc.roundedRect(livraisonX, startY, cardW, cardH, 8).lineWidth(1).stroke(colors.borderSoft);
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor(colors.gray900)
        .text("LIVRAISON", livraisonX + 10, startY + 10, { width: cardW - 20 });

      const dateLivStr = bc.dateLivraison
        ? new Date(bc.dateLivraison).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : "-";
      doc.font("Helvetica").fontSize(8.5).fillColor(colors.gray800)
        .text(`Date : ${dateLivStr}`, livraisonX + 10, startY + 30, { width: cardW - 20, ellipsis: true });
      doc.font("Helvetica").fontSize(8.5).fillColor(colors.gray800)
        .text(`Lieu : ${bc.lieuLivraison || "-"}`, livraisonX + 10, startY + 48, { width: cardW - 20, ellipsis: true });

      return { startY, cardH };
    };


    const drawFooter = (yPosition) => {
      const startY = yPosition || (pageHeight - margin - footerHeight);
      const gap = 12;
      const sigW = (contentWidth - gap) / 2;
      const sigH = 86;

      const chantier = drawChantier(startY);
      const sigStartY = chantier.startY + chantier.cardH + gap;

      // Signature du direction (left)
      doc.roundedRect(margin, sigStartY, sigW, sigH, 8).lineWidth(1).stroke(colors.borderSoft);
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor(colors.gray900)
        .text("SIGNATURE DU DIRECTION", margin + 10, sigStartY + 10);
      doc.moveTo(margin + 10, sigStartY + sigH - 18).lineTo(margin + sigW - 10, sigStartY + sigH - 18)
        .lineWidth(1).stroke(colors.borderSoft);

      // Le Responsable Achats (right)
      const sig2X = margin + sigW + gap;
      doc.roundedRect(sig2X, sigStartY, sigW, sigH, 8).lineWidth(1).stroke(colors.borderSoft);
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor(colors.gray900)
        .text("LE RESPONSABLE ACHATS", sig2X + 10, sigStartY + 10);

      if (fs.existsSync(signaturePath)) {
        try {
          const fitW = sigW - 20;
          const fitH = 60;
          const imgX = sig2X + (sigW - fitW) / 2;
          const imgY = sigStartY + 22;
          doc.image(signaturePath, imgX, imgY, { fit: [fitW, fitH], align: "center", valign: "center" });
        } catch (e) {
          console.error("Error loading signature:", e);
        }
      }

      doc.moveTo(sig2X + 10, sigStartY + sigH - 18).lineTo(sig2X + sigW - 10, sigStartY + sigH - 18)
        .lineWidth(1).stroke(colors.borderSoft);

      const footerY = pageHeight - companyFooterHeight;

      doc.rect(0, footerY, pageWidth, companyFooterHeight).fill('#AB3029').stroke();

      const textMargin = 15;
      doc.font('Helvetica').fontSize(9).fillColor('#FFFFFF');
      doc.text(
        '82, angle Bd abdelmoumen et rue Soumaya Imm.Shahrazad III 2ème étage Casablanca Tél : 0522-23-39-70',
        50,
        footerY + textMargin,
        { width: pageWidth - 100, align: 'center' }
      );
      doc.text(
        'Fax : 0522-23-42-60  Capital : 18 500 000.00 DH  CNSS : 7167788 - R.C. : 145619 – I.F. : 1602714 – Patente : 37900708- I.C.E : 001526422000063',
        50,
        footerY + textMargin + 15,
        { width: pageWidth - 100, align: 'center' }
      );
    };

    const drawTableHeader = (y) => {
      doc.rect(margin, y, contentWidth, rowHeight).fill(colors.tableHeader);
      const headers = ["N°", "Reference", "Désignation", "Quantité", "Unité", "Prix U. HT", "Remise (%)", "Total HT"];
      let x = margin;
      headers.forEach((h, i) => {
        doc.font("Helvetica-Bold").fontSize(8).fillColor(colors.white)
          .text(h, x + 4, y + 7, { width: colWidths[i] - 8, align: i === 2 ? "left" : "center" });
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
        doc.rect(x, y, w, rowHeight).lineWidth(0.6).stroke(colors.rowBorder);
        x += w;
      });

      x = margin;

      // N°
      doc.font("Helvetica").fontSize(8).fillColor(colors.gray900)
        .text(String(index + 1), x + 4, y + 7, { width: colWidths[0] - 12, align: "center" });
      x += colWidths[0];

      // Reference
      doc.font("Helvetica").fontSize(8).fillColor(colors.gray800)
        .text(item.reference || "", x + 4, y + 7, { width: colWidths[1] - 8, align: "left", ellipsis: true });
      x += colWidths[1];

      // Désignation
      doc.font("Helvetica").fontSize(8).fillColor(colors.gray900)
        .text(item.designation || "-", x + 4, y + 7, { width: colWidths[2] - 8, ellipsis: true });
      x += colWidths[2];

      // Quantité
      doc.font("Helvetica").fontSize(8).fillColor(colors.gray900)
        .text(String(item.quantite ?? 0), x, y + 7, { width: colWidths[3], align: "center" });
      x += colWidths[3];

      // Unité
      doc.font("Helvetica").fontSize(8).fillColor(colors.gray800)
        .text(item.unite || "", x, y + 7, { width: colWidths[4], align: "center", ellipsis: true });
      x += colWidths[4];

      // Prix U.
      doc.font("Helvetica").fontSize(8).fillColor(colors.gray900)
        .text(fmtMoney(item.prixUnitaire ?? 0), x, y + 7, { width: colWidths[5] - 6, align: "right" });
      x += colWidths[5];

      // Remise
      doc.font("Helvetica").fontSize(8).fillColor(colors.gray800)
        .text(fmtPct(item.tauxRemise ?? 0), x, y + 7, { width: colWidths[6], align: "center" });
      x += colWidths[6];

      // Total HT (net)
      const itemTotalHt = (() => {
        const stored = normalizeNumber(item.totalHt);
        if (stored) return stored;
        const q = normalizeNumber(item.quantite);
        const pu = normalizeNumber(item.prixUnitaire);
        const remiseAmt = normalizeNumber(item.remise);
        return (q * pu) - remiseAmt;
      })();
      doc.font("Helvetica").fontSize(8).fillColor(colors.gray900)
        .text(fmtMoney(itemTotalHt), x, y + 7, { width: colWidths[7] - 6, align: "right" });

      return y + rowHeight;
    };

    const drawTotals = (y) => {
      const totalsWidth = 250;
      const totalsX = pageWidth - margin - totalsWidth;

      const lines = [
        { label: "Total HT", value: computedTotalHt },
        { label: `TVA (${fmtPct(tvaRate)}%)`, value: computedTva },
        { label: "Total TTC", value: computedTtc, bold: true, size: 12 },
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

        const valStr = fmtMoney(Math.abs(line.value)) + " MAD";
        doc.text(valStr, totalsX + 10, currentY, { width: totalsWidth - 20, align: "right" });

        currentY += 20;
      });

      return y + boxHeight;
    };

    const drawMontantLettres = (y) => {
      const height = 48;
      doc.roundedRect(margin, y, contentWidth, height, 8)
        .fillAndStroke("#f3f4f6", colors.border);

      doc.font("Helvetica-Bold").fontSize(10).fillColor(colors.gray900)
        .text("Montant en lettres", margin + 15, y + 10);

      doc.font("Helvetica-Bold").fontSize(10).fillColor(colors.gray900)
        .text(bc.montantLettre || "—", margin + 15, y + 28, { width: contentWidth - 30 });

      return y + height;
    };

    // 5. Main Render Logic

    let currentY = margin + headerHeight + 18;
    await drawHeader();

    // Table Logic
    const maxRowsPerPage = 20;

    currentY = drawTableHeader(currentY);
    let rowsOnPage = 0;

    for (let i = 0; i < items.length; i++) {
      // Check for overflow
      // Only trigger new page if isMultiPage is true AND we are running out of space
      // We reserve space for the footer if we are on the last page (or potentially last)
      // But if isMultiPage is false, we try to squeeze it in (it should fit by design for <= 7 items)

      if (rowsOnPage >= maxRowsPerPage) {
        doc.addPage();
        await drawHeader();
        currentY = margin + headerHeight + 18;
        currentY = drawTableHeader(currentY);
        rowsOnPage = 0;
      }

      currentY = drawTableRow(currentY, items[i], i);
      rowsOnPage += 1;
    }

    // Totals & Montant en lettres
    const totalsHeight = 120;
    const montantHeight = 60;
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
        await drawHeader();
        currentY = margin + headerHeight + 18;
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
    const totalsBoxHeight = (3 * 20) + 20;
    const montantBoxHeight = 48;
    const endGap = 12;

    const footerY = pageHeight - margin - footerHeight;
    const montantY = footerY - endGap - montantBoxHeight;
    const totalsY = montantY - endGap - totalsBoxHeight;

    // If the end block doesn't fit on this page, move it entirely to the next page
    if (currentY + 20 > totalsY) {
      doc.addPage();
      await drawHeader();
      currentY = margin + headerHeight + 18;
    }

    drawTotals(totalsY);
    drawMontantLettres(montantY);
    drawFooter(footerY);
    

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
  try {
    const { id } = req.params;
    const bcId = parseInt(id, 10);

    if (!bcId || Number.isNaN(bcId)) {
      return res.status(400).json({ success: false, error: "ID invalide" });
    }

    const bc = await prisma.bondeCommande.findUnique({
      where: { id: bcId },
      include: { fournisseur: true },
    });

    if (!bc) {
      return res.status(404).json({ success: false, error: "Bon de commande non trouvé" });
    }

    const to = (req.body?.email || bc?.fournisseur?.email || "").toString().trim();
    if (!to) {
      return res.status(400).json({ success: false, error: "Email fournisseur manquant" });
    }

    // Fetch the exact same PDF as the download endpoint
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const pdfUrl = `${baseUrl}/achat/bc/${bcId}/pdf`;

    const pdfResp = await axios.get(pdfUrl, {
      responseType: 'arraybuffer',
      headers: {
        // Forward session cookies so the PDF endpoint behaves exactly like in the browser
        cookie: req.headers.cookie || "",
      },
      // Avoid caching proxies returning old PDFs
      params: { t: Date.now() },
      validateStatus: () => true,
    });

    if (pdfResp.status < 200 || pdfResp.status >= 300) {
      console.error('sendBcEmail: PDF fetch failed', { status: pdfResp.status, data: pdfResp.data?.toString?.() });
      return res.status(500).json({ success: false, error: "Impossible de générer le PDF pour l'email" });
    }

    const pdfBuffer = Buffer.from(pdfResp.data);

    const subject = `Bon de commande #${bc.numero || bc.id}`;
    const mailOptions = {
      from: "CONFONDA",
      to,
      subject,
      text: `Bonjour,\n\nVeuillez trouver en pièce jointe le bon de commande ${bc.numero || bc.id}.\n\nCordialement.`,
      attachments: [
        {
          filename: `bonCommande_${bc.numero || bc.id}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    await mailTransporter.sendMail(mailOptions);
    return res.json({ success: true });
  } catch (error) {
    console.error('Error in sendBcEmail:', error);
    return res.status(500).json({ success: false, error: error.message || "Erreur serveur" });
  }
};


// export const viewBc = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const bc = await prisma.bondeCommande.findUnique({
//       where: { id: parseInt(id) },
//       include: {
//         commandesItems: true,
//         fournisseur: true,
//         chantier: true, 
//       }
//     });
//     if (!bc) {
//       return res.status(404).json({ success: false, error: "Bon de commande non trouvée" });
//     }
//     res.render('dashboard/achats/bc/index', { bc });
//   } catch (err) {
//     console.error('Erreur affichage bon de commande:', err);
//     res.status(500).json({ success: false, error: "Erreur serveur" });
//   }
// };
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
            },
          },

        },
        fournisseur: true,
      }
    });


    if (!bc) {
      return res.status(404).json({ success: false, error: "Bon de commande non trouvée" });
    }
    const fournisseurs = await prisma.fournisseur.findMany()
    const publicBcUrl = buildPublicBcUrl(req, bc.id);
    res.render('dashboard/achats/bc/edit', { bc, fournisseurs, chantiers, publicBcUrl });
  } catch (err) {
    console.error('Erreur affichage bon de commande:', err);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
};
export const updateBc = async (req, res) => {
  try {
    const { id } = req.params;
    const { supplier, date, dateLivraison, lieuLivraison, modeReg, delaiReg, montantLettres, tauxTva, commandesItems = [] } = req.body || {};

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
        reference: String(l.reference || ""),
        quantite: Number.parseInt(l.quantite) || 0,
        imputation: String(l.imputation || ""),
        prixUnitaire: normalizeNumber(l.prixUnitaire),
        tauxRemise: normalizeNumber(l.tauxRemise),
        montantRemise: normalizeNumber(l.montantRemise),
        chantierDistribution: l.chantierDistribution || []
      }))
      .filter((l) => Number.isInteger(l.id) && l.id > 0);

    const toCreate = lignesArray
      .filter((l) => !l || !l.id)
      .map((l) => ({
        designation: String(l?.designation || "").trim(),
        unite: String(l?.unite || ""),
        reference: String(l?.reference || ""),
        quantite: Number.parseInt(l?.quantite) || 0,
        imputation: String(l?.imputation || ""),
        prixUnitaire: normalizeNumber(l?.prixUnitaire),
        tauxRemise: normalizeNumber(l?.tauxRemise),
        montantRemise: normalizeNumber(l?.montantRemise),
        chantierDistribution: l?.chantierDistribution || []
      }))
      .filter((l) => l.designation);

    const allLines = [...existing, ...toCreate];
    let totalHt = 0;
    allLines.forEach((l) => {
      const q = l.quantite || 0;
      const p = l.prixUnitaire || 0;
      const r = l.montantRemise || 0;
      totalHt += (q * p) - r;

    });

    // In this new model, totalHt is already the "Net Commercial" sum of all lines
    // We ignore a global "tauxRemise" on the BC header because discounts are per-line.
    const tvaRate = parseFloat(tauxTva) || 0;
    const montantTva = totalHt * (tvaRate > 0 ? tvaRate : 0) / 100;
    const totalTtc = totalHt + montantTva;

    // First, perform the main update on BC and items (create/update fields)
    // We ignore distribution in this step
    await prisma.bondeCommande.update({
      where: { id: bcId },
      data: {
        date: jsDate,
        fournisseur: { connect: { id: fournisseurId } },
        totalHt, // This is effectively Net Commercial
        tauxTva: tvaRate,
        totalTtc,
        montantLettre: montantLettres,
        dateLivraison,
        lieuLivraison,
        modeReg,
        delaiReg,
        commandesItems: {
          create: toCreate.map(l => ({
            designation: l.designation,
            unite: l.unite,
            reference: l.reference,
            quantite: l.quantite,
            imputation: l.imputation,
            prixUnitaire: l.prixUnitaire,
            tauxRemise: l.tauxRemise,
            remise: l.montantRemise,
            totalHt: (l.quantite || 0) * (l.prixUnitaire || 0) - (l.montantRemise || 0)
          })),
          update: existing.map((l) => ({
            where: { id: l.id },
            data: {
              designation: l.designation,
              unite: l.unite,
              reference: l.reference,
              quantite: l.quantite,
              imputation: l.imputation,
              prixUnitaire: l.prixUnitaire,
              tauxRemise: l.tauxRemise,
              remise: l.montantRemise,
              totalHt: (l.quantite || 0) * (l.prixUnitaire || 0) - (l.montantRemise || 0),
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
      if (!sourceData) {
        // Heuristic match
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
    console.log("Headers:", req.headers);
    res.render('dashboard/achats/bc/create', { fournisseurs, chantiers });
  } catch (error) {
    console.error("Erreur affichage formulaire BC:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
};
export const storeBc = async (req, res) => {
  try {
    const { supplier, date, dateLivraison, lieuLivraison, modeReg, delaiReg, montantLettre, tauxTva, commandesItems = [], distributionData = [] } = req.body || {};

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
        reference: String(l?.reference || ""),
        quantite: Number.parseInt(l?.quantite) || 0,
        imputation: String(l?.imputation || ""),
        prixUnitaire: normalizeNumber(l?.prixUnitaire),
        tauxRemise: normalizeNumber(l?.tauxRemise),
        montantRemise: normalizeNumber(l?.montantRemise),

        chantierDistribution: l?.chantierDistribution || [],


      }))
      .filter((l) => l.designation);

    let totalHt = 0;
    toCreate.forEach((l) => {
      const q = l.quantite || 0;
      const p = l.prixUnitaire || 0;
      const re = l.montantRemise || 0;
      totalHt += q * p - re;
    });

    const tvaRate = parseFloat(tauxTva) || 0;
    const montantTva = totalHt * (tvaRate > 0 ? tvaRate : 0) / 100;
    const totalTtc = totalHt + montantTva;

    const recentBcs = await prisma.bondeCommande.findMany({
      select: { numero: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    const currentMaxNumero = recentBcs.reduce((max, bc) => {
      const n = parseInt(bc?.numero, 10);
      return Number.isNaN(n) ? max : Math.max(max, n);
    }, 0);
    const nextNumero = currentMaxNumero + 1;

    // Step 1: Create BC + items
    const bc = await prisma.bondeCommande.create({
      data: {
        date: jsDate,
        numero: String(nextNumero),
        totalHt,
        tauxTva: tvaRate,
        totalTtc,
        montantLettre,
        dateLivraison,
        lieuLivraison,
        delaiReg,
        modeReg,


        fournisseur: { connect: { id: fournisseurId } },
        commandesItems: {
          create: toCreate.map((l) => ({
            designation: l.designation,
            unite: l.unite,
            reference: l.reference,
            quantite: l.quantite,
            imputation: l.imputation,
            prixUnitaire: l.prixUnitaire,
            tauxRemise: l.tauxRemise,
            remise: l.montantRemise,
            totalHt: (l.quantite || 0) * (l.prixUnitaire || 0) - (l.montantRemise || 0),
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
    console.log(modeReg, delaiReg)
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

    const { designation, unite, quantite, prixUnitaire, tauxRemise } = req.body || {};

    // Ensure item exists
    const item = await prisma.commandesItems.findUnique({ where: { id: itemId } });
    if (!item) return res.status(404).json({ success: false, error: 'Article introuvable' });

    // Calculate derived values if needed
    // Note: We expect the frontend to send valid numbers, but we re-calculate amounts for safety
    const safeQty = quantite !== undefined ? (parseInt(quantite) || 0) : item.quantite;
    const safePu = prixUnitaire !== undefined ? normalizeNumber(prixUnitaire) : item.prixUnitaire;
    const safeRate = tauxRemise !== undefined ? normalizeNumber(tauxRemise) : (item.tauxRemise || 0);

    const baseAmount = safeQty * safePu;
    const remiseAmount = baseAmount * (safeRate / 100);
    const totalHt = baseAmount - remiseAmount;

    // Update item fields
    const updatedItem = await prisma.commandesItems.update({
      where: { id: itemId },
      data: {
        designation: designation !== undefined ? designation : item.designation,
        unite: unite !== undefined ? unite : item.unite,
        quantite: safeQty,
        prixUnitaire: safePu,
        tauxRemise: safeRate,
        remise: remiseAmount,
        totalHt: totalHt
      }
    });

    return res.json({ success: true, item: updatedItem });
  } catch (error) {
    console.error('Erreur mise à jour article BC:', error);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};



export const importBcInfo = async (req, res) => {
  console.log('🚀 Starting Excel import for Bon de Commande ...');

  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const filePath = req.file.path;
  const workbook = new ExcelJS.Workbook();

  try {
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0];

    if (!worksheet) {
      return res.status(400).send('No worksheet found in Excel file.');
    }

    // ---------- HEADER DETECTION ----------
    let headerRow = null;
    let columnMap = {};

    const normalizeHeader = (s) =>
      (s || '')
        .toString()
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ');

    for (let rowNum = 1; rowNum <= Math.min(10, worksheet.rowCount); rowNum++) {
      const row = worksheet.getRow(rowNum);
      const headerValues = [];

      for (let col = 1; col <= row.cellCount; col++) {
        headerValues.push(normalizeHeader(row.getCell(col).text));
      }

      const expectedHeaders = [
        'bc',
        'date de cde',
        'designation',
        'reference',
        'fournisseur',
        'unite',
        'qty',
        'pu.ht',
        'total.ht',
        'taux de tva',
        'taxe',
        'total.ttc',
        'chantier',
      ];

      const matchCount = expectedHeaders.filter(h =>
        headerValues.some(v => v.includes(h))
      ).length;

      if (matchCount >= 4) {
        headerRow = rowNum;

        for (let col = 1; col <= row.cellCount; col++) {
          const h = normalizeHeader(row.getCell(col).text);

          if (h.includes('bc')) columnMap.bc = col;
          else if (h.includes('date') && h.includes('cde')) {
            columnMap.dateCde = col;
            columnMap.date = col;
          } else if (h.includes('designation')) columnMap.designation = col;
          else if (h.includes('reference')) columnMap.reference = col;
          else if (h.includes('fournisseur')) columnMap.fournisseur = col;
          else if (h.includes('unite')) columnMap.unite = col;
          else if (h.includes('qty') || h.includes('quantite')) columnMap.qty = col;
          else if (h.includes('pu') && h.includes('ht')) columnMap.puHt = col;
          else if (h.includes('total') && h.includes('ht')) columnMap.totalHt = col;
          else if (h.includes('tva')) columnMap.tauxTva = col;
          else if (h.includes('taxe')) columnMap.taxe = col;
          else if (h.includes('ttc')) {
            columnMap.totalTtc = col;
            columnMap.montant = col;
          } else if (h.includes('chantier')) columnMap.chantier = col;
        }
        break;
      }
    }

    if (!headerRow) {
      return res.status(400).send('No valid header row found.');
    }

    // ---------- HELPERS ----------
    const parseExcelDate = (v) => {
      if (!v) return null;
      if (v instanceof Date) return v;
      if (typeof v === 'number') return new Date((v - 25569) * 86400 * 1000);
      const d = new Date(v);
      return isNaN(d.getTime()) ? null : d;
    };

    const parseExcelNumber = (v) => {
      if (v === null || v === undefined || v === '') return null;
      if (typeof v === 'number') return v;
      const n = parseFloat(v.toString().replace(',', '.'));
      return isNaN(n) ? null : n;
    };

    // ---------- ROW PARSING ----------
    const bc = [];
    const validationIssues = [];
    let processedRows = 0;

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber <= headerRow) return;

      processedRows++;
      if (processedRows % 1000 === 0) {
        console.log(`⏳ Parsed ${processedRows} rows`);
      }

      const numero = row.getCell(columnMap.bc).text?.trim();
      const fournisseur = row.getCell(columnMap.fournisseur).text?.trim();
      const date = parseExcelDate(row.getCell(columnMap.dateCde).value);
      const totalHt = parseExcelNumber(row.getCell(columnMap.totalHt).value);
      const totalTtc = parseExcelNumber(row.getCell(columnMap.totalTtc).value);

      if (!numero || !fournisseur || !date || totalHt === null || totalTtc === null) {
        validationIssues.push({ rowNumber, numero, fournisseur });
        return;
      }

      bc.push({
        rowNumber,
        numero,
        fournisseur,
        date,
        designation: columnMap.designation ? row.getCell(columnMap.designation).text?.trim() : null,
        qty: parseExcelNumber(columnMap.qty ? row.getCell(columnMap.qty).value : null),
        puHt: parseExcelNumber(columnMap.puHt ? row.getCell(columnMap.puHt).value : null),
        totalHt,
        totalTtc,
        reference: columnMap.reference ? row.getCell(columnMap.reference).text?.trim() : null,
        unite: columnMap.unite ? row.getCell(columnMap.unite).text?.trim() : null,
        tauxTva: parseExcelNumber(columnMap.tauxTva ? row.getCell(columnMap.tauxTva).value : null),
        taxe: parseExcelNumber(columnMap.taxe ? row.getCell(columnMap.taxe).value : null),
        chantier: columnMap.chantier ? row.getCell(columnMap.chantier).text?.trim() : null,
      });
    });

    // ---------- GROUP BY BC ----------
    const groupedBc = bc.reduce((acc, r) => {
      // Create a unique key using both BC number and supplier to avoid merging identical BC numbers from different suppliers
      const key = `${r.numero}_${r.fournisseur || 'unknown'}`;

      if (!acc[key]) {
        acc[key] = {
          numero: r.numero,
          date: r.date,
          fournisseurName: r.fournisseur,
          tauxTva: r.tauxTva,
          items: [],
          totalHtSum: 0,
          totalTtcSum: 0,
        };
      }
      acc[key].items.push(r);
      acc[key].totalHtSum += r.totalHt || 0;
      acc[key].totalTtcSum += r.totalTtc || 0;
      return acc;
    }, {});

    const bcList = Object.values(groupedBc);

    // ---------- CACHE DB DATA ----------
    const fournisseursDb = await prisma.fournisseur.findMany();
    const fournisseurMap = new Map(
      fournisseursDb.map(f => [f.name.toLowerCase(), f])
    );

    const chantiersDb = await prisma.chantier.findMany();
    const chantierMap = new Map(
      chantiersDb.map(c => [c.nom.toLowerCase(), c])
    );

    let successCount = 0;
    let totalLinesInserted = 0;

    // ---------- DB INSERT ----------
    for (const bcGroup of bcList) {
      // ... existing supplier lookup logic ...
      let fournisseur = fournisseurMap.get(bcGroup.fournisseurName.toLowerCase());

      if (!fournisseur) {
        fournisseur = await prisma.fournisseur.create({
          data: {
            name: bcGroup.fournisseurName,
            ice: ' ',
            identifFiscal: ' ',
            rib: ' ',
            telFournisseur: ' ',
            contact: ' ',
            telContact: ' ',
          }
        });
        fournisseurMap.set(bcGroup.fournisseurName.toLowerCase(), fournisseur);
      }

      const savedBc = await prisma.bondeCommande.create({
        data: {
          date: bcGroup.date,
          totalHt: bcGroup.totalHtSum,
          totalTtc: bcGroup.totalTtcSum,
          tauxTva: bcGroup.tauxTva,
          numero: bcGroup.numero,
          dateLivraison: new Date().toISOString().split('T')[0], // Use current date for default if needed, or remove hardcoded "2026-01-11"
          lieuLivraison: 'casablanca',
          modeReg: 'espece',
          delaiReg: '15',
          montantLettre: numberToFrenchWords(Math.round(bcGroup.totalTtcSum)),
          fournisseur: { connect: { id: fournisseur.id } },
        }
      });

      for (const itemRow of bcGroup.items) {
        const createdItem = await prisma.commandesItems.create({
          data: {
            designation: itemRow.designation || 'Article',
            unite: itemRow.unite || 'U',
            quantite: itemRow.qty || 0,
            prixUnitaire: itemRow.puHt || 0,
            totalHt: itemRow.totalHt || 0,
            reference: itemRow.reference,
            bondeCommande: { connect: { id: savedBc.id } },
          }
        });

        if (itemRow.chantier) {
          const chantier = chantierMap.get(itemRow.chantier.toLowerCase());
          if (chantier) {
            await prisma.bondeCommandeChantierItem.create({
              data: {
                bondeCommandeId: savedBc.id,
                itemId: createdItem.id,
                chantierId: chantier.id,
                qty: itemRow.qty || 0,
                montant: itemRow.totalHt || 0,
              }
            });
          }
        }
        totalLinesInserted++;
      }

      successCount++;
    }

    res.send({
      message: 'bc uploaded with validation report.',
      totalRows: bc.length,
      insertedbc: successCount,
      insertedLines: totalLinesInserted,
      validationIssues,
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server error during Excel import.');
  } finally {
    fs.unlink(filePath, () => { });
  }
};

