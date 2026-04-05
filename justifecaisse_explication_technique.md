# JustifCaisseController - Explication Technique Ligne par Ligne

## Imports (Lignes 1-10)

```javascript
import prisma from "../db.js"                    // ORM Prisma pour DB
import PDFDocument from "pdfkit";               // Lib génération PDF
import fs from "fs";                            // File system Node.js
import path, { parse } from 'path';             // Gestion chemins fichiers
import { fileURLToPath } from 'url';            // Pour obtenir __dirname en ES6
import { PassThrough } from "stream";           // Stream pour buffer PDF
import { whatsappService } from "../services/whatssapservice.js";  // Service WhatsApp
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);     // Chemin absolu du fichier
import ExcelJS from 'exceljs';                  // Lib génération Excel
```

## Helper: getPreviousSolde (Lignes 12-24)

```javascript
const getPreviousSolde = async (userId, chantierId, mois, annee) => {
  let prevMois = mois - 1;        // Mois précédent
  let prevAnnee = annee;          // Année par défaut
  
  if (prevMois === 0) {           // Si janvier (1-1=0)
    prevMois = 12;                // Décembre
    prevAnnee -= 1;               // Année précédente
  }
  
  // Recherche la justification du mois précédent
  const prevJustif = await prisma.justifCaisse.findFirst({
    where: { userId, chantierId, mois: prevMois, annee: prevAnnee },
    select: { soldeFinal: true }, // Sélectionne seulement soldeFinal
  });
  
  return prevJustif?.soldeFinal ?? 0;  // Retourne solde ou 0 si null
};
```

## Helper: recalculateAndUpdateTotals (Lignes 27-63)

```javascript
const recalculateAndUpdateTotals = async (justifCaisseId) => {
  // 1. Récupère la justification
  const justifCaisse = await prisma.justifCaisse.findUnique({
    where: { id: justifCaisseId },
  });
  if (!justifCaisse) throw new Error("JustifCaisse not found");

  // 2. Calcule total recettes (SUM)
  const recettesSum = await prisma.recetteCaisse.aggregate({
    _sum: { montant: true },
    where: { justifCaisseId },
  });
  const totalRecettes = recettesSum._sum.montant ?? 0;

  // 3. Calcule total dépenses (SUM avec validation=true)
  const depensesSum = await prisma.depenseCaisse.aggregate({
    _sum: { montantJustifie: true, montantNonJustifie: true },
    where: { justifCaisseId, validation: true },  // UNIQUEMENT validées
  });
  const totalDepenses = (depensesSum._sum.montantJustifie ?? 0) + 
                        (depensesSum._sum.montantNonJustifie ?? 0);

  // 4. Calcule solde final
  const soldeFinal = justifCaisse.soldePrecedent + totalRecettes - totalDepenses;

  // 5. Met à jour la DB
  await prisma.justifCaisse.update({
    where: { id: justifCaisseId },
    data: { totalRecettes, totalDepenses, soldeFinal },
  });

  return { totalRecettes, totalDepenses, soldeFinal };
};
```

## Controller: createJustifCaisse (Lignes 66-151)

Render la page de création avec auto-génération du mois/année.

```javascript
export const createJustifCaisse = async (req, res) => {
  // Récupère user et chantierId depuis query ou body
  const user = req.session.user;
  const chantierIdRaw = req.query.chantierId ?? req.body?.chantierId;
  const chantierId = chantierIdRaw ? parseInt(chantierIdRaw) : NaN;
  
  // Validation auth
  if (!user || !user.name || !chantierIdRaw || Number.isNaN(chantierId)) {
    return res.status(403).render("error", { ... });
  }

  // Récupère la dernière justification pour déterminer le mois suivant
  const lastJustif = await prisma.justifCaisse.findFirst({
    where: { userId: user.id, chantierId },
    orderBy: { id: "desc" },
    select: { designation: true },
  });

  // Tableau des mois en français
  const months = ["Janvier", "Février", "Mars", ...];
  
  // Logique pour déterminer nextMonth/nextYear
  if (lastJustif?.designation) {
    // Parse la designation pour trouver mois et année
    const foundMonth = months.find(m => designationText.includes(m));
    const yearMatch = designationText.match(/\b(20\d{2})\b/);
    // Calcule mois suivant (avec gestion décembre->janvier)
    const newMonthIndex = (prevMonthIndex + 1) % 12;
    nextMonth = months[newMonthIndex];
    nextYear = newMonthIndex === 0 ? prevYear + 1 : prevYear;
  } else {
    // Pas de justification précédente -> utilise date actuelle
    nextMonth = months[now.getMonth()];
    nextYear = now.getFullYear();
  }

  // Génère designation formatée: "Justif.Caisse Janvier 2025"
  const designation = `Justif.Caisse ${nextMonth} ${nextYear}`;

  // Render la vue avec données par défaut
  res.render("dashboard/achats/caisse/justifecaisse/create", {
    user: { ...user, role: user.role, recettes: [], depenses: [] },
    chantier,
    justifCaisse: defaultJustifCaisse,
    designation,
  });
};
```

## Controller: addJustifCaisse (Lignes 153-212)

Crée une nouvelle justification via API (JSON response).

```javascript
export const addJustifCaisse = async (req, res) => {
  // Auth check
  if (!user) return res.status(403).json({ ... });
  
  // Validation chantierId
  const chantierId = parseInt(req.body.chantierId);
  if (!chantierId || Number.isNaN(chantierId)) { ... }

  // Récupère dernière justification pour ce user+chantier
  const last = await prisma.justifCaisse.findFirst({
    where: { userId: user.id, chantierId },
    orderBy: [{ annee: 'desc' }, { mois: 'desc' }],
  });

  // Calcule mois/année suivante
  if (last) {
    nextMois = last.mois + 1;
    nextAnnee = last.annee;
    if (nextMois > 12) { nextMois = 1; nextAnnee++; }  // Gestion année
  } else {
    nextMois = now.getMonth() + 1;
    nextAnnee = now.getFullYear();
  }

  // Calcule solde précédent automatiquement
  const soldePrecedent = await getPreviousSolde(user.id, chantierId, nextMois, nextAnnee);

  // Création en DB
  const justifCaisse = await prisma.justifCaisse.create({
    data: { mois: nextMois, annee: nextAnnee, designation, soldePrecedent, userId, chantierId },
  });

  res.json({ success: true, justifCaisse });
};
```

## Controller: createOrUpdateRecettes (Lignes 215-424)

Gère création/mise à jour des recettes avec validation complète.

```javascript
export const createOrUpdateRecettes = async (req, res) => {
  const { justifId } = req.params;
  const { responsable, chantier, designation, items } = req.body;

  // VALIDATIONS MULTIPLES:
  
  // 1. Session utilisateur
  if (!user || !user.id || !user.name) { ... }
  
  // 2. User existe en DB
  const userRecord = await prisma.user.findUnique({ where: { id: parseInt(user.id) } });
  if (!userRecord) { ... }
  
  // 3. Responsable correspond au session user
  if (userRecord.name !== responsable) { ... }
  
  // 4. Champs requis présents
  if (!responsable || !chantier || !designation || !items || !Array.isArray(items)) { ... }
  
  // 5. Chantier valide
  const chantierRecord = await prisma.chantier.findFirst({ where: { nom: chantier } });
  if (!chantierRecord) { ... }
  
  // 6. Parse designation (format: "Janvier-2025")
  const [moisStr, anneeStr] = designation.split('-');
  const moisIndex = ['Janvier', 'Février', ...].indexOf(moisStr);
  if (moisIndex === -1 || !anneeStr || isNaN(parseInt(anneeStr))) { ... }

  // RECHERCHE OU CRÉATION DE JUSTIFCAISSE
  
  // Cherche si justif existe déjà (user + chantier + mois + annee)
  let justifCaisse = await prisma.justifCaisse.findFirst({
    where: { userId, chantierId, mois, annee },
    include: { chantier: true },
  });

  // Si justifId fourni, valide qu'il correspond
  if (justifId) {
    const justifCaisseById = await prisma.justifCaisse.findUnique({ ... });
    if (justifCaisseById) {
      // Vérifie propriétaire
      if (justifCaisseById.userId !== userId || justifCaisseById.chantierId !== chantierId) {
        return res.status(403).json({ error: 'Justification non autorisée' });
      }
    }
  }

  // Si pas de justif, crée nouveau avec solde précédent calculé
  if (!justifCaisse) {
    const soldePrecedent = await getPreviousSolde(userId, chantierId, mois, annee);
    justifCaisse = await prisma.justifCaisse.create({ ... });
  }

  // TRAITEMENT DES RECETTES (items)
  for (const item of items) {
    // Validation item
    const dateRecette = new Date(item.dateRecette);
    if (isNaN(dateRecette.getTime())) { ... }  // Date invalide
    
    const montant = parseFloat(item.montant);
    if (isNaN(montant) || montant <= 0) { ... }  // Montant invalide
    
    if (!item.source || item.source.trim() === '') { ... }  // Source manquante

    const data = { source, userId, montant, dateRecette, justifCaisseId };

    // UPDATE ou CREATE
    if (item._id) {
      // Vérifie existence
      const existingRecette = await prisma.recetteCaisse.findUnique({
        where: { id: parseInt(item._id), justifCaisseId },
      });
      if (existingRecette) {
        await prisma.recetteCaisse.update({ where: { id }, data });
      } else {
        await prisma.recetteCaisse.create({ data });  // Fallback create
      }
    } else {
      await prisma.recetteCaisse.create({ data });  // Nouvelle recette
    }
  }

  // RECALCULE LES TOTAUX
  const { totalRecettes, totalDepenses, soldeFinal } = 
    await recalculateAndUpdateTotals(justifCaisse.id);

  // RÉPONSE AVEC DONNÉES ACTUALISÉES
  return res.json({
    success: true,
    justifId: justifCaisse.id,
    recettes: updatedRecettes.map(...),  // Formatte pour frontend
    totals: { totalRecettes, totalDepenses, soldeFinal },
  });
};
```

## Controller: deleteRecette (Lignes 427-450)

```javascript
export const deleteRecette = async (req, res) => {
  const { id } = req.params;
  const admin = req.session.user;  // Vérifie admin

  // Récupère recette
  const recette = await prisma.recetteCaisse.findUnique({ where: { id: parseInt(id) } });
  if (!recette) return res.status(403).json({ error: "Aucune Caisse" });

  // Suppression
  await prisma.recetteCaisse.delete({ where: { id: parseInt(id) } });

  // Recalcule totaux après suppression
  const { totalRecettes, totalDepenses, soldeFinal } = 
    await recalculateAndUpdateTotals(recette.justifCaisseId);

  res.json({ success: true, totals: { ... } });
};
```

## Controller: createOrUpdateDepenses (Lignes 453-694)

Le plus complexe : gère dépenses + logs de changements + notifications WhatsApp.

```javascript
export const createOrUpdateDepenses = async (req, res) => {
  // ... (validations similaires à recettes)

  const changeLogs = [];  // Pour tracker les modifications

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
      // === UPDATE EXISTANT ===
      const existing = await prisma.depenseCaisse.findUnique({ where: { id } });
      
      const changes = [];
      // Compare chaque champ et log les différences
      if (existing.dateDepense.getTime() !== data.dateDepense.getTime()) {
        changes.push(`Date: ${old} → ${new}`);
      }
      if (existing.numeroPiece !== data.numeroPiece) {
        changes.push(`NumeroPiece: ${old} → ${new}`);
      }
      // ... (autres comparaisons)

      await prisma.depenseCaisse.update({ where: { id }, data });

      if (changes.length > 0) {
        changeLogs.push(`✏️ Modification ligne ${item._id}\n${changes.join("\n")}`);
      }
    } else {
      // === CREATE NOUVEAU ===
      const created = await prisma.depenseCaisse.create({ data });
      changeLogs.push(`➕ Nouvelle dépense ajoutée\nNumeroPiece: ${created.numeroPiece}...`);
    }
  }

  // Recalcule totaux
  const { totalRecettes, totalDepenses, soldeFinal } = 
    await recalculateAndUpdateTotals(justifCaisse.id);

  // === NOTIFICATION WHATSAPP (async IIFE) ===
  if (changeLogs.length > 0) {
    (async () => {
      try {
        // Récupère numéros des recipients actifs
        const recipients = await prisma.whatsAppNotificationRecipient.findMany({
          where: { active: true, notifyJustiffecaisse: true },
          select: { phone: true },
        });
        const numbers = recipients.map(r => r.phone).filter(Boolean);
        if (!numbers.length) return;

        // Construit le message
        const message = `📢 Justification de caisse mise à jour
Utilisateur: ${user.name}
Chantier: ${chantierRecord.nom}
Date: ${new Date().toLocaleDateString("fr-FR")}
Changements:\n${changeLogs.join("\n\n")}`;

        // Génère PDF en buffer
        const pdfBuffer = await generateJustifCaissePDFBuffer(justifCaisse.id);
        const filename = `JustifCaisse_${justifCaisse.id}.pdf`;

        // Envoie à tous les numéros
        await Promise.allSettled(
          numbers.map(number =>
            whatsappService.sendMessage(number, message, {
              data: pdfBuffer,
              filename,
              mimetype: "application/pdf",
            })
          )
        );
      } catch (err) {
        console.error("WhatsApp notification failed:", err);
      }
    })();
  }

  res.json({ success: true, totals: { ... } });
};
```

## Controller: deleteDepense (Lignes 696-718)

Similaire à deleteRecette mais vérifie propriétaire (userId).

```javascript
export const deleteDepense = async (req, res) => {
  const depense = await prisma.depenseCaisse.findUnique({ where: { id } });
  
  // Vérifie propriétaire (sécurité)
  if (!depense || depense.userId !== user.id) {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  await prisma.depenseCaisse.delete({ where: { id } });
  
  // Recalcule
  const totals = await recalculateAndUpdateTotals(depense.justifCaisseId);
  res.json({ success: true, totals });
};
```

## PDF Generation (Lignes 1722-2045)

```javascript
export const generateJustifCaissePDF = async (req, res) => {
  // Récupère justif avec relations
  const justif = await prisma.justifCaisse.findUnique({
    where: { id: Number(id) },
    include: { recettes: true, depenses: true, user: ..., chantier: ... },
  });

  // Auth: propriétaire ou admin
  if (justif.userId !== user.id && !["admin", "grandadmin"].includes(user.role))
    return res.sendStatus(403);

  // Config PDF A4
  const doc = new PDFDocument({ size: "A4", margin: 40, bufferPages: true });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=JustifCaisse_${id}.pdf`);
  doc.pipe(res);

  // Constantes mise en page
  const PAGE_WIDTH = 595.28;    // Points (A4)
  const PAGE_HEIGHT = 841.89;
  const MARGIN = 40;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
  const FOOTER_HEIGHT = 70;

  // Helper: vérifie espace restant, ajoute page si nécessaire
  const ensureSpace = (currentY, neededHeight, onNewPage) => {
    if (currentY + neededHeight <= getPageBottomY()) return currentY;
    doc.addPage();
    drawHeader();
    return onNewPage();
  };

  // Header avec logo
  const drawHeader = () => {
    const logo = path.join(process.cwd(), "public/img/logo-4.png");
    if (fs.existsSync(logo)) doc.image(logo, MARGIN, 30, { width: 90 });
    
    doc.font("Helvetica-Bold").fontSize(16).text("JUSTIFICATIFS DE CAISSE", 0, 40, { align: "center" });
    doc.fontSize(9).text(`N° : J-${justif.id}`, PAGE_WIDTH - 160, 40);
  };

  // Info box avec données chantier/user
  const drawInfoBox = (yPosition) => {
    doc.rect(MARGIN, y, CONTENT_WIDTH, 90).stroke();
    doc.text(`Responsable : ${justif.user?.name ?? "-"}`, MARGIN + 10, y + 25);
    doc.text(`Chantier : ${justif.chantier?.nom ?? "-"}`, MARGIN + 10, y + 40);
    doc.text(`Solde Précédent : ${Number(justif.soldePrecedent).toFixed(2)} MAD`, ...);
    doc.text(`Solde Final : ${Number(justif.soldeFinal).toFixed(2)} MAD`, ...);
  };

  // Table Recettes avec colonnes Date/Source/Montant
  const drawRecettesTable = (yPosition) => {
    const cols = [{ label: "Date", w: 100 }, { label: "Source", w: 250 }, { label: "Montant", w: 100 }];
    
    // Calcule hauteur dynamique selon contenu
    const getRowHeight = (values) => {
      let maxHeight = minRowH;
      cols.forEach((c, i) => {
        const textHeight = doc.heightOfString(String(text), { width: c.w - 8 });
        maxHeight = Math.max(maxHeight, textHeight + 12);
      });
      return maxHeight;
    };

    // Dessine ligne avec bordures
    const drawRow = (yy, values, bold = false) => {
      let x = tableX;
      doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(9);
      
      cols.forEach((c, i) => {
        doc.rect(x, yy, c.w, maxHeight).stroke();  // Bordure
        doc.text(values[i], x + 4, yy + 6, { width: c.w - 8, align: i === 2 ? "right" : "left" });
        x += c.w;
      });
      return maxHeight;
    };

    // Parcourt recettes et dessine chaque ligne
    justif.recettes.forEach(r => {
      const rowValues = [
        new Date(r.dateRecette).toLocaleDateString("fr-FR"),
        r.source ?? "",
        Number(r.montant ?? 0).toFixed(2),
      ];
      
      // Vérifie espace, ajoute page si besoin
      yPosition = ensureSpace(yPosition, rowHeightMeasured, () => { ... });
      
      const rowHeight = drawRow(yPosition, rowValues);
      yPosition += rowHeight;
    });

    // Ligne total
    const totalValues = ["TOTAL", "", totalRecettes.toFixed(2)];
    drawRow(yPosition, totalValues, true);  // bold=true
  };

  // Table Dépenses (similaire avec plus de colonnes)
  const drawDepensesTable = (yPosition) => {
    const cols = [
      { label: "Date", w: 70 },
      { label: "N° Pièce", w: 60 },
      { label: "Nature Dépense", w: 170 },
      { label: "Imputation", w: 70 },
      { label: "Justifié", w: 70 },
      { label: "Non Justifié", w: 70 },
    ];
    // ... (logique similaire à recettes)
  };

  // Footer rouge avec coordonnées entreprise
  const drawFooter = (yPosition) => {
    doc.rect(0, fy, PAGE_WIDTH, FOOTER_HEIGHT).fill("#8B0000");  // Fond rouge
    doc.fillColor("#fff").fontSize(8)
      .text("82, angle Bd Abdelmoumen...", 0, fy + 20, { align: "center" });
  };

  // Main execution
  drawHeader();
  let currentY = drawInfoBox(110);
  
  if (justif.recettes?.length > 0) {
    currentY = drawRecettesTable(currentY);
  }
  
  const depensesTable = drawDepensesTable(currentY);
  // ... (dessine dépenses, totaux, etc.)
  
  drawFooter();
  doc.end();
};
```

## PDF Buffer pour WhatsApp (Lignes 2047-2369)

```javascript
const generateJustifCaissePDFBuffer = async (id) => {
  // Similaire à generateJustifCaissePDF mais :
  // - Utilise PassThrough stream au lieu de res
  // - Accumule chunks dans buffer
  // - Retourne Buffer.concat(chunks)
  
  const chunks = [];
  const pass = new PassThrough();
  pass.on('data', (c) => chunks.push(c));
  
  const finished = new Promise((resolve, reject) => {
    pass.on('end', resolve);
    pass.on('error', reject);
  });

  const doc = new PDFDocument({ ... });
  doc.pipe(pass);  // Pipe vers PassThrough au lieu de res
  
  // ... (même logique de dessin)
  
  doc.end();
  await finished;
  return Buffer.concat(chunks);  // Retourne buffer pour WhatsApp
};
```

## Excel Generation (Lignes 2371-2487)

```javascript
export const generateJustifCaisseExcel = async (req, res) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Dépenses');

  // Merge cells pour titre
  sheet.mergeCells('A1', 'F1');
  sheet.getCell('A1').value = `Justification Caisse: ${justifCaisse.designation}`;
  sheet.getCell('A1').font = { bold: true, size: 14 };
  sheet.getCell('A1').alignment = { horizontal: 'center' };

  // Headers avec style
  const headers = ['Date', 'N° Piece', 'Nature de la Dépense', 'Imputation', 'Justifié', 'Non Justifié'];
  const headerRow = sheet.addRow(headers);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFA52A2A' } };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  
  // Bordures sur chaque cellule
  headerRow.eachCell((cell) => {
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  // Data rows avec alternating colors
  justifCaisse.depenses.forEach((depense, index) => {
    const row = sheet.addRow([...]);
    const fillColor = index % 2 === 0 ? 'FFF9F9F9' : 'FFFFFFFF';  // Gris/Blanc alterné
    row.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
      cell.border = { ... };
    });
  });

  // Totaux
  const totalJustifie = justifCaisse.depenses.reduce((sum, d) => sum + Number(d.montantJustifie ?? 0), 0);
  const totalRow = sheet.addRow(['TOTAL', '', '', '', totalJustifie, totalNonJustifie]);
  totalRow.font = { bold: true };

  // Response avec headers pour download
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=JustifCaisse-${justifCaisse.designation}.xlsx`);
  
  await workbook.xlsx.write(res);
  res.end();
};
```

## Résumé Architecture

```
justifecaisseController.js
├── Helpers
│   ├── getPreviousSolde()          → Récupère solde mois précédent
│   └── recalculateAndUpdateTotals() → Recalcule et update totaux
├── CRUD JustifCaisse
│   ├── createJustifCaisse()         → Page création (render)
│   ├── addJustifCaisse()            → API création (JSON)
│   └── getAllJustifCaisse()         → Liste justifs
├── CRUD Recettes
│   ├── createOrUpdateRecettes()     → Création/MAJ recettes
│   └── deleteRecette()              → Suppression recette
├── CRUD Dépenses
│   ├── createOrUpdateDepenses()     → Création/MAJ dépenses + WhatsApp
│   └── deleteDepense()              → Suppression dépense
├── Validation
│   ├── updateDepenceValidation()    → Valide/refuse dépense
│   └── validateAllDepenses()        → Valide toutes dépenses
├── Exports
│   ├── generateJustifCaissePDF()    → Génère PDF (stream)
│   ├── generateJustifCaissePDFBuffer() → Génère PDF (buffer)
│   └── generateJustifCaisseExcel()  → Génère Excel
└── Admin
    ├── createJustifCaisseAdmin()   → Admin crée pour user
    ├── saveRecettesAdmin()          → Admin save recettes
    └── ... (autres fonctions admin)
```

## Points Techniques Clés

1. **Transaction logique** : Recalcule systématique des totaux après chaque opération
2. **Sécurité** : Vérification userId sur chaque opération sensible
3. **Async IIFE** : Notifications WhatsApp non-bloquantes
4. **Streaming PDF** : Génération progressive pour grandes justifications
5. **Validation data** : ParseInt, parseFloat avec gestion NaN
6. **Soft validation** : Dépenses validées = incluses dans calculs
