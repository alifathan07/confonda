import prisma from "../db.js";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import ExcelJS from "exceljs";
import multer from "multer";
import nodemailer from "nodemailer";
import { fileURLToPath } from 'url';
import { error } from "console";
import { connect } from "http2";

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

export const postDemandePrixViaFourniture = async (req, res) => {
  try {
    const { demandeId, items } = req.body;
    if (!demandeId || !items || items.length === 0) {
      return res.status(400).json({ success: false, error: "Aucun article ou demande invalide" });
    }

    // Group items by fournisseur
    const itemsByFournisseur = items.reduce((acc, { itemId, fournisseurId }) => {
      const fid = parseInt(fournisseurId);
      const iid = parseInt(itemId);
      if (!acc[fid]) acc[fid] = [];
      acc[fid].push(iid);
      return acc;
    }, {});
    

    const createdDemandePrix = [];

    // Fetch all items from demandeFourniture in one query
    const itemIds = items.map(i => parseInt(i.itemId));
    const demandeItems = await prisma.itemFourniture.findMany({
      where: {
        id: { in: itemIds },
        demandeFournitureId: parseInt(demandeId),
      },
      select: {
        id: true,
        designation: true,
        unité: true,
        quantité: true,
        observation: true,
        lot : true ,
         
      }
    });

    if (demandeItems.length === 0) {
      return res.status(400).json({ success: false, error: "Aucun article trouvé dans la demande" });
    }

    const itemMap = Object.fromEntries(demandeItems.map(item => [item.id, item]));

    for (const [fournisseurId, itemIds] of Object.entries(itemsByFournisseur)) {
      const fournisseur = await prisma.fournisseur.findUnique({
        where: { id: parseInt(fournisseurId) },
      });

      if (!fournisseur) continue;

      const validItemIds = itemIds.filter(id => itemMap[id]);
      if (validItemIds.length === 0) continue;

      const articlesToCreate = validItemIds.map(id => {
        const a = itemMap[id];
        return {
          designation: a.designation,
          reference: a.lot ?? null,
          unite: a.unité ?? null,
          quantite: parseInt(a.quantité) ?? 1,
          prixUnitaire: null,
          totalHt: null,
          delaiLivraison: null,
          observation: a.observation ?? null,
        };
      });

      const newDemandePrix = await prisma.demandeDePrix.create({
        data: {
          date: new Date(),
          fournisseurId: fournisseur.id,
          articles: {
            create: articlesToCreate
          }
        },
        select: { id: true }
      });

      createdDemandePrix.push(newDemandePrix.id);
    }

    if (createdDemandePrix.length === 0) {
      return res.status(400).json({ success: false, error: "Aucun demande de prix créée (fournisseurs ou articles invalides)" });
    }

    return res.status(201).json({
      success: true,
      count: createdDemandePrix.length,
      demandePrixIds: createdDemandePrix,
      primaryId: createdDemandePrix[0], // for backward compatibility
      message: `${createdDemandePrix.length} demande(s) de prix créée(s)`
    });

  } catch (err) {
    console.error('Erreur création demande de prix:', err);
    return res.status(500).json({ success: false, error: "Erreur serveur" });
  }
};

export const deleteDemandePrix = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ success: false, error: 'ID invalide' });
    }

    await prisma.article.deleteMany({ where: { demandeDePrixId: id } });
    await prisma.demandeDePrix.delete({ where: { id } });

    return res.json({ success: true });
  } catch (error) {
    console.error('Erreur suppression demande de prix:', error);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};


export const viewDemandePrix = async (req, res) => {
  try {
    const { id } = req.params;
    const demandePrix = await prisma.demandeDePrix.findUnique({
      where: { id: parseInt(id) },
      include: {
        articles: true,
        fournisseur: true,
      }
    });
    if (!demandePrix) {
      return res.status(404).json({ success: false, error: "Demande de prix non trouvée" });
    }
    res.render('dashboard/achats/demandeprix/index', { demandePrix });
  } catch (err) {
    console.error('Erreur affichage demande de prix:', err);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
};
export const EditDemandePrix = async (req, res)=> {
   const {id} = req.params
   const demandePrix = await prisma.demandeDePrix.findUnique({
    where: { id: parseInt(id) },
    include: {
      articles: true,
      fournisseur: true,
    }
  });
   const fournisseurs = await prisma.fournisseur.findMany();
   res.render('dashboard/achats/demandeprix/edit', { demandePrix, fournisseurs });
} 
  
export const listDemandePrix = async (req, res) => {
      const demandePrix = await prisma.demandeDePrix.findMany({
        include: {
          fournisseur: true,
          articles: true,
        },
        orderBy: { id: 'desc' }
      });
      const fournisseurs = await prisma.fournisseur.findMany({ select: { id: true, name: true } });
      const rowsForExport = demandePrix.map(dp => ({
        id: `#${dp.id}`,
        dateISO: dp.date ? new Date(dp.date).toISOString() : null,
        fournisseur: dp.fournisseur?.name || '—',
        articles: Array.isArray(dp.articles) ? dp.articles.length : 0,
      }));
      res.render('dashboard/achats/demandeprix/list', { demandePrix, fournisseurs, rowsForExport })
}

  export const updateDemandePrix = async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { supplier, date, articles = [], deletedArticleIds = [] } = req.body || {};

      const fournisseurId = parseInt(supplier);
      const jsDate = new Date(date);
      if (!id || Number.isNaN(id)) return res.status(400).json({ success: false, error: 'ID invalide' });
      if (!fournisseurId || Number.isNaN(fournisseurId)) return res.status(400).json({ success: false, error: 'Fournisseur invalide' });
      if (!(jsDate instanceof Date) || isNaN(jsDate.getTime())) return res.status(400).json({ success: false, error: 'Date invalide' });

      const toDelete = (Array.isArray(deletedArticleIds) ? deletedArticleIds : []).map(Number).filter(n => Number.isInteger(n) && n > 0);
      const existing = (Array.isArray(articles) ? articles : []).filter(a => a && a.id).map(a => ({
        id: Number(a.id),
        designation: String(a.designation || '').trim(),
        reference: a.reference ? String(a.reference).trim() : null,
        unite: String(a.unite || ''),
        quantite: Number.parseInt(a.quantite) || 1,
      })).filter(a => Number.isInteger(a.id) && a.id > 0);
      const toCreate = (Array.isArray(articles) ? articles : []).filter(a => !a || !a.id).map(a => ({
        designation: String(a?.designation || '').trim(),
        reference: a?.reference ? String(a.reference).trim() : null,
        unite: String(a?.unite || ''),
        quantite: Number.parseInt(a?.quantite) || 1,
      })).filter(a => a.designation);

      const updated = await prisma.demandeDePrix.update({
        where: { id },
        data: {
          date: jsDate,
          fournisseur: { connect: { id: fournisseurId } },
          articles: {
            deleteMany: toDelete.length ? { id: { in: toDelete } } : undefined,
            create: toCreate,
            update: existing.map(a => ({
              where: { id: a.id },
              data: {
                designation: a.designation,
                reference: a.reference,
                unite: a.unite,
                quantite: a.quantite,
              }
            }))
          }
        },
        include: { articles: true, fournisseur: true }
      });

      return res.json({ success: true, message: 'Demande de prix mise à jour avec succès', demande: updated });

    } catch (error) {
      console.error('Erreur mise à jour demande de prix:', error);
      res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
  };
export const deleteArticle = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.article.delete({
      where: { id: parseInt(id) }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};
export const createDemandePrix = async (req, res) => {
  try {
    const fournisseurs = await prisma.fournisseur.findMany();
    res.render('dashboard/achats/demandeprix/create', { fournisseurs });
  } catch (error) {
    console.error('Erreur chargement création demande de prix:', error);
    res.status(500).send('Erreur serveur');
  }
};

export const storeDemandePrix = async (req, res) => {
  try {
    const { supplier, date, articles = [] } = req.body || {};
    const fournisseurId = parseInt(supplier);
    const jsDate = new Date(date);
    if (!fournisseurId || Number.isNaN(fournisseurId)) return res.status(400).json({ success: false, error: 'Fournisseur invalide' });
    if (!(jsDate instanceof Date) || isNaN(jsDate.getTime())) return res.status(400).json({ success: false, error: 'Date invalide' });

    const toCreate = (Array.isArray(articles) ? articles : []).map(a => ({
      designation: String(a?.designation || '').trim(),
      reference: a?.reference ? String(a.reference).trim() : null,
      unite: String(a?.unite || ''),
      quantite: Number.parseInt(a?.quantite) || 1,
    })).filter(a => a.designation);

    const created = await prisma.demandeDePrix.create({
      data: {
        date: jsDate,
        fournisseur: { connect: { id: fournisseurId } },
        articles: { create: toCreate }
      },
      select: { id: true }
    });

    return res.json({ success: true, id: created.id, redirect: `/achat/demande-prix/${created.id}/edit` });
  } catch (error) {
    console.error('Erreur création demande de prix:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};
export const generateDemandePrixPDF = async (req, res) => {
  const { id } = req.params;
  const demandePrixId = parseInt(id, 10);
  if (isNaN(demandePrixId)) return res.status(400).send("ID invalide");

  try {
    const demandePrix = await prisma.demandeDePrix.findUnique({
      where: { id: demandePrixId },
      include: { fournisseur: true, articles: true }
    });
    if (!demandePrix) return res.status(404).send("Non trouvé");

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=demandePrix_${demandePrix.id}.pdf`);

    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      bufferPages: false,
      autoFirstPage: true
    });
    doc.pipe(res);

    // Page dimensions
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 40;
    const contentWidth = pageWidth - (margin * 2);

    // Colors
    const primaryColor = '#2563EB';
    const darkText = '#1F2937';
    const lightText = '#6B7280';
    const borderColor = '#D1D5DB';
    const lightBg = '#F9FAFB';

    const signatureHeight = 70;
    const footerHeight = 45;
    const reservedSpace = signatureHeight + footerHeight + 20;

    let y = margin;

    // ===== HEADER =====
    const logoPath = path.join(__dirname, '../public/img/logo-4.png');
    if (fs.existsSync(logoPath)) doc.image(logoPath, margin, y, { width: 100, height: 50 });

    doc.fillColor(primaryColor)
       .font('Helvetica-Bold')
       .fontSize(20)
       .text('DEMANDE DE PRIX', 0, y + 5, { align: 'center', width: pageWidth });

    y += 20;

    doc.font('Helvetica').fontSize(9).fillColor(darkText)
       .text(`Référence: #${demandePrix.id}`, pageWidth - 160, y, { align: 'right', width: 120 })
       .text(`Date: ${new Date(demandePrix.date).toLocaleDateString('fr-FR')}`, pageWidth - 160, y + 12, { align: 'right', width: 120 });

    y += 50;

    doc.moveTo(margin, y).lineTo(pageWidth - margin, y).strokeColor(primaryColor).lineWidth(2).stroke();
    y += 25;

    // ===== COMPANY & SUPPLIER INFO =====
    const boxWidth = (contentWidth - 20) / 2;

    // Company box
    doc.roundedRect(margin, y, boxWidth, 85, 5).fillAndStroke(lightBg, borderColor);
    doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(10).text('ÉMETTEUR', margin + 12, y + 12);
    doc.font('Helvetica').fontSize(9).fillColor(darkText)
       .text('CONFONDA', margin + 12, y + 28)
       .text('82, Bd Abdelmoumen', margin + 12, y + 41)
       .text('Casablanca, Maroc', margin + 12, y + 54)
       .text('Tél: 0522-23-39-70', margin + 12, y + 67);

    // Supplier box
    const supplierX = margin + boxWidth + 20;
    doc.roundedRect(supplierX, y, boxWidth, 85, 5).fillAndStroke(lightBg, borderColor);
    doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(10).text('DESTINATAIRE', supplierX + 12, y + 12);
    doc.font('Helvetica').fontSize(9).fillColor(darkText)
       .text(demandePrix.fournisseur?.name || '-', supplierX + 12, y + 28)
       .text(demandePrix.fournisseur?.email || '-', supplierX + 12, y + 41)
       .text(demandePrix.fournisseur?.telFournisseur || '-', supplierX + 12, y + 54);

    y += 80;

    // Description
    doc.font('Helvetica').fontSize(12).fillColor(darkText)
       .text('Nous vous prions de bien vouloir nous communiquer votre meilleur offre de prix concernant les produits ci-après', margin + 12, y + 28);

    y += 70;

    // ===== ARTICLES TABLE =====
    const columnWidths = [35, 210, 95, 55, 55];
    const headerHeight = 28;
    const rowHeight = 22;
    let currentY = y;

    const drawTableHeader = () => {
      doc.roundedRect(margin, currentY, contentWidth, headerHeight, 3).fillAndStroke(primaryColor, primaryColor);
      const headers = ['N°', 'Désignation', 'Référence', 'Unité', 'Quantité'];
      let x = margin;
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(9);
      headers.forEach((h, i) => {
        const align = i === 0 || i >= 2 ? 'center' : 'left';
        const textX = align === 'center' ? x + (columnWidths[i] / 2) - (doc.widthOfString(h) / 2) : x + 10;
        doc.text(h, textX, currentY + 8);
        x += columnWidths[i];
      });
      currentY += headerHeight;
    };

    const drawRow = (art, idx) => {
      if (currentY + rowHeight + reservedSpace > pageHeight) {
        doc.addPage();
        currentY = margin;
        drawTableHeader();
      }

      const bg = idx % 2 === 0 ? '#FFFFFF' : lightBg;
      doc.rect(margin, currentY, contentWidth, rowHeight).fill(bg);

      let cx = margin;
      doc.fillColor(darkText).font('Helvetica').fontSize(9);

      // N°
      doc.text(String(idx + 1), cx + (columnWidths[0] / 2) - (doc.widthOfString(String(idx + 1)) / 2), currentY + 6);
      cx += columnWidths[0];

      // Désignation
      const truncated = (art.designation || '-').slice(0, 50);
      doc.text(truncated, cx + 8, currentY + 6, { width: columnWidths[1] - 16, lineBreak: false });
      cx += columnWidths[1];

      // Référence
      const ref = (art.reference || '-').substring(0, 22);
      doc.text(ref, cx + (columnWidths[2] / 2) - (doc.widthOfString(ref) / 2), currentY + 6);
      cx += columnWidths[2];

      // Unité
      const unit = art.unite || '-';
      doc.text(unit, cx + (columnWidths[3] / 2) - (doc.widthOfString(unit) / 2), currentY + 6);
      cx += columnWidths[3];

      // Quantité
      const qty = String(art.quantite || '-');
      doc.text(qty, cx + (columnWidths[4] / 2) - (doc.widthOfString(qty) / 2), currentY + 6);

      currentY += rowHeight;
    };

    // Draw table
    drawTableHeader();
    if (demandePrix.articles.length === 0) {
      doc.rect(margin, currentY, contentWidth, rowHeight * 2).stroke(borderColor);
      doc.fillColor(lightText).font('Helvetica-Oblique').fontSize(10)
         .text('Aucun article disponible', 0, currentY + 12, { align: 'center', width: pageWidth });
      currentY += rowHeight * 2;
    } else {
      demandePrix.articles.forEach((art, idx) => drawRow(art, idx));
    }

    // ===== SIGNATURES =====
    let sigY = pageHeight - margin - footerHeight - signatureHeight;
    const sigWidth = (contentWidth / 2) - 15;

    const boxes = [
      { x: margin, label: 'Cachet & Signature Fournisseur' },
      { x: margin + sigWidth + 30, label: 'Signature Responsable Achat' }
    ];

    const signatureImgPath = path.join(__dirname, '../public/img/signature.png');

    boxes.forEach((box, idx) => {
      doc.roundedRect(box.x, sigY, sigWidth, 50, 3).stroke(borderColor);

      // For Responsable Achat box, try to draw signature image inside
      if (idx === 1 && fs.existsSync(signatureImgPath)) {
        try {
          const imgWidth = 180;
          const imgHeight = 80;
          const imgX = box.x + (sigWidth - imgWidth) / 2;
          const imgY = sigY;
          doc.image(signatureImgPath, imgX, imgY, { width: imgWidth, height: imgHeight });
        } catch (e) {
          console.error('Erreur chargement signature.png pour PDF download:', e.message);
        }
      }

      doc.font('Helvetica').fontSize(8).fillColor(lightText)
         .text(box.label, box.x, sigY + 55, { width: sigWidth, align: 'center' });
    });

    // ===== FOOTER =====
    const footerY = pageHeight - margin - footerHeight + 15;
    doc.moveTo(margin, footerY).lineTo(pageWidth - margin, footerY)
       .strokeColor(borderColor).lineWidth(1).stroke();

    doc.font('Helvetica').fontSize(10).fillColor(darkText)
       .text('82, angle Bd Abdelmoumen et rue Soumaya • Casablanca, Maroc',
             margin, footerY + 8, { width: contentWidth, align: 'center' })
     
       .text('contact@confonda.com • Tél: 0522-23-39-70',
             margin, footerY + 18, { width: contentWidth, align: 'center' })
      
    doc.end();

  } catch (err) {
    console.error('Erreur PDF:', err.message);
    res.status(500).send("Erreur PDF");
  }
};
export const sendDemandePrixEmail = async (req, res) => {
  const { id } = req.params;
  const { email } = req.body || {};
  const demandePrixId = parseInt(id, 10);
  if (!email) return res.status(400).json({ success: false, error: "Email destinataire manquant" });
  if (isNaN(demandePrixId)) return res.status(400).json({ success: false, error: "ID invalide" });

  try {
    const demandePrix = await prisma.demandeDePrix.findUnique({
      where: { id: demandePrixId },
      include: { fournisseur: true, articles: true },
    });
    if (!demandePrix) return res.status(404).json({ success: false, error: "Demande de prix non trouvée" });

    const chunks = [];
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      bufferPages: false,
      autoFirstPage: true,
    });
    doc.on('data', (c) => chunks.push(c));
    doc.on('error', (e) => {
      console.error('Erreur génération PDF (email):', e);
    });

    // Same layout as generateDemandePrixPDF
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 40;
    const contentWidth = pageWidth - (margin * 2);

    const primaryColor = '#2563EB';
    const darkText = '#1F2937';
    const lightText = '#6B7280';
    const borderColor = '#D1D5DB';
    const lightBg = '#F9FAFB';

    const signatureHeight = 70;
    const footerHeight = 45;
    const reservedSpace = signatureHeight + footerHeight + 20;

    let y = margin;

    const logoPath = path.join(__dirname, '../public/img/logo-4.png');
    if (fs.existsSync(logoPath)) doc.image(logoPath, margin, y, { width: 100, height: 50 });

    doc.fillColor(primaryColor)
      .font('Helvetica-Bold')
      .fontSize(20)
      .text('DEMANDE DE PRIX', 0, y + 5, { align: 'center', width: pageWidth });

    y += 20;

    doc.font('Helvetica').fontSize(9).fillColor(darkText)
      .text(`Référence: #${demandePrix.id}`, pageWidth - 160, y, { align: 'right', width: 120 })
      .text(`Date: ${new Date(demandePrix.date).toLocaleDateString('fr-FR')}`, pageWidth - 160, y + 12, { align: 'right', width: 120 });

    y += 50;

    doc.moveTo(margin, y).lineTo(pageWidth - margin, y).strokeColor(primaryColor).lineWidth(2).stroke();
    y += 25;

    const boxWidth = (contentWidth - 20) / 2;

    doc.roundedRect(margin, y, boxWidth, 85, 5).fillAndStroke(lightBg, borderColor);
    doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(10).text('ÉMETTEUR', margin + 12, y + 12);
    doc.font('Helvetica').fontSize(9).fillColor(darkText)
      .text('CONFONDA', margin + 12, y + 28)
      .text('82, Bd Abdelmoumen', margin + 12, y + 41)
      .text('Casablanca, Maroc', margin + 12, y + 54)
      .text('Tél: 0522-23-39-70', margin + 12, y + 67);

    const supplierX = margin + boxWidth + 20;
    doc.roundedRect(supplierX, y, boxWidth, 85, 5).fillAndStroke(lightBg, borderColor);
    doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(10).text('DESTINATAIRE', supplierX + 12, y + 12);
    doc.font('Helvetica').fontSize(9).fillColor(darkText)
      .text(demandePrix.fournisseur?.name || '-', supplierX + 12, y + 28)
      .text(demandePrix.fournisseur?.email || '-', supplierX + 12, y + 41)
      .text(demandePrix.fournisseur?.telFournisseur || '-', supplierX + 12, y + 54);

    y += 80;

    doc.font('Helvetica').fontSize(12).fillColor(darkText)
      .text('Nous vous prions de bien vouloir nous communiquer votre meilleur offre de prix concernant les produits ci-après', margin + 12, y + 28);

    y += 70;

    const columnWidths = [35, 210, 95, 55, 55];
    const headerHeight = 28;
    const rowHeight = 22;
    let currentY = y;

    const drawTableHeader = () => {
      doc.roundedRect(margin, currentY, contentWidth, headerHeight, 3).fillAndStroke(primaryColor, primaryColor);
      const headers = ['N°', 'Désignation', 'Référence', 'Unité', 'Quantité'];
      let x = margin;
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(9);
      headers.forEach((h, i) => {
        const align = i === 0 || i >= 2 ? 'center' : 'left';
        const textX = align === 'center' ? x + (columnWidths[i] / 2) - (doc.widthOfString(h) / 2) : x + 10;
        doc.text(h, textX, currentY + 8);
        x += columnWidths[i];
      });
      currentY += headerHeight;
    };

    const drawRow = (art, idx) => {
      if (currentY + rowHeight + reservedSpace > pageHeight) {
        doc.addPage();
        currentY = margin;
        drawTableHeader();
      }

      const bg = idx % 2 === 0 ? '#FFFFFF' : lightBg;
      doc.rect(margin, currentY, contentWidth, rowHeight).fill(bg);

      let cx = margin;
      doc.fillColor(darkText).font('Helvetica').fontSize(9);

      const numStr = String(idx + 1);
      doc.text(numStr, cx + (columnWidths[0] / 2) - (doc.widthOfString(numStr) / 2), currentY + 6);
      cx += columnWidths[0];

      const truncated = (art.designation || '-').slice(0, 50);
      doc.text(truncated, cx + 8, currentY + 6, { width: columnWidths[1] - 16, lineBreak: false });
      cx += columnWidths[1];

      const ref = (art.reference || '-').substring(0, 22);
      doc.text(ref, cx + (columnWidths[2] / 2) - (doc.widthOfString(ref) / 2), currentY + 6);
      cx += columnWidths[2];

      const unit = art.unite || '-';
      doc.text(unit, cx + (columnWidths[3] / 2) - (doc.widthOfString(unit) / 2), currentY + 6);
      cx += columnWidths[3];

      const qty = String(art.quantite || '-');
      doc.text(qty, cx + (columnWidths[4] / 2) - (doc.widthOfString(qty) / 2), currentY + 6);

      currentY += rowHeight;
    };

    drawTableHeader();
    if (demandePrix.articles.length === 0) {
      doc.rect(margin, currentY, contentWidth, rowHeight * 2).stroke(borderColor);
      doc.fillColor(lightText).font('Helvetica-Oblique').fontSize(10)
        .text('Aucun article disponible', 0, currentY + 12, { align: 'center', width: pageWidth });
      currentY += rowHeight * 2;
    } else {
      demandePrix.articles.forEach((art, idx) => drawRow(art, idx));
    }

    let sigY = pageHeight - margin - footerHeight - signatureHeight;
    const sigWidth = (contentWidth / 2) - 15;
    const boxes = [
      { x: margin, label: 'Cachet & Signature Fournisseur' },
      { x: margin + sigWidth + 30, label: 'Signature Responsable Achat' },
    ];

    const signatureImgPathEmail = path.join(__dirname, '../public/img/signature.png');

    boxes.forEach((box, idx) => {
      doc.roundedRect(box.x, sigY, sigWidth, 50, 3).stroke(borderColor);

      if (idx === 1 && fs.existsSync(signatureImgPathEmail)) {
        try {
          const imgWidth = 180;
          const imgHeight = 80;
          const imgX = box.x + (sigWidth - imgWidth) / 2;
          const imgY = sigY;
          doc.image(signatureImgPathEmail, imgX, imgY, { width: imgWidth, height: imgHeight });
        } catch (e) {
          console.error('Erreur chargement signature.png pour PDF email:', e.message);
        }
      }

      doc.font('Helvetica').fontSize(8).fillColor(lightText)
        .text(box.label, box.x, sigY + 55, { width: sigWidth, align: 'center' });
    });

    const footerY = pageHeight - margin - footerHeight + 15;
    doc.moveTo(margin, footerY).lineTo(pageWidth - margin, footerY)
      .strokeColor(borderColor).lineWidth(1).stroke();

    doc.font('Helvetica').fontSize(10).fillColor(darkText)
      .text('82, angle Bd Abdelmoumen et rue Soumaya • Casablanca, Maroc',
            margin, footerY + 8, { width: contentWidth, align: 'center' })
      .text('contact@confonda.com • Tél: 0522-23-39-70',
            margin, footerY + 18, { width: contentWidth, align: 'center' });

    doc.end();

    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(chunks);
      try {
        await mailTransporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: email,
          subject: `Demande de Prix #${demandePrix.id}`,
          text: `Bonjour,\n\nVeuillez trouver ci-joint la demande de prix #${demandePrix.id}.`,
          attachments: [
            {
              filename: `demandePrix_${demandePrix.id}.pdf`,
              content: pdfBuffer,
            },
          ],
        });
        return res.json({ success: true });
      } catch (e) {
        console.error('Erreur envoi email demande de prix:', e);
        return res.status(500).json({ success: false, error: 'Erreur envoi email' });
      }
    });
  } catch (err) {
    console.error('Erreur préparation email demande de prix:', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};  



