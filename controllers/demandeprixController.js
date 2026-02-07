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
import { sendEmail } from "../services/emailservice.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



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
export const generateDemandePrixPDF = async (req, res, pdf) => {
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

    const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true, autoFirstPage: true });
    doc.pipe(res);

    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;

    const colors = {
      blue: '#0052CC',
      blueLight: '#f3f8ff',
      brand: '#A22C29',
      gray900: '#1f2937',
      gray800: '#374151',
      gray600: '#6b7280',
      border: '#cfd6df',
      borderSoft: '#c3cbd6',
      rowBorder: '#eef1f5',
      white: '#ffffff',
      tableHeader: '#0052CC',
      rowEven: '#ffffff',
      rowOdd: '#f9fafb',
    };

    const logoPath = path.join(__dirname, '../public/img/logo-4.png');
    const signaturePath = path.join(__dirname, '../public/img/signature.png');

    const rowHeight = 22;
    const companyFooterHeight = 100;
    const footerHeight = 120 + companyFooterHeight;
    const colWidths = [28, 240, 95, 55, 55];

    const sanitizePdfNumber = (s) => String(s || '').replace(/[\u202F\u00A0]/g, ' ');
    const fmtStr = (s) => sanitizePdfNumber(String(s || ''));
    const dpDateStr = new Date(demandePrix.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const drawHeader = () => {
      const y = margin;
      const toplineY = y;
      const toplineH = 70;

      if (fs.existsSync(logoPath)) {
        try {
          doc.image(logoPath, margin, toplineY + 2, { height: 60 });
        } catch (e) {
          console.error('Error loading logo:', e);
        }
      }

      const centerX = margin + contentWidth / 2;
      const sepW = 6;
      const sepH = 44;
      const sepX = centerX - sepW / 2;
      const sepY = toplineY + 12;
      doc.rect(sepX, sepY, sepW, sepH).fill(colors.brand);

      doc.font('Helvetica-Bold').fontSize(13).fillColor(colors.brand)
        .text('Construction et Fondation', centerX + 14, toplineY + 18, { align: 'left' });
      doc.font('Helvetica').fontSize(9).fillColor(colors.gray600)
        .text('Pour des constructions bien fondées', centerX + 14, toplineY + 36, { align: 'left' });

      const gridY = toplineY + toplineH + 12;
      const gap = 10;
      const boxW = (contentWidth - gap * 2) / 3;
      const boxH = 68;

      doc.roundedRect(margin, gridY, boxW, boxH, 8).lineWidth(1).stroke(colors.border);
      doc.font('Helvetica-Bold').fontSize(11).fillColor(colors.gray900)
        .text(`DP N° : ${demandePrix.id}`, margin + 10, gridY + 14, { width: boxW - 20 });
      doc.font('Helvetica-Bold').fontSize(11).fillColor(colors.gray900)
        .text(`Date : ${dpDateStr}`, margin + 10, gridY + 38, { width: boxW - 20 });

      const midX = margin + boxW + gap;
      doc.roundedRect(midX, gridY, boxW, boxH, 8).lineWidth(1).stroke(colors.border);
      doc.font('Helvetica-Bold').fontSize(11).fillColor(colors.gray900)
        .text('DEMANDE DE PRIX', midX + 10, gridY + 24, { width: boxW - 20, align: 'center' });

      const cliX = margin + (boxW + gap) * 2;
      doc.roundedRect(cliX, gridY, boxW, boxH, 8).lineWidth(1).stroke(colors.border);
      const lineW = boxW - 16;
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor(colors.gray900)
        .text(fmtStr(demandePrix.fournisseur?.name || '-'), cliX + 8, gridY + 8, { width: lineW, ellipsis: true });
      doc.font('Helvetica').fontSize(8.5).fillColor(colors.gray600)
        .text(fmtStr(demandePrix.fournisseur?.email || '-'), cliX + 8, gridY + 24, { width: lineW, ellipsis: true });
      doc.font('Helvetica').fontSize(8.5).fillColor(colors.gray600)
        .text(fmtStr(demandePrix.fournisseur?.telFournisseur || 'Non renseigné'), cliX + 8, gridY + 38, { width: lineW, ellipsis: true });

      doc.font('Helvetica').fontSize(11).fillColor(colors.gray900)
        .text(
          "Nous vous prions de bien vouloir nous communiquer votre meilleur offre de prix concernant les produits ci-après",
          margin,
          gridY + boxH + 20,
          { width: contentWidth }
        );

      return gridY + boxH + 55;
    };

    const drawFooter = (yPosition) => {
      const startY = yPosition || (pageHeight - margin - footerHeight);
      const gap = 12;
      const sigW = (contentWidth - gap) / 2;
      const sigH = 86;

      const sigStartY = startY;

      doc.roundedRect(margin, sigStartY, sigW, sigH, 8).lineWidth(1).stroke(colors.borderSoft);
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(colors.gray900)
        .text('CACHET & SIGNATURE FOURNISSEUR', margin + 10, sigStartY + 10);
      doc.moveTo(margin + 10, sigStartY + sigH - 18).lineTo(margin + sigW - 10, sigStartY + sigH - 18)
        .lineWidth(1).stroke(colors.borderSoft);

      const sig2X = margin + sigW + gap;
      doc.roundedRect(sig2X, sigStartY, sigW, sigH, 8).lineWidth(1).stroke(colors.borderSoft);
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(colors.gray900)
        .text('LE RESPONSABLE ACHATS', sig2X + 10, sigStartY + 10);

      if (fs.existsSync(signaturePath)) {
        try {
          const fitW = sigW - 20;
          const fitH = 60;
          const imgX = sig2X + (sigW - fitW) / 2;
          const imgY = sigStartY + 22;
          doc.image(signaturePath, imgX, imgY, { fit: [fitW, fitH], align: 'center', valign: 'center' });
        } catch (e) {
          console.error('Error loading signature:', e);
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
      const headers = ['N°', 'Désignation', 'Reference', 'Unité', 'Quantité'];
      let x = margin;
      headers.forEach((h, i) => {
        doc.font('Helvetica-Bold').fontSize(8).fillColor(colors.white)
          .text(h, x + 4, y + 7, { width: colWidths[i] - 8, align: i === 1 ? 'left' : 'center' });
        x += colWidths[i];
      });
      return y + rowHeight;
    };

    const drawTableRow = (y, art, index) => {
      const bg = index % 2 === 0 ? colors.rowEven : colors.rowOdd;
      doc.rect(margin, y, contentWidth, rowHeight).fill(bg);

      let x = margin;
      colWidths.forEach((w) => {
        doc.rect(x, y, w, rowHeight).lineWidth(0.6).stroke(colors.rowBorder);
        x += w;
      });

      x = margin;
      doc.font('Helvetica').fontSize(8).fillColor(colors.gray900)
        .text(String(index + 1), x + 4, y + 7, { width: colWidths[0] - 12, align: 'center' });
      x += colWidths[0];

      doc.font('Helvetica').fontSize(8).fillColor(colors.gray800)
        .text(fmtStr(art.designation || ''), x + 4, y + 7, { width: colWidths[1] - 8, align: 'left', ellipsis: true });
      x += colWidths[1];

      doc.font('Helvetica').fontSize(8).fillColor(colors.gray800)
        .text(fmtStr(art.reference || ''), x + 4, y + 7, { width: colWidths[2] - 8, align: 'center', ellipsis: true });
      x += colWidths[2];

      doc.font('Helvetica').fontSize(8).fillColor(colors.gray800)
        .text(fmtStr(art.unite || ''), x + 4, y + 7, { width: colWidths[3] - 8, align: 'center', ellipsis: true });
      x += colWidths[3];

      doc.font('Helvetica').fontSize(8).fillColor(colors.gray800)
        .text(fmtStr(art.quantite ?? ''), x + 4, y + 7, { width: colWidths[4] - 8, align: 'center', ellipsis: true });

      return y + rowHeight;
    };

    let currentY = drawHeader();

    currentY += 10;
    currentY = drawTableHeader(currentY);

    const articles = Array.isArray(demandePrix.articles) ? demandePrix.articles : [];
    const reservedSpace = footerHeight + 20;

    if (!articles.length) {
      doc.rect(margin, currentY, contentWidth, rowHeight * 2).stroke(colors.rowBorder);
      doc.font('Helvetica-Oblique').fontSize(10).fillColor(colors.gray600)
        .text('Aucun article disponible', 0, currentY + 12, { align: 'center', width: pageWidth });
      currentY += rowHeight * 2;
    } else {
      articles.forEach((art, idx) => {
        if (currentY + rowHeight + reservedSpace > pageHeight) {
          doc.addPage();
          currentY = margin;
          currentY = drawTableHeader(currentY);
        }
        currentY = drawTableRow(currentY, art, idx);
      });
    }

    drawFooter(pageHeight - margin - footerHeight);
    
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

    // Generate PDF using existing function
    const pdfBuffer = await generateDemandePrixPDF(demandePrix);

    // Send email
    await sendEmail({
      from: "CONFONDA",
      to: email,
      subject: `Demande de prix n°${demandePrix.id}`,
      text: `Bonjour,\n\nVeuillez trouver ci-joint la demande de prix n°${demandePrix.id}.`,
      attachments: [
        {
          filename: `demandePrix_${demandePrix.id}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    });
    res.send('email Sent !');
  } catch (error) {
    console.log(error);
    res.send(error.message);
  }
};  



