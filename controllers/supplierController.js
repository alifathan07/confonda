import multer from 'multer';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import prisma from '../db.js';
export const upload = multer({
    dest: 'uploads/',
    fileFilter: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (ext !== '.xlsx') {
        return cb(new Error('Only .xlsx files are allowed'), false);
      }
      cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
  });
export const importExel = async(req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded.');
  
    const workbook = new ExcelJS.Workbook();
    const filePath = req.file.path;
  
    try {
      await workbook.xlsx.readFile(filePath);
      const worksheet = workbook.getWorksheet(1);
  
      const suppliers = [];
      const validationIssues = [];
  
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // skip header
  
        const [
          nameRaw, emailRaw, addressRaw, phoneRaw,
          contactRaw, contactphoneRaw, iceRaw, idFRaw
        ] = Array.from({ length: 8 }, (_, i) => row.getCell(i + 1).text.trim());
  
        // Normalize missing values to null
        const name = nameRaw || null;
        const email = emailRaw || null;
        const address = addressRaw || null;
        const phone = phoneRaw || null;
        const contact = contactRaw || null;
        const contactphone = contactphoneRaw || null;
        const ice = iceRaw || null;
        const idF = idFRaw || null;
  
        // Validate required fields
        if (!name) validationIssues.push({ row: rowNumber, field: 'name', issue: 'Missing name' });
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) validationIssues.push({ row: rowNumber, field: 'email', issue: 'Invalid email' });
  
        if (!ice) {
          validationIssues.push({ row: rowNumber, field: 'ice', issue: 'Missing ICE' });
        } else if (!/^[A-Za-z0-9]{5,}$/.test(ice) || ['0', '123', '55'].includes(ice)) {
          validationIssues.push({ row: rowNumber, field: 'ice', issue: 'Invalid ICE' });
        }
  
        if (!idF) validationIssues.push({ row: rowNumber, field: 'identifFiscal', issue: 'Missing identifFiscal' });
  
        suppliers.push({ name, email, address, phone, contact, contactphone, ice, idF, rowNumber });
      });
  
      // Filter suppliers with valid ICE for DB upsert (required for uniqueness)
      const validSuppliers = suppliers.filter(s => s.ice && /^[A-Za-z0-9]{5,}$/.test(s.ice) && !['0', '123', '55'].includes(s.ice));
  
      // Remove duplicates by ICE, keep first occurrence
      const uniqueSuppliers = Array.from(
        new Map(validSuppliers.map(s => [s.ice, s])).values()
      );
  
      for (const supplier of uniqueSuppliers) {
        try {
          await prisma.fournisseur.upsert({
            where: { ice: supplier.ice },
            update: {
              name: supplier.name,
              email: supplier.email,
              address: supplier.address,
              identifFiscal: supplier.idF,
              telFournisseur: supplier.phone,
              contact: supplier.contact,
              telContact: supplier.contactphone,
            },
            create: {
              name: supplier.name,
              email: supplier.email,
              address: supplier.address,
              ice: supplier.ice,
              identifFiscal: supplier.idF,
              telFournisseur: supplier.phone,
              contact: supplier.contact,
              telContact: supplier.contactphone,
            }
          });
        } catch (e) {
          console.warn(`Error inserting supplier ICE ${supplier.ice} at row ${supplier.rowNumber}:`, e);
        }
      }
  
      res.send({
        message: 'Suppliers uploaded with validation report.',
        totalRows: suppliers.length,
        insertedSuppliers: uniqueSuppliers.length,
        validationIssues,
      });
      console.log({
        message: 'Suppliers uploaded with validation report.',
        totalRows: suppliers.length,
        insertedSuppliers: uniqueSuppliers.length,
        validationIssues,
      })
  
    } catch (error) {
      console.error('Error processing Excel:', error);
      res.status(500).send('Failed to process Excel file.');
    } finally {
      fs.unlink(filePath, err => {
        if (err) console.error('Failed to delete temp file:', err);
      });
    }
  }
export const create = async (req, res) => {
  try {
    const { name, email, address,  phone, contact, contactphone, ice, idF, rib } = req.body;
    const supplier = await prisma.fournisseur.create({
      data: {
        name : name,
        email : email,
        address : address,
        ice : ice,
        identifFiscal: idF,
        telFournisseur: phone,
        contact,
        telContact: contactphone,
        rib : rib
      },
    });
   

    res.status(201).json(supplier);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la création du fournisseur.' });
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, address, phone, contact, contactphone, ice, idF, rib } = req.body;
    const supplier = await prisma.fournisseur.update({
      where: { id: Number(id) },
      data: {
        name,
        email,
        address,
        ice,
        identifFiscal: idF,
        telFournisseur: phone,
        contact,
        telContact: contactphone,
        rib,
      },
    });
    res.status(200).json(supplier);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la modification du fournisseur.' });
  }
};
export const show = async (req, res) => {
  try {
    const suppliers = await prisma.fournisseur.findMany({
      orderBy: {
        name: 'asc' // ou 'createdAt': 'desc' si tu as ce champ
      }
    });
    res.render("dashboard/achats/fournisseurs/index", { suppliers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la récupération des fournisseurs.' });
  }
};

export const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.fournisseur.delete({ where: { id: Number(id) } });
    res.status(200).json({ message: 'Fournisseur supprimé avec succès.' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Fournisseur non trouvé.' });
    }
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la suppression du fournisseur.' });
  }
};
export const atess =  async (req, res) => {
  const { id } = req.params;
  // Create a new attestation for the supplier with id
  // Example: set today's date and valid for 180 days
  try {
    const today = new Date();
    const dateValidite = new Date(today);
    dateValidite.setDate(today.getDate() + 180);
    await prisma.attestation.create({
      data: {
        fournisseurId: Number(id),
        date: today,
        dateValidite,
        status: 'pending', // or 'valide'
        demandeEnvoyee: true
      }
    });
    res.status(200).json({ success: true });
  } catch (e) {
    res.status(400).json({ error: 'Erreur lors de la création de l\'attestation.' });
  }
}