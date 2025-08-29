import express from 'express';
import { isAuthenticated } from '../middlewares/auth.js';
import { create, update, show, deleteSupplier, importExel, upload, atess } from '../controllers/supplierController.js';
import multer from 'multer';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import prisma from '../db.js';
import { createBanque, deleteBanque, displayBanques, displayBanquesForcheques, getSituationBancaire, showCreate, updateChequeInStituation, updateSituationBancaire } from '../controllers/banquesController.js';
import { awb, bmce, bmci, bp, cam, cdm, createCheque, deleteCheque, etablirCheque, importExelCheques, showCheques, showChequesForbanque, updateCheque, updateChequeStatut } from '../controllers/chequesController.js';
import {createEffet, deleteEffet, Eawb, Ebmce, Ebmci, Ebp, Ecam, Ecdm, etablirEffet, importExelEffets, showEffets, showEffetsForbanque, updateEffet, updateEffetStatut} from '../controllers/effetsController.js';
import { createPayavenir, deletePayavenir, showPayavenir, updatePayavenir, updatePayavenirStatut } from '../controllers/payavenirController.js';
import { createRecavenir, deleteRecavenir, showRecavenir, updateRecavenir, updateRecavenirStatut } from '../controllers/recavenirController.js';
import { createVirement, deleteVirement, generateVirementPDF, index, postVirement, showUpdateVirement, suppliersList, updateVire } from '../controllers/VirementController.js';
export const dashboardRouter = express.Router();
dashboardRouter.use(isAuthenticated)

dashboardRouter.use((req, res, next) => {
    res.locals.user = req.session.user;
    
    
    next();
});

dashboardRouter.get('/dashboard' , (req, res) => {
    res.render('dashboard/index', { user: req.session.user });
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
        dashboardRouter.get('/tresorerie/banques/create', showCreate);
        dashboardRouter.post('/tresorerie/banques/create', createBanque);
        // -----------Trésorerie :  Cheques-----------------
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
        dashboardRouter.delete('/tresorerie/effets/:id', deleteEffet);
        
        // < -----------Trésorerie :  Payavenir ----------------- >
        dashboardRouter.get('/tresorerie/payavenir', showPayavenir);
        dashboardRouter.post('/tresorerie/payavenir/create', createPayavenir);
        dashboardRouter.delete('/tresorerie/payavenir/:id', deletePayavenir);
        dashboardRouter.patch('/tresorerie/payavenir/:id', updatePayavenir);
        dashboardRouter.put('/tresorerie/payavenir/:id/update-statut', updatePayavenirStatut);
        // < -----------Trésorerie :  Recavenir ----------------- >
        dashboardRouter.get('/tresorerie/recettes_a_venir', showRecavenir);
        dashboardRouter.post('/tresorerie/recettes_a_venir/create', createRecavenir);
        dashboardRouter.delete('/tresorerie/recettes_a_venir/:id', deleteRecavenir);
        dashboardRouter.patch('/tresorerie/recettes_a_venir/:id', updateRecavenir);
        dashboardRouter.put('/tresorerie/recettes_a_venir/:id/update-statut', updateRecavenirStatut);
         // < -----------Trésorerie :  Virements ----------------- >
         
        dashboardRouter.get('/tresorerie/virements/banque/:id/create', createVirement);
        dashboardRouter.get('/tresorerie/virements/banque/:banqueId', index);

        dashboardRouter.get('/tresorerie/virements/banque/:banqueId/update/:id', showUpdateVirement);
        dashboardRouter.patch('/tresorerie/virements/banque/:banqueId/update/:id', updateVire);
        dashboardRouter.get('/tresorerie/virements/banque/:id/pdf', generateVirementPDF);
        dashboardRouter.post('/tresorerie/virements/banque/:id/create', postVirement);
        dashboardRouter.delete('/tresorerie/virements/banque/:banqueId/delete/:id', deleteVirement);
        dashboardRouter.get('/api/fournisseurs', suppliersList);