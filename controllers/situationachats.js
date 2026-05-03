import prisma from "../db.js";

export async function getSituationGenerale(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalBCs = await prisma.bondeCommande.count();
    const totalPages = Math.ceil(totalBCs / limit);

    // Fetch paginated BCs with all necessary includes
    const bcs = await prisma.bondeCommande.findMany({
      skip: skip,
      take: limit,
      include: {
        fournisseur: true,
        chantier: true,
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
      include: {
        fournisseur: true,
        chantier: true,
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

    // Flatten rows for display
    const rows = flattenRows(bcs);

    // Compute global KPIs from all data
    const allRows = flattenRows(allBCs);
    const kpis = computeKPIs(allRows);

    res.render('dashboard/achats/situation', { rows, kpis, page, totalPages, totalBCs });
  } catch (error) {
    console.error('Error in getSituationGenerale:', error);
    res.status(500).json({ error: error.message });
  }
}

function flattenRows(bcs) {
  const rows = [];

  for (const bc of bcs) {
    const bcHeader = {
      bcId: bc.id,
      bcNumero: bc.numero,
      bcDate: bc.date,
      fournisseur: bc.fournisseur?.name || '',
      chantier: bc.chantier?.nom || '',
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

  return rows;
}

function computeKPIs(rows) {
  // Commandé HT - sum of totalHT per unique itemId
  const uniqueItems = new Map();
  for (const row of rows) {
    if (row.isItemRow && row.itemId && row.totalHt != null) {
      if (!uniqueItems.has(row.itemId)) {
        uniqueItems.set(row.itemId, row.totalHt);
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
