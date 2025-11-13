import express from 'express';
import { isGrandAdmin, isAuthenticated, isAdmin, isUser } from '../middlewares/auth.js';
import { create, update, show, deleteSupplier, importExel, upload, atess } from '../controllers/supplierController.js';
import multer from 'multer';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import prisma from '../db.js';
import { createBanque, deleteBanque, displayBanques, displayBanquesForcheques, getSituationBancaire, showCreate, updateChequeInStituation, updateChequeValidation, updateEffetInStituation, updateEffetValidation, updatePayValidation, updateSituationBancaire, showEditBanque, updateBanque, listBanques } from '../controllers/banquesController.js';
import { awb, bmce, bmci, bp, cam, cdm, createCheque, deleteCheque, etablirCheque, importExelCheques, listBanquesCheques, showCheques, showChequesForbanque, updateCheque, updateChequeStatut } from '../controllers/chequesController.js';
import {createEffet, deleteEffet, Eawb, Ebmce, Ebmci, Ebp, Ecam, Ecdm, etablirEffet, importExelEffets, listBanquesEffets, showEffets, showEffetsForbanque, updateEffet, updateEffetStatut} from '../controllers/effetsController.js';
import { createPayavenir, deletePayavenir, showPayavenir, updatePayavenir, updatePayavenirChantier, updatePayavenirStatut } from '../controllers/payavenirController.js';
import { createRecavenir, deleteRecavenir, showRecavenir, updateRecavenir, updateRecavenirStatut } from '../controllers/recavenirController.js';
import { createVirement, deleteVirement, generateVirementPDF, index, listBanquesVirements, postVirement, showUpdateVirement, suppliersList, updateVire } from '../controllers/virementController.js';
import { createMiseadis, deleteMiseadis, generateMiseadisPDF, indexDis, listBanquesMiseadis, postMiseadis, showUpdateMiseadis, updateMis } from '../controllers/misediscontrollrt.js';
import { createFourniture, postFourniture } from '../controllers/fournitureController.js';
import { addUser, deleteUser, editUser, listUsers } from '../controllers/usersController.js';
// import { deleteClient, indexClients, postClient, updateClient } from '../controllers/clientController.js';
import {  destroyChantier, destroyChantierDetails, indexChantiers, postChantier, postChantierItems, showChantierDetails, updateChantier } from '../controllers/chantierController.js';
import { createUi, destroyClient, indexClient, postClient, showClient, updateClient, updateUiClient } from '../controllers/clientController.js';
import { deleteEncaissement, indexHis, saveEncaissement, updateHistoryBanque } from '../controllers/historiqueControlelr.js';
import { deleteTelePai, indexTelePai, storeTelePai, updateTelePai } from '../controllers/telepay_prelevController.js';
import { createEncaissement, indexEncaissement, updateEncaissement } from '../controllers/encaisementController.js';
import { addCaisseItem, createDemandeCaisse, deleteDemandeCaisseItem, generateDemandeExcel, generateDemandePdf, indexDemandeCaisse, storeDemandeCaisse, updateDemandeCaisseItem, updateDemandeCaisseItemValidation, updateDemandeCaisseStatut, viewDemandeCaisse } from '../controllers/demandecaisseController.js';
import { addJustifCaisse, addJustifCaisseAdminAuto, adminUserList, createJustifCaisse, createJustifCaisseAdmin, createOrUpdateDepenses, createOrUpdateRecettes, deleteDepense, deleteJustifeCaisse, deleteRecette, generateJustifCaisseExcel, generateJustifCaissePDF, getAllJustifCaisse, justifeCaisseListUser, saveAllData, saveRecettesAdmin, updateDepenceValidation, validateAllDepenses, viewJustifCaisse, viewJustifCaisseAdmin } from '../controllers/justifecaisseController.js';
import { createDemandeFourniture, deleteDemandeFourniture, downloadImageFourniture, editDemandeFourniture, indexDemandeFourniture, storeDemandeFourniture, updateDemandeFourniture, updateValidationFourniture, uploadFour, uploadImageFourniture, uploadTempImage, validateAllFourniture, viewDemandeFourniture } from '../controllers/demandeFourniture.js';
import { fileURLToPath } from 'url';
import { EditDemandePrix, postDemandePrixViaFourniture, viewDemandePrix } from '../controllers/demandeprixController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const dashboardRouter = express.Router();
dashboardRouter.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));
dashboardRouter.use(isAuthenticated)

dashboardRouter.use((req, res, next) => {
    res.locals.user = req.session.user;
    
    
    next();
});
dashboardRouter.get('/dashboard' , isAdmin, async (req, res) => {
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
        select: { montant: true, dateEcheance : true },
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
  
      res.render('dashboard/index', {
        user: req.session.user,
        banques,
        soldePositif,
        totalPayementsAEffectuer,
        totalRecettesAVenir,
        echeancesThisWeek,
        recettesChartData,
        payementsChartData,
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
        // -----------Achats :  Upload Fournisseur -----------------
        /// multer logic 

        // uploading logic details 
        dashboardRouter.post('/achats/fournisseurs/import', upload.single('excelFile'),   importExel );
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
        dashboardRouter.post('/tresorerie/cheques/import', upload.single('excelFile'),   importExelCheques );
        dashboardRouter.delete('/tresorerie/cheques/:id', deleteCheque);
        dashboardRouter.patch('/tresorerie/cheques/:id', updateCheque);
        dashboardRouter.patch('/tresorerie/cheques/situation/:id', updateChequeInStituation);
        dashboardRouter.patch('/tresorerie/cheques/:id/validation', updateChequeValidation);
        dashboardRouter.put('/tresorerie/cheques/:id/update-statut', updateChequeStatut);
        
        
        // situation banquaire : 
        dashboardRouter.get('/tresorerie/situation', getSituationBancaire);
        dashboardRouter.post('/tresorerie/situation', updateSituationBancaire);
        dashboardRouter.post('/tresorerie/situation/create/banque', createBanque);
        dashboardRouter.delete('/tresorerie/banques/delete/:id', deleteBanque);

        // -----------Trésorerie :  Effets -----------------        // Update your route definition to include the bank ID parameter:
        
        dashboardRouter.get('/tresorerie/effets', showEffets);
        dashboardRouter.post('/tresorerie/effets/import', upload.single('excelFile'),   importExelEffets );
        dashboardRouter.get('/tresorerie/effets/banque/:id', showEffetsForbanque);
        dashboardRouter.post('/tresorerie/effets/create', createEffet);
        dashboardRouter.patch('/tresorerie/effets/:id', updateEffet);
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
        dashboardRouter.get('/ventes/clients/new', createUi );
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
        dashboardRouter.get('/achats/caisse', (req, res) =>{
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
       dashboardRouter.patch("/achats/demandes/caisse/updateValidation/:id", updateDemandeCaisseItemValidation);
       dashboardRouter.get('/achats/demandes/caisse/:id/pdf', generateDemandePdf);
       dashboardRouter.get('/achats/demandes/caisse/:id/excel', generateDemandeExcel);


       // justification caisse
       // Render create page
       dashboardRouter.get("/achats/caisse/justifecaisse/create", createJustifCaisse);

        // List justifications

        // View details
        dashboardRouter.get("/achats/caisse/justifecaisse/:id", viewJustifCaisse);

        // Handle recettes
        dashboardRouter.post("/achats/caisse/justification/recettes", createOrUpdateRecettes);
        dashboardRouter.delete("/achats/caisse/justification/recettes/:id", deleteRecette);
        dashboardRouter.get("/achats/caisse/justification/recettes/:id/pdf", generateJustifCaissePDF);
        dashboardRouter.get("/achats/caisse/justification/recettes/:id/excel", generateJustifCaisseExcel);
        // Handle depenses
        dashboardRouter.post("/achats/caisse/justification/depenses", createOrUpdateDepenses);
        dashboardRouter.delete("/achats/caisse/justification/depenses/:id", deleteDepense);
        dashboardRouter.post("/achats/caisse/justification/save-all", saveAllData);
        dashboardRouter.get("/achats/caisse/justifecaisse", getAllJustifCaisse);
        dashboardRouter.post('/achats/add/justifeAuto', addJustifCaisse);
        dashboardRouter.post('/achats/add/justifeAutoAdmin/:userId', addJustifCaisseAdminAuto);
        dashboardRouter.delete('/achats/caisse/justifecaisse/:id', deleteJustifeCaisse);
        dashboardRouter.get('/achats/caisse/admin',isAdmin, adminUserList);
        dashboardRouter.get('/achats/caisse/admin/:id',isAdmin,  justifeCaisseListUser);
        dashboardRouter.get('/achats/caisse/admin/create/:userId',isAdmin,  createJustifCaisseAdmin);
        // dashboardRouter.get('/achats/caisse/admin/:userId/:id', isAdmin, createJustifCaisseAdmin);
        dashboardRouter.get('/achats/caisse/admin/:userId/:id', isAdmin, viewJustifCaisseAdmin);
        // dashboardRouter.get('/achats/caisse/admin/:userId/:id', isAdmin, updateJustifCaisseAdmin);
        dashboardRouter.post('/achats/caisse/admin/:userId/:id/recettes', isAdmin, saveRecettesAdmin);


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

dashboardRouter.post('/achat/fourniture/:id/upload-image', uploadFour.single('image'), uploadImageFourniture);
dashboardRouter.post('/achat/fourniture/upload-temp-image', uploadFour.single('image'), uploadTempImage);
dashboardRouter.get('/achat/fourniture/:id/download-image', downloadImageFourniture);



/// Creation de La demande de prix :
dashboardRouter.post('/achats/demande/prix', postDemandePrixViaFourniture)
dashboardRouter.get('/achat/demande-prix/:id', viewDemandePrix);
dashboardRouter.get('/achat/demande-prix/:id/edit', EditDemandePrix);

