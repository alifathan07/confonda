import prisma from "../db.js";

export const postBcDemandeFourniture = async (req, res) => {
  try {
    const { demandeId, items } = req.body;

    if (!demandeId || !items || items.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "Aucun article ou demande invalide" });
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

    // Fetch all selected demandeFourniture items in one query
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
        observation: true,
        lot: true,
      },
    });

    if (demandeItems.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "Aucun article trouvé dans la demande" });
    }

    const itemMap = Object.fromEntries(demandeItems.map((item) => [item.id, item]));

    const createdBcIds = [];

    // Simple generation of numero: timestamp-based for now
    const baseNumero = Date.now();
    let offset = 0;

    for (const [fournisseurIdStr, itemIdsForFournisseur] of Object.entries(
      itemsByFournisseur
    )) {
      const fournisseurId = parseInt(fournisseurIdStr);

      const fournisseur = await prisma.fournisseur.findUnique({
        where: { id: fournisseurId },
      });

      if (!fournisseur) continue;

      const validItemIds = itemIdsForFournisseur.filter((id) => itemMap[id]);
      if (validItemIds.length === 0) continue;

      const lignesToCreate = validItemIds.map((id) => {
        const a = itemMap[id];
        const quantiteInt = parseInt(a.quantité || "0") || 1;

        return {
          designation: a.designation,
          unite: a.unité || "",
          quantite: quantiteInt,
          prixUnitaire: null,
          totalHt: null,
        };
      });

      const numero = baseNumero + offset; // placeholder; adapt later if needed
      offset += 1;

      const newBc = await prisma.bondeCommande.create({
        data: {
          date: new Date(),
          numero,
          fournisseurId,
          commandesItems: {
            create: lignesToCreate,
          },
        },
        select: { id: true },
      });

      createdBcIds.push(newBc.id);
    }

    if (createdBcIds.length === 0) {
      return res.status(400).json({
        success: false,
        error:
          "Aucun bon de commande créé (fournisseurs ou articles invalides)",
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
    return res
      .status(500)
      .json({ success: false, error: "Erreur serveur" });
  }
};




export const viewBc = async (req, res) => {
  try {
    const { id } = req.params;
    const bc = await prisma.bondeCommande.findUnique({
      where: { id: parseInt(id) },
      include: {
        commandesItems: true,
        fournisseur: true,
      }
    });
    if (!bc) {
      return res.status(404).json({ success: false, error: "Bon de commande non trouvée" });
    }
    res.render('dashboard/achats/bc/index', { bc });
  } catch (err) {
    console.error('Erreur affichage bon de commande:', err);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
};
export const editBc = async (req, res) => {
  try {
    const { id } = req.params;
    const bc = await prisma.bondeCommande.findUnique({
      where: { id: parseInt(id) },
      include: {
        commandesItems: true,
        fournisseur: true,
      }
    });
    if (!bc) {
      return res.status(404).json({ success: false, error: "Bon de commande non trouvée" });
    }
    res.render('dashboard/achats/bc/edit', { bc });
  } catch (err) {
    console.error('Erreur affichage bon de commande:', err);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
};