import prisma from "../db.js"
import PDFDocument from "pdfkit";
import fs from "fs";
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const index = async(req , res) => {
    const banqueId = req.params.banqueId;
    const virements  = await prisma.virement.findMany({
        include: { fournisseur: true, banque: true },
        where: { banqueId: Number(banqueId) }
    });

    res.render('dashboard/tresorerie/reglements/virements/index' , { virements, banqueId  } )
}

export const createVirement = async(req , res) => {
    const fournisseurs = await prisma.fournisseur.findMany()
    const banqueId = Number(req.params.id)
    
    res.render('dashboard/tresorerie/reglements/virements/create' , { fournisseurs , banqueId, rtgs: false } )
}
export const postVirement = async (req, res) => {
    try {
        const { beneficiaire, date, dateReglement, montant, obs, rib, montantLettre, objet, cause } = req.body;
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

        // ✅ normalize rtgs value here
        let rtgsValue = req.body.rtgs;
        let rtgs = false;

        if (Array.isArray(rtgsValue)) {
            rtgs = rtgsValue.includes("1");
        } else {
            rtgs = rtgsValue === "1";
        }

        // fournisseur logic
        const fournisseurName = beneficiaire;
        let fournisseur = await prisma.fournisseur.findFirst({
            where: { name: fournisseurName }
        });

        if (fournisseur && !fournisseur.ice) {
            await prisma.fournisseur.update({
                where: { id: fournisseur.id },
                data: { rib: rib }
            });
        }

        if (!fournisseur) {
            fournisseur = await prisma.fournisseur.create({
                data: {
                    name: beneficiaire,
                    ice: `ICE_${Date.now()}`,
                    identifFiscal: `FISCAL_${Date.now()}`,
                    telFournisseur: 'Default',
                    contact: 'Default',
                    telContact: 'Default',
                    rib: rib
                }
            });
        }

        // create virement
        const virement = await prisma.virement.create({
            data: {
                beneficiaire,
                date: new Date(date),
                dateReglement: dateReglement ? new Date(dateReglement) : null,
                montant: parseFloat(montant),
                obs,
                montantLettres: montantLettre,
                rtgs, // ✅ boolean here
                objet,
                cause,
                fournisseur: { connect: { id: fournisseur.id } },
                banque: { connect: { id: banqueId } }
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
        where: { id }
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
        const banqueId = Number(req.params.banqueId);
        const { beneficiaire, date, dateReglement, montant, obs, rib, montantLettre, objet, cause, rtgs } = req.body;

        // Validate IDs
        if (isNaN(banqueId) || isNaN(id)) {
            return res.status(400).json({ error: "ID invalide." });
        }

        // Check if banque exists
        const banqueExists = await prisma.banque.findUnique({
            where: { id: banqueId }
        });
        if (!banqueExists) {
            return res.status(404).json({ error: "Banque non trouvée." });
        }

        // Normalize rtgs value
        let rtgsValue = rtgs;
        let rtgsBoolean = false;

        if (Array.isArray(rtgsValue)) {
            rtgsBoolean = rtgsValue.includes("1") || rtgsValue.includes("RTGS") || rtgsValue.includes(true);
        } else {
            rtgsBoolean = rtgsValue === "1" || rtgsValue === "RTGS" || rtgsValue === true;
        }

        // Fournisseur logic
        let fournisseur = await prisma.fournisseur.findFirst({
            where: { name: beneficiaire }
        });

        if (fournisseur && !fournisseur.ice) {
            await prisma.fournisseur.update({
                where: { id: fournisseur.id },
                data: { rib }
            });
        }

        if (!fournisseur) {
            fournisseur = await prisma.fournisseur.create({
                data: {
                    name: beneficiaire,
                    ice: `ICE_${Date.now()}`,
                    identifFiscal: `FISCAL_${Date.now()}`,
                    telFournisseur: "Default",
                    contact: "Default",
                    telContact: "Default",
                    rib
                }
            });
        }

        // Update virement
        const updatedVirement = await prisma.virement.update({
            where: { id },
            data: {
                beneficiaire,
                date: new Date(date),
                dateReglement: dateReglement ? new Date(dateReglement) : null,
                montant: parseFloat(montant),
                obs,
                montantLettres: montantLettre, // Use montantLettre from form
                rtgs: rtgsBoolean,
                objet,
                cause,
                fournisseur: { connect: { id: fournisseur.id } },
                banque: { connect: { id: banqueId } }
            }
        });

        res.status(200).json({ message: "Virement mis à jour avec succès." });
    } catch (error) {
        console.error("Erreur lors de la mise à jour du virement :", error);
        res.status(500).json({ error: "Erreur lors de la mise à jour du virement." });
    }
};


export const showVirement = async(req , res) => {
    const banqueId = Number(req.params.id)
    const virements = await prisma.virement.findMany({
        where: { banqueId },
        include: { fournisseur: true, banque: true }
    })
    res.render('dashboard/tresorerie/reglements/virements/index' , { virements , banqueId } )
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

        // Page dimensions: A4 = 595pt width, 842pt height; usable area after 50pt margins = 495pt width, 742pt height
        const maxY = 742; // Usable height
        const sentence = `A L'ATTENTION de monsieur le directeur de la banque \n` + virement.banque.name + ` Agence ` + virement.banque.agence
        // ===== WATERMARK =====
        doc.save()
           .opacity(0.05)
           .fontSize(60)
           .fillColor('#000000')
           .rotate(-45)
           .text('Company XYZ', 150, 200, { align: 'center' }) // Moved up from 400 to 200
           .restore();

        // ===== HEADER =====
        const logoPath = path.join(__dirname, '../public/img/logo-4.png');
        doc.image(logoPath, 50, 20, { width: 100 }); // Adjusted y from 30 to 20

       
        doc.font('Helvetica')
           .fontSize(10)
           .fillColor('#555555')
           .text(`CASABLANCA, ${new Date().toLocaleDateString('fr-FR')}`, 400, 100, { align: 'right' }) // Moved up from 30 to 20
        
        doc.font('Helvetica')
           .fontSize(10)
           .fillColor('#555555')
           .text(sentence.toUpperCase(), 350, 150, { align: 'left' }) // Moved up from 30 to 20
        
       
        // Modernized "Objet" and Intro Section
        doc.moveDown(4)
           .font('Helvetica-Bold')
           .fontSize(14)
           .fillColor('#1A4D99')
           .text(`Objet : ${virement.objet || 'N/A'} ${virement.rtgs ? 'RTGS' : ''}`, 50, doc.y, { width: 495, align: 'left' });
        doc.moveDown(1)
            .font('Helvetica')
            .fontSize(12)
            .fillColor('#333333')
            .text(virement.cause)

        doc.moveDown(1)
           .font('Helvetica')
           .fontSize(12)
           .fillColor('#333333')
           .text(
               `Monsieur,\n\nNous vous prions de bien vouloir débiter notre compte numéro ${virement.banque.rib || 'N/A'}, ouvert à votre agence au nom de notre société CONFONDA, pour effectuer le virement détaillé ci-après.`,
               50,
               doc.y,
               { width: 495, align: 'justify', lineGap: 4 }
           );

        // ===== VIREMENT DETAILS TABLE =====
        doc.moveDown(3); // Increased from 2
        let startY = doc.y;
        const boxX = 50;
        const boxWidth = 495; // Adjusted to fit within margins (595 - 50 - 50)
        const rowHeight = 30;
        const headerHeight = 35;
        function parseFrenchNumber(value) {
            if (!value) return 0;
          
            // Remove spaces and replace comma with dot
            const cleanValue = value.toString().replace(/\s/g, '').replace(',', '.');
            const numValue = parseFloat(cleanValue);
            return isNaN(numValue) ? 0 : numValue;
          }
          
          const details = [
            { title: 'Bénéficiaire', value: virement.beneficiaire || 'N/A' },
          
            {
              title: 'Montant',
              value: virement.montant
                ? parseFrenchNumber(virement.montant) // 👈 ensure parsing works even if string
                    .toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    .replace(/\u202F/g, ' ') // replace thin non-breaking space
                    .replace(/\u00A0/g, ' ') // replace non-breaking space
                    + " dirhams"
                : 'N/A'
            },
          
            { title: 'Montant en lettres', value: virement.montantLettres ? virement.montantLettres + ' dirhams' : 'N/A' },
            { title: 'Banque', value: virement.banque?.name || 'N/A' },
            { title: 'RIB', value: virement.fournisseur?.rib || 'N/A' },
            { title: 'Agence', value: virement.banque?.agence || 'N/A' },
          ];
          
        // Check if table fits on page
        if (startY + headerHeight + details.length * rowHeight > maxY - 100) {
            doc.addPage();
            startY = 50;
        }

        // Table Header
        let currentY = startY;

        // Table Rows
        details.forEach((item, i) => {
            const bgColor = i % 2 === 0 ? '#F2F2F2' : '#FFFFFF';

            doc.rect(boxX, currentY, boxWidth, rowHeight)
               .fill(bgColor)
               .stroke();

            doc.font('Helvetica-Bold')
               .fontSize(11)
               .fillColor('#1A4D99')
               .text(item.title, boxX + 15, currentY + 8, { width: 180 });

            doc.font('Helvetica')
               .fontSize(11)
               .fillColor('#333333')
               .text(item.value, boxX + 220, currentY + 8, { width: boxWidth - 240 });

            currentY += rowHeight;
        });

        // Border around table
        doc.rect(boxX, startY, boxWidth, details.length * rowHeight)
           .strokeColor('#CCCCCC')
           .lineWidth(1)
           .stroke();

        // ===== OBSERVATIONS =====
        

        // ===== FOOTER =====
        let footerY = 745; // Lowered from 750 to ensure fit
        if (doc.y > footerY - 50) { // Ensure footer doesn't overlap content
            doc.addPage();
            footerY = 50;
        }
        doc.rect(0, footerY, 690, 90)
           .fill('#AB3029')
           .stroke();

        doc.font('Helvetica')
           .fontSize(9)
           .fillColor('#FFFFFF')
           .text(
               'Company XYZ - 123 Rue Fictive, Casablanca, Maroc',
               50,
               footerY + 20,
               { align: 'center', width: 495 }
           )
           .text(
               'Tél: +212 5 22 33 44 55 | Email: info@companyxyz.com | www.companyxyz.com',
               50,
               footerY + 35,
               { align: 'center', width: 495 }
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
    const banqueId = Number(req.params.banqueId);
    await prisma.virement.delete({
        where: { id }
    });
    res.status(200).json({ message: "Virement supprimé avec succès" });
}


