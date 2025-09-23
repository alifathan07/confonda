import prisma from "../db.js";

export const indexHis = async (req, res) => {
    try {
      const { from, to } = req.query;
  
   
      const fromDate = from ? new Date(from) : new Date('1900-01-01');
      const toDate = to ? new Date(to) : new Date('2100-01-01');
        
      const cheques = await prisma.cheque.findMany({
        where: {
          dateEcheance: {
            gte: fromDate,
            lte: toDate,
          },
        },
        select: {
          id: true,
          numero: true,
          dateEtablissement: true,
          montant: true,
          dateEcheance: true,
          validation: true, 
          beneficiaire: true,
          statut: true,
          obs : true,
          banque: {
            select: { name: true },
          },
        },
        orderBy: {
          dateEcheance: 'asc',
        },
      });
      console.log(cheques);
      const effets = await prisma.effet.findMany({
        where: {
          statut: { in: ['En Circulation', 'Impayé'] },
          dateEcheance: {
            gte: fromDate,
            lte: toDate,
          },
        },
        select: {
          id: true,
          numero: true,
          dateEtablissement: true,
          montant: true,
          dateEcheance: true,
          validation: true, 
          beneficiaire: true,
          obs : true,
          statut: true,
          banque: {
            select: { name: true },
          },
        },
        orderBy: {
          dateEcheance: 'asc',
        },
      });
      const fournisseurs = await prisma.fournisseur.findMany();
      
      const banques = await prisma.banque.findMany();

     
       res.render('dashboard/tresorerie/historique/index', {
        cheques,
        effets,
        from,
        to,
        fournisseurs,
        banques
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Erreur serveur.');
    }
  };