import prisma from "../db.js";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import ExcelJS from "exceljs";
import multer from "multer";
import { fileURLToPath } from 'url';
import { error } from "console";
import { connect } from "http2";

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

   

    
   

   

