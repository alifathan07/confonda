import prisma from "../db.js";
import fs from "fs";
import path from "path";
import axios from "axios";
import { fileURLToPath } from "url";
import { log } from "console";
import crypto from "crypto";
import { buildPublicBcUrl, normalizeNumber, numberToFrenchWords, PUBLIC_BC_SECRET } from "../utils/utils.js";
import ExcelJS from 'exceljs';
import { sendEmail } from "../services/emailservice.js";
import { downloadpdf, getpdfBuffer } from "../services/pdfbcService.js";








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
        imputation: true,
        prixU: true,
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

    // Compute next BC numero (numbering resets annually)
    const yearForBc = new Date().getFullYear();
    const yearStr = String(yearForBc);

    const bcsThisYear = await prisma.bondeCommande.findMany({
      where: {
        numero: { contains: `/${yearStr}` }
      },
      select: { numero: true }
    });

    let maxNum = 0;
    for (const bc of bcsThisYear) {
      if (bc.numero && bc.numero.includes('/')) {
        const numPart = bc.numero.split('/')[0];
        const n = parseInt(numPart, 10);
        if (!isNaN(n)) maxNum = Math.max(maxNum, n);
      }
    }
    let nextNumCounter = maxNum + 1;

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
        const p = parseFloat(a.prixU || "0");

        return {
          designation: a.designation,
          unite: a.unité || "",
          quantite: q,
          reference: a.lot,
          imputation: a.imputation,
          prixUnitaire: p,
          totalHt: q * p,

        };
      });
      const totalHt = lignesToCreate.reduce((acc, item) => acc + item.totalHt, 0);
      const tva = totalHt * 0.2;
      const totalTtc = totalHt + tva;

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
          numero: `${String(nextNumCounter++).padStart(4, '0')}/${yearStr}`,
          fournisseurId,
          chantierId,
          demandeur,
          tauxTva: 20,
          totalHt: totalHt,
          totalTtc: totalTtc,
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

    await prisma.bondeCommande.delete({ where: { id } });

    return res.json({ success: true });
  } catch (error) {
    console.error('Erreur suppression Bon De Commande:', error);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

export const listBc = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    // Build where clause for search
    const whereClause = search ? {
      numero: { contains: search }
    } : {};

    const totalCount = await prisma.bondeCommande.count({ where: whereClause });
    const totalPages = Math.ceil(totalCount / limit);

    const bc = await prisma.bondeCommande.findMany({
      where: whereClause,
      skip,
      take: limit,
      include: {
        commandesItems: {
          include: {
            BondeCommandeChantierItem: { include: { chantier: { select: { id: true, nom: true } } } }
          }
        },
        fournisseur: { select: { id: true, name: true } },
        chantier: { select: { id: true, nom: true } },
        bondeLivraisonLinks: {
          include: {
            bondeLivraison: {
              include: { 
                items: true,
                factureLinks: { include: { facture: true } },
                avoirs: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate status for each BC
    const bcWithStatus = bc.map(bcItem => {
      // Filter out links to cancelled BLs
      bcItem.bondeLivraisonLinks = bcItem.bondeLivraisonLinks.filter(
        link => link.bondeLivraison && link.bondeLivraison.status !== 'Annulé'
      );
      const statusInfo = calculateBCStatus(bcItem);
      return {
        ...bcItem,
        statusLabel: statusInfo.label,
        statusColor: statusInfo.color,
        statusValue: statusInfo.status,
        articlesRecus: statusInfo.articlesRecus,
        articlesTotal: statusInfo.articlesTotal
      };
    });

    res.render('dashboard/achats/bc/list', {
      bc: bcWithStatus,
      currentPage: page,
      totalPages,
      totalCount,
      limit,
      search
    });
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
        fournisseur: { select: { id: true, name: true } },
        commandesItems: {
          include: {
            BondeCommandeChantierItem: { include: { chantier: { select: { id: true, nom: true } } } }
          }
        },
        chantier: { select: { id: true, nom: true } },
        bondeLivraisonLinks: {
          include: {
            bondeLivraison: {
              include: { items: true }
            }
          }
        }
      },
    });

    if (!bc) {
      return res.status(404).json({ success: false, error: "Bon de commande non trouvé" });
    }

    // 2. Setup PDF Document

    // Response Headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=bonCommande_${bc.numero}.pdf`
    );

    await downloadpdf(bc, req, res);
  } catch (error) {
    console.error("Error generating BC PDF:", error);
    if (res && !res.headersSent) {
      res.status(500).json({ success: false, error: "Erreur lors de la génération du PDF" });
    } else if (!res) {
      throw error;
    }
  }
};

export const sendBcEmail = async (req, res) => {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const logoPath = path.join(__dirname, "../public/img/logo-4.png");

    const { id } = req.params;
    const bcId = parseInt(id, 10);

    if (!bcId || Number.isNaN(bcId)) {
      return res.status(400).json({ success: false, error: "ID invalide" });
    }

    const bc = await prisma.bondeCommande.findUnique({
      where: { id: bcId },
      include: {
        fournisseur: { select: { id: true, name: true, email: true } },
        commandesItems: {
          include: {
            BondeCommandeChantierItem: { include: { chantier: { select: { id: true, nom: true } } } }
          }
        },
        chantier: { select: { id: true, nom: true } },
        bondeLivraisonLinks: {
          include: {
            bondeLivraison: {
              include: { items: true }
            }
          }
        }
      },
    });

    if (!bc) {
      return res.status(404).json({ success: false, error: "Bon de commande non trouvé" });
    }

    const to = (req.body?.email || bc?.fournisseur?.email || "").toString().trim();
    if (!to) {
      return res.status(400).json({ success: false, error: "Email fournisseur manquant" });
    }

    const pdfBuffer = await getpdfBuffer(bc, req);

    await sendEmail({
      to,
      subject: `Bon de Commande N° ${bc.numero}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.5;
              color: #2c3e50;
              max-width: 600px;
              margin: 0 auto;
              padding: 40px 20px;
              background-color: #ffffff;
            }
            .header {
              border-bottom: 2px solid #A22C29;
              padding-bottom: 15px;
              margin-bottom: 30px;
            }
            .header h2 {
              margin: 0;
              color: #A22C29;
              font-size: 24px;
              font-weight: 600;
            }
            .content p {
              margin-bottom: 15px;
              font-size: 16px;
            }
            .attachment-note {
              background-color: #f8f9fa;
              border-left: 4px solid #A22C29;
              padding: 15px;
              margin: 25px 0;
              font-weight: 500;
              color: #34495e;
            }
            .signature {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #eee;
            }
            .signature p {
              margin: 0 0 15px 0;
              font-weight: 500;
            }
            .signature-logo img {
              max-width: 120px;
              height: auto;
              margin-bottom: 15px;
            }
            .contact-details {
              font-size: 14px;
              color: #7f8c8d;
              line-height: 1.6;
            }
            .contact-name {
              color: #A22C29;
              font-weight: 700;
              display: block;
              margin-bottom: 4px;
              font-size: 15px;
            }
            .company-name {
              display: block;
              margin-top: 4px;
              font-weight: 600;
              color: #2c3e50;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Bon de Commande N° ${bc.numero}</h2>
          </div>
          
          <div class="content">
            <p>Bonjour,</p>
            
            <p>Veuillez trouver ci-joint notre bon de commande pour la référence citée en objet.</p>
            
          <div class="signature">
            <p>Cordialement,</p>
            
            <div class="signature-logo">
              <img src="cid:signature-logo" alt="Construction et Fondation" />
            </div>
            
            <div class="contact-details">
              <span class="contact-name">Khbazi Mustapha</span>
              Responsable Service Achats<br>
              Tél: 06 44 00 05 47<br>
              <span class="company-name">Construction et Fondation</span>
              "Pour des constructions bien fondées"
            </div>
          </div> </div>
          
         
        </body>
        </html>
      `,
      attachments: [
        {
          filename: `bonCommande_${bc.numero}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        },
        {
          filename: 'logo-4.png',
          path: logoPath,
          cid: 'signature-logo'
        }
      ]
    })
    console.log(pdfBuffer)

  
    return res.json({ success: true });
  } catch (error) {
    console.error('Error in sendBcEmail:', error);
    return res.status(500).json({ success: false, error: error.message || "Erreur serveur" });
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
            BondeCommandeChantierItem: { include: { chantier: { select: { id: true, nom: true } } } }
          },
        },
        fournisseur: { include: { emails: true } },
        bondeLivraisonLinks: {
          include: {
            bondeLivraison: {
              include: { 
                items: true,
                bondeCommandeLinks: true,
                factureLinks: true,
                avoirs: true
              }
            }
          }
        }
      }
    });


    if (!bc) {
      return res.status(404).json({ success: false, error: "Bon de commande non trouvée" });
    }
    const fournisseurs = await prisma.fournisseur.findMany({ include: { emails: true } })
    const publicBcUrl = buildPublicBcUrl(req, bc.id);
    const listfourniture = await prisma.fourniture_list.findMany();

    res.render('dashboard/achats/bc/edit', { bc, fournisseurs, chantiers, publicBcUrl, listfourniture });
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
        quantite: parseFloat(l.quantite) || 0,
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
        quantite: parseFloat(l?.quantite) || 0,
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
    await prisma.$transaction(async (tx) => {
      for (const item of allLines) {
        if (!item?.designation || !item?.reference) continue;
        await tx.fourniture_list.upsert({
          where: {
            designation_reference: {
              designation: item.designation,
              reference: item.reference,
            },
          },
          update: {
            prixUnitaire: item.prixUnitaire ?? null,
          },
          create: {
            designation: item.designation,
            reference: item.reference,
            prixUnitaire: item.prixUnitaire ?? null,
          },
        });
      }
    });
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
        bondeLivraisonLinks: {
          include: {
            bondeLivraison: {
              include: { items: true }
            }
          }
        }
      },
    });
    console.log('im updatebc sir ')

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
      const qty = parseFloat(d.qty) || 0;
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
    const fournisseurs = await prisma.fournisseur.findMany({ include: { emails: true } });
    const chantiers = await prisma.chantier.findMany();
    const listfourniture = await prisma.fourniture_list.findMany();
    console.log("Headers:", req.headers);
    res.render('dashboard/achats/bc/create', { fournisseurs, chantiers, listfourniture });
  } catch (error) {
    console.error('Erreur création formulaire BC:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
}

export const storeBc = async (req, res) => {
  try {
    console.log('=== storeBc DEBUG START ===');
    console.log('Full body:', JSON.stringify(req.body, null, 2));

    const { supplier, date, dateLivraison, lieuLivraison, modeReg, delaiReg, montantLettre, tauxTva, commandesItems = [], distributionData = [] } = req.body || {};

    console.log('commandesItems received:', JSON.stringify(commandesItems, null, 2));

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
        quantite: Number.parseFloat(l?.quantite) || 0,
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

    // Compute next BC numero (numbering resets annually)
    const yearForBc = jsDate.getFullYear();
    const yearStr = String(yearForBc);

    const bcsThisYear = await prisma.bondeCommande.findMany({
      where: {
        numero: { contains: `/${yearStr}` }
      },
      select: { numero: true }
    });

    let maxNum = 0;
    for (const bc of bcsThisYear) {
      if (bc.numero && bc.numero.includes('/')) {
        const numPart = bc.numero.split('/')[0];
        const n = parseInt(numPart, 10);
        if (!isNaN(n)) maxNum = Math.max(maxNum, n);
      }
    }
    const nextNumCounter = maxNum + 1;

    await prisma.$transaction(async (tx) => {
      for (const item of toCreate) {
        await tx.fourniture_list.upsert({
          where: {
            designation_reference: {
              designation: item.designation,
              reference: item.reference,
            },
          },
          update: {}, // do nothing if exists
          create: {
            designation: item.designation,
            reference: item.reference,
            prixUnitaire: item.prixUnitaire || null,
          },
        });
      }
    });

    // Step 1: Create BC + items
    const bc = await prisma.bondeCommande.create({
      data: {
        date: jsDate,
        numero: `${String(nextNumCounter).padStart(4, '0')}/${yearStr}`,
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
    // Match by index to ensure correct distribution assignment
    console.log('=== Creating distributions ===');
    console.log('bc.commandesItems:', JSON.stringify(bc.commandesItems.map(i => ({id: i.id, designation: i.designation})), null, 2));
    console.log('toCreate distributions:', JSON.stringify(toCreate.map(t => t.chantierDistribution), null, 2));
    
    for (const item of bc.commandesItems) {
      const idx = bc.commandesItems.indexOf(item);
      const itemDistribution = toCreate[idx]?.chantierDistribution || [];
      console.log(`Item ${idx} (${item.designation}): distribution =`, itemDistribution);
      
      for (const d of itemDistribution) {
        if (d.chantierId && d.qty > 0) {
          console.log('Creating distribution:', { bondeCommandeId: bc.id, itemId: item.id, chantierId: d.chantierId, qty: d.qty, montant: d.montant });
          await prisma.bondeCommandeChantierItem.create({
            data: {
              bondeCommandeId: bc.id,
              itemId: item.id,
              chantierId: parseInt(d.chantierId),
              qty: parseFloat(d.qty) || 0,
              montant: parseFloat(d.montant) || 0,
            },
          });
        }
      }
    }
    console.log('=== Distributions created ===');

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

    const { designation, unite, reference, quantite, prixUnitaire, tauxRemise } = req.body || {};

    // Ensure item exists
    const item = await prisma.commandesItems.findUnique({ where: { id: itemId } });
    if (!item) return res.status(404).json({ success: false, error: 'Article introuvable' });

    // Calculate derived values if needed
    // Note: We expect the frontend to send valid numbers, but we re-calculate amounts for safety
    const safeQty = quantite !== undefined ? (parseFloat(quantite) || 0) : item.quantite;
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
        reference: reference !== undefined ? reference : item.reference,
        quantite: safeQty,
        prixUnitaire: safePu,
        tauxRemise: safeRate,
        remise: remiseAmount,
        totalHt: totalHt
      }
    });

    if (updatedItem?.designation && updatedItem?.reference && updatedItem?.prixUnitaire !== undefined) {
      await prisma.fourniture_list.upsert({
        where: {
          designation_reference: {
            designation: updatedItem.designation,
            reference: updatedItem.reference,
          },
        },
        update: {
          prixUnitaire: updatedItem.prixUnitaire,
        },
        create: {
          designation: updatedItem.designation,
          reference: updatedItem.reference,
          prixUnitaire: updatedItem.prixUnitaire,
        },
      });
    }

    return res.json({ success: true, item: updatedItem });
    console.log('im updateBcItem sir ')
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

export const updateSupplier = async (req, res) => {
  const { supplierId, name, email, telFournisseur } = req.body;

  try {
    const fournisseur = await prisma.fournisseur.update({
      where: {
        id: parseInt(supplierId)
      },
      data: {
        name,
        email,
        telFournisseur
      }
    })
    res.status(200).send('Supplier updated successfully.');
  } catch (error) {
    res.status(500).send('Server error during Excel import.');
  }

}

// ==================== BC STATUS HELPERS ====================
/**
 * Helper function to calculate BC delivery status
 * Returns status info AND article counts
 */
function calculateBCStatus(bc) {
  if (!bc || !bc.commandesItems || bc.commandesItems.length === 0) {
    return { 
      status: 'en_attente_bl', 
      label: 'Att. BL', 
      color: 'secondary',
      articlesRecus: 0,
      articlesTotal: 0
    };
  }

  let allFullyReceived = true;
  let hasPartialReceipt = false;
  let articlesRecus = 0;
  const articlesTotal = bc.commandesItems.length;

  for (const item of bc.commandesItems) {
    const receivedQty = bc.bondeLivraisonLinks?.reduce((sum, link) => {
      const bl = link.bondeLivraison;
      if (!bl || bl.status === 'Annulé') return sum;
      const blItems = (bl.items || []).filter(i => i.commandesItemsId === item.id);
      const blQty = blItems.reduce((s, it) => s + (it?.quantite || 0), 0);
      return sum + blQty;
    }, 0) || 0;

    if (receivedQty >= item.quantite && item.quantite > 0) {
      articlesRecus++;
    }

    if (receivedQty < item.quantite) {
      allFullyReceived = false;
      if (receivedQty > 0) {
        hasPartialReceipt = true;
      }
    } else if (receivedQty > 0) {
      hasPartialReceipt = true;
    }
  }

  // Determine status
  let status, label, color;

  // No BL linked
  if (!bc.bondeLivraisonLinks || bc.bondeLivraisonLinks.length === 0) {
    status = 'en_attente_bl';
    label = 'Att. BL';
    color = 'secondary';
  } else if (allFullyReceived) {
    // All items fully received
    status = 'livre';
    label = 'Livré ✓';
    color = 'success';
  } else if (hasPartialReceipt) {
    // Partial receipt
    status = 'partiel';
    label = 'Partiel';
    color = 'info';
  } else {
    // BL linked but no items received yet
    status = 'partiel';
    label = 'Partiel';
    color = 'info';
  }

  return { 
    status, 
    label, 
    color,
    articlesRecus,
    articlesTotal
  };
}

/**
 * Update BC status in database
 */
export async function updateBCStatusInDB(bcId) {
  const bc = await prisma.bondeCommande.findUnique({
    where: { id: bcId },
    include: {
      commandesItems: true,
      bondeLivraisonLinks: {
        include: {
          bondeLivraison: {
            include: { items: true }
          }
        }
      }
    }
  });

  if (!bc) return null;

  const statusInfo = calculateBCStatus(bc);
  
  // Update the statut column in DB
  await prisma.bondeCommande.update({
    where: { id: bcId },
    data: { statut: statusInfo.status }
  });

  return statusInfo;
}

/**
 * GET /api/bons-commande/:id/articles-remaining
 * Returns articles from a BC with their received quantities
 */
export const getArticlesRemaining = async (req, res) => {
  try {
    const bcId = parseInt(req.params.id);
    if (!bcId || isNaN(bcId)) {
      return res.status(400).json({ success: false, error: 'ID invalide' });
    }

    // Get BC with its items
    const bc = await prisma.bondeCommande.findUnique({
      where: { id: bcId },
      include: {
        commandesItems: true,
        bondeLivraisonLinks: {
          include: {
            bondeLivraison: {
              include: { 
                items: true,
                factureLinks : true,
                avoirs: true
              }
            }
          }
        }
      }
    });

    if (!bc) {
      return res.status(404).json({ success: false, error: 'Bon de commande non trouvé' });
    }

    // Calculate received quantities per item
    const articlesWithRemaining = bc.commandesItems.map(item => {
      // Sum quantities from all linked BLs for this item
      const qte_deja_recue = bc.bondeLivraisonLinks.reduce((sum, link) => {
        const bl = link.bondeLivraison;
        if (!bl || bl.status === 'Annulé') return sum;
        const blItems = (bl.items || []).filter(i => i.commandesItemsId === item.id);
        const blQty = blItems.reduce((s, it) => s + (it?.quantite || 0), 0);
        return sum + blQty;
      }, 0);

      return {
        id: item.id,
        designation: item.designation,
        reference: item.reference,
        unite: item.unite,
        qte_commandee: item.quantite,
        qte_deja_recue: qte_deja_recue,
        prixUnitaire: item.prixUnitaire
      };
    });

    return res.json(articlesWithRemaining);
  } catch (error) {
    console.error('Erreur getArticlesRemaining:', error);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

/**
 * POST /api/bons-livraison
 * Create a new Bon de Livraison
 */
export const createBondeLivraison = async (req, res) => {
  try {
    const { bcId, fournisseurId, numeroBL, dateReception, articles } = req.body;

    if (!numeroBL || !dateReception || !articles || !Array.isArray(articles) || articles.length === 0) {
      return res.status(400).json({ success: false, error: 'Données incomplètes' });
    }

    let blData = {
      numero: numeroBL,
      dateReception: new Date(dateReception),
      items: {
        create: articles.map(art => ({
          designation: art.designation || '',
          unite: art.unite || '',
          reference: art.reference || '',
          quantite: parseFloat(art.quantite) || 0,
          prixUnitaire: art.prixUnitaire != null ? parseFloat(art.prixUnitaire) : null,
          commandesItemsId: art.commandesItemsId ? parseInt(art.commandesItemsId) : null
        }))
      }
    };

    let bcIdInt = null;
    if (bcId) {
      bcIdInt = parseInt(bcId);
      if (isNaN(bcIdInt)) {
        return res.status(400).json({ success: false, error: 'BC ID invalide' });
      }

      const bc = await prisma.bondeCommande.findUnique({
        where: { id: bcIdInt },
        include: { commandesItems: true, fournisseur: true }
      });

      if (!bc) {
        return res.status(404).json({ success: false, error: 'Bon de commande non trouvé' });
      }

      blData.fournisseurId = bc.fournisseurId;
      blData.bondeCommandeLinks = {
        create: {
          bondeCommandeId: bcIdInt
        }
      };
      blData.items = {
        create: articles.map(art => {
          if (art.isExtra) {
            return {
              designation: art.designation || '',
              unite: art.unite || '',
              reference: art.reference || '',
              quantite: parseFloat(art.qte) || 0,
              prixUnitaire: art.prixUnitaire != null ? parseFloat(art.prixUnitaire) : null,
              commandesItemsId: null
            };
          }
          const item = bc.commandesItems.find(i => i.id === parseInt(art.id));
          return {
            designation: item?.designation || '',
            unite: item?.unite || '',
            reference: item?.reference || '',
            quantite: parseFloat(art.qte) || 0,
            prixUnitaire: art.prixUnitaire != null ? parseFloat(art.prixUnitaire) : item?.prixUnitaire || null,
            commandesItemsId: parseInt(art.id)
          };
        })
      };
    } else {
      if (!fournisseurId) {
        return res.status(400).json({ success: false, error: 'Fournisseur requis pour un BL sans BC' });
      }

      const fournisseurIdInt = parseInt(fournisseurId);
      if (isNaN(fournisseurIdInt)) {
        return res.status(400).json({ success: false, error: 'Fournisseur invalide' });
      }

      const fournisseur = await prisma.fournisseur.findUnique({
        where: { id: fournisseurIdInt }
      });

      if (!fournisseur) {
        return res.status(404).json({ success: false, error: 'Fournisseur non trouvé' });
      }

      blData.fournisseurId = fournisseurIdInt;
    }

    const bl = await prisma.bondeLivraison.create({
      data: blData,
      include: { items: true }
    });

    if (bcIdInt) {
      await prisma.$transaction(async (tx) => {
        for (const art of articles) {
          if (art.isExtra || !art.id || isNaN(parseInt(art.id))) continue;
          
          const bcItemId = parseInt(art.id);
          const bcWithLinks = await tx.bondeCommande.findUnique({
            where: { id: bcIdInt },
            include: {
              bondeLivraisonLinks: {
                include: {
                  bondeLivraison: {
                    include: { items: true }
                  }
                }
              }
            }
          });
          const qteRecue = bcWithLinks.bondeLivraisonLinks.reduce((sum, link) => {
            const bl = link.bondeLivraison;
            if (!bl || bl.status === 'Annulé') return sum;
            const blItems = (bl.items || []).filter(i => i.commandesItemsId === bcItemId);
            return sum + blItems.reduce((s, it) => s + (it?.quantite || 0), 0);
          }, 0);
          await tx.commandesItems.update({
            where: { id: bcItemId },
            data: { quantiteRecue: qteRecue }
          });
        }
      });

      const statusInfo = await updateBCStatusInDB(bcIdInt);
      return res.json({ 
        success: true, 
        bl, 
        bc_statut: statusInfo.status,
        articles_recus: statusInfo.articlesRecus,
        articles_total: statusInfo.articlesTotal,
        status_label: statusInfo.label,
        status_color: statusInfo.color
      });
    }

    return res.json({ success: true, bl });
  } catch (error) {
    console.error('Erreur createBondeLivraison:', error);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

/**
 * PATCH /api/bons-commande/:bc_id/affecter-bl/:bl_id
 * Link an existing BL to a BC (legacy simple link — kept for backward compatibility)
 */
export const affecterBL = async (req, res) => {
  try {
    const bcId = parseInt(req.params.bc_id);
    const blId = parseInt(req.params.bl_id);

    if (!bcId || !blId || isNaN(bcId) || isNaN(blId)) {
      return res.status(400).json({ success: false, error: 'IDs invalides' });
    }

    // Check if BC exists
    const bc = await prisma.bondeCommande.findUnique({
      where: { id: bcId },
      include: { commandesItems: true }
    });

    if (!bc) {
      return res.status(404).json({ success: false, error: 'Bon de commande non trouvé' });
    }

    // Check if BL exists and is not already linked
    const bl = await prisma.bondeLivraison.findUnique({
      where: { id: blId },
      include: { bondeCommandeLinks: true }
    });

    if (!bl) {
      return res.status(404).json({ success: false, error: 'Bon de livraison non trouvé' });
    }

    if (bl.bondeCommandeLinks && bl.bondeCommandeLinks.length > 0) {
      const alreadyLinkedTo = bl.bondeCommandeLinks[0].bondeCommandeId;
      if (alreadyLinkedTo !== bcId) {
        return res.status(400).json({ success: false, error: 'Ce BL est déjà lié à un autre BC' });
      }
    }

    // Link BL to BC via join table
    await prisma.bondeLivraisonBondeCommande.create({
      data: {
        bondeLivraisonId: blId,
        bondeCommandeId: bcId
      }
    });

    // Update BC status in DB and get status info
    const statusInfo = await updateBCStatusInDB(bcId);

    return res.json({ 
      success: true, 
      bc_statut: statusInfo.status,
      articles_recus: statusInfo.articlesRecus,
      articles_total: statusInfo.articlesTotal,
      status_label: statusInfo.label,
      status_color: statusInfo.color
    });
  } catch (error) {
    console.error('Erreur affecterBL:', error);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};  

/**
 * GET /achats/bons-commande/:id/dashboard
 * Show dashboard for a BC with all linked BLs and their Factures
 */
export const getBCDashboard = async (req, res) => {
  try {
    const bcId = parseInt(req.params.id);
    if (!bcId || isNaN(bcId)) {
      return res.status(400).json({ success: false, error: 'ID invalide' });
    }

    // Fetch BC with all related data
    const bc = await prisma.bondeCommande.findUnique({
      where: { id: bcId },
      include: {
        fournisseur: true,
        commandesItems: {
          include: {
            BondeCommandeChantierItem: {
              include: {
                chantier: true
              }
            }
          }
        },
        bondeLivraisonLinks: {
          include: {
            bondeLivraison: {
              include: {
                items: true,
                bondeCommandeLinks: {
                  include: {
                    bondeCommande: {
                      include: { commandesItems: true }
                    }
                  }
                },
                factureLinks: {
                  include: {
                    facture: {
                      include: {
                        items: true,
                        avoirs: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!bc) {
      return res.status(404).json({ success: false, error: 'Bon de Commande non trouvé' });
    }

    // Collect all unique factures from all BLs
    const facturesMap = new Map();
    bc.bondeLivraisonLinks.forEach(link => {
      const bl = link.bondeLivraison;
      if (bl && bl.factureLinks) {
        bl.factureLinks.forEach(fl => {
          if (fl.facture) {
            facturesMap.set(fl.facture.id, fl.facture);
          }
        });
      }
    });
    const factures = Array.from(facturesMap.values());

    res.render('dashboard/achats/bc/dashboard', {
      bc,
      bls: bc.bondeLivraisonLinks.map(link => link.bondeLivraison),
      factures,
      user: req.session.user
    });
  } catch (error) {
    console.error('Erreur getBCDashboard:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};