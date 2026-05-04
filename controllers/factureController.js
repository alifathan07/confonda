import prisma from "../db.js";
import fs, { truncateSync } from "fs";
import path from "path";
import multer from "multer";

const FACTURE_UPLOAD_DIR = "./uploads/factures";
if (!fs.existsSync(FACTURE_UPLOAD_DIR)) {
  fs.mkdirSync(FACTURE_UPLOAD_DIR, { recursive: true });
}

const factureFileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, FACTURE_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, "facture-" + req.params.id + "-" + uniqueSuffix + ext);
  }
});

const factureFileFilter = (req, file, cb) => {
  const allowedExts = [".pdf", ".jpg", ".jpeg", ".png"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Type de fichier non autorisé. Seuls PDF, JPG, JPEG et PNG sont acceptés."));
  }
};

export const uploadFactureFileMulter = multer({
  storage: factureFileStorage,
  fileFilter: factureFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

/**
 * GET /achats/factures - List page
 * GET /api/factures - API endpoint
 * List all invoices
 */
export const listFactures = async (req, res) => {
  try {
    const factures = await prisma.facture.findMany({
      include: {
        fournisseur: true,
        bondeLivraisonLinks: {
          include: {
            bondeLivraison: true
          }
        },
        avoirs: true,
        cheques: {
          include: {
            cheque: {
              include: {
                banque: true
              }
            }
          }
        },
        effets: {
          include: {
            effet: {
              include: {
                banque: true
              }
            }
          }
        },
        virements: {
          include: {
            virement: {
              include: {
                banque: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // If request accepts HTML, render the page
    if (req.accepts('html')) {
      return res.render('dashboard/achats/factures/list', {
        factures,
        currentPage: 'factures'
      });
    }

    // Otherwise return JSON for API
    res.json(factures);
  } catch (error) {
    console.error('Erreur listFactures:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

/**
 * GET /api/factures/:id
 * Get single invoice with items
 */
export const getFacture = async (req, res) => {
  try {
    const factureId = parseInt(req.params.id);
    const facture = await prisma.facture.findUnique({
      where: { id: factureId },
      include: {
        fournisseur: true,
        bondeLivraisonLinks: {
          include: {
            bondeLivraison: true
          }
        },
        items: true
      }
    });
    if (!facture) {
      return res.status(404).json({ success: false, error: 'Facture non trouvée' });
    }
    res.json({ facture });
  } catch (error) {
    console.error('Erreur getFacture:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

/**
 * POST /api/factures
 * Create a new invoice
 * Body: { numero, date, totalHt, tauxTva, bondeLivraisonIds[], items[] }
 */
export const createFacture = async (req, res) => {
  try {
    const { numero, date, totalHt, tauxTva, fournisseurId, items, createBC, createBL, bcNumero, blNumero, bondeLivraisonIds, bondeCommandeId } = req.body;

    if (!numero || !date || !totalHt || !fournisseurId) {
      return res.status(400).json({ success: false, error: 'Champs obligatoires manquants' });
    }

    const totalTtc = parseFloat(totalHt) + (parseFloat(totalHt) * parseFloat(tauxTva || 0) / 100);

    const facture = await prisma.$transaction(async (tx) => {
      let newBC = null;
      let newBL = null;

      // Create BC if requested
      if (createBC) {
        newBC = await tx.bondeCommande.create({
          data: {
            numero: bcNumero || `BC-${Date.now()}`,
            date: new Date(date),
            fournisseurId: parseInt(fournisseurId),
            statut: 'livre',
            commandesItems: items && items.length > 0 ? {
              create: items.map(item => ({
                designation: item.designation,
                quantite: parseFloat(item.quantite),
                prixUnitaire: parseFloat(item.prixUnitaire),
                totalHt: parseFloat(item.quantite) * parseFloat(item.prixUnitaire)
              }))
            } : undefined
          },
          include: { commandesItems: true }
        });
      }

      // Create BL if requested
      if (createBL) {
        // If BC exists, use its items; otherwise use items directly
        const blItems = newBC ? newBC.commandesItems : (items || []);
        
        newBL = await tx.bondeLivraison.create({
          data: {
            numero: blNumero || `BL-${Date.now()}`,
            date: new Date(date),
            fournisseurId: parseInt(fournisseurId),
            bondeCommandeLinks: newBC ? { create: { bondeCommandeId: newBC.id } } : undefined,
            items: blItems && blItems.length > 0 ? {
              create: blItems.map(item => ({
                designation: item.designation,
                quantite: item.quantite,
                prixUnitaire: item.prixUnitaire
              }))
            } : undefined
          },
          include: { items: true }
        });
      }

      // Create the facture
      // If BL was created, link items to BL items
      let factureItems = items;
      if (newBL && newBL.items && newBL.items.length > 0 && items && items.length > 0) {
        // Map items to BL items
        factureItems = items.map((item, idx) => ({
          ...item,
          bondeLivraisonItemId: newBL.items[idx] ? newBL.items[idx].id : null
        }));
      }

      const newFacture = await tx.facture.create({
        data: {
          numero,
          date: new Date(date),
          totalHt: parseFloat(totalHt),
          tauxTva: parseFloat(tauxTva || 0),
          totalTtc,
          fournisseurId: parseInt(fournisseurId),
          items: factureItems && factureItems.length > 0 ? {
            create: factureItems.map(item => ({
              designation: item.designation,
              unite: item.unite,
              reference: item.reference,
              quantite: parseFloat(item.quantite),
              prixUnitaire: parseFloat(item.prixUnitaire),
              totalHt: parseFloat(item.quantite) * parseFloat(item.prixUnitaire),
              bondeLivraisonItemId: item.bondeLivraisonItemId || null
            }))
          } : undefined,
          bondeLivraisonLinks: newBL ? {
            create: [{ bondeLivraisonId: newBL.id }]
          } : (bondeLivraisonIds ? {
            create: bondeLivraisonIds.map(blId => ({ bondeLivraisonId: parseInt(blId) }))
          } : undefined)
        },
        include: {
          items: true,
          bondeLivraisonLinks: {
            include: {
              bondeLivraison: true
            }
          }
        }
      });

      // Get all unique BCs linked to these BLs and create FactureBondecommande records
      const bcIdsSet = new Set();
      
      // Add direct BC if provided
      if (bondeCommandeId) {
        bcIdsSet.add(parseInt(bondeCommandeId));
      }
      
      // Add newly created BC
      if (newBC) {
        bcIdsSet.add(newBC.id);
      }
      
      for (const link of newFacture.bondeLivraisonLinks) {
        const bl = link.bondeLivraison;
        if (bl && bl.bondeCommandeLinks) {
          for (const bcLink of bl.bondeCommandeLinks) {
            bcIdsSet.add(bcLink.bondeCommandeId);
          }
        }
      }

      // Create FactureBondecommande records for all BCs
      if (bcIdsSet.size > 0) {
        const bcLinksData = Array.from(bcIdsSet).map(bcId => ({
          factureId: newFacture.id,
          bondeCommandeId: bcId
        }));
        
        await tx.factureBondecommande.createMany({
          data: bcLinksData,
          skipDuplicates: true
        });
      }

      // Return the updated facture with BC links
      return await tx.facture.findUnique({
        where: { id: newFacture.id },
        include: {
          items: true,
          bondeLivraisonLinks: {
            include: {
              bondeLivraison: true
            }
          },
          bondeCommandeLinks: {
            include: {
              bondeCommande: true
            }
          }
        }
      });
    });

    res.json({ success: true, facture });
  } catch (error) {
    console.error('Erreur createFacture:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur: ' + error.message });
  }
};

/**
 * PUT /api/factures/:id
 * Update invoice
 */
export const updateFacture = async (req, res) => {
  try {
    const factureId = parseInt(req.params.id);
    const { numero, date, totalHt, tauxTva, items } = req.body;

    const existingFacture = await prisma.facture.findUnique({
      where: { id: factureId },
      include: { items: true }
    });

    if (!existingFacture) {
      return res.status(404).json({ success: false, error: 'Facture non trouvée' });
    }

    const newTotalTtc = parseFloat(totalHt) + (parseFloat(totalHt) * parseFloat(tauxTva || 0) / 100);

    // Delete old items
    await prisma.factureItem.deleteMany({
      where: { factureId }
    });

    // Update facture with new items
    const facture = await prisma.facture.update({
      where: { id: factureId },
      data: {
        numero,
        date: new Date(date),
        totalHt: parseFloat(totalHt),
        tauxTva: parseFloat(tauxTva || 0),
        totalTtc: newTotalTtc,
        items: items && items.length > 0 ? {
          create: items.map(item => ({
            designation: item.designation,
            unite: item.unite,
            reference: item.reference,
            quantite: parseFloat(item.quantite),
            prixUnitaire: parseFloat(item.prixUnitaire),
            totalHt: parseFloat(item.quantite) * parseFloat(item.prixUnitaire),
            bondeLivraisonItemId: item.bondeLivraisonItemId || null
          }))
        } : undefined
      },
      include: {
        items: true,
        bondeLivraisonLinks: {
          include: { bondeLivraison: true }
        }
      }
    });

    res.json({ success: true, facture });
  } catch (error) {
    console.error('Erreur updateFacture:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur: ' + error.message });
  }
};

/**
 * DELETE /api/factures/:id
 * Delete invoice and cascade items and BL links
 */
export const deleteFacture = async (req, res) => {
  try {
    const factureId = parseInt(req.params.id);

    const existingFacture = await prisma.facture.findUnique({
      where: { id: factureId }
    });

    if (!existingFacture) {
      return res.status(404).json({ success: false, error: 'Facture non trouvée' });
    }

    // Delete items first (cascade should handle this, but being explicit)
    await prisma.factureItem.deleteMany({ where: { factureId } });
    
    // Delete BL links
    await prisma.factureBondeLivraison.deleteMany({ where: { factureId } });
    
    // Delete avoirs (cascade should handle)
    await prisma.factureAvoir.deleteMany({ where: { factureId } });

    // Delete facture
    await prisma.facture.delete({ where: { id: factureId } });

    res.json({ success: true, message: 'Facture supprimée' });
  } catch (error) {
    console.error('Erreur deleteFacture:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur: ' + error.message });
  }
};

/**
 * POST /api/factures/:id/affecter-bl
 * Link an existing BL to a Facture (must have same supplier)
 */
export const affecterBLToFacture = async (req, res) => {
  try {
    const factureId = parseInt(req.params.id);
    const { bondeLivraisonId } = req.body;

    if (!bondeLivraisonId) {
      return res.status(400).json({ success: false, error: 'ID du BL manquant' });
    }

    // Get the Facture with its supplier name
    const facture = await prisma.facture.findUnique({
      where: { id: factureId },
      include: { fournisseur: true }
    });

    if (!facture) {
      return res.status(404).json({ success: false, error: 'Facture non trouvée' });
    }

    // Get the BL with its supplier name
    const bl = await prisma.bondeLivraison.findUnique({
      where: { id: parseInt(bondeLivraisonId) },
      include: { fournisseur: true }
    });

    if (!bl) {
      return res.status(404).json({ success: false, error: 'BL non trouvé' });
    }

    // Check if same supplier by name (case insensitive)
    if (facture.fournisseur.name.toLowerCase() !== bl.fournisseur.name.toLowerCase()) {
      return res.status(400).json({ success: false, error: 'Le BL et la facture doivent avoir le même fournisseur' });
    }

    // Check if already linked
    const existingLink = await prisma.factureBondeLivraison.findUnique({
      where: {
        factureId_bondeLivraisonId: {
          factureId,
          bondeLivraisonId: parseInt(bondeLivraisonId)
        }
      }
    });

    if (existingLink) {
      return res.status(400).json({ success: false, error: 'BL déjà lié à cette facture' });
    }

    await prisma.factureBondeLivraison.create({
      data: {
        factureId,
        bondeLivraisonId: parseInt(bondeLivraisonId)
      }
    });

    res.json({ success: true, message: 'BL lié à la facture' });
  } catch (error) {
    console.error('Erreur affecterBLToFacture:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

/**
 * GET /api/factures-avoir
 * List all credit notes
 */
export const listFactureAvoirs = async (req, res) => {
  try {
    const avoirs = await prisma.factureAvoir.findMany({
      include: {
        facture: true,
        bondeLivraison: true,
        items: true
      },
      orderBy: { date: 'desc' }
    });
    res.json(avoirs);
  } catch (error) {
    console.error('Erreur listFactureAvoirs:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

/**
 * POST /api/factures-avoir
 * Create a new credit note (Facture Avoir)
 */
export const createFactureAvoir = async (req, res) => {
  try {
    const { numero, date, type, tauxTva, factureId, bondeLivraisonId, fournisseurId, items } = req.body;

    if (!numero || !date || !type || !factureId) {
      return res.status(400).json({ success: false, error: 'Champs obligatoires manquants' });
    }

    // Calculate totalHt from items
    const totalHt = items.reduce((sum, item) => {
      return sum + (parseFloat(item.quantite) * parseFloat(item.prixUnitaire));
    }, 0);

    const totalTtc = totalHt + (totalHt * tauxTva / 100);

    const factureAvoir = await prisma.factureAvoir.create({
      data: {
        numero,
        date: new Date(date),
        type,
        totalHt,
        tauxTva: parseFloat(tauxTva || 0),
        totalTtc,
        factureId: parseInt(factureId),
        bondeLivraisonId: bondeLivraisonId ? parseInt(bondeLivraisonId) : null,
        fournisseurId: fournisseurId ? parseInt(fournisseurId) : null,
        items: items && items.length > 0 ? {
          create: items.map(item => ({
            designation: item.designation,
            unite: item.unite,
            reference: item.reference,
            quantite: parseFloat(item.quantite),
            prixUnitaire: parseFloat(item.prixUnitaire),
            totalHt: parseFloat(item.quantite) * parseFloat(item.prixUnitaire),
            bondeLivraisonItemId: item.bondeLivraisonItemId || null
          }))
        } : undefined
      },
      include: {
        items: true
      }
    });

    // If type is "retour", update qtyRetourne on BondeLivraisonItem
    if (type === 'retour' && items && items.length > 0) {
      for (const item of items) {
        if (item.bondeLivraisonItemId) {
          const existing = await prisma.bondeLivraisonItem.findUnique({
            where: { id: item.bondeLivraisonItemId }
          });
          if (existing) {
            await prisma.bondeLivraisonItem.update({
              where: { id: item.bondeLivraisonItemId },
              data: {
                qtyRetourne: (existing.qtyRetourne || 0) + parseFloat(item.quantite)
              }
            });
          }
        }
      }
    }

    res.json({ success: true, factureAvoir });
  } catch (error) {
    console.error('Erreur createFactureAvoir:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur: ' + error.message });
  }
};

/**
 * POST /api/factures-avoir/:id/affecter-bl
 * Link an existing BL to a FactureAvoir
 */
export const affecterBLToFactureAvoir = async (req, res) => {
  try {
    const avoirId = parseInt(req.params.id);
    const { bondeLivraisonId } = req.body;

    if (!bondeLivraisonId) {
      return res.status(400).json({ success: false, error: 'ID du BL manquant' });
    }

    await prisma.factureAvoir.update({
      where: { id: avoirId },
      data: { bondeLivraisonId: parseInt(bondeLivraisonId) }
    });

    res.json({ success: true, message: 'BL lié à l\'avoir' });
  } catch (error) {
    console.error('Erreur affecterBLToFactureAvoir:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

/**
 * GET /api/factures/by-fournisseur/:fournisseurId
 * Get all invoices for a supplier (by supplier name)
 */
export const getFacturesByFournisseur = async (req, res) => {
  try {
    const fournisseurName = req.params.fournisseurId;
    console.log('getFacturesByFournisseur called with name:', fournisseurName);
    
    // Find the supplier by name to get its ID
    const fournisseur = await prisma.fournisseur.findFirst({
      where: { name: { contains: fournisseurName } }
    });
    
    if (!fournisseur) {
      return res.json([]);
    }
    
    console.log('Found fournisseur:', fournisseur.id, fournisseur.name);
    
    const factures = await prisma.facture.findMany({
      where: { fournisseurId: fournisseur.id },
      include: {
        bondeLivraisonLinks: {
          include: {
            bondeLivraison: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });
    console.log('Found factures:', factures.length);
    res.json(factures);
  } catch (error) {
    console.error('Erreur getFacturesByFournisseur:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

/**
 * GET /api/factures-avoir/by-fournisseur/:fournisseurId
 * Get all credit notes for a supplier
 */
export const getFactureAvoirsByFournisseur = async (req, res) => {
  try {
    const fournisseurId = parseInt(req.params.fournisseurId);
    const avoirs = await prisma.factureAvoir.findMany({
      where: {
        facture: {
          fournisseurId
        }
      },
      include: {
        facture: true,
        bondeLivraison: true
      },
      orderBy: { date: 'desc' }
    });
    res.json(avoirs);
  } catch (error) {
    console.error('Erreur getFactureAvoirsByFournisseur:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

/**
 * GET /api/factures/:factureId/avoirs
 * List all avoirs for a facture
 */
export const getFactureAvoirsByFacture = async (req, res) => {
  try {
    const factureId = parseInt(req.params.factureId);
    const avoirs = await prisma.factureAvoir.findMany({
      where: { factureId },
      include: {
        items: true,
        bondeLivraison: true
      },
      orderBy: { date: 'desc' }
    });
    res.json(avoirs);
  } catch (error) {
    console.error('Erreur getFactureAvoirsByFacture:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

/**
 * GET /api/factures/avoirs/:id
 * Get single avoir with items
 */
export const getFactureAvoir = async (req, res) => {
  try {
    const avoirId = parseInt(req.params.id);
    const avoir = await prisma.factureAvoir.findUnique({
      where: { id: avoirId },
      include: {
        facture: true,
        bondeLivraison: true,
        items: true
      }
    });
    if (!avoir) {
      return res.status(404).json({ success: false, error: 'Facture Avoir non trouvée' });
    }
    res.json(avoir);
  } catch (error) {
    console.error('Erreur getFactureAvoir:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

/**
 * DELETE /api/factures/avoirs/:id
 * Delete avoir and reverse qtyRetourne if type is "retour"
 */
export const deleteFactureAvoir = async (req, res) => {
  try {
    const avoirId = parseInt(req.params.id);

    const existingAvoir = await prisma.factureAvoir.findUnique({
      where: { id: avoirId },
      include: { items: true }
    });

    if (!existingAvoir) {
      return res.status(404).json({ success: false, error: 'Facture Avoir non trouvée' });
    }

    // If type is "retour", reverse qtyRetourne on each linked BL item
    if (existingAvoir.type === 'retour' && existingAvoir.items.length > 0) {
      for (const item of existingAvoir.items) {
        if (item.bondeLivraisonItemId) {
          const blItem = await prisma.bondeLivraisonItem.findUnique({
            where: { id: item.bondeLivraisonItemId }
          });
          if (blItem) {
            await prisma.bondeLivraisonItem.update({
              where: { id: item.bondeLivraisonItemId },
              data: {
                qtyRetourne: Math.max(0, (blItem.qtyRetourne || 0) - item.quantite)
              }
            });
          }
        }
      }
    }

    // Delete items
    await prisma.factureAvoirItem.deleteMany({ where: { factureAvoirId: avoirId } });

    // Delete avoir
    await prisma.factureAvoir.delete({ where: { id: avoirId } });

    res.json({ success: true, message: 'Facture Avoir supprimée' });
  } catch (error) {
    console.error('Erreur deleteFactureAvoir:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur: ' + error.message });
  }
};

/**
 * GET /api/bons-livraison/:id/facture-status
 * Get BL facture status
 */
export const getBLFactureStatus = async (req, res) => {
  try {
    const blId = parseInt(req.params.id);

    const bl = await prisma.bondeLivraison.findUnique({
      where: { id: blId },
      include: {
        factureLinks: {
          include: { facture: true }
        },
        avoirs: true
      }
    });

    if (!bl) {
      return res.status(404).json({ success: false, error: 'BL non trouvé' });
    }

    res.json({
      hasFacture: bl.factureLinks.length > 0,
      factureId: bl.factureLinks.length > 0 ? bl.factureLinks[0].facture.id : null,
      hasAvoir: bl.avoirs.length > 0
    });
  } catch (error) {
    console.error('Erreur getBLFactureStatus:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

/**
 * POST /api/factures/:id/upload
 * Upload a file (PDF or image) for a Facture
 */
export const uploadFactureFile = async (req, res) => {
  try {
    const factureId = parseInt(req.params.id);
    if (!factureId || isNaN(factureId)) {
      return res.status(400).json({ success: false, error: 'ID invalide' });
    }

    const facture = await prisma.facture.findUnique({
      where: { id: factureId }
    });

    if (!facture) {
      return res.status(404).json({ success: false, error: 'Facture non trouvée' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Aucun fichier fourni' });
    }

    const filePath = req.file.path;

    await prisma.facture.update({
      where: { id: factureId },
      data: { fichier: filePath }
    });

    return res.json({ success: true, message: 'Fichier uploadé avec succès', fichier: filePath });
  } catch (error) {
    console.error('Erreur uploadFactureFile:', error);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

/**
 * GET /api/factures/:id/download
 * Download the file attached to a Facture
 */
export const downloadFactureFile = async (req, res) => {
  try {
    const factureId = parseInt(req.params.id);
    if (!factureId || isNaN(factureId)) {
      return res.status(400).json({ success: false, error: 'ID invalide' });
    }

    const facture = await prisma.facture.findUnique({
      where: { id: factureId }
    });

    if (!facture) {
      return res.status(404).json({ success: false, error: 'Facture non trouvée' });
    }

    if (!facture.fichier) {
      return res.status(404).json({ success: false, error: 'Aucun fichier attaché' });
    }

    const filePath = facture.fichier;
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Fichier non trouvé sur le serveur' });
    }

    const filename = path.basename(filePath);
    res.download(filePath, filename);
  } catch (error) {
    console.error('Erreur downloadFactureFile:', error);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

/**
 * GET /api/factures/:id/reglements
 * Get all règlements (cheques, effets, virements) linked to a facture
 */
export const getFactureReglements = async (req, res) => {
  try {
    const factureId = parseInt(req.params.id);

    // Fetch the facture with its règlements
    const facture = await prisma.facture.findUnique({
      where: { id: factureId },
      include: {
        fournisseur: true,
        cheques: {
          include: {
            cheque: true
          }
        },
        effets: {
          include: {
            effet: true
          }
        },
        virements: {
          include: {
            virement: true
          }
        }
      }
    });

    if (!facture) {
      return res.status(404).json({ success: false, error: 'Facture non trouvée' });
    }

    // Calculate totalAffecte
    const totalAffecte =
      facture.cheques.reduce((sum, fc) => sum + fc.montantAffecte, 0) +
      facture.effets.reduce((sum, fe) => sum + fe.montantAffecte, 0) +
      facture.virements.reduce((sum, fv) => sum + fv.montantAffecte, 0);

    // Format règlements
    const reglements = {
      cheques: facture.cheques.map(fc => ({
        id: fc.cheque.id,
        numero: fc.cheque.numero,
        montant: fc.cheque.montant,
        montantAffecte: fc.montantAffecte,
        dateEcheance: fc.cheque.dateEcheance,
        statut: fc.cheque.statut,
        beneficiaire: fc.cheque.beneficiaire
      })),
      effets: facture.effets.map(fe => ({
        id: fe.effet.id,
        numero: fe.effet.numero,
        montant: fe.effet.montant,
        montantAffecte: fe.montantAffecte,
        dateEcheance: fe.effet.dateEcheance,
        statut: fe.effet.statut,
        beneficiaire: fe.effet.beneficiaire
      })),
      virements: facture.virements.map(fv => ({
        id: fv.virement.id,
        numero: fv.virement.id.toString(),
        montant: fv.virement.montant,
        montantAffecte: fv.montantAffecte,
        dateEcheance: fv.virement.date,
        statut: 'paye',
        beneficiaire: fv.virement.beneficiaire
      }))
    };

    res.json({
      success: true,
      factureId,
      totalTtc: facture.totalTtc,
      totalAffecte,
      statut: facture.statut,
      reglements
    });
  } catch (error) {
    console.error('Erreur getFactureReglements:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

/**
 * GET /api/reglements/search?type=cheque|effet|virement&fournisseurId=X
 * Search for available règlements that can be linked to a facture
 */
export const searchReglements = async (req, res) => {
  try {
    const { type, fournisseurId } = req.query;

    if (!type || !fournisseurId) {
      return res.status(400).json({ success: false, error: 'Type et fournisseurId sont requis' });
    }

    const fournisseurIdInt = parseInt(fournisseurId);
    let results = [];

    if (type === 'cheque') {
      // Get all cheques for this fournisseur that are not cancelled
      const cheques = await prisma.cheque.findMany({
        where: {
          fournisseurId: fournisseurIdInt,
          statut: { not: 'annulé' }
        },
        include: {
          factures: true,
          fournisseur: true
        }
      });

      // For each cheque, calculate montantDejaAffecte
      results = cheques.map(cheque => {
        const montantDejaAffecte = cheque.factures.reduce((sum, fc) => sum + fc.montantAffecte, 0);
        return {
          id: cheque.id,
          numero: cheque.numero,
          montant: cheque.montant,
          montantDejaAffecte,
          montantRestant: cheque.montant - montantDejaAffecte,
          dateEcheance: cheque.dateEcheance,
          statut: cheque.statut,
          beneficiaire: cheque.beneficiaire
        };
      }).filter(c => c.montantRestant > 0); // Only return cheques with remaining amount

    } else if (type === 'effet') {
      // Get all effets for this fournisseur that are not cancelled
      const effets = await prisma.effet.findMany({
        where: {
          fournisseurId: fournisseurIdInt,
          statut: { not: 'Annulé' }
        },
        include: {
          factures: true,
          fournisseur: true
        }
      });

      // For each effet, calculate montantDejaAffecte
      results = effets.map(effet => {
        const montantDejaAffecte = effet.factures.reduce((sum, fe) => sum + fe.montantAffecte, 0);
        return {
          id: effet.id,
          numero: effet.numero,
          montant: effet.montant,
          montantDejaAffecte,
          montantRestant: effet.montant - montantDejaAffecte,
          dateEcheance: effet.dateEcheance,
          statut: effet.statut,
          beneficiaire: effet.beneficiaire
        };
      }).filter(e => e.montantRestant > 0);

    } else if (type === 'virement') {
      // Get all virements for this fournisseur
      const virements = await prisma.virement.findMany({
        where: {
          fournisseurId: fournisseurIdInt
        },
        include: {
          factures: true,
          fournisseur: true
        }
      });

      // For each virement, calculate montantDejaAffecte
      results = virements.map(virement => {
        const montantDejaAffecte = virement.factures.reduce((sum, fv) => sum + fv.montantAffecte, 0);
        return {
          id: virement.id,
          numero: virement.id.toString(),
          montant: virement.montant,
          montantDejaAffecte,
          montantRestant: virement.montant - montantDejaAffecte,
          dateEcheance: virement.date,
          statut: 'paye',
          beneficiaire: virement.beneficiaire
        };
      }).filter(v => v.montantRestant > 0);
    } else {
      return res.status(400).json({ success: false, error: 'Type invalide. Utilisez cheque, effet ou virement' });
    }

    res.json({ success: true, type, results });
  } catch (error) {
    console.error('Erreur searchReglements:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

/**
 * POST /api/factures/:id/affecter-reglement
 * Link a règlement to a facture with a specific amount
 */
export const affecterReglement = async (req, res) => {
  try {
    const factureId = parseInt(req.params.id);
    const { type, reglementId, montantAffecte } = req.body;

    // Validate inputs
    if (!type || !reglementId || !montantAffecte) {
      return res.status(400).json({ success: false, error: 'Type, reglementId et montantAffecte sont requis' });
    }

    const montantAffecteFloat = parseFloat(montantAffecte);
    if (montantAffecteFloat <= 0) {
      return res.status(400).json({ success: false, error: 'Le montant affecté doit être positif' });
    }

    // Fetch facture
    const facture = await prisma.facture.findUnique({
      where: { id: factureId },
      include: {
        cheques: { include: { cheque: true } },
        effets: { include: { effet: true } },
        virements: { include: { virement: true } }
      }
    });

    if (!facture) {
      return res.status(404).json({ success: false, error: 'Facture non trouvée' });
    }

    // Check if facture is already fully paid
    if (facture.statut === 'payee') {
      return res.status(400).json({ success: false, error: 'La facture est déjà entièrement payée' });
    }

    const reglementIdInt = parseInt(reglementId);
    let reglement;
    let montantRestant = 0;

    // Validate montantRestant based on type
    if (type === 'cheque') {
      const cheque = await prisma.cheque.findUnique({
        where: { id: reglementIdInt },
        include: { factures: true }
      });
      if (!cheque) {
        return res.status(404).json({ success: false, error: 'Chèque non trouvé' });
      }
      const montantDejaAffecte = cheque.factures.reduce((sum, fc) => sum + fc.montantAffecte, 0);
      montantRestant = cheque.montant - montantDejaAffecte;
      reglement = cheque;
    } else if (type === 'effet') {
      const effet = await prisma.effet.findUnique({
        where: { id: reglementIdInt },
        include: { factures: true }
      });
      if (!effet) {
        return res.status(404).json({ success: false, error: 'Effet non trouvé' });
      }
      const montantDejaAffecte = effet.factures.reduce((sum, fe) => sum + fe.montantAffecte, 0);
      montantRestant = effet.montant - montantDejaAffecte;
      reglement = effet;
    } else if (type === 'virement') {
      const virement = await prisma.virement.findUnique({
        where: { id: reglementIdInt },
        include: { factures: true }
      });
      if (!virement) {
        return res.status(404).json({ success: false, error: 'Virement non trouvé' });
      }
      const montantDejaAffecte = virement.factures.reduce((sum, fv) => sum + fv.montantAffecte, 0);
      montantRestant = virement.montant - montantDejaAffecte;
      reglement = virement;
    } else {
      return res.status(400).json({ success: false, error: 'Type invalide' });
    }

    // Create or update the junction record using upsert
    // If record exists: replace montantAffecte (not increment) with the new value
    // Validation: ensure total allocated to this reglement doesn't exceed reglement.montant
    let junctionRecord;
    
    if (type === 'cheque') {
      // Get existing allocation to this facture (if any) to calculate remaining correctly
      const existingLink = await prisma.factureCheque.findUnique({
        where: { factureId_chequeId: { factureId, chequeId: reglementIdInt } }
      });
      const existingAmountToThisFacture = existingLink ? existingLink.montantAffecte : 0;
      
      // Calculate how much is allocated to OTHER factures (excluding this one)
      const otherAllocations = reglement.factures
        .filter(fc => fc.factureId !== factureId)
        .reduce((sum, fc) => sum + fc.montantAffecte, 0);
      
      // New total would be: otherAllocations + montantAffecteFloat
      const newTotalAllocated = otherAllocations + montantAffecteFloat;
      if (newTotalAllocated > reglement.montant) {
        return res.status(400).json({
          success: false,
          error: `Le montant total affecté (${newTotalAllocated}) dépasserait le montant du chèque (${reglement.montant})`
        });
      }
      
      // Upsert: create if not exists, update if exists (replace amount, not increment)
      junctionRecord = await prisma.factureCheque.upsert({
        where: { factureId_chequeId: { factureId, chequeId: reglementIdInt } },
        create: { factureId, chequeId: reglementIdInt, montantAffecte: montantAffecteFloat },
        update: { montantAffecte: montantAffecteFloat }
      });
    } else if (type === 'effet') {
      const existingLink = await prisma.factureEffet.findUnique({
        where: { factureId_effetId: { factureId, effetId: reglementIdInt } }
      });
      const existingAmountToThisFacture = existingLink ? existingLink.montantAffecte : 0;
      
      const otherAllocations = reglement.factures
        .filter(fe => fe.factureId !== factureId)
        .reduce((sum, fe) => sum + fe.montantAffecte, 0);
      
      const newTotalAllocated = otherAllocations + montantAffecteFloat;
      if (newTotalAllocated > reglement.montant) {
        return res.status(400).json({
          success: false,
          error: `Le montant total affecté (${newTotalAllocated}) dépasserait le montant de l'effet (${reglement.montant})`
        });
      }
      
      junctionRecord = await prisma.factureEffet.upsert({
        where: { factureId_effetId: { factureId, effetId: reglementIdInt } },
        create: { factureId, effetId: reglementIdInt, montantAffecte: montantAffecteFloat },
        update: { montantAffecte: montantAffecteFloat }
      });
    } else if (type === 'virement') {
      const existingLink = await prisma.factureVirement.findUnique({
        where: { factureId_virementId: { factureId, virementId: reglementIdInt } }
      });
      const existingAmountToThisFacture = existingLink ? existingLink.montantAffecte : 0;
      
      const otherAllocations = reglement.factures
        .filter(fv => fv.factureId !== factureId)
        .reduce((sum, fv) => sum + fv.montantAffecte, 0);
      
      const newTotalAllocated = otherAllocations + montantAffecteFloat;
      if (newTotalAllocated > reglement.montant) {
        return res.status(400).json({
          success: false,
          error: `Le montant total affecté (${newTotalAllocated}) dépasserait le montant du virement (${reglement.montant})`
        });
      }
      
      junctionRecord = await prisma.factureVirement.upsert({
        where: { factureId_virementId: { factureId, virementId: reglementIdInt } },
        create: { factureId, virementId: reglementIdInt, montantAffecte: montantAffecteFloat },
        update: { montantAffecte: montantAffecteFloat }
      });
    }

    // Recalculate facture status
    const updatedFacture = await prisma.facture.findUnique({
      where: { id: factureId },
      include: {
        cheques: true,
        effets: true,
        virements: true
      }
    });

    const totalAffecte =
      updatedFacture.cheques.reduce((sum, fc) => sum + fc.montantAffecte, 0) +
      updatedFacture.effets.reduce((sum, fe) => sum + fe.montantAffecte, 0) +
      updatedFacture.virements.reduce((sum, fv) => sum + fv.montantAffecte, 0);

    let newStatut;
    if (totalAffecte === 0) {
      newStatut = 'en_attente';
    } else if (totalAffecte >= updatedFacture.totalTtc) {
      newStatut = 'payee';
    } else {
      newStatut = 'partielle';
    }

    await prisma.facture.update({
      where: { id: factureId },
      data: { statut: newStatut }
    });

    res.json({
      success: true,
      message: 'Règlement affecté avec succès',
      statut: newStatut,
      totalAffecte,
      junctionRecord
    });
  } catch (error) {
    console.error('Erreur affecterReglement:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur: ' + error.message });
  }
};

