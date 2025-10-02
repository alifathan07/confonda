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
        }
    })
    const chantiers  = await prisma.chantier.findMany()
    res.render('dashboard/achats/caisse/demande/index' , { demande , chantiers } )
}


