import prisma from "../db.js"
import PDFDocument from "pdfkit";
import fs from "fs";
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const indexDis = async(req , res) => {
    const banqueId = req.params.banqueId;
    const miseadis  = await prisma.miseadis.findMany({
        orderBy: { id: 'desc' },
        include: {  banque: true, chantier : true, allocations: { include: { chantier: true } } },
    });
    const chantiers = await prisma.chantier.findMany()
    const banques = await prisma.banque.findMany();
    const miseadisWithSplit = (miseadis || []).map((m) => {
        const allocs = Array.isArray(m.allocations) ? m.allocations : [];

        const chantierLines = (() => {
            const map = new Map();
            for (const a of allocs) {
                const nom = (a && a.chantier && a.chantier.nom) ? String(a.chantier.nom).trim() : '';
                if (!nom) continue;
                const prev = map.get(nom) || 0;
                map.set(nom, prev + Number(a.montant || 0));
            }
            const lines = Array.from(map.entries()).map(([nom, montant]) => ({ nom, montant }));
            if (lines.length) return lines;
            if (m.chantier?.nom) {
                return [{ nom: m.chantier.nom, montant: Number(m.montant || 0) }];
            }
            return [];
        })();

        const chantierNames = (() => {
            const names = allocs
                .map(a => (a && a.chantier && a.chantier.nom) ? String(a.chantier.nom).trim() : '')
                .filter(Boolean);
            if (names.length) return Array.from(new Set(names));
            if (m.chantier?.nom) return [String(m.chantier.nom)];
            return [];
        })();

        return { ...m, chantierLines, chantierNames };
    });

    res.render('dashboard/tresorerie/reglements/miseadis/index' , { miseadis: miseadisWithSplit, chantiers, banques } )
}

export const createMiseadis = async(req , res) => {
    const fournisseurs = await prisma.fournisseur.findMany()
    const banqueId = Number(req.params.id)
    const chantiers = await prisma.chantier.findMany()
    
    res.render('dashboard/tresorerie/reglements/miseadis/create' , { fournisseurs , banqueId, rtgs: false, chantiers } )
}
export const postMiseadis = async (req, res) => {
    try {
        const { beneficiaire, date, dateReglement, montant, obs, montantLettre, cin, objet, chantier, allocations } = req.body;
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

        let parsedAllocations = [];
        try {
            parsedAllocations = allocations ? JSON.parse(allocations) : [];
        } catch (e) {
            return res.status(400).json({ error: "Format allocations invalide" });
        }

        const chantierIdParam = chantier ? parseInt(chantier) : null;
        let chantierData = {};
        if (!isNaN(chantierIdParam) && chantierIdParam !== null) {
            chantierData = { connect: { id: chantierIdParam } };
        }

        const miseadis = await prisma.miseadis.create({
            data: {
                beneficiaire,
                date: new Date(date),
                dateReglement: dateReglement ? new Date(dateReglement) : null,
                montant: parseFloat(montant),
                obs,
                objet : objet,
                montantLettres: montantLettre,
                cin : cin,
                ...(chantierData.connect ? { chantier: chantierData } : {}),
                banque: { connect: { id: banqueId } }

            }
        });

        if (Array.isArray(parsedAllocations) && parsedAllocations.length > 0) {
            for (const alloc of parsedAllocations) {
                if (alloc.chantierId && alloc.amount) {
                    await prisma.miseADispositionAllocation.create({
                        data: {
                            miseadisId: miseadis.id,
                            chantierId: parseInt(alloc.chantierId),
                            montant: parseFloat(alloc.amount),
                        },
                    });
                }
            }
        }

        res.redirect('/tresorerie/miseadis');

    } catch (error) {
        console.error("Erreur lors de la création du virement :", error);
        res.status(500).json({ error: "Erreur lors de la création du virement." });
    }
};


export const showUpdateMiseadis = async (req, res) => {
    const id = Number(req.params.id);
    const banqueId = Number(req.params.banqueId);
    

    const miseadis = await prisma.miseadis.findUnique({
        where: { id },
        include: { chantier: true, allocations: { include: { chantier: true } } }
    });

    const chantiers = await prisma.chantier.findMany();

    if (!miseadis) {
        return res.status(404).send("Miseadis non trouvé");
    }

    // 2. Now fetch fournisseur using virement.fournisseurId
    

    // 3. Render the page with both
    res.render("dashboard/tresorerie/reglements/miseadis/update", {
        miseadis,
        banqueId,
        chantiers,
        
    });
    console.log(miseadis);
};

export const updateMis = async (req, res) => {
    const id = Number(req.params.id);

    

    const wantsJson = (req.headers['content-type'] || '').includes('application/json');

    // Extract form fields
    const { beneficiaire, date, dateReglement, montant, obs, rib, objet, cin, chantier, banque, allocations } = req.body;

    let banqueId = null;
    if (banque) {
        const findBanque = await prisma.banque.findFirst({
            where: { name: banque }
        });
        banqueId = findBanque?.id || null;
    }


    // ✅ Update virement
    let parsedAllocations = [];
    try {
        parsedAllocations = allocations ? JSON.parse(allocations) : [];
    } catch (e) {
        if (allocations) {
            return res.status(400).json({ error: "Format allocations invalide" });
        }
    }

    const chantierIdParam = chantier ? parseInt(chantier) : null;
    let chantierData = {};
    if (!isNaN(chantierIdParam) && chantierIdParam !== null) {
        chantierData = { connect: { id: chantierIdParam } };
    }

    const updateData = {};
    if (beneficiaire !== undefined) updateData.beneficiaire = beneficiaire;
    if (obs !== undefined) updateData.obs = obs;
    if (cin !== undefined) updateData.cin = cin;
    if (objet !== undefined) updateData.objet = objet;
    if (montant !== undefined && montant !== null && montant !== '') updateData.montant = parseFloat(montant);

    if (date !== undefined && date !== null && date !== '') updateData.date = new Date(date);
    if (dateReglement !== undefined && dateReglement !== null && dateReglement !== '') {
        updateData.dateReglement = new Date(dateReglement);
    }

    if (chantier !== undefined) {
        if (chantierData.connect) updateData.chantier = chantierData;
        else updateData.chantier = { disconnect: true };
    }

    if (banqueId) {
        updateData.banque = { connect: { id: banqueId } };
    }

    const updatedMiseadis = await prisma.miseadis.update({
        where: { id },
        data: updateData
    });

    if (Array.isArray(parsedAllocations) && parsedAllocations.length > 0) {
        await prisma.miseADispositionAllocation.deleteMany({ where: { miseadisId: id } });
        for (const alloc of parsedAllocations) {
            if (alloc.chantierId && alloc.amount) {
                await prisma.miseADispositionAllocation.create({
                    data: {
                        miseadisId: id,
                        chantierId: parseInt(alloc.chantierId),
                        montant: parseFloat(alloc.amount),
                    },
                });
            }
        }
    }

    if (wantsJson) {
        const miseadispo = await prisma.miseadis.findUnique({
            where: { id },
            include: { banque: true, chantier: true, allocations: { include: { chantier: true } } },
        });
        return res.json({ message: 'Miseadis mise à jour', miseadispo });
    }

    res.redirect(`/tresorerie/miseadis`); // ✅ redirect to list
};


export const showMiseadis = async(req , res) => {
    const banqueId = Number(req.params.id)
    const miseadis = await prisma.miseadis.findMany({
        where: { banqueId },
        include: { banque: true, chantier: true, allocations: { include: { chantier: true } } }
    })
    const chantiers = await prisma.chantier.findMany()
    const banques = await prisma.banque.findMany();
    const miseadisWithSplit = (miseadis || []).map((m) => {
        const allocs = Array.isArray(m.allocations) ? m.allocations : [];

        const chantierLines = (() => {
            const map = new Map();
            for (const a of allocs) {
                const nom = (a && a.chantier && a.chantier.nom) ? String(a.chantier.nom).trim() : '';
                if (!nom) continue;
                const prev = map.get(nom) || 0;
                map.set(nom, prev + Number(a.montant || 0));
            }
            const lines = Array.from(map.entries()).map(([nom, montant]) => ({ nom, montant }));
            if (lines.length) return lines;
            if (m.chantier?.nom) {
                return [{ nom: m.chantier.nom, montant: Number(m.montant || 0) }];
            }
            return [];
        })();

        const chantierNames = (() => {
            const names = allocs
                .map(a => (a && a.chantier && a.chantier.nom) ? String(a.chantier.nom).trim() : '')
                .filter(Boolean);
            if (names.length) return Array.from(new Set(names));
            if (m.chantier?.nom) return [String(m.chantier.nom)];
            return [];
        })();

        return { ...m, chantierLines, chantierNames };
    });

    res.render('dashboard/tresorerie/reglements/miseadis/index' , { miseadis: miseadisWithSplit , banqueId, chantiers, banques } )
}


export const generateMiseadisPDF = async (req, res) => {
    const { id } = req.params;
    const miseadisId = parseInt(id, 10);

    if (isNaN(miseadisId)) return res.status(400).send("ID de miseadis invalide");

    try {
        const miseadis = await prisma.miseadis.findUnique({
            where: { id: miseadisId },
            include: { banque: true }
        });

        if (!miseadis) return res.status(404).send("Miseadis non trouvé");

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=miseadis_${miseadis.id}.pdf`
        );
        const doc = new PDFDocument({ margin: 50, size: "A4" });
        doc.pipe(res);

        const maxY = 742;

        // ===== WATERMARK =====
        doc.save()
            .opacity(0.05)
            .fontSize(60)
            .fillColor("#000000")
            .rotate(-45)
            .text("", 150, 200, { align: "center" })
            .restore();

        // ===== HEADER =====
        const logoPath = path.join(__dirname, "../public/img/logo-4.png");
        doc.image(logoPath, 50, 20, { width: 100 });

        doc.font("Helvetica")
            .fontSize(10)
            .fillColor("#555555")
            .text(
                `CASABLANCA LE , ${new Date().toLocaleDateString("fr-FR")}`,
                400,
                100,
                { align: "right" }
            );
                    const senetence = `A L'ATTENTION  DE MONSIEUR LE directeur de la Banque ${miseadis.banque?.name || "N/A"} - \n\Agence ${miseadis.banque?.agence || "N/A"}`

        doc.font("Helvetica")
   .fontSize(10)
   .fillColor("#555555")
   .text(senetence.toUpperCase(), 400, 120, { align: "left" });


        // ===== OBJET + MAIN TEXT =====
        doc.moveDown(4)
            .font("Helvetica-Bold")
            .fontSize(14)
            .fillColor("#1A4D99")
            .text(`Objet : ${miseadis.objet || "N/A"}`, 50, doc.y, {
                width: 495,
                align: "left"
            });

       doc.moveDown(1)
   .font("Helvetica")
   .fontSize(12)
   .fillColor("#333333")
   .text(
       `Monsieur,

Nous avons l'honneur de vous demander de bien vouloir mettre à la disposition de Monsieur ${miseadis.beneficiaire || "N/A"}, CIN N° ${miseadis.cin || "N/A"}, la somme de ${miseadis.montant ?miseadis.montant.toLocaleString('fr-FR', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }).replace(/[\u00A0\u202F]/g, ' ') + " MAD" : "N/A"} (${miseadis.montantLettres || "N/A"}), en débitant notre compte N° ${miseadis.banque?.rib || "N/A"} ouvert à votre agence au nom de notre société.

Veuillez agréer, Monsieur, l'expression de nos salutations distinguées.`,
       50,
       doc.y,
       { width: 495, align: "justify", lineGap: 6 }
   );


        // ===== OBSERVATIONS =====
        if (miseadis.obs && typeof miseadis.obs === "string" && miseadis.obs.trim()) {
            doc.moveDown(3);
            let obsY = doc.y;
            if (obsY + 50 > maxY - 100) {
                doc.addPage();
                obsY = 50;
            }
            doc.font("Helvetica-Bold")
                     
        }

        // ===== FOOTER =====
         // ===== FOOTER =====     const pageHeight = 842;
        const footerHeight = 70;
        const footerY = 735; // 772
        const maxContentY = footerY - 30; // safe margin above footer

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

export const deleteMiseadis = async (req, res) => {
    const id = Number(req.params.id);
    await prisma.miseadis.delete({
        where: { id }
    });
    res.status(200).json({ message: "Miseadis supprimé avec succès" });
}



export const listBanquesMiseadis = async (req, res) => {
    const banques = await prisma.banque.findMany();

    res.render('dashboard/tresorerie/reglements/miseadis/banques', {banques});
}














