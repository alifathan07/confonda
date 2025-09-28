import prisma from "../db.js";

// Index route
export const  indexTelePai = async (req, res) => {
    try {
        const telePai = await prisma.telepaimentPrelevement.findMany({
            include: {
                chantier: true,
                banque: true,
                fournisseur: true,
            }
        });
        const banques = await prisma.banque.findMany();
        const fournisseurs = await prisma.fournisseur.findMany();
        const chantiers = await prisma.chantier.findMany();
        res.render('dashboard/tresorerie/reglements/tele_prelev/index', {telePai, banques, fournisseurs, chantiers });
    } catch (error) {
        console.error('Error loading telePai:', error);
        res.status(500).send('Erreur lors du chargement des données').end();
    }
};  

// Store route
export const storeTelePai = async (req, res) => {
    try {
        const { chantierId, banque, montant,  dateEtablissement, observation, beneficiaire, type } = req.body;
        
        // Debug: Log the received data
        console.log('Received data:', req.body);
        console.log('chantierId:', chantierId, 'type:', typeof chantierId);
        let fournisseur = await prisma.fournisseur.findFirst({
            where: { name: beneficiaire }
        });
        
        if (!fournisseur) {
            console.log(`🆕 Creating new fournisseur: ${beneficiaire}`);
            fournisseur = await prisma.fournisseur.create({
                data: {
                    name: beneficiaire,
                    ice: ` `,
                    rib: ` `,
                    banque : '',
                    agence : '',
                    identifFiscal: ` `,
                    telFournisseur: ' ',
                    contact: ' ',
                    telContact: ' '
                }
            });
        }
        
        // Find or create banque
        console.log(`🏦 Looking for banque: ${banque}`);
        let existbanque = await prisma.banque.findFirst({
            where: { name: banque }
        });
        
        if (!existbanque) {
            existbanque = await prisma.banque.create({
                data: {
                    name: banque,
                    rib: 123456789,
                    agence: 'Default Agence',
                    solde: 0,
                    dateSolde: new Date(),
                    positive: 0,
                    negative: 0,
                    dmlt: 0
                }
            });
        }
        // Prepare the data object
        const telePaiData = {
            montant: parseFloat(montant),
            dateEtablissement: new Date(dateEtablissement) || new Date(),
            banque: { connect: { id: existbanque.id } },
            fournisseur: { connect: { id: fournisseur.id } },
            observation: observation || null,
            type: type || 'télépaiment', // Default to 'télépaiment' if not provided
        };

        // Only connect chantier if chantierId is provided and valid
        if (chantierId && chantierId !== '' && chantierId !== 'null') {
            telePaiData.chantier = { connect: { id: parseInt(chantierId) } };
        }

        const telePai = await prisma.telepaimentPrelevement.create({
            data: telePaiData
        });
        res.json(telePai);
    } catch (error) {
        console.error('Error storing telePai:', error);
        res.status(500).send('Erreur lors de la sauvegarde des données').end();
    }
};
export const updateTelePai = async (req, res) => {
    try {
        const { id } = req.params;
        const { chantierId, banque, montant, dateEtablissement, observation, beneficiaire, type } = req.body;
        
        // Debug: Log the received data
        console.log('Received data:', req.body);
        console.log('chantierId:', chantierId, 'type:', typeof chantierId);

        if (!beneficiaire || !banque) {
            return res.status(400).json({ error: "Fournisseur (bénéficiaire) et banque sont requis." });
        }

        // 📌 Check if fournisseur exists by name
        let fournisseur = await prisma.fournisseur.findFirst({ where: { name: beneficiaire } });

        if (!fournisseur) {
            console.log(`🆕 Creating new fournisseur: ${beneficiaire}`);
            fournisseur = await prisma.fournisseur.create({
                data: {
                    name: beneficiaire,
                    ice: ' ',
                    rib: ' ',
                    banque: '',
                    agence: '',
                    identifFiscal: ' ',
                    telFournisseur: ' ',
                    contact: ' ',
                    telContact: ' '
                }
            });
        }

        // 📌 Check if banque exists
        let findBanque = await prisma.banque.findFirst({ where: { name: banque } });

        if (!findBanque) {
            console.log(`🏦 Creating new banque: ${banque}`);
            findBanque = await prisma.banque.create({
                data: {
                    name: banque,
                    rib: 123456789,
                    agence: 'Default Agence',
                    solde: 0,
                    dateSolde: new Date(),
                    positive: 0,
                    negative: 0,
                    dmlt: 0
                }
            });
        }

        // 📌 Check if chantier exists by ID
        let findChantier = null;
        if (chantierId && chantierId !== '' && chantierId !== 'null') {
            findChantier = await prisma.chantier.findFirst({ where: { id: parseInt(chantierId) } });
        }

        // 🛠️ Build the data object dynamically, only including fields that are provided
        const data = {};

        if (montant !== undefined) {
            data.montant = parseFloat(montant.toString().replace(/[^0-9,.]/g, '').replace(',', '.'));
        }
        if (dateEtablissement !== undefined) {
            data.dateEtablissement = new Date(dateEtablissement);
        }
        if (observation !== undefined) {
            data.observation = observation;
        }
        if (type !== undefined) {
            data.type = type;
        }
        if (fournisseur) {
            data.fournisseur = { connect: { id: fournisseur.id } };
        }
        if (findBanque) {
            data.banque = { connect: { id: findBanque.id } };
        }
        if (findChantier) {
            data.chantier = { connect: { id: findChantier.id } };
        }

        // 🛠️ Update telePai
        const telePai = await prisma.telepaimentPrelevement.update({
            where: { id: parseInt(id) },
            data
        });

        console.log(`✅ telePai updated successfully: ${id}`);
        res.json(telePai);

    } catch (error) {
        console.error('❌ Error updating telePai:', {
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({ error: "Erreur lors de la mise à jour du télépaiment." });
    }
};
export const deleteTelePai = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.telepaimentPrelevement.delete({
            where: { id: parseInt(id) }
        });
        res.json({ message: 'Télépaiment supprimé avec succès' });
    } catch (error) {
        console.error('Error deleting telePai:', error);
        res.status(500).send('Erreur lors de la suppression du télépaiment').end();
    }
};