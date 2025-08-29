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
        const { beneficiaire, date, dateReglement, montant, obs, rib, montantLettre, objet } = req.body;
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
                data: { rib: Number(rib) }
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
                    rib: Number(rib)
                }
            });
        }

        // create virement
        const virement = await prisma.virement.create({
            data: {
                beneficiaire,
                date: new Date(date),
                dateReglement: new Date(dateReglement),
                montant: parseFloat(montant),
                obs,
                montantLettres: montantLettre,
                rtgs, // ✅ boolean here
                objet,
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
    const id = Number(req.params.id);
    const banqueId = Number(req.params.banqueId);

    if (isNaN(banqueId) || isNaN(id)) {
        return res.status(400).json({ error: "ID invalide." });
    }

    // Extract form fields
    const { beneficiaire, date, dateReglement, montant, obs, rib, objet } = req.body;
    let rtgs = req.body.rtgs === "RTGS"; // checkbox

    // ✅ Update fournisseur (if exists or create new)
    let fournisseur = await prisma.fournisseur.findFirst({
        where: { name: beneficiaire }
    });

    if (fournisseur) {
        await prisma.fournisseur.update({
            where: { id: fournisseur.id },
            data: { rib }
        });
    } else {
        fournisseur = await prisma.fournisseur.create({
            data: {
                name: beneficiaire,
                ice: `ICE_${Date.now()}`,
                identifFiscal: `FISCAL_${Date.now()}`,
                telFournisseur: "Default",
                contact: "Default",
                telContact: "Default",
                rib,
                banque: { connect: { id: banqueId } }
            }
        });
    }

    // ✅ Update virement
    const updatedVirement = await prisma.virement.update({
        where: { id },
        data: {
            beneficiaire,
            date: new Date(date),
            dateReglement: new Date(dateReglement),
            montant: parseFloat(montant),
            obs,
            rtgs,
            objet,
            fournisseur: { connect: { id: fournisseur.id } },
            banque: { connect: { id: banqueId } }
        }
    });

    res.redirect(`/tresorerie/virements/banque/${banqueId}`); // ✅ redirect to list
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
           .text(`CASABLANCA, ${new Date().toLocaleDateString('fr-FR')}`, 400, 20, { align: 'right' }) // Moved up from 30 to 20
        
        doc.font('Helvetica')
           .fontSize(10)
           .fillColor('#555555')
           .text(`A latestation de monsieur le directeur de ` + virement.banque.name + ` Agence ` + virement.banque.agence , 400, 50, { align: 'right' }) // Moved up from 30 to 20
        
       
        // Modernized "Objet" and Intro Section
        doc.moveDown(4)
           .font('Helvetica-Bold')
           .fontSize(14)
           .fillColor('#1A4D99')
           .text(`Objet : ${virement.objet || 'N/A'}`, 50, doc.y, { width: 495, align: 'left' });

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

        const details = [
            { title: 'Montant', value: `${(virement.montant || 0).toFixed(2)} MAD` },
            { title: 'Montant en lettres', value: virement.montantLettres || 'N/A' },
            { title: 'Bénéficiaire', value: virement.beneficiaire || 'N/A' },
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
        doc.rect(boxX, startY, boxWidth, headerHeight)
           .fill('#1A4D99')
           .stroke();

        doc.font('Helvetica-Bold')
           .fontSize(12)
           .fillColor('#FFFFFF')
           .text('Détails', boxX + 15, startY + 10, { width: 180 });

        doc.font('Helvetica-Bold')
           .fontSize(12)
           .fillColor('#FFFFFF')
           .text('Information', boxX + 220, startY + 10, { width: boxWidth - 240 });

        let currentY = startY + headerHeight;

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
        doc.rect(boxX, startY, boxWidth, headerHeight + details.length * rowHeight)
           .strokeColor('#CCCCCC')
           .lineWidth(1)
           .stroke();

        // ===== OBSERVATIONS =====
        if (virement.obs && typeof virement.obs === 'string' && virement.obs.trim()) {
            doc.moveDown(3); // Increased from 2
            let obsY = doc.y;
            // Check if observations fit on page
            if (obsY + 50 > maxY - 100) { // Reserve space for footer
                doc.addPage();
                obsY = 50;
            }
            doc.font('Helvetica-Bold')
               .fontSize(12)
               .fillColor('#1A4D99')
               .text('Observations', 50, obsY, { underline: true })
               .moveDown(0.5);
            doc.font('Helvetica')
               .fontSize(11)
               .fillColor('#333333')
               .text(virement.obs.trim(), 50, doc.y, { width: 495, align: 'left' });
        }

        // ===== FOOTER =====
        let footerY = 700; // Lowered from 750 to ensure fit
        if (doc.y > footerY - 50) { // Ensure footer doesn't overlap content
            doc.addPage();
            footerY = 50;
        }
        doc.rect(0, footerY, 595, 90)
           .fill('#F2F2F2')
           .stroke();

        doc.font('Helvetica')
           .fontSize(9)
           .fillColor('#555555')
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