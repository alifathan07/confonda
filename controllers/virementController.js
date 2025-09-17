import prisma from "../db.js"
import PDFDocument from "pdfkit";
import fs from "fs";
import path, { parse } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const index = async(req , res) => {
    const virements  = await prisma.virement.findMany({
        include: { fournisseur: true, banque: true,  chantier : true },
    }); 
    const chantiers = await prisma.chantier.findMany();
    res.render('dashboard/tresorerie/reglements/virements/index' , { virements, chantiers } )
}

export const createVirement = async(req , res) => {
    const fournisseurs = await prisma.fournisseur.findMany()
    const banqueId = Number(req.params.id)
    const chantiers = await prisma.chantier.findMany()
    
    res.render('dashboard/tresorerie/reglements/virements/create' , { fournisseurs , banqueId, rtgs: false, srbm: false, instantane: false, chantiers } )
}
export const postVirement = async (req, res) => {
    try {
        const { beneficiaire, date, dateReglement, montant, obs, rib, montantLettre, objet, cause, agence, banque, chantier } = req.body;
        const banqueId = parseInt(req.params.id);

        if (isNaN(banqueId)) {
            return res.status(400).json({ error: "ID de banque invalide." });
        }

        const banqueExists = await prisma.banque.findUnique({
            where: { id: banqueId }
        });
        if (!banqueExists) {
            return res.status(404).json({ error: "Banque non trouvée." });
        }

        // Normalize rtgs value
        let rtgsValue = req.body.rtgs;
        let rtgs = false;
        if (Array.isArray(rtgsValue)) {
            rtgs = rtgsValue.includes("1");
        } else {
            rtgs = rtgsValue === "1";
        }

        // Normalize srbm value
        let srbmValue = req.body.srbm;
        let srbm = false;
        if (Array.isArray(srbmValue)) {
            srbm = srbmValue.includes("1");
        } else {
            srbm = srbmValue === "1";
        }

        // Normalize instantane value
        let instantaneValue = req.body.instantane;
        let instantane = false;
        if (Array.isArray(instantaneValue)) {
            instantane = instantaneValue.includes("1");
        } else {
            instantane = instantaneValue === "1";
        }

        // Fournisseur logic
        const fournisseurName = beneficiaire;
        let fournisseur = await prisma.fournisseur.findFirst({
            where: { name: fournisseurName }
        });

        // Prepare update data for fournisseur
        const updateData = {};
        if (rib !== undefined && rib !== null && rib !== '') updateData.rib = rib;
        if (agence !== undefined && agence !== null && agence !== '') updateData.agence = agence;
        if (banque !== undefined && banque !== null && banque !== '') updateData.banque = banque;

        if (fournisseur) {
            // Update fournisseur if any of rib, agence, or banque are provided
            if (Object.keys(updateData).length > 0) {
                fournisseur = await prisma.fournisseur.update({
                    where: { id: fournisseur.id },
                    data: updateData,
                });
            }
        } else {
            // Create new fournisseur if it doesn't exist
            fournisseur = await prisma.fournisseur.create({
                data: {
                    name: beneficiaire,
                    ice: `ICE_${Date.now()}`,
                    identifFiscal: `FISCAL_${Date.now()}`,
                    telFournisseur: 'Default',
                    contact: 'Default',
                    telContact: 'Default',
                    rib: rib || null,
                    agence: agence || null,
                    banque: banque || null
                }
            });
        }

        // Create virement
        const virement = await prisma.virement.create({
            data: {
                beneficiaire,
                date: new Date(date),
                dateReglement: dateReglement ? new Date(dateReglement) : null,
                montant: parseFloat(montant),
                obs,
                montantLettres: montantLettre,
                rtgs,
                srbm,
                instantane,
                objet,
                cause,
                fournisseur: { connect: { id: fournisseur.id } },
                banque: { connect: { id: banqueId } },
                chantier: { connect: { id: parseInt(chantier) } },
            }
        });

        res.redirect('/tresorerie/virements/banque/' + banqueId);

    } catch (error) {
        console.error("Erreur lors de la création du virement :", error);
        res.status(500).json({ error: "Erreur lors de la création du virement." });
    }
};


export const showUpdateVirement = async (req, res) => {
    const id = Number(req.params.id);
    const banqueId = Number(req.params.banqueId);
    

    // 1. Get the virement first
    const virement = await prisma.virement.findUnique({
        where: { id },
        include: { fournisseur: true, banque: true }

    });

    if (!virement) {
        return res.status(404).send("Virement non trouvé");
    }

    // 2. Now fetch fournisseur using virement.fournisseurId
    const fournisseur = await prisma.fournisseur.findUnique({
        where: { id: virement.fournisseurId }
    });

    // 3. Render the page with both
    res.render("dashboard/tresorerie/reglements/virements/update", {
        virement,
        banqueId,
        fournisseur
    });
};
export const updateVire = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { beneficiaire, date, dateReglement, montant, obs, rib, montantLettre, objet, cause, rtgs, srbm, instantane, chantier, banque } = req.body;

        // Validate IDs
        const findBanque = await prisma.banque.findFirst({
            where: { name: banque }
        });
        // Check if banque exists
        const banqueExists = await prisma.banque.findUnique({
            where: { id: findBanque.id }
        });
        if (!banqueExists) {
            return res.status(404).json({ error: "Banque non trouvée." });
        }

        // Fetch existing virement to preserve unchanged fields
        const existingVirement = await prisma.virement.findUnique({
            where: { id }
        });
        if (!existingVirement) {
            return res.status(404).json({ error: "Virement non trouvé." });
        }

        // Validate and convert date
        let formattedDate = existingVirement.date; // Preserve existing date if not provided
        if (date) {
            const parsedDate = new Date(date);
            if (isNaN(parsedDate)) {
                return res.status(400).json({ error: "Format de date invalide pour dateSaisie." });
            }
            formattedDate = parsedDate;
        }

        // Validate and convert dateReglement
        let formattedDateReglement = existingVirement.dateReglement; // Preserve existing dateReglement
        if (dateReglement) {
            const parsedDateReglement = new Date(dateReglement);
            if (isNaN(parsedDateReglement)) {
                return res.status(400).json({ error: "Format de date invalide pour dateReglement." });
            }
            formattedDateReglement = parsedDateReglement;
        } else if (dateReglement === null) {
            formattedDateReglement = null; // Allow explicit nulling of dateReglement
        }

        // Normalize boolean values, preserve existing if not provided
        const rtgsBoolean = rtgs !== undefined
            ? (Array.isArray(rtgs) ? rtgs.includes("1") || rtgs.includes("RTGS") || rtgs.includes(true) : rtgs === "1" || rtgs === "RTGS" || rtgs === true)
            : existingVirement.rtgs;

        const srbmBoolean = srbm !== undefined
            ? (Array.isArray(srbm) ? srbm.includes("1") || srbm.includes("SRBM") || srbm.includes(true) : srbm === "1" || srbm === "SRBM" || srbm === true)
            : existingVirement.srbm;

        const instantaneBoolean = instantane !== undefined
            ? (Array.isArray(instantane) ? instantane.includes("1") || instantane.includes("INSTANTANE") || instantane.includes(true) : instantane === "1" || instantane === "INSTANTANE" || instantane === true)
            : existingVirement.instantane;

        // Fournisseur logic
        let fournisseur = await prisma.fournisseur.findFirst({
            where: { name: beneficiaire }
        });

        if (fournisseur && rib && !fournisseur.rib) {
            await prisma.fournisseur.update({
                where: { id: fournisseur.id },
                data: { rib }
            });
        }

        if (!fournisseur && beneficiaire) {
            fournisseur = await prisma.fournisseur.create({
                data: {
                    name: beneficiaire,
                    ice: `ICE_${Date.now()}`,
                    identifFiscal: `FISCAL_${Date.now()}`,
                    telFournisseur: "Default",
                    contact: "Default",
                    telContact: "Default",
                    rib: rib || null
                }
            });
        }
        const randomChantier = await prisma.chantier.findMany();
        const randomChantierId = randomChantier[Math.floor(Math.random() * randomChantier.length)].id;
        // Prepare update data
        const updateData = {
            beneficiaire: beneficiaire || existingVirement.beneficiaire,
            date: formattedDate,
            dateReglement: formattedDateReglement,
            montant: montant ? parseFloat(montant) : existingVirement.montant,
            obs: obs !== undefined ? obs : existingVirement.obs,
            montantLettres: montantLettre !== undefined ? montantLettre : existingVirement.montantLettres,
            rtgs: rtgsBoolean,
            srbm: srbmBoolean,
            instantane: instantaneBoolean,
            objet: objet !== undefined ? objet : existingVirement.objet,
            cause: cause !== undefined ? cause : existingVirement.cause,
            banque: { connect: { id: findBanque.id } },
            chantier : { connect: { id: chantier ? parseInt(chantier) : parseInt(randomChantierId)} },
        };

        // Only connect fournisseur if it exists
        if (fournisseur) {
            updateData.fournisseur = { connect: { id: fournisseur.id } };
        }

        // Update virement
        const updatedVirement = await prisma.virement.update({
            where: { id },
            data: updateData
        });

        res.status(200).json({ 
            message: "Virement mis à jour avec succès.",
            virement: updatedVirement // Return updated data for frontend
        });
        console.log("Virement mis à jour avec succès.");
    } catch (error) {
        console.error("Erreur lors de la mise à jour du virement :", error);
        res.status(500).json({ error: `Erreur lors de la mise à jour du virement : ${error.message}` });
    }
};

export const showVirement = async(req , res) => {
    const banqueId = Number(req.params.id)
    const virements = await prisma.virement.findMany({
        where: { banqueId },
        include: { fournisseur: true, banque: true, chantier: true }
    })
    const chantiers = await prisma.chantier.findMany();
    res.render('dashboard/tresorerie/reglements/virements/index' , { virements , banqueId , chantiers } )
}


export const generateVirementPDF = async (req, res) => {
    const { id } = req.params;
    const virementId = parseInt(id, 10);

    if (isNaN(virementId)) return res.status(400).send("ID de virement invalide");

    try {
        const virement = await prisma.virement.findUnique({
            where: { id: virementId },
            include: { fournisseur: true, banque: true }
        });

        if (!virement) return res.status(404).send("Virement non trouvé");

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=virement_${virement.id}.pdf`);

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        doc.pipe(res);

        const pageHeight = 842;
        const footerHeight = 70;
        const footerY = 735; // 772
        const maxContentY = footerY - 30; // safe margin above footer

        // === HEADER ===
        const logoPath = path.join(__dirname, '../public/img/logo-4.png');
        doc.image(logoPath, 50, 20, { width: 100 });

        doc.font('Helvetica')
           .fontSize(10)
           .fillColor('#555555')
           .text(`CASABLANCA, ${new Date().toLocaleDateString('fr-FR')}`, 400, 100, { align: 'right' });

        const sentence = `A L'ATTENTION de monsieur le directeur de la banque \n${virement.banque.name} Agence ${virement.banque.agence}`;
        doc.font('Helvetica')
           .fontSize(10)
           .fillColor('#555555')
           .text(sentence.toUpperCase(), 350, 150, { align: 'left' });

        // === Objet + Intro ===
        doc.moveDown(4)
           .font('Helvetica-Bold')
           .fontSize(14)
           .fillColor('#1A4D99')
           .text(`Objet : ${virement.objet || 'N/A'} ${virement.rtgs ? 'RTGS' : ''} ${virement.srbm ? 'SRBM' : ''} ${virement.instantane ? 'Instantané' : ''}`, 50, doc.y, { width: 495, align: 'left' });

        doc.moveDown(1)
           .font('Helvetica')
           .fontSize(12)
           .fillColor('#333333')
           .text(virement.cause || '', { width: 495, align: 'justify' });

        doc.moveDown(1)
           .font('Helvetica')
           .fontSize(12)
           .fillColor('#333333')
           .text(
               `Monsieur,\n\nNous vous prions de bien vouloir débiter notre compte numéro ${virement.banque.rib || 'N/A'}, ouvert à votre agence au nom de notre société CONFONDA, pour effectuer le virement détaillé ci-après.`,
               { width: 495, align: 'justify', lineGap: 4 }
           );

        // === TABLE ===
        const details = [
            { title: 'Bénéficiaire', value: virement.beneficiaire || 'N/A' },
            { 
                title: 'Montant', 
                value: Number(virement.montant).toLocaleString('fr-FR', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                }).replace(/[\u00A0\u202F]/g, ' ') + ' DIRHAMS' 
              },            { title: 'Montant en lettres', value: virement.montantLettres ? virement.montantLettres  : 'N/A' },
            { title: 'Banque', value: virement.fournisseur?.banque || 'N/A' },
            { title: 'RIB', value: virement.fournisseur?.rib || 'N/A' },
            { title: 'Agence', value: virement.fournisseur?.agence || 'N/A' },
        ];
       

        doc.moveDown(2);
        let currentY = doc.y;
        const boxX = 50;
        const boxWidth = 495;
        const rowHeight = 30;

        details.forEach((item, i) => {
            if (currentY + rowHeight > maxContentY) return; // stop drawing table before footer

            const bgColor = i % 2 === 0 ? '#F2F2F2' : '#FFFFFF';
            doc.rect(boxX, currentY, boxWidth, rowHeight).fill(bgColor).stroke();

            doc.font('Helvetica-Bold').fontSize(11).fillColor('#1A4D99').text(item.title, boxX + 15, currentY + 8, { width: 180 });
            doc.font('Helvetica').fontSize(11).fillColor('#333333').text(item.value, boxX + 220, currentY + 8, { width: boxWidth - 240 });

            currentY += rowHeight;
        });

        // Table border
        doc.rect(boxX, doc.y - details.length * rowHeight, boxWidth, Math.min(details.length * rowHeight, maxContentY - doc.y + details.length * rowHeight))
           .strokeColor('#CCCCCC').lineWidth(1).stroke();

        // === FOOTER ===


// Draw footer background
doc.rect(0, footerY, 595, footerHeight).fill('#AB3029').stroke();

// Text margin from top of footer
const textMargin = 15;

// Add footer text
doc.font('Helvetica').fontSize(9).fillColor('#FFFFFF')
doc.text(
    '82, angle Bd abdelmoumen et rue Soumaya Imm.Shahrazad III 2ème étage Casablanca Tél : 0522-23-39-70',
    50,
    footerY + textMargin,
    { width: 495, align: 'center' }
);
doc.text(
    'Fax : 0522-23-42-60  Capital : 18 500 000.00 DH  CNSS : 7167788 - R.C. : 145619 – I.F. : 1602714 – Patente : 37900708- I.C.E : 001526422000063',
    50,
    footerY + textMargin + 15,
    { width: 495, align: 'center' }
);

doc.end();

    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la génération du PDF");
    }
};

export const suppliersList = async (req, res) => {
    const fournisseurs = await prisma.fournisseur.findMany();
    res.json(fournisseurs);
};
export const deleteVirement = async (req, res) => {
    const id = Number(req.params.id);
    await prisma.virement.delete({
        where: { id }
    });
    res.status(200).json({ message: "Virement supprimé avec succès" });
}


export const listBanquesVirements = async (req, res) => {
    const banques = await prisma.banque.findMany();

    res.render('dashboard/tresorerie/reglements/virements/banques', {banques});
}
