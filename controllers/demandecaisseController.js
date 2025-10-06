import prisma from "../db.js"
import PDFDocument from "pdfkit";
import fs from "fs";
import path, { parse } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const indexDemandeCaisse = async(req , res) => {
    const demande = await prisma.demandeCaisse.findMany({
        include: {
            user: true,
            items: true,
            chantier: true
        },
        orderBy: {
            numero: 'desc',
        },
        
    })
    const chantiers  = await prisma.chantier.findMany()
    res.render('dashboard/achats/caisse/demande/index' , { demande , chantiers } )
}
export const createDemandeCaisse = async(req , res) => {
    
    const user = await prisma.user.findUnique({
        where: {
            id: req.session.user.id
        },
        include: {
            chantier: true
        }
    })
    
    
 
    res.render('dashboard/achats/caisse/demande/create' , { user  } )
}
  export const storeDemandeCaisse = async (req, res) => {
      try {
        const { demandeur, chantier, designation, items } = req.body;
    
        // Log incoming request for debugging
        console.log('Request body:', { demandeur, chantier, designation, items });
    
        // Validate session
        if (!req.session?.user?.id || !req.session?.user?.chantierId) {
          console.error('Session validation failed:', req.session?.user);
          return res.status(401).json({ success: false, error: 'Utilisateur non authentifié ou chantier manquant.' });
        }
        // https://grok.com/c/686e7aca-c44a-4443-a805-8fdc630da836
    
        // Validate input
        if (!designation) {
          console.error('Designation missing');
          return res.status(400).json({ success: false, error: 'Le mois (designation) est requis.' });
        }
    
        if (!items || !Array.isArray(items) || items.length === 0) {
          console.error('Invalid items:', items);
          return res.status(400).json({ success: false, error: 'Les items doivent être un tableau non vide.' });
        }
    
        // Validate items
        for (const [index, item] of items.entries()) {
          if (!item.dateCaisse || !item.designation || !item.montant || !item.imputation) {
            console.error(`Invalid item at index ${index}:`, item);
            return res.status(400).json({ success: false, error: `Tous les champs des items doivent être remplis (item ${index + 1}).` });
          }
          const montant = parseFloat(item.montant);
          if (isNaN(montant) || montant <= 0) {
            console.error(`Invalid montant at index ${index}:`, item.montant);
            return res.status(400).json({ success: false, error: `Le montant doit être un nombre positif (item ${index + 1}).` });
          }
        }
    
        // Calculate total montant
        const montantTotal = items.reduce((sum, item) => sum + parseFloat(item.montant), 0);
        console.log('Calculated montantTotal:', montantTotal);
    
        // Generate user-specific numero
        const lastDemande = await prisma.demandeCaisse.findFirst({
          where: { userId: req.session.user.id },
          orderBy: { numero: 'desc' },
          select: { numero: true },
        });
        const numero = lastDemande ? lastDemande.numero + 1 : 1;
        console.log('Generated numero:', numero);
    
        // Create DemandeCaisse
        const demandeCaisse = await prisma.demandeCaisse.create({
          data: {
            designation,
            montantTotal,
            dateDemande: new Date(),
            numero,
            demandeur: demandeur || null,
            user: { connect: { id: req.session.user.id } },
            chantier: { connect: { id: req.session.user.chantierId } },
            items: {
              create: items.map((item, index) => {
                console.log(`Creating item ${index}:`, item);
                return {
                  dateCaisse: new Date(item.dateCaisse),
                  designation: item.designation,
                  montant: parseFloat(item.montant),
                  imputation: item.imputation,
                };
              }),
            },
          },
          include: { items: true },
        });
    
        console.log('Created DemandeCaisse:', demandeCaisse);
    
        // Return JSON response
        res.status(200).json({ success: true, data: demandeCaisse, id: demandeCaisse.id });
      } catch (error) {
        console.error('Error creating DemandeCaisse:', error);
        if (error.code === 'P2002') {
          return res.status(400).json({ success: false, error: 'Numéro de demande déjà utilisé pour cet utilisateur.' });
        }
        res.status(500).json({ success: false, error: `Erreur serveur : ${error.message}` });
      }
    };
export const viewDemandeCaisse = async (req, res) => {
    const demandeCaisse = await prisma.demandeCaisse.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
      include: {
        items: true,
        user: true,
        chantier: true
      },
    });
    const user = await prisma.user.findUnique({
        where: {
            id: req.session.user.id
        },
        include: {
            chantier: true
        }
    })
    
    res.render('dashboard/achats/caisse/demande/view', { demandeCaisse , user });
  };
  export const deleteDemandeCaisseItem = async (req, res) => {
    const id = req.params.id;
    try {
      const item = await prisma.itemCaisse.delete({
        where: {
          id: parseInt(id),
        },
      });
      const items = await prisma.itemCaisse.findMany({
        where: {
          demandeCaisseId: item.demandeCaisseId,
        },
      });
      const montantTotal = items.reduce((sum, item) => sum + parseFloat(item.montant), 0);
      await prisma.demandeCaisse.update({
        where: {
          id: item.demandeCaisseId,
        },
        data: {
          montantTotal,
        },
      });
      res.redirect(`/achats/demandes/caisse/${item.demandeCaisseId}`);
    } catch (error) {
      console.error('Error deleting item:', error);
      res.status(500).send('Erreur lors de la suppression de l\'item.');
    }
  };
  export const updateDemandeCaisseItem = async (req, res) => {
    const id = req.params.id;
    try {
      const item = await prisma.itemCaisse.update({
        where: {
          id: parseInt(id),
        },
        data: {
          dateCaisse: new Date(req.body.dateCaisse),
          designation: req.body.designation,
          montant: parseFloat(req.body.montant),
          imputation: req.body.imputation,
        },
      });
      const demandeCaisse = await prisma.demandeCaisse.findUnique({
        where: {
          id: item.demandeCaisseId,
        },
      });
      const items = await prisma.itemCaisse.findMany({
        where: {
          demandeCaisseId: item.demandeCaisseId,
        },
      });
      const montantTotal = items.reduce((sum, item) => sum + parseFloat(item.montant), 0);
      await prisma.demandeCaisse.update({
        where: {
          id: item.demandeCaisseId,
        },
        data: {
          montantTotal: montantTotal,
        },
      });
      res.redirect(`/achats/demandes/caisse/${item.demandeCaisseId}`);
    } catch (error) {
      console.error('Error updating item:', error);
      res.status(500).send('Erreur lors de la mise à jour de l\'item.');
    }
  };
  export const addCaisseItem = async (req, res) => {
    const demandeCaisseId = parseInt(req.params.id);
    try {
      const item = await prisma.itemCaisse.create({
        data: {
          dateCaisse: new Date(req.body.dateCaisse),
          designation: req.body.designation,
          montant: parseFloat(req.body.montant),
          imputation: req.body.imputation,
          demandeCaisse: { connect: { id: demandeCaisseId } },
        },
      });
  
      // Recalculate total
      const items = await prisma.itemCaisse.findMany({
        where: { demandeCaisseId },
      });
      const montantTotal = items.reduce((sum, item) => sum + parseFloat(item.montant), 0);
  
      await prisma.demandeCaisse.update({
        where: { id: demandeCaisseId },
        data: { montantTotal },
      });
  
      res.json({ success: true, item });
    } catch (error) {
      console.error('Error adding item:', error);
      res.json({ success: false, error: 'Erreur lors de l\'ajout de l\'item.' });
    }
  };


    export const updateDemandeCaisseStatut = async (req, res) => {
      const id = req.params.id;
    const {status} = req.body;
    try {
      const demandeCaisse = await prisma.demandeCaisse.update({
        where: { id: parseInt(id) },
        data: { status },
      });
      res.json({ success: true, demandeCaisse });
    } catch (error) {
      console.error('Error updating demandeCaisse:', error);
      res.json({ success: false, error: 'Erreur lors de la mise à jour de la demandeCaisse.' });
    }
  };


  export const updateDemandeCaisseItemValidation = async (req, res) => {
    const id = req.params.id;
    const { validation } = req.body;
  
    try {
      // Update the item
      const item = await prisma.itemCaisse.update({
        where: { id: parseInt(id) },
        data: { 
          validation,
          validepar: req.session.user.name,
        },
      });
  
      // Recalculate total from all validated items
      const items = await prisma.itemCaisse.findMany({
        where: { 
          demandeCaisseId: item.demandeCaisseId,
          validation: { not: 'Refusée' } // Only include validated items
        },
      });
  
      const total = items.reduce((acc, curr) => acc + curr.montant, 0);
  
      // Update the demandeCaisse total
      const demandeCaisse = await prisma.demandeCaisse.update({
        where: { id: item.demandeCaisseId },
        data: { montantTotal: total },
      });
  
      res.json({ success: true, item, montantTotal: total });
    } catch (error) {
      console.error('Error updating item validation:', error);
      res.json({ success: false, error: 'Erreur lors de la mise à jour de la validation de l\'item.' });
    }
  };
  
  
  

