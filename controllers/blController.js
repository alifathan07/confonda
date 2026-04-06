import prisma from "../db.js";
import { updateBCStatusInDB } from "./bcController.js";

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
        bondeCommande: true
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
      qte_recue: item.quantite
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
      include: { items: true }
    });
    if (!bl) {
      return res.status(404).json({ success: false, error: 'Bon de livraison non trouvé' });
    }

    if (bl.bondeCommandeId && bl.bondeCommandeId !== bcId) {
      return res.status(400).json({
        success: false,
        error: 'Ce BL est déjà lié à un autre BC'
      });
    }

    const bc = await prisma.bondeCommande.findUnique({
      where: { id: bcId },
      include: {
        commandesItems: true,
        bondeLivraisons: {
          where: { NOT: { status: 'Annulé' } },
          include: { items: true }
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

      const qteDejaRecue = bc.bondeLivraisons.reduce((sum, existingBl) => {
        const blItems = (existingBl.items || []).filter(i => i.commandesItemsId === bcArticleId);
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

      itemsToCreate.push({
        designation: bcItem.designation,
        unite: bcItem.unite || '',
        reference: bcItem.reference || '',
        quantite: qteRecue,
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
            data: { quantite: (existing.quantite || 0) + item.quantite }
          });
        } else {
          await tx.bondeLivraisonItem.create({ data: item });
        }
      }

      const currentBl = await tx.bondeLivraison.findUnique({ where: { id: blId } });
      if (!currentBl.bondeCommandeId) {
        await tx.bondeLivraison.update({
          where: { id: blId },
          data: { bondeCommandeId: bcId, status: 'Actif' }
        });
      } else if (currentBl.bondeCommandeId === bcId && currentBl.status !== 'Actif') {
        await tx.bondeLivraison.update({
          where: { id: blId },
          data: { status: 'Actif' }
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
      where: { id: blId }
    });

    if (!bl) {
      return res.status(404).json({ success: false, error: 'Bon de livraison non trouvé' });
    }

    // Soft delete - set status to 'Annulé'
    await prisma.bondeLivraison.update({
      where: { id: blId },
      data: { status: 'Annulé' }
    });

    return res.json({ success: true, message: 'Bon de livraison supprimé avec succès' });
  } catch (error) {
    console.error('Erreur deleteBL:', error);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};
