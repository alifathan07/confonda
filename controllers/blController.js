import prisma from "../db.js";
import { updateBCStatusInDB } from "./bcController.js";
import { buildPublicBlUrl } from "../utils/utils.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const BL_UPLOAD_DIR = "./uploads/bl";
if (!fs.existsSync(BL_UPLOAD_DIR)) {
  fs.mkdirSync(BL_UPLOAD_DIR, { recursive: true });
}

const blFileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, BL_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, "bl-" + req.params.id + "-" + uniqueSuffix + ext);
  }
});

const blFileFilter = (req, file, cb) => {
  const allowedExts = [".pdf", ".jpg", ".jpeg", ".png"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Type de fichier non autorisé. Seuls PDF, JPG, JPEG et PNG sont acceptés."));
  }
};

export const uploadBLFile = multer({
  storage: blFileStorage,
  fileFilter: blFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

/**
 * GET /achats/bons-livraison
 * List all BLs with pagination
 */
export const listBL = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalCount = await prisma.bondeLivraison.count({
      where: { NOT: { status: 'Annulé' } }
    });
    const totalPages = Math.ceil(totalCount / limit);

    const bls = await prisma.bondeLivraison.findMany({
      skip,
      take: limit,
      where: { NOT: { status: 'Annulé' } },
      include: {
        fournisseur: true,
        bondeCommandeLinks: {
          include: {
            bondeCommande: true
          }
        },
        factureLinks: {
          include: {
            facture: true
          }
        },
        avoirs: {
          include: {
            facture: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.render('dashboard/achats/bl/list', {
      bls,
      currentPage: page,
      totalPages,
      totalCount,
      limit,
      user: req.session.user
    });
  } catch (error) {
    console.error('Erreur listBL:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

/**
 * GET /api/bons-livraison/search?q={query}&fournisseur_id={id}
 * Search BLs from the same fournisseur for the affectation flow
 */
export const searchBLs = async (req, res) => {
  try {
    const { q, fournisseur_id } = req.query;

    const fournisseurId = fournisseur_id ? parseInt(fournisseur_id) : null;
    const where = {
      NOT: {
        status: 'Annulé'
      }
    };

    if (fournisseurId && !isNaN(fournisseurId)) {
      where.fournisseurId = fournisseurId;
    }

    if (q && q.trim()) {
      const searchTerm = q.trim();
      where.OR = [
        { numero: { contains: searchTerm } },
      ];
    }

    const bls = await prisma.bondeLivraison.findMany({
      where,
      include: {
        fournisseur: true,
        items: true
      },
      orderBy: { createdAt: 'desc' },
      take: 200
    });

    const result = bls.map(bl => ({
      id: bl.id,
      numero: bl.numero,
      dateReception: bl.dateReception,
      date: bl.date,
      fournisseur_name: bl.fournisseur?.name || 'Inconnu',
      nb_articles: bl.items.length
    }));

    return res.json(result);
  } catch (error) {
    console.error('Erreur searchBLs:', error);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

/**
 * GET /api/bons-livraison/:bl_id/articles
 * Get articles already recorded in this BL (from other BCs)
 */
export const getBLArticles = async (req, res) => {
  try {
    const blId = parseInt(req.params.bl_id);
    if (!blId || isNaN(blId)) {
      return res.status(400).json({ success: false, error: 'ID invalide' });
    }

    const bl = await prisma.bondeLivraison.findUnique({
      where: { id: blId },
      include: {
        items: true
      }
    });

    if (!bl) {
      return res.status(404).json({ success: false, error: 'Bon de livraison non trouvé' });
    }

    const articles = bl.items.map(item => ({
      id: item.id,
      designation: item.designation,
      reference: item.reference,
      unite: item.unite,
      qte_recue: item.quantite,
      qtyRetourne: item.qtyRetourne || 0,
      prixUnitaire: item.prixUnitaire
    }));

    return res.json(articles);
  } catch (error) {
    console.error('Erreur getBLArticles:', error);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

/**
 * POST /api/bons-livraison/:bl_id/affecter-bc
 * Affecter articles from a BC to an existing BL
 *
 * Payload: { bc_id, articles: [{ bc_article_id, qte_recue }] }
 */
export const affecterBCToBL = async (req, res) => {
  console.log('affecterBCToBL payload:', { bl_id: req.params.bl_id, bc_id: req.body.bc_id, articles: req.body.articles });
  try {
    const blId = parseInt(req.params.bl_id);
    if (!blId || isNaN(blId)) {
      return res.status(400).json({ success: false, error: 'BL ID invalide' });
    }

    const { bc_id, articles } = req.body;
    const bcId = parseInt(bc_id);

    if (!bcId || isNaN(bcId)) {
      return res.status(400).json({ success: false, error: 'BC ID invalide' });
    }

    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      return res.status(400).json({ success: false, error: 'Aucun article fourni' });
    }

    const bl = await prisma.bondeLivraison.findUnique({
      where: { id: blId },
      include: { 
        items: true,
        bondeCommandeLinks: true
      }
    });
    if (!bl) {
      return res.status(404).json({ success: false, error: 'Bon de livraison non trouvé' });
    }

    // Check if BL is already linked to this specific BC
    const alreadyLinkedToThisBC = bl.bondeCommandeLinks?.some(link => link.bondeCommandeId === bcId);
    if (alreadyLinkedToThisBC) {
      return res.status(400).json({
        success: false,
        error: 'Ce BL est déjà lié à ce BC'
      });
    }

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
    if (!bc) {
      return res.status(404).json({ success: false, error: 'Bon de commande non trouvé' });
    }

    const itemsToCreate = [];
    for (const art of articles) {
      const bcArticleId = parseInt(art.bc_article_id);
      const qteRecue = parseInt(art.qte_recue);

      if (!bcArticleId || isNaN(bcArticleId) || !qteRecue || qteRecue <= 0) {
        return res.status(400).json({
          success: false,
          error: `Article invalide: bc_article_id=${art.bc_article_id}, qte_recue=${art.qte_recue}`
        });
      }

      const bcItem = bc.commandesItems.find(i => i.id === bcArticleId);
      if (!bcItem) {
        return res.status(400).json({
          success: false,
          error: `Article BC #${bcArticleId} non trouvé`
        });
      }

      const qteDejaRecue = bc.bondeLivraisonLinks.reduce((sum, link) => {
        const existingBl = link.bondeLivraison;
        if (!existingBl || existingBl.status === 'Annulé') return sum;
        const blItems = (existingBl.items || []).filter(i => i.commandesItemsId === bcArticleId && i.bondeLivraisonId !== blId);
        const blQty = blItems.reduce((s, it) => s + (it?.quantite || 0), 0);
        return sum + blQty;
      }, 0);

      const qteRestante = bcItem.quantite - qteDejaRecue;

      if (qteRecue > qteRestante) {
        return res.status(400).json({
          success: false,
          error: `Quantité reçue (${qteRecue}) dépasse la quantité restante (${qteRestante}) pour l'article "${bcItem.designation}"`
        });
      }

      const prixUnitaire = art.prixUnitaire != null ? parseFloat(art.prixUnitaire) : (bcItem.prixUnitaire || null);

      itemsToCreate.push({
        designation: bcItem.designation,
        unite: bcItem.unite || '',
        reference: bcItem.reference || '',
        quantite: qteRecue,
        prixUnitaire: prixUnitaire,
        commandesItemsId: bcArticleId,
        bondeLivraisonId: blId
      });
    }

    await prisma.$transaction(async (tx) => {
      for (const item of itemsToCreate) {
        const existing = await tx.bondeLivraisonItem.findFirst({
          where: {
            bondeLivraisonId: blId,
            commandesItemsId: item.commandesItemsId
          }
        });

        if (existing) {
          await tx.bondeLivraisonItem.update({
            where: { id: existing.id },
            data: { 
              quantite: (existing.quantite || 0) + item.quantite,
              prixUnitaire: item.prixUnitaire
            }
          });
        } else {
          await tx.bondeLivraisonItem.create({ data: item });
        }
      }

      const currentBl = await tx.bondeLivraison.findUnique({ 
        where: { id: blId },
        include: { bondeCommandeLinks: true }
      });
      
      // Always create the link for many-to-many relationship
      const alreadyLinked = currentBl.bondeCommandeLinks?.some(link => link.bondeCommandeId === bcId);
      if (!alreadyLinked) {
        await tx.bondeLivraisonBondeCommande.create({
          data: {
            bondeLivraisonId: blId,
            bondeCommandeId: bcId
          }
        });
      }
      
      // Ensure BL status is Actif
      if (currentBl.status !== 'Actif') {
        await tx.bondeLivraison.update({
          where: { id: blId },
          data: { status: 'Actif' }
        });
      }

      // Update quantiteRecue on commandesItems for all affected articles
      for (const art of articles) {
        const bcArticleId = parseInt(art.bc_article_id);
        const bcWithLinks = await tx.bondeCommande.findUnique({
          where: { id: bcId },
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
          const blItems = (bl.items || []).filter(i => i.commandesItemsId === bcArticleId);
          return sum + blItems.reduce((s, it) => s + (it?.quantite || 0), 0);
        }, 0);
        await tx.commandesItems.update({
          where: { id: bcArticleId },
          data: { quantiteRecue: qteRecue }
        });
      }
    });

    const statusInfo = await updateBCStatusInDB(bcId);

    return res.json({
      success: true,
      bc_statut: statusInfo?.status || 'partiel',
      articles_recus: statusInfo?.articlesRecus || 0,
      articles_total: statusInfo?.articlesTotal || 0
    });
  } catch (error) {
    console.error('Erreur affecterBCToBL:', error);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

/**
 * DELETE /api/bons-livraison/:id
 * Delete a BL (soft delete by setting status to 'Annulé')
 */
export const deleteBL = async (req, res) => {
  try {
    const blId = parseInt(req.params.id);
    if (!blId || isNaN(blId)) {
      return res.status(400).json({ success: false, error: 'ID invalide' });
    }

    const bl = await prisma.bondeLivraison.findUnique({
      where: { id: blId },
      include: {
        bondeCommandeLinks: true,
        items: true
      }
    });

    if (!bl) {
      return res.status(404).json({ success: false, error: 'Bon de livraison non trouvé' });
    }

    await prisma.$transaction(async (tx) => {
      // First clear the FK to commandesItems for all items
      await tx.bondeLivraisonItem.updateMany({
        where: { bondeLivraisonId: blId },
        data: { commandesItemsId: null }
      });

      // Delete all BL items
      await tx.bondeLivraisonItem.deleteMany({
        where: { bondeLivraisonId: blId }
      });

      // Delete BL-BC links
      await tx.bondeLivraisonBondeCommande.deleteMany({
        where: { bondeLivraisonId: blId }
      });

      // Delete the BL itself
      await tx.bondeLivraison.delete({
        where: { id: blId }
      });
    });

    // Reset linked BCs status to 'en_attente_bl'
    for (const link of bl.bondeCommandeLinks) {
      await prisma.bondeCommande.update({
        where: { id: link.bondeCommandeId },
        data: { statut: 'en_attente_bl' }
      });
    }

    return res.json({ success: true, message: 'Bon de livraison supprimé avec succès' });
  } catch (error) {
    console.error('Erreur deleteBL:', error);
    return res.status(500).json({ success: false, error: 'Erreur serveur: ' + error.message });
  }
};

/**
 * POST /api/bons-livraison/:id/upload
 * Upload a file (PDF or image) for a BL
 */
export const uploadBLFileHandler = async (req, res) => {
  try {
    const blId = parseInt(req.params.id);
    if (!blId || isNaN(blId)) {
      return res.status(400).json({ success: false, error: 'ID invalide' });
    }

    const bl = await prisma.bondeLivraison.findUnique({
      where: { id: blId }
    });

    if (!bl) {
      return res.status(404).json({ success: false, error: 'Bon de livraison non trouvé' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Aucun fichier fourni' });
    }

    const filePath = req.file.path;

    await prisma.bondeLivraison.update({
      where: { id: blId },
      data: { fichier: filePath }
    });

    return res.json({ success: true, message: 'Fichier uploadé avec succès', fichier: filePath });
  } catch (error) {
    console.error('Erreur uploadBLFile:', error);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

/**
 * GET /api/bons-livraison/:id/download
 * Download the file attached to a BL
 */
export const downloadBLFile = async (req, res) => {
  try {
    const blId = parseInt(req.params.id);
    if (!blId || isNaN(blId)) {
      return res.status(400).json({ success: false, error: 'ID invalide' });
    }

    const bl = await prisma.bondeLivraison.findUnique({
      where: { id: blId }
    });

    if (!bl) {
      return res.status(404).json({ success: false, error: 'Bon de livraison non trouvé' });
    }

    if (!bl.fichier) {
      return res.status(404).json({ success: false, error: 'Aucun fichier attaché' });
    }

    const filePath = bl.fichier;
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Fichier non trouvé sur le serveur' });
    }

    const filename = path.basename(filePath);
    res.download(filePath, filename);
  } catch (error) {
    console.error('Erreur downloadBLFile:', error);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

/**
 * GET /achats/bons-livraison/:id/view
 * Render BL view page
 */
export const viewBL = async (req, res) => {
  try {
    const blId = parseInt(req.params.id);
    if (!blId || isNaN(blId)) {
      return res.redirect('/achats/bons-livraison');
    }

    const bl = await prisma.bondeLivraison.findUnique({
      where: { id: blId },
      include: {
        fournisseur: true,
        items: {
          include: {
            commandesItems: true
          }
        },
        bondeCommandeLinks: {
          include: {
            bondeCommande: true
          }
        },
        factureLinks: {
          include: {
            facture: true
          }
        },
        avoirs: {
          include: {
            facture: true,
            items: true
          }
        }
      }
    });

    if (!bl) {
      return res.redirect('/achats/bons-livraison');
    }

    res.render('dashboard/Achats/bl/view', {
      bl,
      pageTitle: `BL ${bl.numero}`
    });
  } catch (error) {
    console.error('Erreur viewBL:', error);
    res.redirect('/achats/bons-livraison');
  }
};

/**
 * GET /achats/bons-livraison/:id/edit
 * Render BL edit page with items
 */
export const editBL = async (req, res) => {
  try {
    const blId = parseInt(req.params.id);
    if (!blId || isNaN(blId)) {
      return res.redirect('/achats/bons-livraison');
    }

    const bl = await prisma.bondeLivraison.findUnique({
      where: { id: blId },
      include: {
        fournisseur: true,
        items: {
          include: {
            commandesItems: true
          }
        },
        bondeCommandeLinks: {
          include: {
            bondeCommande: true
          }
        },
        factureLinks: {
          include: {
            facture: true
          }
        },
        avoirs: {
          include: {
            facture: true,
            items: true
          }
        }
      }
    });

    if (!bl) {
      return res.redirect('/achats/bons-livraison');
    }

    const publicBlUrl = buildPublicBlUrl(req, bl.id);

    res.render('dashboard/Achats/bl/edit', {
      bl,
      publicBlUrl,
      pageTitle: `Éditer BL ${bl.numero}`
    });
  } catch (error) {
    console.error('Erreur editBL:', error);
    res.redirect('/achats/bons-livraison');
  }
};

/**
 * PUT /achats/bons-livraison/:id
 * Update BL items and recalculate BC status
 */
export const updateBL = async (req, res) => {
  try {
    const blId = parseInt(req.params.id);
    if (!blId || isNaN(blId)) {
      return res.status(400).json({ success: false, error: 'ID invalide' });
    }

    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, error: 'Données invalides' });
    }

    const bl = await prisma.bondeLivraison.findUnique({
      where: { id: blId },
      include: {
        bondeCommandeLinks: true
      }
    });

    if (!bl) {
      return res.status(404).json({ success: false, error: 'Bon de livraison non trouvé' });
    }

    // Update each BL item
    for (const item of items) {
      if (item.id) {
        await prisma.bondeLivraisonItem.update({
          where: { id: item.id },
          data: {
            quantite: parseFloat(item.quantite) || 0,
            qtyRetourne: parseFloat(item.qtyRetourne) || 0,
            prixUnitaire: item.prixUnitaire ? parseFloat(item.prixUnitaire) : null,
            obs: item.remarque || null
          }
        });

        // If linked to BC item, recalculate quantiteRecue
        if (item.commandesItemsId) {
          const bcItemId = parseInt(item.commandesItemsId);

          // Sum quantite from ALL BL items linked to this BC item (where BL is not Annulé)
          const allBLItems = await prisma.bondeLivraisonItem.findMany({
            where: {
              commandesItemsId: bcItemId,
              bondeLivraison: {
                status: { not: 'Annulé' }
              }
            },
            include: {
              bondeLivraison: true
            }
          });

          const totalRecu = allBLItems.reduce((sum, bli) => sum + (bli.quantite || 0), 0);

          // Update quantiteRecue on the BC item
          await prisma.commandesItems.update({
            where: { id: bcItemId },
            data: { quantiteRecue: totalRecu }
          });
        }
      }
    }

    // Update BC status for all linked BCs
    for (const link of bl.bondeCommandeLinks) {
      await updateBCStatusInDB(link.bondeCommandeId);
    }

    return res.json({ success: true, message: 'BL mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur updateBL:', error);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

/**
 * GET /achats/factures/:id/view
 * Render Facture view page
 */
export const viewFacture = async (req, res) => {
  try {
    const factureId = parseInt(req.params.id);
    if (!factureId || isNaN(factureId)) {
      return res.status(400).json({ success: false, error: 'ID invalide' });
    }

    // First get all BL IDs linked to this facture
    const blLinks = await prisma.factureBondeLivraison.findMany({
      where: { factureId: factureId },
      select: { bondeLivraisonId: true }
    });
    const blIds = blLinks.map(link => link.bondeLivraisonId);

    // Then get avoirs that come from those BLs
    const avoirsFromBLs = await prisma.factureAvoir.findMany({
      where: { bondeLivraisonId: { in: blIds } },
      include: { bondeLivraison: true }
    });

    const facture = await prisma.facture.findUnique({
      where: { id: factureId },
      include: {
        fournisseur: true,
        bondeLivraisonLinks: {
          include: {
            bondeLivraison: {
              include: {
                bondeCommandeLinks: {
                  include: { bondeCommande: true }
                }
              }
            }
          }
        },
        items: true
      }
    });

    // Attach avoirs to facture
    facture.avoirs = avoirsFromBLs;

    if (!facture) {
      return res.status(404).json({ success: false, error: 'Facture non trouvée' });
    }

    res.render('dashboard/achats/factures/view', {
      facture,
      user: req.session.user
    });
  } catch (error) {
    console.error('Erreur viewFacture:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

/**
 * GET /achats/factures-avoir/:id/view
 * Render Facture Avoir view page
 */
export const viewFactureAvoir = async (req, res) => {
  try {
    const avoirId = parseInt(req.params.id);
    if (!avoirId || isNaN(avoirId)) {
      return res.status(400).json({ success: false, error: 'ID invalide' });
    }

    const avoir = await prisma.factureAvoir.findUnique({
      where: { id: avoirId },
      include: {
        fournisseur: true,
        bondeLivraison: true,
        facture: true,
        items: true
      }
    });

    if (!avoir) {
      return res.status(404).json({ success: false, error: 'Facture Avoir non trouvée' });
    }

    res.render('dashboard/achats/factures-avoir/view', {
      avoir,
      user: req.session.user
    });
  } catch (error) {
    console.error('Erreur viewFactureAvoir:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};
