import prisma from "../db.js";

export async function getSituationGenerale(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    // Filter parameters
    const { status, supplier, numero, minAmount, maxAmount, designation } = req.query;

    // Build where clause for filtering
    const whereClause = {};
    
    // Default filter: show only BCs from 2026
    const yearFilter = req.query.year ? parseInt(req.query.year) : 2026;
    const startOfYear = new Date(`${yearFilter}-01-01T00:00:00.000Z`);
    const endOfYear = new Date(`${yearFilter + 1}-01-01T00:00:00.000Z`);
    whereClause.date = {
      gte: startOfYear,
      lt: endOfYear
    };
    
    if (status) {
      whereClause.statut = status;
    }
    
    if (supplier) {
      whereClause.fournisseur = {
        name: { contains: supplier }
      };
    }
    
    if (numero) {
      whereClause.numero = { contains: numero };
    }

    // Get total count for pagination with filters
    const totalBCs = await prisma.bondeCommande.count({ where: whereClause });
    const totalPages = Math.ceil(totalBCs / limit);

    // Fetch paginated BCs with all necessary includes
    const bcs = await prisma.bondeCommande.findMany({
      where: whereClause,
      skip: skip,
      take: limit,
      include: {
        fournisseur: true,
        chantier: true,
        BondeCommandeChantierItem: {
          include: { chantier: true }
        },
        commandesItems: {
          include: {
            bondeLivraisonItems: {
              include: {
                bondeLivraison: {
                  include: {
                    fournisseur: true,
                    items: true,
                    factureLinks: {
                      include: {
                        facture: {
                          include: {
                            fournisseur: true,
                            items: true,
                            cheques: {
                              include: { cheque: true }
                            },
                            effets: {
                              include: { effet: true }
                            },
                            virements: {
                              include: { virement: true }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    // Fetch ALL BCs for global KPIs (lightweight query without nested includes)
    const allBCs = await prisma.bondeCommande.findMany({
      where: whereClause,
      include: {
        fournisseur: true,
        chantier: true,
        BondeCommandeChantierItem: {
          include: { chantier: true }
        },
        commandesItems: {
          include: {
            bondeLivraisonItems: {
              include: {
                bondeLivraison: {
                  include: {
                    items: true,
                    factureLinks: {
                      include: {
                        facture: {
                          include: {
                            cheques: { include: { cheque: true } },
                            effets: { include: { effet: true } },
                            virements: { include: { virement: true } }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    // Flatten ALL BCs first, then apply post-process filters
    const allFlattenedRows = flattenRows(bcs);
    
    // Apply amount and designation filters (post-process)
    let filteredAllRows = allFlattenedRows;
    if (designation) {
      const searchTerm = designation.toLowerCase();
      filteredAllRows = filteredAllRows.filter(row => {
        if (row.isHeaderRow) return true;
        return row.designation && row.designation.toLowerCase().includes(searchTerm);
      });
    }
    if (minAmount || maxAmount) {
      filteredAllRows = filteredAllRows.filter(row => {
        if (row.isHeaderRow) return true;
        const amount = row.totalHt || 0;
        if (minAmount && amount < parseFloat(minAmount)) return false;
        if (maxAmount && amount > parseFloat(maxAmount)) return false;
        return true;
      });
    }

    // Now paginate the filtered results
    const totalFiltered = Math.ceil(filteredAllRows.length / 20);
    const paginatedRows = filteredAllRows.slice(skip, skip + limit);

    // Compute global KPIs from all filtered data
    const allRows = flattenRows(allBCs);
    let filteredKpiRows = allRows;
    if (designation) {
      const searchTerm = designation.toLowerCase();
      filteredKpiRows = filteredKpiRows.filter(row => {
        if (row.isHeaderRow) return true;
        return row.designation && row.designation.toLowerCase().includes(searchTerm);
      });
    }
    if (minAmount || maxAmount) {
      filteredKpiRows = filteredKpiRows.filter(row => {
        if (row.isHeaderRow) return true;
        const amount = row.totalHt || 0;
        if (minAmount && amount < parseFloat(minAmount)) return false;
        if (maxAmount && amount > parseFloat(maxAmount)) return false;
        return true;
      });
    }
    const kpis = computeKPIs(filteredKpiRows);

    // Get suppliers list for filter dropdown
    const suppliers = await prisma.fournisseur.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    });

    res.render('dashboard/achats/situation', { 
      rows: paginatedRows, kpis, page, totalPages: totalFiltered, totalBCs: filteredAllRows.length, 
      filters: { status, supplier, numero, minAmount, maxAmount, designation, year: yearFilter },
      suppliers
    });
  } catch (error) {
    console.error('Error in getSituationGenerale:', error);
    res.status(500).json({ error: error.message });
  }
}

function flattenRows(bcs, filters = {}) {
  const rows = [];
  const { minAmount, maxAmount, designation } = filters;

  for (const bc of bcs) {
    // Get chantier from BC, BondeCommandeChantierItem, or items' imputation
    let bcChantier = bc.chantier?.nom || '';
    
    // Check BondeCommandeChantierItem for additional Chantiers
    const bcChantiers = [];
    if (bc.chantier?.nom) bcChantiers.push(bc.chantier.nom);
    if (bc.BondeCommandeChantierItem) {
      for (const bcItem of bc.BondeCommandeChantierItem) {
        if (bcItem.chantier?.nom && !bcChantiers.includes(bcItem.chantier.nom)) {
          bcChantiers.push(bcItem.chantier.nom);
        }
      }
    }
    
    // Fallback to items' imputation
    if (bcChantiers.length === 0 && bc.commandesItems) {
      for (const item of bc.commandesItems) {
        if (item.imputation && !bcChantiers.includes(item.imputation)) {
          bcChantiers.push(item.imputation);
        }
      }
    }

    const bcHeader = {
      bcId: bc.id,
      bcNumero: bc.numero,
      bcDate: bc.date,
      fournisseur: bc.fournisseur?.name || '',
      chantier: bcChantiers.join(', '),
      statut: bc.statut || 'en_attente_bl'
    };

    // Get all items from this BC (via BL items)
    const itemsMap = new Map(); // itemId -> item data

    for (const cmdItem of bc.commandesItems || []) {
      const itemId = cmdItem.id;

      // Process each BL linked to this command item
      for (const blItem of cmdItem.bondeLivraisonItems || []) {
        const bl = blItem.bondeLivraison;

        // Get all factures linked to this BL
        for (const blFactureLink of bl.factureLinks || []) {
          const facture = blFactureLink.facture;

          // Get all règlements for this facture
          const reglements = [];

          // Cheques
          for (const fc of facture.cheques || []) {
            reglements.push({
              type: 'cheque',
              id: fc.chequeId,
              montantAffecte: fc.montantAffecte,
              numero: fc.cheque?.numero || '',
              date: fc.cheque?.dateEtablissement
            });
          }

          // Effets
          for (const fe of facture.effets || []) {
            reglements.push({
              type: 'effet',
              id: fe.effetId,
              montantAffecte: fe.montantAffecte,
              numero: fe.effet?.numero || '',
              date: fe.effet?.dateEtablissement
            });
          }

          // Virements
          for (const fv of facture.virements || []) {
            reglements.push({
              type: 'virement',
              id: fv.virementId,
              montantAffecte: fv.montantAffecte,
              numero: fv.virement?.numero || '',
              date: fv.virement?.date
            });
          }

          // If no règlements, create one empty row
          if (reglements.length === 0) {
            reglements.push({ type: null, id: null, montantAffecte: 0, numero: '', date: null });
          }

          // Create rows for each règlement
          for (let i = 0; i < reglements.length; i++) {
            const reg = reglements[i];

            // Calculate item totals for this row
            const itemData = itemsMap.get(itemId) || {
              itemId,
              designation: cmdItem.designation,
              reference: cmdItem.reference,
              quantite: cmdItem.quantite,
              resteRecue: cmdItem.quantite - (cmdItem.quantiteRecue || 0),
              imputation: cmdItem.imputation,
              prixUnitaire: cmdItem.prixUnitaire || 0,
              remise: cmdItem.remise || 0,
              totalHt: cmdItem.totalHt || 0,
              blId: bl.id,
              blNumero: bl.numero,
              blDate: bl.date,
              factureId: facture.id,
              factureNumero: facture.numero,
              factureDate: facture.date,
              montantTtc: facture.totalTtc
            };

            // Only first règlement row gets item data
            if (i > 0) {
              rows.push({
                ...bcHeader,
                isHeader: false,
                isItemRow: false,
                itemId: null,
                designation: '',
                reference: '',
                quantite: null,
                resteRecue: null,
                imputation: '',
                prixUnitaire: null,
                remise: null,
                totalHt: null,
                blId: itemData.blId,
                blNumero: itemData.blNumero,
                blDate: itemData.blDate,
                factureId: itemData.factureId,
                factureNumero: itemData.factureNumero,
                factureDate: itemData.factureDate,
                montantTtc: itemData.montantTtc,
                reglementType: reg.type,
                reglementId: reg.id,
                reglementNumero: reg.numero,
                reglementMontant: reg.montantAffecte,
                reglementDate: reg.date
              });
            } else {
              rows.push({
                ...bcHeader,
                isHeader: false,
                isItemRow: true,
                itemId: itemData.itemId,
                designation: itemData.designation,
                reference: itemData.reference,
                quantite: itemData.quantite,
                resteRecue: itemData.resteRecue,
                imputation: itemData.imputation,
                prixUnitaire: itemData.prixUnitaire,
                remise: itemData.remise,
                totalHt: itemData.totalHt,
                blId: itemData.blId,
                blNumero: itemData.blNumero,
                blDate: itemData.blDate,
                factureId: itemData.factureId,
                factureNumero: itemData.factureNumero,
                factureDate: itemData.factureDate,
                montantTtc: itemData.montantTtc,
                reglementType: reg.type,
                reglementId: reg.id,
                reglementNumero: reg.numero,
                reglementMontant: reg.montantAffecte,
                reglementDate: reg.date
              });
            }

            itemsMap.set(itemId, itemData);
          }
        }

        // If no facture linked to BL, create one row with null facture/règlement
        if (!bl.factureLinks || bl.factureLinks.length === 0) {
          for (const cmdItem of bc.commandesItems || []) {
            rows.push({
              ...bcHeader,
              isHeader: false,
              isItemRow: true,
              itemId: cmdItem.id,
              designation: cmdItem.designation,
              reference: cmdItem.reference,
              quantite: cmdItem.quantite,
              resteRecue: cmdItem.quantite - (cmdItem.quantiteRecue || 0),
              imputation: cmdItem.imputation,
              prixUnitaire: cmdItem.prixUnitaire || 0,
              remise: cmdItem.remise || 0,
              totalHt: cmdItem.totalHt || 0,
              blId: bl.id,
              blNumero: bl.numero,
              blDate: bl.date,
              factureId: null,
              factureNumero: null,
              factureDate: null,
              montantTtc: null,
              reglementType: null,
              reglementId: null,
              reglementNumero: null,
              reglementMontant: null,
              reglementDate: null
            });
          }
        }
      }

      // If no BL linked to command item, create row with null BL/facture/règlement
      if (!cmdItem.bondeLivraisonItems || cmdItem.bondeLivraisonItems.length === 0) {
        rows.push({
          ...bcHeader,
          isHeader: false,
          isItemRow: true,
          itemId: cmdItem.id,
          designation: cmdItem.designation,
          reference: cmdItem.reference,
          quantite: cmdItem.quantite,
          resteRecue: cmdItem.quantite - (cmdItem.quantiteRecue || 0),
          imputation: cmdItem.imputation,
          prixUnitaire: cmdItem.prixUnitaire || 0,
          remise: cmdItem.remise || 0,
          totalHt: cmdItem.totalHt || 0,
          blId: null,
          blNumero: null,
          blDate: null,
          factureId: null,
          factureNumero: null,
          factureDate: null,
          montantTtc: null,
          reglementType: null,
          reglementId: null,
          reglementNumero: null,
          reglementMontant: null,
          reglementDate: null
        });
      }
    }

    // If no items at all, create empty row
    if (!bc.commandesItems || bc.commandesItems.length === 0) {
      rows.push({
        ...bcHeader,
        isHeader: false,
        isItemRow: true,
        itemId: null,
        designation: '',
        reference: '',
        quantite: null,
        resteRecue: null,
        imputation: '',
        prixUnitaire: null,
        remise: null,
        totalHt: null,
        blId: null,
        blNumero: null,
        blDate: null,
        factureId: null,
        factureNumero: null,
        factureDate: null,
        montantTtc: null,
        reglementType: null,
        reglementId: null,
        reglementNumero: null,
        reglementMontant: null,
        reglementDate: null
      });
    }
  }

  // Apply amount and designation filters (post-process)
  let filteredRows = rows;
  
  if (designation) {
    const searchTerm = designation.toLowerCase();
    filteredRows = filteredRows.filter(row => {
      if (row.isHeaderRow) return true; // Keep BC header rows
      return row.designation && row.designation.toLowerCase().includes(searchTerm);
    });
  }

  if (minAmount || maxAmount) {
    filteredRows = filteredRows.filter(row => {
      if (row.isHeaderRow) return true;
      const amount = row.totalHt || 0;
      if (minAmount && amount < parseFloat(minAmount)) return false;
      if (maxAmount && amount > parseFloat(maxAmount)) return false;
      return true;
    });
  }

  return filteredRows;
}

function computeKPIs(rows) {
  const currentYear = new Date().getFullYear();

  // Commandé HT - sum of totalHT per unique itemId for current year only
  const uniqueItems = new Map();
  for (const row of rows) {
    if (row.isItemRow && row.itemId && row.totalHt != null) {
      // Check if BC date is in current year
      const rowYear = row.bcDate ? new Date(row.bcDate).getFullYear() : null;
      if (rowYear === currentYear) {
        if (!uniqueItems.has(row.itemId)) {
          uniqueItems.set(row.itemId, row.totalHt);
        }
      }
    }
  }
  const commandeHT = Array.from(uniqueItems.values()).reduce((sum, v) => sum + v, 0);

  // Facturé TTC - sum of montantTtc per unique factureId
  const uniqueFactures = new Map();
  for (const row of rows) {
    if (row.factureId && row.montantTtc != null) {
      if (!uniqueFactures.has(row.factureId)) {
        uniqueFactures.set(row.factureId, row.montantTtc);
      }
    }
  }
  const factureTTC = Array.from(uniqueFactures.values()).reduce((sum, v) => sum + v, 0);

  // Total réglé - sum of all montantAffecte across all règlements
  const totalRegle = rows.reduce((sum, row) => {
    if (row.reglementMontant != null) {
      return sum + row.reglementMontant;
    }
    return sum;
  }, 0);

  // Solde dû
  const soldeDu = factureTTC - totalRegle;

  return {
    commandeHT: Math.round(commandeHT * 100) / 100,
    factureTTC: Math.round(factureTTC * 100) / 100,
    totalRegle: Math.round(totalRegle * 100) / 100,
    soldeDu: Math.round(soldeDu * 100) / 100
  };
}
