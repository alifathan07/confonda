import prisma from "../db.js";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { sendEmail } from "../services/emailservice.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Helper: standard M:N include for DemandeDePrix ───────────────────────────
const dpInclude = {
  articles: true,
  demandeandfournisseur: {
    include: { fournisseur: true }
  }
};

// ─── Helper: parse + validate supplier IDs array from request body ─────────────
const parseSupplierIds = (suppliers) => {
  const raw = Array.isArray(suppliers) ? suppliers : suppliers ? [suppliers] : [];
  return raw.map(s => parseInt(s)).filter(n => Number.isFinite(n) && n > 0);
};

// ─── Helper: extract flat fournisseurs list from a dp record ──────────────────
const flattenFournisseurs = (dp) => {
  const list = (dp.demandeandfournisseur || []).map(df => df.fournisseur).filter(Boolean);
  dp.fournisseurs = list;
  dp.fournisseurIds = list.map(f => f.id);
  // legacy single-fournisseur accessor (first one, or empty object)
  dp.fournisseur = list[0] || null;
  return dp;
};

// ─── Render page: list all ────────────────────────────────────────────────────
export const listDemandePrix = async (req, res) => {
  try {
    const demandePrix = await prisma.demandeDePrix.findMany({
      include: dpInclude,
      orderBy: { id: 'desc' }
    });

    // Add flat helpers to every entry
    demandePrix.forEach(flattenFournisseurs);

    const fournisseurs = await prisma.fournisseur.findMany({ select: { id: true, name: true } });

    const rowsForExport = demandePrix.map(dp => ({
      id: `#${dp.id}`,
      dateISO: dp.date ? new Date(dp.date).toISOString() : null,
      fournisseur: dp.fournisseurs.map(f => f.name).join(', ') || '—',
      articles: Array.isArray(dp.articles) ? dp.articles.length : 0,
    }));

    res.render('dashboard/achats/demandeprix/list', { demandePrix, fournisseurs, rowsForExport });
  } catch (err) {
    console.error('Erreur listDemandePrix:', err);
    res.status(500).send('Erreur serveur');
  }
};

// ─── Render page: create form ─────────────────────────────────────────────────
export const createDemandePrix = async (req, res) => {
  try {
    const fournisseurs = await prisma.fournisseur.findMany({ orderBy: { name: 'asc' } });
    res.render('dashboard/achats/demandeprix/create', { fournisseurs });
  } catch (err) {
    console.error('Erreur createDemandePrix:', err);
    res.status(500).send('Erreur serveur');
  }
};

// ─── Render page: view (read-only) ───────────────────────────────────────────
export const viewDemandePrix = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id || isNaN(id)) return res.status(404).send('Demande non trouvée');
    const dp = await prisma.demandeDePrix.findUnique({ where: { id }, include: dpInclude });
    if (!dp) return res.status(404).send('Demande non trouvée');
    res.render('dashboard/achats/demandeprix/index', { demandePrix: flattenFournisseurs(dp) });
  } catch (err) {
    console.error('Erreur viewDemandePrix:', err);
    res.status(500).send('Erreur serveur');
  }
};

// ─── Render page: edit form ───────────────────────────────────────────────────
export const EditDemandePrix = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const dp = await prisma.demandeDePrix.findUnique({ where: { id }, include: dpInclude });
    if (!dp) return res.status(404).send('Demande non trouvée');

    const fournisseurs = await prisma.fournisseur.findMany({ orderBy: { name: 'asc' } });
    res.render('dashboard/achats/demandeprix/edit', {
      demandePrix: flattenFournisseurs(dp),
      fournisseurs
    });
  } catch (err) {
    console.error('Erreur EditDemandePrix:', err);
    res.status(500).send('Erreur serveur');
  }
};

// ─── API: CREATE new DemandeDePrix ────────────────────────────────────────────
export const storeDemandePrix = async (req, res) => {
  try {
    const { suppliers = [], date, articles = [] } = req.body || {};
    const supplierIds = parseSupplierIds(suppliers);
    const jsDate = new Date(date);

    if (supplierIds.length === 0)
      return res.status(400).json({ success: false, error: 'Sélectionnez au moins un fournisseur.' });
    if (isNaN(jsDate.getTime()))
      return res.status(400).json({ success: false, error: 'Date invalide.' });

    const articlesToCreate = (Array.isArray(articles) ? articles : [])
      .map(a => ({
        designation: String(a?.designation || '').trim(),
        reference: a?.reference ? String(a.reference).trim() : null,
        unite: String(a?.unite || ''),
        quantite: parseInt(a?.quantite) || 1,
      }))
      .filter(a => a.designation);

    const created = await prisma.demandeDePrix.create({
      data: {
        date: jsDate,
        demandeandfournisseur: {
          create: supplierIds.map(sid => ({ fournisseurId: sid, status: 'En attente' }))
        },
        articles: { create: articlesToCreate }
      },
      select: { id: true }
    });

    return res.json({ success: true, id: created.id, redirect: `/achat/demande-prix/${created.id}/edit` });
  } catch (err) {
    console.error('Erreur storeDemandePrix:', err);
    res.status(500).json({ success: false, error: 'Erreur serveur.' });
  }
};

// ─── API: UPDATE existing DemandeDePrix ──────────────────────────────────────
export const updateDemandePrix = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { suppliers = [], date, articles = [], deletedArticleIds = [] } = req.body || {};

    const supplierIds = parseSupplierIds(suppliers);
    const jsDate = new Date(date);

    if (!id || isNaN(id)) return res.status(400).json({ success: false, error: 'ID invalide.' });
    if (supplierIds.length === 0) return res.status(400).json({ success: false, error: 'Sélectionnez au moins un fournisseur.' });
    if (isNaN(jsDate.getTime())) return res.status(400).json({ success: false, error: 'Date invalide.' });

    const toDeleteIds = (Array.isArray(deletedArticleIds) ? deletedArticleIds : [])
      .map(Number).filter(n => Number.isInteger(n) && n > 0);

    const existingArticles = (Array.isArray(articles) ? articles : [])
      .filter(a => a && a.id)
      .map(a => ({
        id: Number(a.id),
        designation: String(a.designation || '').trim(),
        reference: a.reference ? String(a.reference).trim() : null,
        unite: String(a.unite || ''),
        quantite: parseInt(a.quantite) || 1,
      }))
      .filter(a => Number.isInteger(a.id) && a.id > 0);

    const newArticles = (Array.isArray(articles) ? articles : [])
      .filter(a => !a?.id)
      .map(a => ({
        designation: String(a?.designation || '').trim(),
        reference: a?.reference ? String(a.reference).trim() : null,
        unite: String(a?.unite || ''),
        quantite: parseInt(a?.quantite) || 1,
      }))
      .filter(a => a.designation);

    await prisma.$transaction(async (tx) => {
      // 1. Update date and articles
      await tx.demandeDePrix.update({
        where: { id },
        data: {
          date: jsDate,
          articles: {
            deleteMany: toDeleteIds.length ? { id: { in: toDeleteIds } } : undefined,
            create: newArticles,
            update: existingArticles.map(a => ({
              where: { id: a.id },
              data: { designation: a.designation, reference: a.reference, unite: a.unite, quantite: a.quantite }
            }))
          }
        }
      });

      // 2. Sync suppliers (add new, remove removed)
      const currentLinks = await tx.demandeandfournisseur.findMany({
        where: { demandeDePrixId: id },
        select: { fournisseurId: true }
      });
      const currentIds = currentLinks.map(l => l.fournisseurId);

      const toAdd = supplierIds.filter(sid => !currentIds.includes(sid));
      const toRemove = currentIds.filter(sid => !supplierIds.includes(sid));

      if (toRemove.length > 0) {
        await tx.demandeandfournisseur.deleteMany({
          where: { demandeDePrixId: id, fournisseurId: { in: toRemove } }
        });
      }
      if (toAdd.length > 0) {
        await tx.demandeandfournisseur.createMany({
          data: toAdd.map(sid => ({ demandeDePrixId: id, fournisseurId: sid, status: 'En attente' }))
        });
      }
    });

    return res.json({ success: true, message: 'Demande de prix mise à jour avec succès.' });
  } catch (err) {
    console.error('Erreur updateDemandePrix:', err);
    res.status(500).json({ success: false, error: 'Erreur serveur: ' + err.message });
  }
};

// ─── API: DELETE DemandeDePrix ────────────────────────────────────────────────
export const deleteDemandePrix = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id || isNaN(id)) return res.status(400).json({ success: false, error: 'ID invalide.' });

    await prisma.$transaction([
      prisma.article.deleteMany({ where: { demandeDePrixId: id } }),
      prisma.demandeandfournisseur.deleteMany({ where: { demandeDePrixId: id } }),
      prisma.demandeDePrix.delete({ where: { id } })
    ]);

    return res.json({ success: true });
  } catch (err) {
    console.error('Erreur deleteDemandePrix:', err);
    res.status(500).json({ success: false, error: 'Erreur serveur.' });
  }
};

// ─── API: DELETE single Article ───────────────────────────────────────────────
export const deleteArticle = async (req, res) => {
  try {
    await prisma.article.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erreur serveur.' });
  }
};

// ─── API: POST DemandePrix from Fourniture ────────────────────────────────────
// Creates one DemandeDePrix per fournisseur group using the M:N join table
export const postDemandePrixViaFourniture = async (req, res) => {
  try {
    const { demandeId, items } = req.body;
    if (!demandeId || !Array.isArray(items) || items.length === 0)
      return res.status(400).json({ success: false, error: 'Données invalides.' });

    // Group item IDs by fournisseur
    const byFournisseur = items.reduce((acc, { itemId, fournisseurId }) => {
      const fid = parseInt(fournisseurId);
      const iid = parseInt(itemId);
      if (!acc[fid]) acc[fid] = [];
      acc[fid].push(iid);
      return acc;
    }, {});

    const allItemIds = items.map(i => parseInt(i.itemId));
    const demandeItems = await prisma.itemFourniture.findMany({
      where: { id: { in: allItemIds }, demandeFournitureId: parseInt(demandeId) },
      select: { id: true, designation: true, unité: true, quantité: true, observation: true, lot: true }
    });

    if (demandeItems.length === 0)
      return res.status(400).json({ success: false, error: 'Aucun article trouvé.' });

    const itemMap = Object.fromEntries(demandeItems.map(it => [it.id, it]));
    const createdIds = [];

    for (const [fournisseurId, itemIds] of Object.entries(byFournisseur)) {
      const fid = parseInt(fournisseurId);
      const fournisseur = await prisma.fournisseur.findUnique({ where: { id: fid } });
      if (!fournisseur) continue;

      const validIds = itemIds.filter(id => itemMap[id]);
      if (validIds.length === 0) continue;

      const articles = validIds.map(id => {
        const a = itemMap[id];
        return {
          designation: a.designation,
          reference: a.lot ?? null,
          unite: a.unité ?? null,
          quantite: parseInt(a.quantité) || 1,
          prixUnitaire: null,
          totalHt: null,
          delaiLivraison: null,
          observation: a.observation ?? null,
        };
      });

      const dp = await prisma.demandeDePrix.create({
        data: {
          date: new Date(),
          demandeandfournisseur: {
            create: [{ fournisseurId: fid, status: 'En attente' }]
          },
          articles: { create: articles }
        },
        select: { id: true }
      });

      createdIds.push(dp.id);
    }

    if (createdIds.length === 0)
      return res.status(400).json({ success: false, error: 'Aucune demande créée.' });

    return res.status(201).json({
      success: true,
      count: createdIds.length,
      demandePrixIds: createdIds,
      primaryId: createdIds[0],
      message: `${createdIds.length} demande(s) de prix créée(s).`
    });
  } catch (err) {
    console.error('Erreur postDemandePrixViaFourniture:', err);
    res.status(500).json({ success: false, error: 'Erreur serveur.' });
  }
};

// ─── API: Generate PDF for download ──────────────────────────────────────────
export const generateDemandePrixPDF = async (req, res) => {
  const demandePrixId = parseInt(req.params.id, 10);
  if (isNaN(demandePrixId)) return res.status(400).send('ID invalide');

  try {
    const dp = await prisma.demandeDePrix.findUnique({
      where: { id: demandePrixId },
      include: dpInclude
    });
    if (!dp) return res.status(404).send('Non trouvé');

    flattenFournisseurs(dp);

    // For the downloadable PDF, show all suppliers or the first one's info
    const pdfBuffer = await generateDemandePrixPDFBuffer(dp, dp.fournisseur);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=demandePrix_${dp.id}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Erreur PDF:', err);
    res.status(500).send('Erreur PDF');
  }
};

// ─── API: Send email to all suppliers ────────────────────────────────────────
export const sendDemandePrixEmail = async (req, res) => {
  const demandePrixId = parseInt(req.params.id, 10);
  if (isNaN(demandePrixId)) return res.status(400).json({ success: false, error: 'ID invalide.' });

  try {
    const dp = await prisma.demandeDePrix.findUnique({
      where: { id: demandePrixId },
      include: dpInclude
    });
    if (!dp) return res.status(404).json({ success: false, error: 'Demande non trouvée.' });

    flattenFournisseurs(dp);
    const suppliers = dp.fournisseurs;

    if (suppliers.length === 0)
      return res.status(400).json({ success: false, error: 'Aucun fournisseur associé.' });

    let sent = 0, failed = [];

    for (const fournisseur of suppliers) {
      if (!fournisseur.email) {
        failed.push(`${fournisseur.name} (pas d'email)`);
        continue;
      }

      try {
        // Generate a personalized PDF for this supplier
        const pdfBuffer = await generateDemandePrixPDFBuffer(dp, fournisseur);

        const result = await sendEmail({
          from: 'CONFONDA',
          to: fournisseur.email,
          subject: `Demande de prix n°${dp.id}`,
          text: `Bonjour ${fournisseur.name},\n\nVeuillez trouver ci-joint la demande de prix n°${dp.id}.\n\nCordialement,\n\nKhbazi Mustapha\nRésp. Service Achats\nTél. 06 44 00 05 47\nCONFONDA`,
          attachments: [{
            filename: `demandePrix_${dp.id}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }]
        });

        if (result.success) {
          // Update status in join table
          await prisma.demandeandfournisseur.updateMany({
            where: { demandeDePrixId: dp.id, fournisseurId: fournisseur.id },
            data: { status: 'Envoyé', emailSentAt: new Date() }
          });
          sent++;
        } else {
          failed.push(`${fournisseur.name} (${result.error || 'erreur inconnue'})`);
        }
      } catch (emailErr) {
        failed.push(`${fournisseur.name} (${emailErr.message})`);
      }
    }

    const msg = failed.length === 0
      ? `Email envoyé avec succès à ${sent} fournisseur(s).`
      : `Envoyé à ${sent}/${suppliers.length}. Échec: ${failed.join(', ')}.`;

    return res.json({ success: true, message: msg });
  } catch (err) {
    console.error('Erreur sendDemandePrixEmail:', err);
    res.status(500).json({ success: false, error: 'Erreur serveur.' });
  }
};

// ─── Internal: generate PDF buffer ───────────────────────────────────────────
// `fournisseurForPdf` is the specific supplier to display in the header box.
const generateDemandePrixPDFBuffer = (demandePrix, fournisseurForPdf = null) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true, autoFirstPage: true });
      const buffers = [];
      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const margin = 40;
      const contentWidth = pageWidth - margin * 2;

      const colors = {
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

      const fmt = (s) => String(s || '').replace(/[\u202F\u00A0]/g, ' ');
      const dpDateStr = new Date(demandePrix.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

      // Determine supplier info to display in PDF header
      const sup = fournisseurForPdf
        || (demandePrix.fournisseurs && demandePrix.fournisseurs[0])
        || demandePrix.fournisseur
        || {};

      // ── Draw page header ──
      const drawHeader = () => {
        const toplineY = margin;
        const toplineH = 70;

        if (fs.existsSync(logoPath)) {
          try { doc.image(logoPath, margin, toplineY + 2, { height: 60 }); } catch (_) { }
        }

        const centerX = margin + contentWidth / 2;
        doc.rect(centerX - 3, toplineY + 12, 6, 44).fill(colors.brand);
        doc.font('Helvetica-Bold').fontSize(13).fillColor(colors.brand)
          .text('Construction et Fondation', centerX + 14, toplineY + 18, { align: 'left' });
        doc.font('Helvetica').fontSize(9).fillColor(colors.gray600)
          .text('Pour des constructions bien fondées', centerX + 14, toplineY + 36, { align: 'left' });

        const gridY = toplineY + toplineH + 12;
        const gap = 10;
        const boxW = (contentWidth - gap * 2) / 3;
        const boxH = 68;

        // Box 1: DP number + date
        doc.roundedRect(margin, gridY, boxW, boxH, 8).lineWidth(1).stroke(colors.border);
        doc.font('Helvetica-Bold').fontSize(11).fillColor(colors.gray900)
          .text(`DP N° : ${demandePrix.id}`, margin + 10, gridY + 14, { width: boxW - 20 });
        doc.font('Helvetica-Bold').fontSize(11).fillColor(colors.gray900)
          .text(`Date : ${dpDateStr}`, margin + 10, gridY + 38, { width: boxW - 20 });

        // Box 2: Title
        const midX = margin + boxW + gap;
        doc.roundedRect(midX, gridY, boxW, boxH, 8).lineWidth(1).stroke(colors.border);
        doc.font('Helvetica-Bold').fontSize(11).fillColor(colors.gray900)
          .text('DEMANDE DE PRIX', midX + 10, gridY + 24, { width: boxW - 20, align: 'center' });

        // Box 3: Supplier info
        const cliX = margin + (boxW + gap) * 2;
        doc.roundedRect(cliX, gridY, boxW, boxH, 8).lineWidth(1).stroke(colors.border);
        const lw = boxW - 16;
        doc.font('Helvetica-Bold').fontSize(9.5).fillColor(colors.gray900)
          .text(fmt(sup.name || '—'), cliX + 8, gridY + 8, { width: lw, ellipsis: true });
        doc.font('Helvetica').fontSize(8.5).fillColor(colors.gray600)
          .text(fmt(sup.email || '—'), cliX + 8, gridY + 24, { width: lw, ellipsis: true });
        doc.font('Helvetica').fontSize(8.5).fillColor(colors.gray600)
          .text(fmt(sup.telFournisseur || 'Non renseigné'), cliX + 8, gridY + 38, { width: lw, ellipsis: true });

        doc.font('Helvetica').fontSize(11).fillColor(colors.gray900)
          .text(
            'Nous vous prions de bien vouloir nous communiquer votre meilleur offre de prix concernant les produits ci-après',
            margin, gridY + boxH + 20, { width: contentWidth }
          );

        return gridY + boxH + 55;
      };

      // ── Draw footer ──
      const drawFooter = (yPos) => {
        const startY = yPos;
        const gap = 12;
        const sigW = (contentWidth - gap) / 2;
        const sigH = 86;

        doc.roundedRect(margin, startY, sigW, sigH, 8).lineWidth(1).stroke(colors.borderSoft);
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor(colors.gray900)
          .text('CACHET & SIGNATURE FOURNISSEUR', margin + 10, startY + 10);
        doc.moveTo(margin + 10, startY + sigH - 18)
          .lineTo(margin + sigW - 10, startY + sigH - 18)
          .lineWidth(1).stroke(colors.borderSoft);

        const sig2X = margin + sigW + gap;
        doc.roundedRect(sig2X, startY, sigW, sigH, 8).lineWidth(1).stroke(colors.borderSoft);
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor(colors.gray900)
          .text('LE RESPONSABLE ACHATS', sig2X + 10, startY + 10);

        if (fs.existsSync(signaturePath)) {
          try {
            const fitW = sigW - 20;
            doc.image(signaturePath, sig2X + 10, startY + 22, { fit: [fitW, 60], align: 'center', valign: 'center' });
          } catch (_) { }
        }
        doc.moveTo(sig2X + 10, startY + sigH - 18)
          .lineTo(sig2X + sigW - 10, startY + sigH - 18)
          .lineWidth(1).stroke(colors.borderSoft);

        const fy = pageHeight - companyFooterHeight;
        doc.rect(0, fy, pageWidth, companyFooterHeight).fill('#AB3029').stroke();
        doc.font('Helvetica').fontSize(9).fillColor('#FFFFFF');
        doc.text('82, angle Bd abdelmoumen et rue Soumaya Imm.Shahrazad III 2ème étage Casablanca Tél : 0522-23-39-70',
          50, fy + 15, { width: pageWidth - 100, align: 'center' });
        doc.text('Fax : 0522-23-42-60  Capital : 18 500 000.00 DH  CNSS : 7167788 - R.C. : 145619 – I.F. : 1602714 – Patente : 37900708- I.C.E : 001526422000063',
          50, fy + 30, { width: pageWidth - 100, align: 'center' });
      };

      const drawTableHeader = (y) => {
        doc.rect(margin, y, contentWidth, rowHeight).fill(colors.tableHeader);
        const headers = ['N°', 'Désignation', 'Référence', 'Unité', 'Quantité'];
        let x = margin;
        headers.forEach((h, i) => {
          doc.font('Helvetica-Bold').fontSize(8).fillColor(colors.white)
            .text(h, x + 4, y + 7, { width: colWidths[i] - 8, align: i === 1 ? 'left' : 'center' });
          x += colWidths[i];
        });
        return y + rowHeight;
      };

      const drawTableRow = (y, art, idx) => {
        const bg = idx % 2 === 0 ? colors.rowEven : colors.rowOdd;
        doc.rect(margin, y, contentWidth, rowHeight).fill(bg);
        let x = margin;
        colWidths.forEach(w => { doc.rect(x, y, w, rowHeight).lineWidth(0.6).stroke(colors.rowBorder); x += w; });

        x = margin;
        doc.font('Helvetica').fontSize(8).fillColor(colors.gray900)
          .text(String(idx + 1), x + 4, y + 7, { width: colWidths[0] - 12, align: 'center' });
        x += colWidths[0];
        doc.font('Helvetica').fontSize(8).fillColor(colors.gray800)
          .text(fmt(art.designation || ''), x + 4, y + 7, { width: colWidths[1] - 8, ellipsis: true });
        x += colWidths[1];
        doc.font('Helvetica').fontSize(8).fillColor(colors.gray800)
          .text(fmt(art.reference || ''), x + 4, y + 7, { width: colWidths[2] - 8, align: 'center', ellipsis: true });
        x += colWidths[2];
        doc.font('Helvetica').fontSize(8).fillColor(colors.gray800)
          .text(fmt(art.unite || ''), x + 4, y + 7, { width: colWidths[3] - 8, align: 'center', ellipsis: true });
        x += colWidths[3];
        doc.font('Helvetica').fontSize(8).fillColor(colors.gray800)
          .text(fmt(art.quantite ?? ''), x + 4, y + 7, { width: colWidths[4] - 8, align: 'center', ellipsis: true });

        return y + rowHeight;
      };

      // ── Render ──
      let y = drawHeader();
      y += 10;
      y = drawTableHeader(y);

      const articles = Array.isArray(demandePrix.articles) ? demandePrix.articles : [];
      const reservedSpace = footerHeight + 20;

      if (!articles.length) {
        doc.rect(margin, y, contentWidth, rowHeight * 2).stroke(colors.rowBorder);
        doc.font('Helvetica-Oblique').fontSize(10).fillColor(colors.gray600)
          .text('Aucun article disponible', 0, y + 12, { align: 'center', width: pageWidth });
        y += rowHeight * 2;
      } else {
        articles.forEach((art, idx) => {
          if (y + rowHeight + reservedSpace > pageHeight) {
            doc.addPage();
            y = margin;
            y = drawTableHeader(y);
          }
          y = drawTableRow(y, art, idx);
        });
      }

      drawFooter(pageHeight - margin - footerHeight);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
