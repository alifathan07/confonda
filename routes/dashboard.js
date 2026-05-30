import express from 'express';
import { isGrandAdmin, isAuthenticated, isAdmin, isUser, isDeveloper } from '../middlewares/auth.js';
import { create, update, show, deleteSupplier, importExel, upload, atess } from '../controllers/supplierController.js';
import multer from 'multer';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import prisma from '../db.js';
import { createBanque, deleteBanque, displayBanques, displayBanquesForcheques, getSituationBancaire, showCreate, updateChequeInStituation, updateChequeValidation, updateEffetInStituation, updateEffetValidation, updatePayValidation, updateSituationBancaire, showEditBanque, updateBanque, listBanques } from '../controllers/banquesController.js';
import { awb, bmce, bmci, bp, cam, cdm, createCheque, deleteCheque, etablirCheque, exportChequesExcel, exportChequesPdf, importExelCheques, listBanquesCheques, listChequesApi, showCheques, showChequesForbanque, updateCheque, updateChequeAllocations, updateChequeStatut } from '../controllers/chequesController.js';
import { createEffet, deleteEffet, Eawb, Ebmce, Ebmci, Ebp, Ecam, Ecdm, etablirEffet, importExelEffets, listBanquesEffets, showEffets, showEffetsForbanque, updateEffet, updateEffetAllocations, updateEffetStatut } from '../controllers/effetsController.js';
import { createPayavenir, deletePayavenir, showPayavenir, updatePayavenir, updatePayavenirChantier, updatePayavenirStatut } from '../controllers/payavenirController.js';
import { createRecavenir, deleteRecavenir, showRecavenir, updateRecavenir, updateRecavenirStatut } from '../controllers/recavenirController.js';
import { createVirement, deleteVirement, generateVirementPDF, index, listBanquesVirements, postVirement, showUpdateVirement, suppliersList, updateVire, updateVirementAllocations } from '../controllers/virementController.js';
import { createMiseadis, deleteMiseadis, generateMiseadisPDF, indexDis, listBanquesMiseadis, postMiseadis, showUpdateMiseadis, updateMis } from '../controllers/misediscontrollrt.js';
import { createFourniture, postFourniture } from '../controllers/fournitureController.js';
import { addUser, deleteUser, editUser, listUsers } from '../controllers/usersController.js';
// import { deleteClient, indexClients, postClient, updateClient } from '../controllers/clientController.js';
import { destroyChantier, destroyChantierDetails, indexChantiers, postChantier, postChantierItems, showChantierDetails, updateChantier } from '../controllers/chantierController.js';
import { createUi, destroyClient, indexClient, postClient, showClient, updateClient, updateUiClient } from '../controllers/clientController.js';
import { deleteEncaissement, exportHistoriqueExcel, exportHistoriquePdf, indexHis, saveEncaissement, updateHistoryBanque } from '../controllers/historiqueControlelr.js';
import { deleteTelePai, indexTelePai, storeTelePai, updateTelePai } from '../controllers/telepay_prelevController.js';
import { createEncaissement, indexEncaissement, updateEncaissement } from '../controllers/encaisementController.js';
import { addCaisseItem, createDemandeCaisse, deleteDemandeCaisse, deleteDemandeCaisseItem, generateDemandeExcel, generateDemandePdf, indexDemandeCaisse, storeDemandeCaisse, updateDemandeCaisseItem, updateDemandeCaisseItemValidation, updateDemandeCaisseStatut, updateDemandeCaisseValidationAll, viewDemandeCaisse } from '../controllers/demandecaisseController.js';
import { addJustifCaisse, addJustifCaisseAdminAuto, addJustifCaisseUserFirstTime, adminUserList, createJustifCaisse, createJustifCaisseAdmin, createOrUpdateDepenses, createOrUpdateRecettes, deleteDepense, deleteJustifeCaisse, deleteRecette, generateJustifCaisseExcel, generateJustifCaissePDF, getAllJustifCaisse, justifeCaisseListUser, listChantierUser, saveAllData, saveRecettesAdmin, updateDepenceValidation, updateSoldePrecedentAdmin, validateAllDepenses, viewJustifCaisse, viewJustifCaisseAdmin } from '../controllers/justifecaisseController.js';
import { addpricingforDemande, createDemandeFourniture, deleteDemandeFourniture, downloadImageFourniture, editDemandeFourniture, generateDemandeFourniturePDF, indexDemandeFourniture, storeDemandeFourniture, updateDemandeFourniture, updateDemandeStatus, updateEtat, updateValidationFourniture, uploadFour, uploadImageFourniture, uploadTempImage, validateAllFourniture, viewDemandeFourniture, sendTodayDemandesWhatsApp } from '../controllers/demandeFourniture.js';
import { fileURLToPath } from 'url';
import { EditDemandePrix, listDemandePrix, postDemandePrixViaFourniture, updateDemandePrix, viewDemandePrix, deleteDemandePrix, deleteArticle, createDemandePrix, storeDemandePrix, generateDemandePrixPDF, sendDemandePrixEmail } from '../controllers/demandeprixController.js';
import { editBc, postBcDemandeFourniture, updateBc, deleteBcItem, createBcForm, storeBc, generateBcPDF, sendBcEmail, listBc, deleteBc, updateBcItemDistribution, updateBcItem, importBcInfo, updateSupplier, getArticlesRemaining, createBondeLivraison,affecterBL, getBCDashboard } from '../controllers/bcController.js';
import { searchBLs, getBLArticles, affecterBCToBL, listBL, uploadBLFileHandler, downloadBLFile, uploadBLFile, editBL, updateBL, deleteBL, viewFacture, viewFactureAvoir, viewBL, getBL } from '../controllers/blController.js';
import { listFactures, getFacture, createFacture, updateFacture, deleteFacture, affecterBLToFacture, listFactureAvoirs, createFactureAvoir, deleteFactureAvoir, affecterBLToFactureAvoir, getFacturesByFournisseur, getFactureAvoirsByFournisseur, getFactureAvoirsByFacture, getFactureAvoir, getBLFactureStatus, uploadFactureFile, downloadFactureFile, uploadFactureFileMulter, getFactureReglements, searchReglements, affecterReglement } from '../controllers/factureController.js';
import { listBugReports, createBugReportForm, createBugReport, editBugReportForm, updateBugReport, deleteBugReport, getBugReport, getBugStats, uploadBugScreenshot } from '../controllers/bugReportController.js';
import { listPopups, createPopupForm, createPopup, editPopupForm, updatePopup, deletePopup, getActivePopupsForUser, dismissPopup, toggleUserPopup, getPopupStats } from '../controllers/popupController.js';
import { bmceDelete, bmceDownload, bmcePay, bmcePreview, bmceUpload, indexVirementPay } from '../controllers/virementpayController.js';
import { getListFourniture } from '../controllers/listfournitureController.js';
import { addNumbers, deleteNum, editSettingNum, settingsIndex } from '../controllers/settingsController.js';
import { getSituationGenerale } from '../controllers/situationachats.js';

const virementpayUpload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const dashboardRouter = express.Router();
dashboardRouter.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

// Public API for sending WhatsApp (no auth required)
dashboardRouter.get('/api/demandes-fourniture/send-whatsapp', sendTodayDemandesWhatsApp);

dashboardRouter.use(isAuthenticated)

dashboardRouter.use((req, res, next) => {
  res.locals.user = req.session.user;


  next();
});


dashboardRouter.get('/dashboard', isAdmin, async (req, res) => {
  try {
    // Fetch all banks
    const banques = await prisma.banque.findMany({
      select: {
        id: true,
        name: true,
        positive: true,
        negative: true,
        dmlt: true,
      },
    });

    // Fetch cheques in circulation or unpaid
    const cheques = await prisma.cheque.findMany({
      where: { statut: { in: ['En Circulation', 'Impayé'] } },
      select: { montant: true, dateEcheance: true },
    });

    // Fetch effets in circulation or unpaid
    const effets = await prisma.effet.findMany({
      where: { statut: { in: ['En Circulation', 'Impayé'] } },
      select: { montant: true, dateEcheance: true },
    });

    // Fetch payements à effectuer
    const payavenirs = await prisma.payavenir.findMany({
      where: { statut: { in: ['échu', 'impayé', 'non échu'] } },
      select: { montant: true, dateEcheance: true },
    });

    // Fetch recettes à venir
    const recavenirs = await prisma.recavenir.findMany({
      where: { statut: { in: ['échu', 'impayé', 'non échu'] } },
      select: { montant: true, dateEcheance: true },
    });

    // Compute totals
    const soldePositif = banques.reduce((sum, b) => sum + (b.positive || 0), 0);

    const totalPayementsAEffectuer = cheques.reduce((sum, c) => sum + (c.montant || 0), 0) +
      effets.reduce((sum, e) => sum + (e.montant || 0), 0) +
      payavenirs.reduce((sum, p) => sum + (p.montant || 0), 0);

    const totalRecettesAVenir = recavenirs.reduce((sum, r) => sum + (r.montant || 0), 0);

    // Optional: echeances this week
    const now = new Date();
    const endOfWeek = new Date();
    endOfWeek.setDate(now.getDate() + (7 - now.getDay()));

    const echeancesThisWeek = cheques
      .concat(effets)
      .filter(item => {
        if (!item.dateEcheance) return false;
        const date = new Date(item.dateEcheance);
        return date >= now && date <= endOfWeek;
      });

    // Prepare data for graphs
    const recettesChartData = recavenirs.map(r => ({
      date: r.dateEcheance.toISOString().split('T')[0], // YYYY-MM-DD
      amount: r.montant,
    }));

    const payementsChartData = payavenirs.map(p => ({
      date: p.dateEcheance ? p.dateEcheance.toISOString().split('T')[0] : null,
      amount: p.montant,
    })).filter(p => p.date !== null);

    // Check for welcome message flag
    const showWelcomeBugMessage = req.session.showWelcomeBugMessage || false;
    if (showWelcomeBugMessage) {
      delete req.session.showWelcomeBugMessage;
    }

    // Fetch active popups for this user
    let activePopups = [];
    const user = req.session.user;
    if (user && user.popupEnabled !== false) {
      const now = new Date();
      const dismissedPopups = req.session.dismissedPopups || [];
      const afterLoginShown = req.session.afterLoginShown || [];
      
      const popups = await prisma.popup.findMany({
        where: {
          status: 'active',
          startDate: { lte: now },
          OR: [
            { endDate: null },
            { endDate: { gte: now } }
          ]
        }
      });

      // Filter popups based on displayMode, target users/roles, and dismissal
      activePopups = popups.filter(popup => {
        const dismissedBy = popup.dismissedBy ? popup.dismissedBy.split(',').map(id => parseInt(id)) : [];
        
        // Check target users
        if (popup.targetUsers) {
          const targetUserIds = popup.targetUsers.split(',').map(id => parseInt(id));
          if (!targetUserIds.includes(user.id)) return false;
        }

        // Check target roles
        if (popup.targetRoles) {
          const targetRoleList = popup.targetRoles.split(',');
          if (!targetRoleList.includes(user.role)) return false;
        }

        // Handle displayMode
        switch (popup.displayMode) {
          case 'once_only':
            // Show once per user permanently (stored in DB)
            if (dismissedBy.includes(user.id)) return false;
            break;
            
          case 'after_login':
            // Show once per session after login
            if (afterLoginShown.includes(popup.id)) return false;
            // Mark as shown for this session
            if (!req.session.afterLoginShown) req.session.afterLoginShown = [];
            if (!req.session.afterLoginShown.includes(popup.id)) {
              req.session.afterLoginShown.push(popup.id);
            }
            break;
            
          case 'always':
            // Always show unless explicitly dismissed this session
            if (dismissedPopups.includes(popup.id)) return false;
            break;
            
          case 'after_every_action':
            // Show on every page load until dismissed in DB
            if (dismissedBy.includes(user.id)) return false;
            break;
            
          default:
            // Legacy: use showOnce logic
            if (popup.showOnce && dismissedPopups.includes(popup.id)) return false;
        }

        return true;
      });
    }

    // Fetch "Nouveau" bug reports for developer role ONLY to show as popups
    let nouveauBugs = [];
    if (user && user.role === 'developer') {
      const dismissedBugs = req.session.dismissedBugs || [];
      
      nouveauBugs = await prisma.bugReport.findMany({
        where: {
          status: 'nouveau',
          id: { notIn: dismissedBugs.length > 0 ? dismissedBugs : [0] }
        },
        orderBy: { createdAt: 'desc' },
        take: 5 // Show max 5 at a time
      });
    }

    res.render('dashboard/index', {
      user: req.session.user,
      banques,
      soldePositif,
      totalPayementsAEffectuer,
      totalRecettesAVenir,
      echeancesThisWeek,
      recettesChartData,
      payementsChartData,
      showWelcomeBugMessage,
      activePopups,
      nouveauBugs,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Erreur serveur.');
  }
});



// Achats : 
dashboardRouter.get('/achats', (req, res) => {
  res.render('dashboard/achats/index', { title: 'Supplier Page', user: req.session.user });
});
// -----------Achats :  Fournisseus-----------------
dashboardRouter.post('/achats/fournisseurs/create', create);
dashboardRouter.patch('/achats/fournisseurs/:id', update);
dashboardRouter.get('/achats/fournisseurs', show);
dashboardRouter.delete('/achats/fournisseurs/:id', deleteSupplier);
dashboardRouter.post('/achats/fournisseurs/:id/emails', async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email requis' });
    }
    await prisma.fournisseurEmail.create({
      data: {
        email,
        fournisseurId: parseInt(id)
      }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error adding email:', error);
    res.status(500).json({ error: 'Erreur lors de l\'ajout de l\'email' });
  }
});

dashboardRouter.delete('/achats/fournisseurs/emails/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.fournisseurEmail.delete({
      where: { id: parseInt(id) }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting email:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'email' });
  }
});
// -----------Achats :  Upload Fournisseur -----------------
/// multer logic 

// uploading logic details 
dashboardRouter.post('/achats/fournisseurs/import', upload.single('excelFile'), importExel);
// add attestation logic 
// Example in routes/fournisseurRoutes.js
dashboardRouter.post('/achats/fournisseurs/:id/attestation', atess);
// Trésorerie : 
dashboardRouter.get('/tresorerie', displayBanques);
dashboardRouter.get('/tresorerie/banques', listBanques);
dashboardRouter.get('/tresorerie/banques/create', showCreate);
dashboardRouter.post('/tresorerie/banques/create', createBanque);
dashboardRouter.get('/tresorerie/banques/:id/edit', showEditBanque);
dashboardRouter.patch('/tresorerie/banques/:id', updateBanque);
// -----------Trésorerie :  Cheques-----------------
dashboardRouter.get('/tresorerie/cheques/banques', listBanquesCheques);
dashboardRouter.get('/tresorerie/cheques/create/format/bmce/:id', bmce);
dashboardRouter.get('/tresorerie/cheques/create/format/bmci/:id', bmci);
dashboardRouter.get('/tresorerie/cheques/create/format/awb/:id', awb);
dashboardRouter.get('/tresorerie/cheques/create/format/credit_agricole/:id', cam);
dashboardRouter.get('/tresorerie/cheques/create/format/cdm/:id', cdm);
dashboardRouter.get('/tresorerie/cheques/create/format/bp/:id', bp);


// -----------Trésorerie :  Effets -----------------

dashboardRouter.post('/tresorerie/effets/create/format/:id', etablirEffet);
dashboardRouter.get('/tresorerie/effets/create/format/bmce/:id', Ebmce);
dashboardRouter.get('/tresorerie/effets/create/format/bmci/:id', Ebmci);
dashboardRouter.get('/tresorerie/effets/create/format/awb/:id', Eawb);
dashboardRouter.get('/tresorerie/effets/create/format/credit_agricole/:id', Ecam);
dashboardRouter.get('/tresorerie/effets/create/format/cdm/:id', Ecdm);
dashboardRouter.get('/tresorerie/effets/create/format/bp/:id', Ebp);
dashboardRouter.get('/tresorerie/effets/banques', listBanquesEffets);


dashboardRouter.post('/tresorerie/cheques/create/format/:id', etablirCheque);
dashboardRouter.get('/tresorerie/cheques', showCheques);
dashboardRouter.post('/tresorerie/cheques/create', createCheque);
dashboardRouter.get('/tresorerie/cheques/banques', displayBanquesForcheques);
dashboardRouter.get('/tresorerie/cheques/banque/:id', showChequesForbanque);
// uploading logic details 
dashboardRouter.post('/tresorerie/cheques/import', upload.single('excelFile'), importExelCheques);
dashboardRouter.delete('/tresorerie/cheques/:id', deleteCheque);
dashboardRouter.patch('/tresorerie/cheques/:id', updateCheque);
dashboardRouter.patch('/tresorerie/cheques/:id/allocations', updateChequeAllocations);
dashboardRouter.patch('/tresorerie/cheques/situation/:id', updateChequeInStituation);
dashboardRouter.patch('/tresorerie/cheques/:id/validation', updateChequeValidation);
dashboardRouter.put('/tresorerie/cheques/:id/update-statut', updateChequeStatut);

dashboardRouter.get('/tresorerie/cheques/export/pdf', exportChequesPdf);
dashboardRouter.get('/tresorerie/cheques/export/excel', exportChequesExcel);

dashboardRouter.get('/api/cheques', listChequesApi);


// situation banquaire : 
dashboardRouter.get('/tresorerie/situation', getSituationBancaire);
dashboardRouter.post('/tresorerie/situation', updateSituationBancaire);
dashboardRouter.post('/tresorerie/situation/create/banque', createBanque);
dashboardRouter.delete('/tresorerie/banques/delete/:id', deleteBanque);

// -----------Trésorerie :  Effets -----------------        // Update your route definition to include the bank ID parameter:

dashboardRouter.get('/tresorerie/effets', showEffets);
dashboardRouter.post('/tresorerie/effets/import', upload.single('excelFile'), importExelEffets);
dashboardRouter.get('/tresorerie/effets/banque/:id', showEffetsForbanque);
dashboardRouter.post('/tresorerie/effets/create', createEffet);
dashboardRouter.patch('/tresorerie/effets/:id', updateEffet);
dashboardRouter.patch('/tresorerie/effets/:id/allocations', updateEffetAllocations);
dashboardRouter.put('/tresorerie/effets/:id/update-statut', updateEffetStatut);
dashboardRouter.patch('/tresorerie/effets/situation/:id', updateEffetInStituation);
dashboardRouter.patch('/tresorerie/effets/:id/validation', updateEffetValidation);



dashboardRouter.delete('/tresorerie/effets/:id', deleteEffet);

// < -----------Trésorerie :  Payavenir ----------------- >
dashboardRouter.get('/tresorerie/payavenir', showPayavenir);
dashboardRouter.post('/tresorerie/payavenir', createPayavenir);
dashboardRouter.delete('/tresorerie/payavenir/:id', deletePayavenir);
dashboardRouter.patch('/tresorerie/payavenir/:id', updatePayavenir);
dashboardRouter.put('/tresorerie/payavenir/:id/update-statut', updatePayavenirStatut);
dashboardRouter.put('/tresorerie/payavenir/:id/update-chantier', updatePayavenirChantier);
dashboardRouter.patch('/tresorerie/payavenir/:id/validation', updatePayValidation);


// < -----------Trésorerie :  Recavenir ----------------- >
dashboardRouter.get('/tresorerie/recettes_a_venir', showRecavenir);
dashboardRouter.post('/tresorerie/recettes_a_venir/create', createRecavenir);
dashboardRouter.delete('/tresorerie/recettes_a_venir/:id', deleteRecavenir);
dashboardRouter.patch('/tresorerie/recettes_a_venir/:id', updateRecavenir);
dashboardRouter.put('/tresorerie/recettes_a_venir/:id/update-statut', updateRecavenirStatut);
// < -----------Trésorerie :  Virements ----------------- >

dashboardRouter.get('/tresorerie/virements/banque/:id/create', createVirement);
dashboardRouter.get('/tresorerie/virements', index);
dashboardRouter.get('/tresorerie/virements/banque/:banqueId/update/:id', showUpdateVirement);
dashboardRouter.patch('/tresorerie/virements/update/:id', updateVire);
dashboardRouter.patch('/tresorerie/virements/:id/allocations', updateVirementAllocations);
dashboardRouter.get('/tresorerie/virements/banque/:id/pdf', generateVirementPDF);
dashboardRouter.post('/tresorerie/virements/banque/:id/create', postVirement);
dashboardRouter.delete('/tresorerie/virements/delete/:id', deleteVirement);
dashboardRouter.get('/tresorerie/virements/banques', listBanquesVirements);
// < -----------Trésorerie :  Mise a Disposition ----------------- >
dashboardRouter.get('/tresorerie/miseadis/banque/:id/create', createMiseadis);
dashboardRouter.get('/tresorerie/miseadis', indexDis);
dashboardRouter.get('/tresorerie/miseadis/banque/:banqueId/update/:id', showUpdateMiseadis);
dashboardRouter.patch('/tresorerie/miseadis/update/:id', updateMis);
dashboardRouter.get('/tresorerie/miseadis/banque/:id/pdf', generateMiseadisPDF);
dashboardRouter.post('/tresorerie/miseadis/banque/:id/create', postMiseadis);
dashboardRouter.delete('/tresorerie/miseadis/delete/:id', deleteMiseadis);
dashboardRouter.get('/tresorerie/miseadis/banques', listBanquesMiseadis);

dashboardRouter.get('/api/fournisseurs', suppliersList);




// < -----------Achats :  Fourniture ----------------- >
// dashboardRouter.get('/achats/fourniture', showFourniture);
dashboardRouter.get('/achats/fourniture/create', createFourniture);
dashboardRouter.post('/achats/fourniture/create', postFourniture);
// dashboardRouter.delete('/achats/fourniture/:id', deleteFourniture);
// dashboardRouter.patch('/achats/fourniture/:id', updateFourniture);
// dashboardRouter.patch('/achats/fourniture/:id/validation', updateFournitureValidation);




// < -----------Users  ----------------- >
dashboardRouter.get("/users", isGrandAdmin, listUsers); // List all users
dashboardRouter.put("/users/edit", isGrandAdmin, editUser); // Edit user
dashboardRouter.post('/users/add', isGrandAdmin, addUser);
dashboardRouter.delete('/users/delete', isGrandAdmin, deleteUser);

// < -----------Ventes  ----------------- >
dashboardRouter.get('/ventes', (req, res) => {
  res.render('dashboard/ventes/index');
})
/// Clients
// dashboardRouter.get('/ventes/clients', indexClients);
// dashboardRouter.post('/ventes/clients', postClient);
// dashboardRouter.patch('/ventes/clients/:id', updateClient);
// dashboardRouter.delete('/ventes/clients/:id', deleteClient);

/// Chantiers
dashboardRouter.get('/ventes/chantiers', indexChantiers);

// dashboardRouter.post('/ventes/chantiers', postChantier);
// dashboardRouter.patch('/ventes/chantiers/:id', updateChantier);
// dashboardRouter.delete('/ventes/chantiers/:id', deleteChantier);


dashboardRouter.get('/ventes/clients', indexClient);
dashboardRouter.get('/ventes/clients/new', createUi);
dashboardRouter.post('/ventes/clients', postClient);
dashboardRouter.get('/ventes/clients/:id/edit', updateUiClient);
dashboardRouter.put('/ventes/clients/:id/edit', updateClient);
dashboardRouter.get('/ventes/clients/:id', showClient)
// add chantier based on client id 
dashboardRouter.post('/ventes/clients/:clientId/chantiers', postChantier);
dashboardRouter.get('/ventes/clients/:clientId/chantiers/:chantierId', showChantierDetails);
dashboardRouter.post('/ventes/clients/:clientId/chantiers/:chantierId/items', postChantierItems);
dashboardRouter.put('/ventes/clients/:clientId/chantiers/:chantierId', updateChantier);
dashboardRouter.delete('/ventes/clients/:clientId/chantiers/:chantierId', destroyChantier);
dashboardRouter.delete('/ventes/chantiers/:chantierId/items/:chantierItemId', destroyChantierDetails);
dashboardRouter.delete('/ventes/clients/:id', destroyClient);

// TelePaiment / Prelevement 
dashboardRouter.get('/tresorerie/telpay_prelevement', indexTelePai);
// Historique : 
dashboardRouter.get('/tresorerie/historique', indexHis);
dashboardRouter.get('/tresorerie/historique/export/excel', exportHistoriqueExcel);
dashboardRouter.get('/tresorerie/historique/export/pdf', exportHistoriquePdf);
dashboardRouter.post('/tresorerie/historique/banque', updateHistoryBanque);
dashboardRouter.post('/tresorerie/telePai/create', storeTelePai);
dashboardRouter.patch('/tresorerie/telePai/:id', updateTelePai);
dashboardRouter.delete('/tresorerie/telePai/:id', deleteTelePai);

// encaissement /achats'
dashboardRouter.get('/tresorerie/encaissement', indexEncaissement);
dashboardRouter.post('/tresorerie/encaissement/create', createEncaissement);
dashboardRouter.delete('/tresorerie/encaissement/:id', deleteEncaissement);
dashboardRouter.patch("/tresorerie/encaissement/:id", updateEncaissement)

// Demande De Caisse 
//caisse Routes
dashboardRouter.get('/achats/caisse', (req, res) => {
  res.render('dashboard/achats/caisse/index');
});
dashboardRouter.get('/achats/demandeCaisse', indexDemandeCaisse);
dashboardRouter.get('/achats/create/demandeCaisse', createDemandeCaisse);
dashboardRouter.post('/achat/demandes/caisse', storeDemandeCaisse);

dashboardRouter.get('/achats/demandes/caisse/:id', viewDemandeCaisse);
// routes/achats.js
dashboardRouter.delete("/demandes/caisse/items/:id", deleteDemandeCaisseItem);
dashboardRouter.put("/demandes/caisse/items/:id", updateDemandeCaisseItem);
dashboardRouter.post("/demandes/caisse/:id", addCaisseItem);
dashboardRouter.patch("/achats/demandes/caisse/updateStatus/:id", updateDemandeCaisseStatut);
dashboardRouter.patch("/achats/demandes/caisse/updateEtat/:id", updateEtat);
dashboardRouter.patch("/achats/demandes/caisse/updateValidation/:id", updateDemandeCaisseItemValidation);
dashboardRouter.get('/achats/demandes/caisse/:id/pdf', generateDemandePdf);
dashboardRouter.delete('/achats/demandes/caisse/delete/:id', deleteDemandeCaisse);
dashboardRouter.get('/achats/demandes/caisse/:id/excel', generateDemandeExcel);
dashboardRouter.patch("/achats/demandes/caisse/updateValidationAll/:id", updateDemandeCaisseValidationAll);


// justification caisse
// Render create page
dashboardRouter.get("/achats/caisse/justifecaisse/create", createJustifCaisse);

// List justifications

// View details
dashboardRouter.get("/achats/caisse/justifecaisse/:id", viewJustifCaisse);
// reccetes in user dashboard 
dashboardRouter.get("/achats/caisse/chantierlist", listChantierUser);
// Handle recettes
dashboardRouter.post("/achats/caisse/justification/recettes", createOrUpdateRecettes);
dashboardRouter.delete("/achats/caisse/justification/recettes/:id", deleteRecette);
dashboardRouter.get("/achats/caisse/justification/recettes/:id/pdf", generateJustifCaissePDF);
dashboardRouter.get("/achats/caisse/justification/recettes/:id/excel", generateJustifCaisseExcel);
// Handle depenses
dashboardRouter.post("/achats/caisse/justification/depenses", createOrUpdateDepenses);
dashboardRouter.delete("/achats/caisse/justification/depenses/:id", deleteDepense);
dashboardRouter.post("/achats/caisse/justification/save-all", saveAllData);
dashboardRouter.get("/achats/caisse/justif/:chantierId", getAllJustifCaisse);

dashboardRouter.post('/achats/add/justifeAuto', addJustifCaisse);
dashboardRouter.post('/achats/add/justifeAutoAdmin/:userId', addJustifCaisseAdminAuto);
dashboardRouter.post('/achats/add/justifeAutoUser', addJustifCaisseUserFirstTime);
dashboardRouter.delete('/achats/caisse/justifecaisse/:id', deleteJustifeCaisse);
dashboardRouter.get('/achats/caisse/admin', isAdmin, adminUserList);
dashboardRouter.get('/achats/caisse/admin/:id', isAdmin, justifeCaisseListUser);
dashboardRouter.get('/achats/caisse/admin/create/:userId', isAdmin, createJustifCaisseAdmin);
// dashboardRouter.get('/achats/caisse/admin/:userId/:id', isAdmin, createJustifCaisseAdmin);
dashboardRouter.get('/achats/caisse/admin/:userId/:id', isAdmin, viewJustifCaisseAdmin);
// dashboardRouter.get('/achats/caisse/admin/:userId/:id', isAdmin, updateJustifCaisseAdmin);
dashboardRouter.post('/achats/caisse/admin/:userId/:id/recettes', isAdmin, saveRecettesAdmin);
dashboardRouter.patch('/achats/caisse/admin/:userId/:id/solde-precedent', isAdmin, updateSoldePrecedentAdmin);


dashboardRouter.patch('/achats/caisse/justification/depenses/:id', updateDepenceValidation);
dashboardRouter.post('/achats/caisse/justification/valider/:justifId', validateAllDepenses);


/* -------------------------- DEMANDE FOURNITURE -------------------------- */
dashboardRouter.get("/achats/fourniture", indexDemandeFourniture);
dashboardRouter.get("/achats/create/fourniture", createDemandeFourniture);
dashboardRouter.post("/achats/demande/fourniture", uploadFour.any(), storeDemandeFourniture);
dashboardRouter.get("/achats/fourniture/:id", viewDemandeFourniture);
dashboardRouter.get("/achats/fourniture/:id/edit", editDemandeFourniture);
dashboardRouter.put("/achats/fourniture/:id", uploadFour.any(), updateDemandeFourniture);
dashboardRouter.delete("/achats/fourniture/:id", deleteDemandeFourniture);
dashboardRouter.patch('/achat/fourniture/:id/validate', updateValidationFourniture);
dashboardRouter.patch('/achat/fourniture/validate-all/:id', validateAllFourniture);
dashboardRouter.patch('/achats/demandes/fourniture/updateStatus/:id', updateDemandeStatus);
dashboardRouter.patch('/achats/demandes/fourniture/update/:id', updateDemandeFourniture);
dashboardRouter.put('/achats/fourniture/update/pricing/:id', addpricingforDemande);
dashboardRouter.post('/achat/fourniture/:id/upload-image', uploadFour.single('image'), uploadImageFourniture);
dashboardRouter.post('/achat/fourniture/upload-temp-image', uploadFour.single('image'), uploadTempImage);
dashboardRouter.get('/achat/fourniture/:id/download-image', downloadImageFourniture);


/// Creation de La demande de prix :
dashboardRouter.post('/achats/demande/prix', postDemandePrixViaFourniture)
dashboardRouter.get("/achat/demande-prix/create", createDemandePrix)   // must be BEFORE /:id
dashboardRouter.get("/achat/demandePrix/create", createDemandePrix)    // alias (old URL)
dashboardRouter.get('/achat/demande-prix/:id', viewDemandePrix);
dashboardRouter.get('/achat/demande-prix/:id/edit', EditDemandePrix);
dashboardRouter.get("/achats/demande-prix", listDemandePrix)
dashboardRouter.put("/achat/demande-prix/:id", updateDemandePrix)
dashboardRouter.delete("/achat/demande-prix/:id", deleteDemandePrix)
dashboardRouter.delete("/achat/demande-prix/article/:id", deleteArticle)
dashboardRouter.post("/achat/demande-prix", storeDemandePrix)
dashboardRouter.get("/achat/demande-prix/:id/pdf", generateDemandePrixPDF)
dashboardRouter.post('/api/demandes-prix/:id/send-email', sendDemandePrixEmail)

// Creation de Bon de Commande depuis une Demande de Fourniture (même payload que demande de prix)
dashboardRouter.post('/achats/bon-commande/create-from-demande', postBcDemandeFourniture);


/// Routers de Bon de commande :
dashboardRouter.get('/achat/bc/create', createBcForm);
dashboardRouter.post("/achat/bc", storeBc);
// dashboardRouter.get("/achat/bc/:id", viewBc);
dashboardRouter.get("/achat/bc/:id/edit", editBc);
dashboardRouter.patch('/achat/bc/supplier/update', updateSupplier);
dashboardRouter.put("/achat/bc/:id", updateBc);
// Update a single item (designation, unite, quantite, prixUnitaire)
dashboardRouter.put('/achat/bc/item/:itemId', updateBcItem);
// Update distribution for a single commandesItems (AJAX)
dashboardRouter.patch('/achat/bc/item/:itemId/distribution', updateBcItemDistribution);
dashboardRouter.delete("/achat/bc/article/:id", deleteBcItem);

dashboardRouter.get('/achat/bc/:id/pdf', generateBcPDF);
dashboardRouter.post('/api/bc/:id/send-email', sendBcEmail);

dashboardRouter.post('/achats/bc/create-from-demande', postBcDemandeFourniture);
dashboardRouter.get('/achats/demandefourniture/:id/pdf', generateDemandeFourniturePDF)
dashboardRouter.get("/achat/bc", listBc);
dashboardRouter.get("/achat/bon-commande", (req, res) => res.redirect('/achat/bc'));
dashboardRouter.get("/achats/bons-commande/:id/dashboard", getBCDashboard);
dashboardRouter.delete("/achat/bc/:id", deleteBc)
// import bc to list 
dashboardRouter.post('/achat/bc/import', upload.single('excelFile'), importBcInfo);

// -----------Achats: Bons de Livraison-----------------
dashboardRouter.get("/achats/bons-livraison", listBL);

// ==================== API ENDPOINTS FOR BON DE LIVRAISON (BL) ====================
// Get articles remaining for a BC
 dashboardRouter.get('/api/bons-commande/:id/articles-remaining', getArticlesRemaining);
 // Create a new BL
dashboardRouter.post('/api/bons-livraison', createBondeLivraison);
// Get unlinked BLs
// Search BLs for affectation (by fournisseur)
dashboardRouter.get('/api/bons-livraison/search', searchBLs);
// Get single BL by ID
dashboardRouter.get('/api/bons-livraison/:id', getBL);
// Get articles of an existing BL
dashboardRouter.get('/api/bons-livraison/:bl_id/articles', getBLArticles);
// Affecter BC articles to an existing BL (new 2-step flow)
dashboardRouter.post('/api/bons-livraison/:bl_id/affecter-bc', affecterBCToBL);
// Affecter (link) an existing BL to a BC (legacy)
dashboardRouter.patch('/api/bons-commande/:bc_id/affecter-bl/:bl_id', affecterBL);

// Upload file to BL
dashboardRouter.post('/api/bons-livraison/:id/upload', uploadBLFile.single('file'), uploadBLFileHandler);
// Download file from BL
dashboardRouter.get('/api/bons-livraison/:id/download', downloadBLFile);

// BL edit page and update
dashboardRouter.get('/achats/bons-livraison/:id/view', viewBL);
dashboardRouter.get('/achats/bons-livraison/:id/edit', editBL);
dashboardRouter.put('/achats/bons-livraison/:id', updateBL);
dashboardRouter.delete('/api/bons-livraison/:id', deleteBL);

// -----------Factures-----------------
dashboardRouter.get('/achats/factures', listFactures);
dashboardRouter.get('/achats/factures/create', async (req, res) => {
  try {
    const fournisseurs = await prisma.fournisseur.findMany({
      orderBy: { name: 'asc' }
    });
    const listfourniture = await prisma.fourniture_list.findMany();
    res.render('dashboard/achats/factures/create', { fournisseurs, listfourniture });
  } catch (error) {
    console.error('Error loading create facture page:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
dashboardRouter.get('/achats/factures/:id/view', viewFacture);
// dashboardRouter.get('/achats/factures/:id/edit', editFacture);
dashboardRouter.put('/achats/factures/:id', updateFacture);

// -----------Situation Générale Achats-----------------
dashboardRouter.get('/achats/situation-generale', getSituationGenerale);

dashboardRouter.get('/api/factures', listFactures);
dashboardRouter.get('/api/factures/:id', getFacture);
dashboardRouter.post('/api/factures', createFacture);
dashboardRouter.put('/api/factures/:id', updateFacture);
dashboardRouter.delete('/api/factures/:id', deleteFacture);
dashboardRouter.post('/api/factures/:id/affecter-bl', affecterBLToFacture);
dashboardRouter.get('/api/factures/by-fournisseur/:fournisseurId', getFacturesByFournisseur);
dashboardRouter.post('/api/factures/:id/upload', uploadFactureFileMulter.single('file'), uploadFactureFile);
dashboardRouter.get('/api/factures/:id/download', downloadFactureFile);

// -----------Factures Avoir-----------------
dashboardRouter.get('/achats/factures-avoir/:id/view', viewFactureAvoir);
dashboardRouter.get('/api/factures-avoir', listFactureAvoirs);
dashboardRouter.get('/api/factures/avoirs/:id', getFactureAvoir);
dashboardRouter.post('/api/factures-avoir', createFactureAvoir);
dashboardRouter.delete('/api/factures-avoir/:id', deleteFactureAvoir);
dashboardRouter.post('/api/factures-avoir/:id/affecter-bl', affecterBLToFactureAvoir);
dashboardRouter.get('/api/factures/:factureId/avoirs', getFactureAvoirsByFacture);
dashboardRouter.get('/api/factures-avoir/by-fournisseur/:fournisseurId', getFactureAvoirsByFournisseur);

// -----------BL Facture Status-----------------
dashboardRouter.get('/api/bons-livraison/:id/facture-status', getBLFactureStatus);

// -----------Facture Règlements (Cheque, Effet, Virement)-----------------
dashboardRouter.get('/api/factures/:id/reglements', getFactureReglements);
dashboardRouter.get('/api/reglements/search', searchReglements);
dashboardRouter.post('/api/factures/:id/affecter-reglement', affecterReglement);


// virement payment 
dashboardRouter.get("/virementpay", indexVirementPay);
dashboardRouter.get("/virementpay/bmce", bmcePay)
dashboardRouter.post('/virementpay/bmce/upload', (req, res, next) => {
  virementpayUpload.single('excelFile')(req, res, (err) => {
    if (err) {
      if (req.session) {
        req.session.virementpay_bmce_error = err.message || 'Erreur upload fichier.';
      }
      return res.redirect('/virementpay/bmce');
    }
    return next();
  });
}, bmceUpload);
dashboardRouter.get('/virementpay/bmce/files/:fileId', bmcePreview);
dashboardRouter.get('/virementpay/bmce/files/:fileId/download', bmceDownload);
dashboardRouter.post('/virementpay/bmce/files/:fileId/delete', bmceDelete);




/// list fourniture
dashboardRouter.get('/achats/listfourniture', getListFourniture);


// settings 
dashboardRouter.get('/settings', isGrandAdmin,settingsIndex);

dashboardRouter.post('/settings/whatsapp-recipients', isGrandAdmin, addNumbers);

dashboardRouter.post('/settings/whatsapp-recipients/:id', isGrandAdmin, editSettingNum);

dashboardRouter.post('/settings/whatsapp-recipients/:id/delete', isGrandAdmin, deleteNum );

// -----------Bug Reports-----------------
// List all bug reports - accessible to all authenticated users
dashboardRouter.get('/bug-reports', isAuthenticated, listBugReports);

// Create bug report form - only admin, grandadmin, granduser
dashboardRouter.get('/bug-reports/create',   createBugReportForm);

// Create bug report API - only admin, grandadmin, granduser
dashboardRouter.post('/api/bug-reports',   uploadBugScreenshot.single('screenshot'), createBugReport);

// Edit bug report form - ONLY developer can access
dashboardRouter.get('/bug-reports/:id/edit', isDeveloper, editBugReportForm);

// Update bug report - only developer can update (change status)
dashboardRouter.put('/api/bug-reports/:id', isDeveloper, updateBugReport);

// Delete bug report - developer can delete any, users can delete their own
dashboardRouter.delete('/api/bug-reports/:id', isAuthenticated, deleteBugReport);

// Get bug report by ID (API) - only developer
dashboardRouter.get('/api/bug-reports/:id', isDeveloper, getBugReport);

// Get bug statistics - accessible to all
dashboardRouter.get('/api/bug-reports/stats', isAuthenticated, getBugStats);

// Dismiss bug notification for developer
dashboardRouter.post('/api/bug-reports/:id/dismiss', isDeveloper, (req, res) => {
  const bugId = parseInt(req.params.id);
  if (!req.session.dismissedBugs) {
    req.session.dismissedBugs = [];
  }
  if (!req.session.dismissedBugs.includes(bugId)) {
    req.session.dismissedBugs.push(bugId);
  }
  res.json({ success: true, message: 'Bug notification dismissed' });
});

// -----------Popups (Developer only)-----------------
// List all popups
dashboardRouter.get('/popups', isDeveloper, listPopups);

// Create popup form
dashboardRouter.get('/popups/create', isDeveloper, createPopupForm);

// Create popup API
dashboardRouter.post('/api/popups', isDeveloper, createPopup);

// Edit popup form
dashboardRouter.get('/popups/:id/edit', isDeveloper, editPopupForm);

// Update popup
dashboardRouter.put('/api/popups/:id', isDeveloper, updatePopup);

// Delete popup
dashboardRouter.delete('/api/popups/:id', isDeveloper, deletePopup);

// Get active popups for current user (public)
dashboardRouter.get('/api/popups/active', isAuthenticated, getActivePopupsForUser);

// Dismiss popup for current user
dashboardRouter.post('/api/popups/:id/dismiss', isAuthenticated, dismissPopup);

// Toggle user popup enabled status
dashboardRouter.patch('/api/users/:userId/popup-toggle', isDeveloper, toggleUserPopup);

// Get popup statistics
dashboardRouter.get('/api/popups/stats', isDeveloper, getPopupStats);

