import prisma from "../db.js";

async function assertCanAccessDemandeFourniture(req, res, demandeId) {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return false;
  }

  const id = parseInt(String(demandeId), 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ success: false, error: 'ID invalide' });
    return false;
  }

  const demande = await prisma.demandeFourniture.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });

  if (!demande) {
    res.status(404).json({ success: false, error: 'Demande introuvable.' });
    return false;
  }

  const role = req.user.role;
  if (role === 'user' && demande.userId !== req.user.id) {
    res.status(403).json({ success: false, error: 'Forbidden' });
    return false;
  }

  return true;
}

async function assertCanAccessItemFourniture(req, res, itemId) {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return false;
  }

  const id = parseInt(String(itemId), 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ success: false, error: 'ID invalide' });
    return false;
  }

  const item = await prisma.itemFourniture.findUnique({
    where: { id },
    select: { id: true, demandeFourniture: { select: { id: true, userId: true } } },
  });

  if (!item) {
    res.status(404).json({ success: false, error: 'Article introuvable' });
    return false;
  }

  const role = req.user.role;
  if (role === 'user' && item.demandeFourniture?.userId !== req.user.id) {
    res.status(403).json({ success: false, error: 'Forbidden' });
    return false;
  }

  return true;
}

// GET /api/fournitures - List all demandes (no pagination, like web version)
export const apiIndexDemandeFourniture = async (req, res) => {
  try {
    const include = { user: true, items: true, chantier: true };

    // Build where clause - users only see their own demandes
    const where = req.user?.role === 'user' 
      ? { userId: req.user.id } 
      : {};

    // Get all demandes ordered by id desc (like web version)
    const demandes = await prisma.demandeFourniture.findMany({
      where,
      include,
      orderBy: { id: "desc" },
    });

    res.json({
      success: true,
      data: demandes,
    });
  } catch (error) {
    console.error("apiIndexDemandeFourniture error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/fournitures/create - Get form data (users, chantiers, list)
export const apiCreateDemandeFourniture = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    const last = await prisma.demandeFourniture.findMany({
      where: { user: { id: userId } },
      orderBy: { numero: "desc" },
      take: 1,
    });
    const numero = (last[0]?.numero || 0) + 1;
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const chantiers = await prisma.chantier.findMany();
    const today = new Date().toISOString().slice(0, 10);
    const listfourniture = await prisma.fourniture_list.findMany();
    
    res.json({
      success: true,
      data: { user, today, numero, chantiers, listfourniture }
    });
  } catch (error) {
    console.error("apiCreateDemandeFourniture error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/fournitures/:id - View single demande
export const apiViewDemandeFourniture = async (req, res) => {
  try {
    const { id } = req.params;

    const allowed = await assertCanAccessDemandeFourniture(req, res, id);
    if (!allowed) return;

    const demandeFourniture = await prisma.demandeFourniture.findUnique({
      where: { id: parseInt(id) },
      include: { user: true, chantier: true, items: true },
    });
    
    if (!demandeFourniture) {
      return res.status(404).json({ success: false, error: "Demande introuvable." });
    }

    const [chantiers, listfourniture] = await Promise.all([
      prisma.chantier.findMany(),
      prisma.fourniture_list.findMany(),
    ]);

    res.json({ success: true, data: { demandeFourniture, chantiers, listfourniture } });
  } catch (error) {
    console.error("apiViewDemandeFourniture error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/fournitures/:id/edit - Get edit form data
export const apiEditDemandeFourniture = async (req, res) => {
  try {
    const { id } = req.params;

    const allowed = await assertCanAccessDemandeFourniture(req, res, id);
    if (!allowed) return;

    const demandeFourniture = await prisma.demandeFourniture.findUnique({
      where: { id: parseInt(id) },
      include: { user: true, chantier: true, items: true },
    });
    
    if (!demandeFourniture) {
      return res.status(404).json({ success: false, error: "Demande introuvable." });
    }

    const format = d => {
      if (!d) return "";
      const date = new Date(d);
      return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
    };
    const today = format(demandeFourniture.dateDemande);

    const [chantiers, listfourniture] = await Promise.all([
      prisma.chantier.findMany(),
      prisma.fourniture_list.findMany(),
    ]);

    res.json({ success: true, data: { demandeFourniture, today, chantiers, listfourniture } });
  } catch (error) {
    console.error("apiEditDemandeFourniture error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Re-export existing functions that already return JSON
// We'll create wrappers that use req.user instead of req.session.user

export const apiStoreDemandeFourniture = async (req, res) => {
  // Pass user via res.locals instead of overwriting req.session
  res.locals.user = req.user;
  
  // Import and call original function
  const { storeDemandeFourniture } = await import('./demandeFourniture.js');
  return storeDemandeFourniture(req, res);
};

export const apiUpdateDemandeFourniture = async (req, res) => {
  const allowed = await assertCanAccessDemandeFourniture(req, res, req.params.id);
  if (!allowed) return;

  // Pass user via res.locals instead of overwriting req.session
  res.locals.user = req.user;
  const { updateDemandeFourniture } = await import('./demandeFourniture.js');
  return updateDemandeFourniture(req, res);
};

export const apiDeleteDemandeFourniture = async (req, res) => {
  const allowed = await assertCanAccessDemandeFourniture(req, res, req.params.id);
  if (!allowed) return;

  const { deleteDemandeFourniture } = await import('./demandeFourniture.js');
  return deleteDemandeFourniture(req, res);
};

export const apiUpdateValidationFourniture = async (req, res) => {
  // Pass user via res.locals instead of overwriting req.session
  res.locals.user = req.user;
  const { updateValidationFourniture } = await import('./demandeFourniture.js');
  return updateValidationFourniture(req, res);
};

export const apiValidateAllFourniture = async (req, res) => {
  // Pass user via res.locals instead of overwriting req.session
  res.locals.user = req.user;
  const { validateAllFourniture } = await import('./demandeFourniture.js');
  return validateAllFourniture(req, res);
};

export const apiUpdateDemandeStatus = async (req, res) => {
  // Pass user via res.locals instead of overwriting req.session
  res.locals.user = req.user;
  const { updateDemandeStatus } = await import('./demandeFourniture.js');
  return updateDemandeStatus(req, res);
};

export const apiUpdateDemandeFourniturePatch = async (req, res) => {
  const allowed = await assertCanAccessDemandeFourniture(req, res, req.params.id);
  if (!allowed) return;

  // Pass user via res.locals instead of overwriting req.session
  res.locals.user = req.user;
  const { updateDemandeFourniture } = await import('./demandeFourniture.js');
  return updateDemandeFourniture(req, res);
};

// PUT /api/fournitures/:id/mobile - Specialized update for mobile with partial update support
export const apiUpdateDemandeFournitureMobile = async (req, res) => {
  const allowed = await assertCanAccessDemandeFourniture(req, res, req.params.id);
  if (!allowed) return;
  console.log("this is me im backend and im triggered alredy !!!")
  try {
    const { id } = req.params;
    const { date, numero, items, newImageCount } = req.body;

    // Parse items
    let parsedItems = [];
    if (typeof items === 'string') {
      parsedItems = JSON.parse(items);
    } else if (Array.isArray(items)) {
      parsedItems = items;
    } else {
      return res.status(400).json({ success: false, error: "Items invalides." });
    }

    const fileCount = parseInt(newImageCount) || 0;
    let fileIndex = 0;

    // Get existing items from DB for merging
    const existingItems = await prisma.itemFourniture.findMany({
      where: { demandeFournitureId: parseInt(id, 10) },
    });

    // Merge incoming data with existing items (for partial updates)
    const mergedItems = parsedItems.map((it) => {
      if (it.id && !isNaN(parseInt(it.id))) {
        // Existing item - merge with DB data
        const existing = existingItems.find(e => e.id === parseInt(it.id));
        if (existing) {
          return {
            ...existing,  // Start with all DB fields
            ...it,        // Override with incoming data
            // Ensure critical fields fall back to DB values if not provided (check undefined, not falsy)
            designation: it.designation !== undefined ? it.designation : existing.designation,
            quantité: it.quantité !== undefined ? it.quantité : 
                     it.quantite !== undefined ? it.quantite : 
                     existing.quantité,
            unite: it.unite !== undefined ? it.unite : (existing.unité || existing.unite),
            unité: it.unité !== undefined ? it.unité : (existing.unité || existing.unite),
          };
        }
      }
      // New item - return as-is
      return it;
    });

    // Replace parsedItems with merged data
    parsedItems = mergedItems;

    // Validate merged items
    if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
      return res.status(400).json({ success: false, error: "Au moins un item requis." });
    }

    for (const [i, it] of parsedItems.entries()) {
      const designation = (it.designation || "").trim();
      const qtyRaw = String(it.quantité || it.quantite || "").trim();

      if (!designation) {
        return res.status(400).json({ success: false, error: `Désignation manquante (ligne ${i + 1})` });
      }

      const quantité = qtyRaw.replace(/[^0-9]/g, '');
      if (!quantité || parseInt(quantité, 10) <= 0) {
        return res.status(400).json({ success: false, error: `Quantité invalide (ligne ${i + 1})` });
      }

      it.quantité = quantité;

      // Fetch Price logic
      let prixUnitaire = null;
      if (it.lot) {
        const fournitureItem = await prisma.fourniture_list.findFirst({
          where: { reference: it.lot },
          select: { prixUnitaire: true },
        });
        if (fournitureItem && fournitureItem.prixUnitaire) {
          prixUnitaire = Number(fournitureItem.prixUnitaire);
        }
      }
      it.prixUnitaire = prixUnitaire;
    }

    // Calculate totals
    const totalHt = parsedItems.reduce((acc, it) => acc + (parseInt(it.quantité, 10) * (it.prixUnitaire || 0)), 0);
    const tva = totalHt * 0.20;
    const totalTTC = totalHt + tva;

    // Separate items by operation type
    const itemsToUpdate = parsedItems.filter(it => it.id && !isNaN(parseInt(it.id)));
    const itemsToCreate = parsedItems.filter(it => !it.id || isNaN(parseInt(it.id)));
    const incomingIds = itemsToUpdate.map(it => parseInt(it.id));

    const itemsToDelete = existingItems.filter(e => !incomingIds.includes(e.id));

    // Execute transaction
    await prisma.$transaction(async (tx) => {
      // Upsert fourniture_list entries
      for (const item of parsedItems) {
        await tx.fourniture_list.upsert({
          where: {
            designation_reference: {
              designation: item.designation,
              reference: item.lot,
            },
          },
          update: { prixUnitaire: item.prixUnitaire ?? null },
          create: {
            designation: item.designation,
            reference: item.lot,
            prixUnitaire: item.prixUnitaire ?? null,
          },
        });
      }

      // Delete removed items
      if (itemsToDelete.length) {
        await tx.itemFourniture.deleteMany({
          where: { id: { in: itemsToDelete.map(i => i.id) } }
        });
      }

      // Create new items
      if (itemsToCreate.length) {
        await tx.itemFourniture.createMany({
          data: itemsToCreate.map(it => {
            let imagePath = it.tempImage || null;
            if (fileIndex < fileCount && req.files && req.files[fileIndex]) {
              imagePath = `/uploads/fournitures/${req.files[fileIndex].filename}`;
              fileIndex++;
            }
            return {
              demandeFournitureId: parseInt(id, 10),
              code: (it.code || "").trim() || null,
              designation: (it.designation || "").trim(),
              unité: (it.unite || "").trim() || null,
              imputation: (it.imputation || "").trim() || null,
              quantité: it.quantité,
              auPlutot: it.auPlutot || null,
              auPlutart: it.auPlutart || null,
              lot: (it.lot || "").trim() || null,
              observation: (it.observation || "").trim() || null,
              image: imagePath,
              validation: null,
              validepar: null,
              delaisPaiement: null,
              prixU: it.prixUnitaire || null,
              totalHt: (it.quantité * it.prixUnitaire) || null,
            };
          }),
        });
      }

      // Update existing items with merged data
      for (const it of itemsToUpdate) {
        const existing = existingItems.find(e => e.id === parseInt(it.id));
        const itemId = parseInt(it.id);

        // Image handling
        let imagePath = existing?.image;
        if (it.tempImage) imagePath = it.tempImage;
        if (fileIndex < fileCount && req.files && req.files[fileIndex]) {
          imagePath = `/uploads/fournitures/${req.files[fileIndex].filename}`;
          fileIndex++;
        }

        await tx.itemFourniture.update({
          where: { id: itemId },
          data: {
            code: (it.code !== undefined ? it.code : existing?.code) || null,
            designation: (it.designation !== undefined ? it.designation : existing?.designation) || "",
            unité: (it.unité !== undefined ? it.unité : it.unite !== undefined ? it.unite : existing?.unité) || null,
            imputation: (it.imputation !== undefined ? it.imputation : existing?.imputation) || null,
            quantité: it.quantité !== undefined ? it.quantité : existing?.quantité,
            auPlutot: it.auPlutot !== undefined ? it.auPlutot : existing?.auPlutot,
            auPlutart: it.auPlutart !== undefined ? it.auPlutart : existing?.auPlutart,
            lot: (it.lot !== undefined ? it.lot : existing?.lot) || null,
            observation: (it.observation !== undefined ? it.observation : existing?.observation) || null,
            image: imagePath,
            validation: existing?.validation ?? null,
            validepar: existing?.validepar ?? null,
            delaisPaiement: existing?.delaispaiment ?? null,
            prixU: it.prixUnitaire !== undefined ? it.prixUnitaire : existing?.prixU,
            totalHt: (it.quantité !== undefined ? it.quantité : existing?.quantité) *
                     (it.prixUnitaire !== undefined ? it.prixUnitaire : (existing?.prixU || 0)) || null,
          },
        });
      }

      // Update demande header
      let parsedDate;
      if (date) {
        parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
          const [day, month, year] = date.split('/');
          if (day && month && year) {
            parsedDate = new Date(`${year}-${month}-${day}`);
          }
        }
      } else {
        parsedDate = new Date();
      }

      if (isNaN(parsedDate.getTime())) {
        throw new Error("Date invalide");
      }

      await tx.demandeFourniture.update({
        where: { id: parseInt(id, 10) },
        data: {
          dateDemande: parsedDate,
          numero: parseInt(numero, 10),
          totalHt: totalHt,
          Tva: tva,
          totalTTC: totalTTC,
        },
      });
    });

    return res.json({ success: true });

  } catch (error) {
    console.error("apiUpdateDemandeFournitureMobile ERROR:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const apiAddPricingForDemande = async (req, res) => {
  const { addpricingforDemande } = await import('./demandeFourniture.js');
  return addpricingforDemande(req, res);
};

// GET /api/fournitures/suggestions/designations?q=searchTerm
// Returns unique designation suggestions based on partial match
export const apiGetDesignationSuggestions = async (req, res) => {
  try {
    const { q } = req.query;
    const searchTerm = (q || "").toLowerCase().trim();

    // Fetch all fourniture list data
    const fournitureData = await prisma.fourniture_list.findMany({
      select: { designation: true },
    });

    if (!searchTerm) {
      return res.json({ success: true, data: [] });
    }

    // Find unique designations that match search term (partial match, case insensitive)
    const uniqueDesignations = new Set();
    const matches = [];

    for (const item of fournitureData) {
      const d = (item.designation || "").trim();
      if (d.toLowerCase().includes(searchTerm)) {
        if (!uniqueDesignations.has(d)) {
          uniqueDesignations.add(d);
          matches.push({ designation: d });
        }
      }
      if (matches.length >= 20) break; // Limit to 20 results
    }

    res.json({ success: true, data: matches });
  } catch (error) {
    console.error("apiGetDesignationSuggestions error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/fournitures/suggestions/references?designation=xxx&q=searchTerm
// Returns reference suggestions filtered by designation first
export const apiGetReferenceSuggestions = async (req, res) => {
  try {
    const { designation, q } = req.query;
    const searchTerm = (q || "").toLowerCase().trim();
    const designationFilter = (designation || "").trim();

    if (!designationFilter) {
      return res.json({ success: true, data: [] });
    }

    // Fetch fourniture list filtered by designation
    const fournitureData = await prisma.fourniture_list.findMany({
      where: {
        designation: designationFilter,
      },
      select: { reference: true, unite: true, prixUnitaire: true },
    });

    // Filter by reference partial match
    let matches = fournitureData;
    if (searchTerm) {
      matches = fournitureData.filter(item =>
        (item.reference || "").toLowerCase().includes(searchTerm)
      );
    }

    // Format response
    const results = matches.map(item => ({
      reference: item.reference || "(Pas de référence)",
      unite: item.unite,
      prixUnitaire: item.prixUnitaire,
    }));

    res.json({ success: true, data: results });
  } catch (error) {
    console.error("apiGetReferenceSuggestions error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/fournitures/suggestions/item-by-reference?reference=xxx&designation=xxx
// Returns full item data by reference for auto-fill
export const apiGetItemByReference = async (req, res) => {
  try {
    const { reference, designation } = req.query;
    const refFilter = (reference || "").trim();
    const desFilter = (designation || "").trim();

    if (!refFilter) {
      return res.status(400).json({ success: false, error: "Reference required" });
    }

    const item = await prisma.fourniture_list.findFirst({
      where: {
        reference: refFilter,
        ...(desFilter && { designation: desFilter }),
      },
    });

    if (!item) {
      return res.status(404).json({ success: false, error: "Item not found" });
    }

    res.json({
      success: true,
      data: {
        designation: item.designation,
        reference: item.reference,
        unite: item.unite,
        prixUnitaire: item.prixUnitaire,
      },
    });
  } catch (error) {
    console.error("apiGetItemByReference error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const apiUploadImageFourniture = async (req, res) => {
  const allowed = await assertCanAccessItemFourniture(req, res, req.params.id);
  if (!allowed) return;

  // Pass user via res.locals instead of overwriting req.session
  res.locals.user = req.user;
  const { uploadImageFourniture } = await import('./demandeFourniture.js');
  return uploadImageFourniture(req, res);
};

export const apiUploadTempImage = async (req, res) => {
  const { uploadTempImage } = await import('./demandeFourniture.js');
  return uploadTempImage(req, res);
};

export const apiDownloadImageFourniture = async (req, res) => {
  const allowed = await assertCanAccessItemFourniture(req, res, req.params.id);
  if (!allowed) return;

  // Pass user via res.locals instead of overwriting req.session
  res.locals.user = req.user;
  const { downloadImageFourniture } = await import('./demandeFourniture.js');
  return downloadImageFourniture(req, res);
};

// GET /api/fournitures/:id/pdf - Generate and download PDF
export const apiGenerateDemandeFourniturePDF = async (req, res) => {
  const allowed = await assertCanAccessDemandeFourniture(req, res, req.params.id);
  if (!allowed) return;

  const { generateDemandeFourniturePDF } = await import('./demandeFourniture.js');
  console.log("i send the pdf ::::::")
  return generateDemandeFourniturePDF(req, res);
};
export const viewDemandeFourniture = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const demandeFourniture = await prisma.demandeFourniture.findUnique({
      where: { id },
      include: { user: true, chantier: true, items: true },
    });
    if (!demandeFourniture) {
      return res.status(404).json({ success: false, error: "Demande introuvable." });
    }
    res.render('dashboard/achats/fourniture/view', { demandeFourniture });
  } catch (error) {
    console.error("viewDemandeFourniture error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};