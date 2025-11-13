import prisma from "../db.js";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import ExcelJS from "exceljs";
import multer from "multer";
import { fileURLToPath } from 'url';
import { error } from "console";

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
        lot : true 
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
export const EditDemandePrix = async (req: any, res: any)=> {
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
  