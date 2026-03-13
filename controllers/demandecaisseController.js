import prisma from "../db.js"
import PDFDocument from "pdfkit";
import fs from "fs";
import path, { parse } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import ExcelJS from 'exceljs';
import { whatsappService } from "../services/whatssapservice.js";
import { PassThrough } from "stream";

export const indexDemandeCaisse = async (req, res) => {
  const demande = await prisma.demandeCaisse.findMany({
    include: {
      user: true,
      items: true,
      chantier: true,
    },
    orderBy: {
      id: 'desc',
    },
  });
  const chantiers = await prisma.chantier.findMany()

  // Sort so that 'En Attente' comes first
  const sortedDemande = demande.sort((a, b) => {
    if (a.status === 'En Attente' && b.status !== 'En Attente') return -1;
    if (a.status !== 'En Attente' && b.status === 'En Attente') return 1;
    return 0;
  });

  const users = await prisma.user.findMany({
    where: { role: 'user' }
  });

  res.render('dashboard/achats/caisse/demande/index', {
    demande: sortedDemande,
    users,
    chantiers
  });
};

export const createDemandeCaisse = async(req , res) => {
    
    const user = await prisma.user.findUnique({
        where: {
            id: req.session.user.id
        }
    })
    const today = new Date().toISOString().split('T')[0];
    const chantiers = await prisma.chantier.findMany()

    
 
    res.render('dashboard/achats/caisse/demande/create' , { user , today , chantiers } )
}
  export const storeDemandeCaisse = async (req, res) => {
      try {
        const { demandeur, chantier, designation, items } = req.body;
    
        // Log incoming request for debugging
        console.log('Request body:', { demandeur, chantier, designation, items });
    
        // Validate session
        if (!req.session?.user?.id) {
          console.error('Session validation failed:', req.session?.user);
          return res.status(401).json({ success: false, error: 'Utilisateur non authentifié ou chantier manquant.' });
        }
        // https://grok.com/c/686e7aca-c44a-4443-a805-8fdc630da836
    
        // Validate input
        if (!designation) {
          console.error('Designation missing');
          return res.status(400).json({ success: false, error: 'Le mois (designation) est requis.' });
        }
    
        if (!items || !Array.isArray(items) || items.length === 0) {
          console.error('Invalid items:', items);
          return res.status(400).json({ success: false, error: 'Les items doivent être un tableau non vide.' });
        }
        if (!chantier) {
          console.error('Chantier missing');
          return res.status(400).json({ success: false, error: 'Le chantier est requis.' });
        }
    
        // Validate items
        for (const [index, item] of items.entries()) {
          if (!item.dateCaisse || !item.designation || !item.montant ) {
            console.error(`Invalid item at index ${index}:`, item);
            return res.status(400).json({ success: false, error: `Tous les champs des items doivent être remplis (item ${index + 1}).` });
          }
          const montant = parseFloat(item.montant);
          if (isNaN(montant) || montant <= 0) {
            console.error(`Invalid montant at index ${index}:`, item.montant);
            return res.status(400).json({ success: false, error: `Le montant doit être un nombre positif (item ${index + 1}).` });
          }
        }
    
        // Calculate total montant
        const montantTotal = items.reduce((sum, item) => sum + parseFloat(item.montant), 0);
        console.log('Calculated montantTotal:', montantTotal);
    
        // Generate user-specific numero
        const lastDemande = await prisma.demandeCaisse.findFirst({
          where: { userId: req.session.user.id },
          orderBy: { numero: 'desc' },
          select: { numero: true },
        });
        const numero = lastDemande ? lastDemande.numero + 1 : 1;
        console.log('Generated numero:', numero);
    
        // Create DemandeCaisse
        const demandeCaisse = await prisma.demandeCaisse.create({
          data: {
            designation,
            montantTotal,
            dateDemande: new Date(),
            numero,
            demandeur: demandeur || null,
            user: { connect: { id: req.session.user.id } },
            chantier: { connect: { id: parseInt(chantier) } },
            color: 'blue',
            items: {
              create: items.map((item, index) => {
                console.log(`Creating item ${index}:`, item);
                return {
                  dateCaisse: new Date(item.dateCaisse),
                  designation: item.designation,
                  montant: parseFloat(item.montant),
                  imputation: item.imputation,
                };
              }),
            },
          },
          include: { items: true },
        });
        const chantierNom = await prisma.chantier.findUnique({
          where: { id: parseInt(chantier) },
          select: { nom: true },
        });
        
        console.log('Created DemandeCaisse:', demandeCaisse);
        const parsedDate = new Date(demandeCaisse.dateDemande);
          const message = `Nouvelle demande de caisse créée par ${req.session.user.name}. Numéro de demande: ${demandeCaisse.numero}. Date de création: ${parsedDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })}.chantier: ${chantierNom.nom}.Montant total demandé : ${montantTotal} MAD .`;

            const recipients = await prisma.whatsAppNotificationRecipient.findMany({
              where: {
                active: true,
                notifyCaisse: true,
              },
              select: { phone: true },
            });

            const numbers = recipients.map((r) => r.phone);

            (async () => {
              const pdfBuffer = await generateDemandeCaissePDFBuffer(demandeCaisse.id);
              const filename = `DemandeCaisse_${demandeCaisse.numero}.pdf`;

              await Promise.allSettled(
                numbers.map((number) =>
                  whatsappService.sendMessage(number, message, {
                    data: pdfBuffer,
                    filename,
                    mimetype: "application/pdf",
                  })
                )
              );
            })().catch((err) => console.error("WhatsApp DemandeCaisse PDF send failed:", err));
              
        // Return JSON response
        res.status(200).json({ success: true, data: demandeCaisse, id: demandeCaisse.id });
      } catch (error) {
        console.error('Error creating DemandeCaisse:', error);
        if (error.code === 'P2002') {
          return res.status(400).json({ success: false, error: 'Numéro de demande déjà utilisé pour cet utilisateur.' });
        }
        res.status(500).json({ success: false, error: `Erreur serveur : ${error.message}` });
      }
    };
export const viewDemandeCaisse = async (req, res) => {
    const demandeCaisse = await prisma.demandeCaisse.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
      include: {
        items: true,
        user: true,
        chantier: true,
      },
    });
    const user = await prisma.user.findUnique({
        where: {
            id: req.session.user.id
        }
    })
    
    res.render('dashboard/achats/caisse/demande/view', { demandeCaisse , user });
  };
  export const deleteDemandeCaisseItem = async (req, res) => {
    const id = req.params.id;
    try {
      const item = await prisma.itemCaisse.delete({
        where: {
          id: parseInt(id),
        },
      });
      const items = await prisma.itemCaisse.findMany({
        where: {
          demandeCaisseId: item.demandeCaisseId,
        },
      });
      const montantTotal = items.reduce((sum, item) => sum + parseFloat(item.montant), 0);
      await prisma.demandeCaisse.update({
        where: {
          id: item.demandeCaisseId,
        },
        data: {
          montantTotal,
        },
      });
      res.redirect(`/achats/demandes/caisse/${item.demandeCaisseId}`);
    } catch (error) {
      console.error('Error deleting item:', error);
      res.status(500).send('Erreur lors de la suppression de l\'item.');
    }
  };
  export const updateDemandeCaisseItem = async (req, res) => {
    const id = req.params.id;
    try {
      const itemId = parseInt(id);
      const updateData = {};

      if (typeof req.body.dateCaisse !== 'undefined' && req.body.dateCaisse !== '') {
        updateData.dateCaisse = new Date(req.body.dateCaisse);
      }
      if (typeof req.body.designation !== 'undefined') {
        updateData.designation = req.body.designation;
      }
      if (typeof req.body.montant !== 'undefined' && req.body.montant !== '') {
        updateData.montant = parseFloat(req.body.montant);
      }
      if (typeof req.body.imputation !== 'undefined') {
        updateData.imputation = req.body.imputation;
      }

      const { item, montantTotal } = await prisma.$transaction(async (tx) => {
        const item = await tx.itemCaisse.update({
          where: { id: itemId },
          data: updateData,
        });

        if (!item.demandeCaisseId) {
          throw new Error('Item is not linked to a DemandeCaisse.');
        }

        const sum = await tx.itemCaisse.aggregate({
          _sum: { montant: true },
          where: { demandeCaisseId: item.demandeCaisseId },
        });
        const montantTotal = sum._sum.montant ?? 0;

        await tx.demandeCaisse.update({
          where: { id: item.demandeCaisseId },
          data: { montantTotal },
        });

        return { item, montantTotal };
      });

      const wantsJson =
        req.xhr ||
        (req.headers.accept && req.headers.accept.includes('application/json')) ||
        (req.headers['content-type'] && req.headers['content-type'].includes('application/json'));

      if (wantsJson) {
        return res.json({ success: true, item, montantTotal });
      }

      return res.redirect(`/achats/demandes/caisse/${item.demandeCaisseId}`);
    } catch (error) {
      console.error('Error updating item:', error);
      const wantsJson =
        req.xhr ||
        (req.headers.accept && req.headers.accept.includes('application/json')) ||
        (req.headers['content-type'] && req.headers['content-type'].includes('application/json'));
      if (wantsJson) {
        return res.status(500).json({ success: false, error: "Erreur lors de la mise à jour de l'item." });
      }
      return res.status(500).send('Erreur lors de la mise à jour de l\'item.');
    }
  };
export const addCaisseItem = async (req, res) => {
  const demandeCaisseId = parseInt(req.params.id);
  try {
    const item = await prisma.itemCaisse.create({
      data: {
        dateCaisse: new Date(req.body.dateCaisse),
        designation: req.body.designation,
        montant: parseFloat(req.body.montant),
        imputation: req.body.imputation || null,
        demandeCaisse: { connect: { id: demandeCaisseId } },
      },
    });

    // Recalculate total
    const items = await prisma.itemCaisse.findMany({
      where: { demandeCaisseId },
    });
    const montantTotal = items.reduce((sum, item) => sum + parseFloat(item.montant), 0);

    await prisma.demandeCaisse.update({
      where: { id: demandeCaisseId },
      data: { montantTotal },
    });

    res.json({ success: true, item });
  } catch (error) {
    console.error('Error adding item:', error);
    res.json({ success: false, error: 'Erreur lors de l\'ajout de l\'item.' });
  }
};


export const updateDemandeCaisseStatut = async (req, res) => {
  const id = req.params.id;
  const { status } = req.body;
  try {
    const demandeCaisse = await prisma.demandeCaisse.update({
      where: { id: parseInt(id) },
      data: { status, color: "gray" },
    });

    if (status === 'Versée') {
      // Fetch full demandeCaisse with relations
      const fullDemande = await prisma.demandeCaisse.findUnique({
        where: { id: parseInt(id) },
        include: { user: true, chantier: true },
      });

      // Parse designation to extract mois and annee
      const designationText = fullDemande.designation.trim();
      const months = [
        "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
        "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
      ];
      const foundMonth = months.find(m => designationText.includes(m));
      const yearMatch = designationText.match(/\b(20\d{2})\b/);

      if (!foundMonth || !yearMatch) {
        throw new Error(`Invalid designation format: ${designationText}`);
      }

      const mois = months.indexOf(foundMonth) + 1;
      const annee = parseInt(yearMatch[1], 10);

      // Find existing justifCaisse
      let justifCaisse = await prisma.justifCaisse.findFirst({
        where: {
          userId: fullDemande.userId,
          chantierId: fullDemande.chantierId,
          mois,
          annee,
        },
      });

      if (!justifCaisse) {
        // Calculate previous solde
        let prevMois = mois - 1;
        let prevAnnee = annee;
        if (prevMois === 0) {
          prevMois = 12;
          prevAnnee -= 1;
        }
        const prevJustif = await prisma.justifCaisse.findFirst({
          where: { userId: fullDemande.userId, chantierId: fullDemande.chantierId, mois: prevMois, annee: prevAnnee },
          select: { soldeFinal: true },
        });
        const soldePrecedent = prevJustif?.soldeFinal ?? 0;
      

        // Create new justifCaisse
        justifCaisse = await prisma.justifCaisse.create({
          data: {
            mois,
            annee,
            designation: `Justification Caisse ${foundMonth} ${annee}`,
            soldePrecedent,
            totalRecettes: 0,
            totalDepenses: 0,
            soldeFinal: soldePrecedent,
            userId: fullDemande.userId,
            chantierId: fullDemande.chantierId,
          },
        });
      }
      

      // Add recette from the demande
      await prisma.recetteCaisse.create({
        data: {
          source: `Versement demande ${fullDemande.numero}`,
          montant: fullDemande.montantTotal,
          dateRecette: new Date(),
          justifCaisseId: justifCaisse.id,
          userId: fullDemande.userId,

        },
      });
      


      // Recalculate and update totals for justifCaisse
      const recettesSum = await prisma.recetteCaisse.aggregate({
        _sum: { montant: true },
        where: { justifCaisseId: justifCaisse.id },
      });
      const totalRecettes = recettesSum._sum.montant ?? 0;

      const depensesSum = await prisma.depenseCaisse.aggregate({
        _sum: { montantJustifie: true, montantNonJustifie: true },
        where: { justifCaisseId: justifCaisse.id, validation: true },
      });
      const totalDepenses = (depensesSum._sum.montantJustifie ?? 0) + (depensesSum._sum.montantNonJustifie ?? 0);

      const soldeFinal = justifCaisse.soldePrecedent + totalRecettes - totalDepenses;

      await prisma.justifCaisse.update({
        where: { id: justifCaisse.id },
        data: {
          totalRecettes,
          totalDepenses,
          soldeFinal,
        },
      });
    }

    res.json({ success: true, demandeCaisse });
  } catch (error) {
    console.error('Error updating demandeCaisse:', error);
    res.json({ success: false, error: 'Erreur lors de la mise à jour de la demandeCaisse.' });
  }
};


export const updateDemandeCaisseItemValidation = async (req, res) => {
    const id = req.params.id;
    const { validation } = req.body;
  
    try {
      // Update the item
      const item = await prisma.itemCaisse.update({
        where: { id: parseInt(id) },
        data: { 
          validation,
          validepar: req.session.user.name,
        },
      });
  
      // Recalculate total from all validated items
      const items = await prisma.itemCaisse.findMany({
        where: { 
          demandeCaisseId: item.demandeCaisseId,
          validation: { not: 'Refusée' } // Only include validated items
        },
      });
  
      const total = items.reduce((acc, curr) => acc + curr.montant, 0);
  
      // Update the demandeCaisse total
      const demandeCaisse = await prisma.demandeCaisse.update({
        where: { id: item.demandeCaisseId },
        data: { 
          montantTotal: total, 
          color: validation === 'Refusée' || validation === 'Validée' ?  'green'  : 'blue'
        },
      });
  
      res.json({ success: true, item, montantTotal: total });
    } catch (error) {
      console.error('Error updating item validation:', error);
      res.json({ success: false, error: 'Erreur lors de la mise à jour de la validation de l\'item.' });
    }
};
export const updateDemandeCaisseValidationAll = async (req, res) => {
  const id = parseInt(req.params.id);
  const { validation } = req.body;
  try {
    const items = await prisma.itemCaisse.updateMany({
      where: { demandeCaisseId: id },
      data: { validation , validepar: req.session.user.name },
    }); 
    console.log("validation success ");
    res.status(200).json({ success: true, items , validation });
  } catch (error) {
    console.error('Error updating demandeCaisse validation:', error);
    res.json({ success: false, error: 'Erreur lors de la mise à jour de la validation de la demandeCaisse.' });
  }
}
export const deleteDemandeCaisse = async(req , res) => {
    const id = parseInt(req.params.id);
    try {
        await prisma.$transaction([
          prisma.itemCaisse.deleteMany({ where: { demandeCaisseId: id } }),
          prisma.demandeCaisse.delete({ where: { id } }),
        ]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting demandeCaisse:', error);
        res.json({ success: false, error: 'Erreur lors de la suppression de la demandeCaisse.' });
    }
}

// Constants for consistent styling
const COLORS = {
  PRIMARY: '#A52A2A', // Softer red for branding
  SECONDARY: '#333333', // Dark gray for text
  BACKGROUND: '#F9F9F9', // Light gray for backgrounds
  TABLE_HEADER: '#4A4A4A', // Darker gray for table headers
  WHITE: '#FFFFFF',
  BORDER: '#D3D3D3',
};

const FONTS = {
  REGULAR: 'Helvetica',
  BOLD: 'Helvetica-Bold',
  ITALIC: 'Helvetica-Oblique',
};

const SIZES = {
  TITLE: 18,
  SUBTITLE: 12,
  BODY: 10,
  SMALL: 8,
  MARGIN: 50,
  PAGE_WIDTH: 595,
  PAGE_HEIGHT: 842,
  HEADER_HEIGHT: 130,
  FOOTER_HEIGHT: 80,
};

export const generateDemandePdf = async (req, res) => {
  const { id } = req.params;
  const demandeCaisseId = parseInt(id, 10);

  if (isNaN(demandeCaisseId)) {
    return res.status(400).send('ID de demandeCaisse invalide');
  }

  try {
    const demandeCaisse = await prisma.demandeCaisse.findUnique({
      where: { id: demandeCaisseId },
      include: {
        items: true,
        user: true,
        chantier: true,
      },
    });

    if (!demandeCaisse) {
      return res.status(404).send('DemandeCaisse non trouvée');
    }

    const COLORS = {
      PRIMARY: '#A52A2A',
      SECONDARY: '#333333',
      BACKGROUND: '#FAFAFA',
      TABLE_HEADER: '#4A4A4A',
      WHITE: '#FFFFFF',
      BORDER: '#E0E0E0',
    };

    const FONTS = {
      REGULAR: 'Helvetica',
      BOLD: 'Helvetica-Bold',
      ITALIC: 'Helvetica-Oblique',
    };

    const SIZES = {
      TITLE: 18,
      SUBTITLE: 12,
      BODY: 10,
      SMALL: 8,
      MARGIN: 50,
      PAGE_WIDTH: 595,
      PAGE_HEIGHT: 842,
      FOOTER_HEIGHT: 70,
    };

    const { PAGE_WIDTH, PAGE_HEIGHT, FOOTER_HEIGHT, MARGIN } = SIZES;
    const footerY = PAGE_HEIGHT - FOOTER_HEIGHT;
    const getPageBottomY = () => PAGE_HEIGHT - FOOTER_HEIGHT - MARGIN;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=DemandeCaisse_${demandeCaisse.id}.pdf`
    );

    const doc = new PDFDocument({ margin: MARGIN, size: 'A4', bufferPages: true });
    doc.pipe(res);

    // BC-style footer with red bar
    const drawFooter = (yPosition) => {
      const footerHeight = 55;
      const footerY = yPosition || (PAGE_HEIGHT - MARGIN - footerHeight);

      // Red footer bar
      doc.rect(0, footerY, PAGE_WIDTH, footerHeight).fill('#AB3029').stroke();

      const textMargin = 6;
      const textY = footerY + 6;
      const text2Y = textY + 14;

      doc.font('Helvetica').fontSize(6.5).fillColor('#FFFFFF');

      doc.text(
        '82, angle Bd abdelmoumen et rue Soumaya Imm.Shahrazad III 2ème étage Casablanca Tél : 0522-23-39-70',
        50,
        textY + textMargin,
        { width: PAGE_WIDTH - 100, align: 'center', lineBreak: false }
      );

      doc.text(
        'Fax : 0522-23-42-60  Capital : 18 500 000.00 DH  CNSS : 7167788 - R.C. : 145619 – I.F. : 1602714 – Patente : 37900708- I.C.E : 001526422000063',
        50,
        text2Y + textMargin,
        { width: PAGE_WIDTH - 100, align: 'center', lineBreak: false }
      );
    };

    const drawHeaderAndInfo = () => {
      const logoPath = path.join(__dirname, '../public/img/logo-4.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, MARGIN, 25, { width: 100 });
      }

      doc
        .font(FONTS.BOLD)
        .fontSize(SIZES.TITLE)
        .fillColor(COLORS.PRIMARY)
        .text('DEMANDE DE CAISSE', 0, 40, { align: 'center', width: PAGE_WIDTH });

      doc
        .font(FONTS.REGULAR)
        .fontSize(SIZES.BODY)
        .fillColor(COLORS.SECONDARY)
        .text(`N° Demande: D-${demandeCaisse.numero}`, PAGE_WIDTH - MARGIN - 130, 35)
        .text(
          `Date: ${new Date(demandeCaisse.dateDemande).toLocaleDateString('fr-FR')}`,
          PAGE_WIDTH - MARGIN - 130,
          50
        );

      doc.moveDown(10);
      const infoY = doc.y;
      doc
        .rect(MARGIN, infoY - 5, PAGE_WIDTH - MARGIN * 2, 80)
        .fillAndStroke(COLORS.BACKGROUND, COLORS.BORDER);

      doc
        .font(FONTS.BOLD)
        .fontSize(SIZES.SUBTITLE)
        .fillColor(COLORS.PRIMARY)
        .text('Informations de la Demande', MARGIN + 10, infoY);

      doc
        .font(FONTS.REGULAR)
        .fontSize(SIZES.BODY)
        .fillColor(COLORS.SECONDARY)
        .text(`Demandeur : ${demandeCaisse.user?.name || 'Non spécifié'}`, MARGIN + 10, infoY + 20)
        .text(`Chantier : ${demandeCaisse.chantier?.nom || 'Non spécifié'}`, MARGIN + 10, infoY + 35)
        .text(`Mois : ${demandeCaisse.designation || 'N/A'}`, MARGIN + 10, infoY + 50)
        .text(
          `Montant Total : ${demandeCaisse.montantTotal
            .toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            .replace(/[\u00A0\u202F]/g, ' ')}`,
          PAGE_WIDTH - MARGIN - 180,
          infoY + 20
        );

      doc.moveDown(5);
      return doc.y + 10;
    };

    const startX = MARGIN;
    const colWidths = [90, 220, 100, 85];
    const tableWidth = colWidths.reduce((a, b) => a + b, 0);
    const headerHeight = 28;
    const minRowHeight = 25;
    const cellPaddingY = 7;

    const drawTableHeader = (y) => {
      doc
        .rect(startX, y, tableWidth, headerHeight)
        .strokeColor('#000000')
        .lineWidth(0.5)
        .stroke();

      doc
        .font(FONTS.BOLD)
        .fontSize(SIZES.BODY)
        .fillColor(COLORS.PRIMARY)
        .text('Date', startX + 5, y + 8, { width: colWidths[0] - 5, align: 'left' })
        .text('Désignation', startX + colWidths[0] + 5, y + 8, {
          width: colWidths[1] - 5,
          align: 'left',
        })
        .text('Imputation', startX + colWidths[0] + colWidths[1] + 5, y + 8, {
          width: colWidths[2] - 5,
          align: 'left',
        })
        .text('Montant (DH)', startX + colWidths[0] + colWidths[1] + colWidths[2] + 5, y + 8, {
          width: colWidths[3] - 10,
          align: 'right',
        });

      let x = startX;
      colWidths.forEach((w) => {
        doc.moveTo(x, y).lineTo(x, y + headerHeight).stroke();
        x += w;
      });
      doc.moveTo(x, y).lineTo(x, y + headerHeight).stroke();
      return y + headerHeight;
    };

    const getRowHeight = (rowData) => {
      doc.font(FONTS.REGULAR).fontSize(SIZES.BODY);
      let maxH = minRowHeight;
      rowData.forEach((data, i) => {
        const text = data ?? '';
        const h = doc.heightOfString(String(text), {
          width: colWidths[i] - 10,
          align: i === 3 ? 'right' : 'left',
        });
        maxH = Math.max(maxH, Math.ceil(h + cellPaddingY * 2));
      });
      return maxH;
    };

    const drawRow = (rowY, rowData, rowHeight) => {
      doc
        .rect(startX, rowY, tableWidth, rowHeight)
        .strokeColor('#000000')
        .lineWidth(0.3)
        .stroke();

      doc.font(FONTS.REGULAR).fontSize(SIZES.BODY).fillColor(COLORS.SECONDARY);

      let x = startX + 5;
      rowData.forEach((data, i) => {
        doc.text(data ?? '', x, rowY + cellPaddingY, {
          width: colWidths[i] - 10,
          height: rowHeight - cellPaddingY * 2,
          align: i === 3 ? 'right' : 'left',
        });
        x += colWidths[i];
      });

      let colX = startX;
      colWidths.forEach((w) => {
        doc.moveTo(colX, rowY).lineTo(colX, rowY + rowHeight).stroke();
        colX += w;
      });
      doc.moveTo(colX, rowY).lineTo(colX, rowY + rowHeight).stroke();
    };

    const rows = demandeCaisse.items.map((item) => [
      new Date(item.dateCaisse).toLocaleDateString('fr-FR'),
      item.designation || '-',
      item.imputation || '-',
      item.montant
        .toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        .replace(/[\u00A0\u202F]/g, ' '),
    ]);

    const rowHeights = rows.map((r) => getRowHeight(r));
    const totalBlockH = 30;

    const drawTotalBlock = (y, isLastPage = true) => {
      const totalText = isLastPage
        ? demandeCaisse.montantTotal
            .toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            .replace(/[\u00A0\u202F]/g, ' ')
        : 'X';
      doc
        .font(FONTS.BOLD)
        .fontSize(SIZES.SUBTITLE)
        .fillColor(COLORS.PRIMARY)
        .text(`Total : ${totalText}`, startX, y + 10, { align: 'right', width: tableWidth });
      return y + totalBlockH;
    };

    // Footer space calculation (only red bar)
    const footerHeight = 55;
    const footerTotalHeight = footerHeight + 10;
    const headerInfoHeight = 220; // Approximate height of header + info section

    // Draw page 1: Header + Info + Table start
    let currentY = drawHeaderAndInfo();
    currentY = drawTableHeader(currentY);

    let idx = 0;
    const pageBottomLimit = PAGE_HEIGHT - MARGIN - footerTotalHeight;

    // Page 1: fill table until footer limit
    while (idx < rows.length) {
      const rh = rowHeights[idx];
      if (currentY + rh > pageBottomLimit) break;
      drawRow(currentY, rows[idx], rh);
      currentY += rh;
      idx++;
    }

    // Check if all items fit on page 1
    const allItemsOnPage1 = idx >= rows.length;

    // Draw footer at bottom of page 1 (with X for total if not last page)
    drawFooter(PAGE_HEIGHT - MARGIN - footerHeight);

    // Subsequent pages for remaining items
    while (idx < rows.length) {
      doc.addPage();
      let py = MARGIN;
      py = drawTableHeader(py);

      const pageBottom = PAGE_HEIGHT - MARGIN - footerTotalHeight;
      while (idx < rows.length) {
        const rh = rowHeights[idx];
        if (py + rh > pageBottom) break;
        drawRow(py, rows[idx], rh);
        py += rh;
        idx++;
      }

      const isLastPage = idx >= rows.length;

      // If last page and total fits, draw it; otherwise just footer
      if (isLastPage && py + totalBlockH <= pageBottom) {
        drawTotalBlock(py, true);
      } else {
        // Not last page or total doesn't fit - draw X
        if (isLastPage) {
          // Last page but total doesn't fit, need new page
          drawFooter(PAGE_HEIGHT - MARGIN - footerHeight);
          doc.addPage();
          py = MARGIN;
          py = drawTableHeader(py);
          drawTotalBlock(py, true);
        }
      }

      // Draw footer at bottom of each page
      drawFooter(PAGE_HEIGHT - MARGIN - footerHeight);
    }

    // If all items on page 1, draw total there
    if (allItemsOnPage1) {
      if (currentY + totalBlockH <= pageBottomLimit) {
        drawTotalBlock(currentY, true);
      } else {
        // Total doesn't fit on page 1, add new page
        drawFooter(PAGE_HEIGHT - MARGIN - footerHeight);
        doc.addPage();
        let py = MARGIN;
        py = drawTableHeader(py);
        drawTotalBlock(py, true);
        drawFooter(PAGE_HEIGHT - MARGIN - footerHeight);
      }
    }

    const range = doc.bufferedPageRange();
    for (let p = range.start; p < range.start + range.count; p++) {
      doc.switchToPage(p);
      doc
        .font(FONTS.REGULAR)
        .fontSize(SIZES.SMALL)
        .fillColor(COLORS.SECONDARY)
        .text(`Page ${p + 1} / ${range.count}`, PAGE_WIDTH - MARGIN - 90, 18, { width: 90, align: 'right' });
    }

    doc.end();
  } catch (error) {
    console.error('Erreur lors de la génération du PDF :', error);
    res.status(500).send('Erreur lors de la génération du PDF');
  }
};

export const generateDemandeCaissePDFBuffer = async (demandeCaisseId) => {
  const id = parseInt(demandeCaisseId, 10);
  if (isNaN(id)) {
    throw new Error('ID de demandeCaisse invalide');
  }

  const demandeCaisse = await prisma.demandeCaisse.findUnique({
    where: { id },
    include: {
      items: true,
      user: true,
      chantier: true,
    },
  });

  if (!demandeCaisse) {
    throw new Error('DemandeCaisse non trouvée');
  }

  const chunks = [];
  const pass = new PassThrough();
  pass.on('data', (c) => chunks.push(c));

  const finished = new Promise((resolve, reject) => {
    pass.on('end', resolve);
    pass.on('error', reject);
  });

  const COLORS = {
    PRIMARY: '#A52A2A',
    SECONDARY: '#333333',
    BACKGROUND: '#FAFAFA',
    TABLE_HEADER: '#4A4A4A',
    WHITE: '#FFFFFF',
    BORDER: '#E0E0E0',
  };

  const FONTS = {
    REGULAR: 'Helvetica',
    BOLD: 'Helvetica-Bold',
    ITALIC: 'Helvetica-Oblique',
  };

  const SIZES = {
    TITLE: 18,
    SUBTITLE: 12,
    BODY: 10,
    SMALL: 8,
    MARGIN: 50,
    PAGE_WIDTH: 595,
    PAGE_HEIGHT: 842,
  };

  const { PAGE_WIDTH, PAGE_HEIGHT, MARGIN } = SIZES;
  const getPageBottomY = () => PAGE_HEIGHT - MARGIN;

  const doc = new PDFDocument({ margin: MARGIN, size: 'A4', bufferPages: true });
  doc.pipe(pass);

  const drawHeaderAndInfo = () => {
    const logoPath = path.join(__dirname, '../public/img/logo-4.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, MARGIN, 25, { width: 100 });
    }

    doc
      .font(FONTS.BOLD)
      .fontSize(SIZES.TITLE)
      .fillColor(COLORS.PRIMARY)
      .text('DEMANDE DE CAISSE', 0, 40, { align: 'center', width: PAGE_WIDTH });

    doc
      .font(FONTS.REGULAR)
      .fontSize(SIZES.BODY)
      .fillColor(COLORS.SECONDARY)
      .text(`N° Demande: D-${demandeCaisse.numero}`, PAGE_WIDTH - MARGIN - 130, 35)
      .text(
        `Date: ${new Date(demandeCaisse.dateDemande).toLocaleDateString('fr-FR')}`,
        PAGE_WIDTH - MARGIN - 130,
        50
      );

    doc.moveDown(10);
    const infoY = doc.y;
    doc
      .rect(MARGIN, infoY - 5, PAGE_WIDTH - MARGIN * 2, 80)
      .fillAndStroke(COLORS.BACKGROUND, COLORS.BORDER);

    doc
      .font(FONTS.BOLD)
      .fontSize(SIZES.SUBTITLE)
      .fillColor(COLORS.PRIMARY)
      .text('Informations de la Demande', MARGIN + 10, infoY);

    doc
      .font(FONTS.REGULAR)
      .fontSize(SIZES.BODY)
      .fillColor(COLORS.SECONDARY)
      .text(`Demandeur : ${demandeCaisse.user?.name || 'Non spécifié'}`, MARGIN + 10, infoY + 20)
      .text(`Chantier : ${demandeCaisse.chantier?.nom || 'Non spécifié'}`, MARGIN + 10, infoY + 35)
      .text(`Mois : ${demandeCaisse.designation || 'N/A'}`, MARGIN + 10, infoY + 50)
      .text(
        `Montant Total : ${demandeCaisse.montantTotal
          .toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          .replace(/[\u00A0\u202F]/g, ' ')}`,
        PAGE_WIDTH - MARGIN - 180,
        infoY + 20
      );

    doc.moveDown(5);
    return doc.y + 10;
  };

  const startX = MARGIN;
  const colWidths = [90, 220, 100, 85];
  const tableWidth = colWidths.reduce((a, b) => a + b, 0);
  const headerHeight = 28;
  const minRowHeight = 25;
  const cellPaddingY = 7;

  const drawTableHeader = (y) => {
    doc
      .rect(startX, y, tableWidth, headerHeight)
      .strokeColor('#000000')
      .lineWidth(0.5)
      .stroke();

    doc
      .font(FONTS.BOLD)
      .fontSize(SIZES.BODY)
      .fillColor(COLORS.PRIMARY)
      .text('Date', startX + 5, y + 8, { width: colWidths[0] - 5, align: 'left' })
      .text('Désignation', startX + colWidths[0] + 5, y + 8, {
        width: colWidths[1] - 5,
        align: 'left',
      })
      .text('Imputation', startX + colWidths[0] + colWidths[1] + 5, y + 8, {
        width: colWidths[2] - 5,
        align: 'left',
      })
      .text('Montant (DH)', startX + colWidths[0] + colWidths[1] + colWidths[2] + 5, y + 8, {
        width: colWidths[3] - 10,
        align: 'right',
      });

    let x = startX;
    colWidths.forEach((w) => {
      doc.moveTo(x, y).lineTo(x, y + headerHeight).stroke();
      x += w;
    });
    doc.moveTo(x, y).lineTo(x, y + headerHeight).stroke();
    return y + headerHeight;
  };

  const getRowHeight = (rowData) => {
    doc.font(FONTS.REGULAR).fontSize(SIZES.BODY);
    let maxH = minRowHeight;
    rowData.forEach((data, i) => {
      const text = data ?? '';
      const h = doc.heightOfString(String(text), {
        width: colWidths[i] - 10,
        align: i === 3 ? 'right' : 'left',
      });
      maxH = Math.max(maxH, Math.ceil(h + cellPaddingY * 2));
    });
    return maxH;
  };

  const drawRow = (rowY, rowData, rowHeight) => {
    doc
      .rect(startX, rowY, tableWidth, rowHeight)
      .strokeColor('#000000')
      .lineWidth(0.3)
      .stroke();

    doc.font(FONTS.REGULAR).fontSize(SIZES.BODY).fillColor(COLORS.SECONDARY);

    let x = startX + 5;
    rowData.forEach((data, i) => {
      doc.text(data ?? '', x, rowY + cellPaddingY, {
        width: colWidths[i] - 10,
        height: rowHeight - cellPaddingY * 2,
        align: i === 3 ? 'right' : 'left',
      });
      x += colWidths[i];
    });

    let colX = startX;
    colWidths.forEach((w) => {
      doc.moveTo(colX, rowY).lineTo(colX, rowY + rowHeight).stroke();
      colX += w;
    });
    doc.moveTo(colX, rowY).lineTo(colX, rowY + rowHeight).stroke();
  };

  const rows = demandeCaisse.items.map((item) => [
    new Date(item.dateCaisse).toLocaleDateString('fr-FR'),
    item.designation || '-',
    item.imputation || '-',
    item.montant
      .toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      .replace(/[\u00A0\u202F]/g, ' '),
  ]);

  const rowHeights = rows.map((r) => getRowHeight(r));
  const totalBlockH = 30;

  const drawTotalBlock = (y, isLastPage = true) => {
    const totalText = isLastPage
      ? demandeCaisse.montantTotal
          .toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          .replace(/[\u00A0\u202F]/g, ' ')
      : 'X';
    doc
      .font(FONTS.BOLD)
      .fontSize(SIZES.SUBTITLE)
      .fillColor(COLORS.PRIMARY)
      .text(`Total : ${totalText}`, startX, y + 10, { align: 'right', width: tableWidth });
    return y + totalBlockH;
  };

  const drawFooter = (yPosition) => {
    const footerHeight = 55;
    const footerY = yPosition || (PAGE_HEIGHT - MARGIN - footerHeight);

    // Red footer bar
    doc.rect(0, footerY, PAGE_WIDTH, footerHeight).fill('#AB3029').stroke();

    const textMargin = 6;
    const textY = footerY + 6;
    const text2Y = textY + 14;

    doc.font('Helvetica').fontSize(6.5).fillColor('#FFFFFF');

    doc.text(
      '82, angle Bd abdelmoumen et rue Soumaya Imm.Shahrazad III 2ème étage Casablanca Tél : 0522-23-39-70',
      50,
      textY + textMargin,
      { width: PAGE_WIDTH - 100, align: 'center', lineBreak: false }
    );

    doc.text(
      'Fax : 0522-23-42-60  Capital : 18 500 000.00 DH  CNSS : 7167788 - R.C. : 145619 – I.F. : 1602714 – Patente : 37900708- I.C.E : 001526422000063',
      50,
      text2Y + textMargin,
      { width: PAGE_WIDTH - 100, align: 'center', lineBreak: false }
    );
  };

  // Footer space calculation (only red bar)
  const footerHeight = 55;
  const footerTotalHeight = footerHeight + 10;

  // Draw page 1: Header + Info + Table start
  let currentY = drawHeaderAndInfo();
  currentY = drawTableHeader(currentY);

  let idx = 0;
  const pageBottomLimit = PAGE_HEIGHT - MARGIN - footerTotalHeight;

  // Page 1: fill table until footer limit
  while (idx < rows.length) {
    const rh = rowHeights[idx];
    if (currentY + rh > pageBottomLimit) break;
    drawRow(currentY, rows[idx], rh);
    currentY += rh;
    idx++;
  }

  // Check if all items fit on page 1
  const allItemsOnPage1 = idx >= rows.length;

  // Draw footer at bottom of page 1 (with X for total if not last page)
  drawFooter(PAGE_HEIGHT - MARGIN - footerHeight);

  // Subsequent pages for remaining items
  while (idx < rows.length) {
    doc.addPage();
    let py = MARGIN;
    py = drawTableHeader(py);

    const pageBottom = PAGE_HEIGHT - MARGIN - footerTotalHeight;
    while (idx < rows.length) {
      const rh = rowHeights[idx];
      if (py + rh > pageBottom) break;
      drawRow(py, rows[idx], rh);
      py += rh;
      idx++;
    }

    const isLastPage = idx >= rows.length;

    // If last page and total fits, draw it; otherwise just footer
    if (isLastPage && py + totalBlockH <= pageBottom) {
      drawTotalBlock(py, true);
    } else {
      // Not last page or total doesn't fit - draw X
      if (isLastPage) {
        // Last page but total doesn't fit, need new page
        drawFooter(PAGE_HEIGHT - MARGIN - footerHeight);
        doc.addPage();
        py = MARGIN;
        py = drawTableHeader(py);
        drawTotalBlock(py, true);
      }
    }

    // Draw footer at bottom of each page
    drawFooter(PAGE_HEIGHT - MARGIN - footerHeight);
  }

  // If all items on page 1, draw total there
  if (allItemsOnPage1) {
    if (currentY + totalBlockH <= pageBottomLimit) {
      drawTotalBlock(currentY, true);
    } else {
      // Total doesn't fit on page 1, add new page
      drawFooter(PAGE_HEIGHT - MARGIN - footerHeight);
      doc.addPage();
      let py = MARGIN;
      py = drawTableHeader(py);
      drawTotalBlock(py, true);
      drawFooter(PAGE_HEIGHT - MARGIN - footerHeight);
    }
  }

  const range = doc.bufferedPageRange();
  for (let p = range.start; p < range.start + range.count; p++) {
    doc.switchToPage(p);
    doc
      .font(FONTS.REGULAR)
      .fontSize(SIZES.SMALL)
      .fillColor(COLORS.SECONDARY)
      .text(`Page ${p + 1} / ${range.count}`, PAGE_WIDTH - MARGIN - 90, 18, { width: 90, align: 'right' });
  }

  doc.end();

  await finished;
  return Buffer.concat(chunks);
};

export const generateDemandeExcel = async (req, res) => {
  const { id } = req.params;
  const demandeCaisseId = parseInt(id, 10);

  if (isNaN(demandeCaisseId)) {
    return res.status(400).send('ID de demandeCaisse invalide');
  }

  try {
    const demandeCaisse = await prisma.demandeCaisse.findUnique({
      where: { id: demandeCaisseId },
      include: {
        items: true,
        user: true,
        chantier: true,
      },
    });

    if (!demandeCaisse) {
      return res.status(404).send('DemandeCaisse non trouvée');
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('DemandeCaisse');

    // Set column widths
    sheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Désignation', key: 'designation', width: 40 },
      { header: 'Imputation', key: 'imputation', width: 25 },
      { header: 'Montant (DH)', key: 'montant', width: 15 },
    ];

    // Add header row style
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEAEAEA' }, // light gray like Excel header
    };

    // Add data rows
    demandeCaisse.items.forEach((item) => {
      sheet.addRow({
        date: new Date(item.dateCaisse).toLocaleDateString('fr-FR'),
        designation: item.designation || '-',
        imputation: item.imputation || '-',
        montant: item.montant.toFixed(2),
      });
    });

    // Add total row
    const totalRow = sheet.addRow({
      montant: demandeCaisse.montantTotal.toFixed(2),
    });
    totalRow.font = { bold: true };
    totalRow.getCell('C').value = 'Total';
    totalRow.getCell('C').alignment = { horizontal: 'right' };
    totalRow.getCell('D').numFmt = '#,##0.00';

    // Apply border to all cells
    sheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });

    // Send Excel file
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=DemandeCaisse_${demandeCaisse.id}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Erreur lors de la génération de l\'Excel :', error);
    res.status(500).send('Erreur lors de la génération de l\'Excel');
  }
};




                 