import prisma from "../db.js";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import ExcelJS from "exceljs";
import multer from "multer";
import { fileURLToPath } from 'url';
import { error } from "console";


export const getListFourniture = async (req, res) => {
    try {
        const listfourniture = await prisma.fourniture_list.findMany();
        res.json({ listfourniture });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la récupération des fournitures" });
    }
}