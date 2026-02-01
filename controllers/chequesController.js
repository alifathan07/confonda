import prisma from "../db.js";
import multer from 'multer';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';


// Multer upload setup
export const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.xlsx') return cb(new Error('Only .xlsx files are allowed'), false);
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// DATE PARSER: Handles format DD/MM/YYYY
// const parseDate = (value) => {
//   if (!value) return null;

//   if (value instanceof Date) {
//     return isNaN(value.getTime()) ? null : value;
//   }

//   if (typeof value === 'number') {
//     // Excel stores dates as number of days since 1900-01-01 (day 1 is 1899-12-31)
//     // Convert Excel date serial number to JS Date:
//     return new Date(Math.round((value - 25569) * 86400 * 1000));
//   }

//   if (typeof value === 'string') {
//     const parts = value.trim().split('/');
//     if (parts.length !== 3) return null;

//     const [day, month, year] = parts.map(p => parseInt(p, 10));
//     if (!day || !month || !year) return null;

//     // create date with 0-based month index
//     const date = new Date(year, month - 1, day);
//     return isNaN(date.getTime()) ? null : date;
//   }

//   return null;
// };



function excelDateToJSDate(serial) {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);

  const fractional_day = serial - Math.floor(serial) + 0.0000001;

  let total_seconds = Math.floor(86400 * fractional_day);

  const seconds = total_seconds % 60;
  total_seconds -= seconds;

  const hours = Math.floor(total_seconds / 3600);
  const minutes = Math.floor((total_seconds % 3600) / 60);

  date_info.setHours(hours);
  date_info.setMinutes(minutes);
  date_info.setSeconds(seconds);

  return date_info;
}

// Parse Excel cell value to JS Date or null
const parseExcelDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'number') return excelDateToJSDate(value);
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

export const importExelCheques = async (req, res) => {
  console.log('🚀 Starting Excel import for cheques...');

  if (!req.file) {
    console.error('❌ No file uploaded');
    return res.status(400).send('No file uploaded.');
  }

  console.log(`📁 File received: ${req.file.originalname} (${req.file.size} bytes)`);
  const filePath = req.file.path;
  const workbook = new ExcelJS.Workbook();

  try {
    console.log('📖 Reading Excel file...');
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0]; // index 0 for first sheet in array


    if (!worksheet) {
      console.error('❌ No worksheet found in Excel file');
      return res.status(400).send('No worksheet found in Excel file.');
    }

    console.log(`📊 Worksheet found: ${worksheet.name} with ${worksheet.rowCount} rows`);

    // Find header row and map columns
    let headerRow = null;
    let columnMap = {};

    // Look for header row (first row with text in most cells)
    for (let rowNum = 1; rowNum <= Math.min(5, worksheet.rowCount); rowNum++) {
      const row = worksheet.getRow(rowNum);
      const headerValues = [];

      for (let col = 1; col <= row.cellCount; col++) {
        const cell = row.getCell(col);
        const value = cell.text?.trim().toLowerCase() || '';
        headerValues.push(value);
      }

      console.log(`🔍 Checking row ${rowNum} for headers:`, headerValues);

      // Check if this looks like a header row (contains expected keywords) BENEFICIARE
      const expectedHeaders = ['date', 'numero', 'banque', 'beneficiaire', 'montant', 'echeance', 'statut', 'reglement', 'obs'];
      const matchCount = expectedHeaders.filter(header =>
        headerValues.some(val => val.includes(header))
      ).length;

      console.log(`📊 Row ${rowNum} match count: ${matchCount} out of ${expectedHeaders.length} expected headers`);
      console.log(`📋 Raw headers found: [${headerValues.map(h => `"${h}"`).join(', ')}]`);

      if (matchCount >= 3) { // At least 3 expected headers found
        headerRow = rowNum;
        console.log(`📋 Found header row at row ${rowNum}: ${headerValues.join(' | ')}`);

        // Map columns based on header content
        for (let col = 1; col <= row.cellCount; col++) {
          const cell = row.getCell(col);
          const headerText = cell.text?.trim().toLowerCase() || '';

          console.log(`🔧 Column ${col}: "${headerText}"`);

          if (headerText.includes('date') && !headerText.includes('echeance') && !headerText.includes('reg')) {
            columnMap.dateEtablissement = col;
            console.log(`  ✅ Mapped to dateEtablissement`);
          } else if (headerText.includes('n°') || headerText.includes('numero') || headerText.includes('num') || headerText.includes('cheque')) {
            columnMap.numero = col;
            console.log(`  ✅ Mapped to numero`);
          } else if (headerText.includes('banque') || headerText.includes('bank')) {
            columnMap.banque = col;
            console.log(`  ✅ Mapped to banque`);
          } else if (headerText.includes('beneficiaire') || headerText.includes('beneficiaire') || headerText.includes('beneficiary')) {
            columnMap.beneficiaire = col;
            console.log(`  ✅ Mapped to beneficiaire`);
          } else if (headerText.includes('montant') || headerText.includes('amount')) {
            columnMap.montant = col;
            console.log(`  ✅ Mapped to montant`);
          } else if (headerText.includes('echeance') || headerText.includes('due')) {
            columnMap.dateEcheance = col;
            console.log(`  ✅ Mapped to dateEcheance`);
          } else if (headerText.includes('statut') || headerText.includes('status')) {
            columnMap.statut = col;
            console.log(`  ✅ Mapped to statut`);
          } else if (headerText.includes('reg') || headerText.includes('payment')) {
            columnMap.dateReglement = col;
            console.log(`  ✅ Mapped to dateReglement`);
          } else if (headerText.includes('obs')) {
            columnMap.obs = col;
            console.log(`  ✅ Mapped to obs`);
          } else {
            console.log(`  ❌ No mapping found for "${headerText}"`);
          }
        }
        break;
      }
    }

    if (!headerRow) {
      console.error('❌ No valid header row found');
      console.log('🔍 Expected headers: Date, N°, Banque, beneficiaire, Montant, Echeance, Statut, Date Reglement');
      console.log('🔍 Please check your Excel file headers and try again.');
      return res.status(400).send('No valid header row found. Please ensure your Excel file has headers like: Date, N°, Banque, beneficiaire, Montant, Echeance, Statut, Date Reglement');
    }

    console.log('🗺️ Column mapping:', columnMap);

    // Check if we have the essential columns mapped
    const missingColumns = [];
    if (!columnMap.numero) missingColumns.push('numero');
    if (!columnMap.montant) missingColumns.push('montant');
    // Note: banque and beneficiaire are optional - will use default values if not present

    if (missingColumns.length > 0) {
      console.error('❌ Missing essential column mappings:', missingColumns);
      console.log('🔍 Current column mapping:', columnMap);
      console.log('🔍 Please check your Excel file structure and ensure all required columns are present.');
      return res.status(400).send(`Missing essential columns: ${missingColumns.join(', ')}. Please check your Excel file structure.`);
    }

    const cheques = [];
    const validationIssues = [];
    let processedRows = 0;

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber <= headerRow) {
        console.log(`📋 Skipping row ${rowNumber} (header)`);
        return; // Skip header rows
      }

      processedRows++;
      console.log(`📝 Processing row ${rowNumber}: ${row.values.join(' | ')}`);

      // Extract data using column mapping
      const dateEtablissementRaw = columnMap.dateEtablissement ? row.getCell(columnMap.dateEtablissement).value : null;
      const numeroRaw = columnMap.numero ? row.getCell(columnMap.numero).text?.trim() : null;
      const banqueRaw = columnMap.banque ? row.getCell(columnMap.banque).text?.trim() : null;
      const beneficiaireRaw = columnMap.beneficiaire ? row.getCell(columnMap.beneficiaire).text?.trim() : null;
      const montantRaw = columnMap.montant ? row.getCell(columnMap.montant).text?.trim() : null;
      const dateEcheanceRaw = columnMap.dateEcheance ? row.getCell(columnMap.dateEcheance).value : null;
      let statutRaw = columnMap.statut ? row.getCell(columnMap.statut).text?.trim() : null;
      if (statutRaw && (statutRaw.toLowerCase() === 'annulée' || statutRaw.toLowerCase() === 'annulee')) {
        statutRaw = 'annulé';
      }
      const dateReglementRaw = columnMap.dateReglement ? row.getCell(columnMap.dateReglement).value : null;
      const obsRaw = columnMap.obs ? row.getCell(columnMap.obs).text?.trim() : null;

      console.log(`🔍 Row ${rowNumber} extracted data:`, {
        dateEtablissement: dateEtablissementRaw,
        numero: numeroRaw,
        banque: banqueRaw,
        beneficiaire: beneficiaireRaw,
        montant: montantRaw,
        dateEcheance: dateEcheanceRaw,
        statut: statutRaw,
        dateReglement: dateReglementRaw,
        obs: obsRaw
      });

      // Debug column mapping for this row
      if (rowNumber <= headerRow + 5) { // Only show first few rows for debugging
        console.log(`🔧 Column mapping debug for row ${rowNumber}:`, {
          columnMap: columnMap,
          rawRowValues: row.values,
          cellCount: row.cellCount
        });
      }

      const numero = numeroRaw || null;
      const montant = parseFloat(montantRaw) || null;
      const beneficiaire = beneficiaireRaw || ''; // Default value if not in Excel
      const banqueName = banqueRaw || 'Default Banque'; // Default value if not in Excel
      const dateEtablissement = parseExcelDate(dateEtablissementRaw);
      const dateEcheance = parseExcelDate(dateEcheanceRaw);
      const dateReglement = parseExcelDate(dateReglementRaw);
      const statut = statutRaw || 'En circulation'; // Default status
      const obs = obsRaw || null;
      // Validation with detailed logging
      if (!numero) { console.warn(`⚠️ Row ${rowNumber}: Missing numero`); validationIssues.push({ row: rowNumber, field: 'numero', issue: 'Missing numero' }); }
      if (!montant) { console.warn(`⚠️ Row ${rowNumber}: Missing or invalid montant (${montantRaw})`); validationIssues.push({ row: rowNumber, field: 'montant', issue: 'Missing or invalid montant' }); }
      if (!dateEcheance) { console.warn(`⚠️ Row ${rowNumber}: Invalid dateEcheance (${dateEcheanceRaw})`); validationIssues.push({ row: rowNumber, field: 'dateEcheance', issue: 'Invalid dateEcheance' }); }
      if (!dateEtablissement) { console.warn(`⚠️ Row ${rowNumber}: Invalid dateEtablissement (${dateEtablissementRaw})`); validationIssues.push({ row: rowNumber, field: 'dateEtablissement', issue: 'Invalid dateEtablissement' }); }

      // Note: beneficiaire and banque will use default values if not present

      cheques.push({
        numero,
        montant,
        beneficiaire,
        banqueName,
        dateEcheance,
        dateEtablissement,
        dateReglement,
        statut,
        obs,
        rowNumber
      });
    });

    console.log(`📊 Processed ${processedRows} rows, found ${cheques.length} cheques`);

    const validCheques = cheques.filter(c => c.numero && c.numero.toString().trim() !== '');
    console.log(`✅ Valid cheques: ${validCheques.length} out of ${cheques.length}`);

    const uniqueCheques = validCheques;
    console.log(`🔄 Processing ${uniqueCheques.length} unique cheques...`);

    let successCount = 0;
    let errorCount = 0;

    for (const cheque of uniqueCheques) {
      try {
        console.log(`🔄 Processing cheque: ${cheque.numero} (row ${cheque.rowNumber})`);

        // Find or create fournisseur
        console.log(`👤 Looking for fournisseur: ${cheque.beneficiaire}`);
        let fournisseur = await prisma.fournisseur.findFirst({
          where: { name: cheque.beneficiaire }
        });

        if (!fournisseur) {
          console.log(`🆕 Creating new fournisseur: ${cheque.beneficiaire}`);
          fournisseur = await prisma.fournisseur.create({
            data: {
              name: cheque.beneficiaire,
              ice: ` `,
              rib: ` `,
              banque: '',
              agence: '',
              identifFiscal: ` `,
              telFournisseur: ' ',
              contact: ' ',
              telContact: ' '
            }
          });
        }

        // Find or create banque
        console.log(`🏦 Looking for banque: ${cheque.banqueName}`);
        let banque = await prisma.banque.findFirst({
          where: { name: cheque.banqueName }
        });

        if (!banque) {
          console.log(`🆕 Creating new banque: ${cheque.banqueName}`);
          banque = await prisma.banque.create({
            data: {
              name: cheque.banqueName,
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

        // Check if cheque already exists
        const existing = await prisma.cheque.findUnique({
          where: {
            banqueId_numero: {
              banqueId: banque.id,
              numero: cheque.numero
            }
          }
        });


        const chequeData = {
          montant: cheque.montant,
          beneficiaire: cheque.beneficiaire,
          dateEcheance: cheque.dateEcheance,
          dateEtablissement: cheque.dateEtablissement,
          dateReglement: cheque.dateReglement,
          obs: cheque.obs,
          statut: cheque.statut,
          fournisseur: { connect: { id: fournisseur.id } },
          banque: { connect: { id: banque.id } },
        };

        if (existing) {
          await prisma.cheque.update({
            where: { id: existing.id },
            data: chequeData
          });
          console.log(`✅ Updated cheque: ${cheque.numero}`);
        } else {
          await prisma.cheque.create({
            data: { numero: cheque.numero, ...chequeData }
          });
          console.log(`✅ Created cheque: ${cheque.numero}`);
        }

        successCount++;
      } catch (e) {
        errorCount++;
        console.error(`❌ Error processing cheque ${cheque.numero} at row ${cheque.rowNumber}:`, {
          error: e.message,
          stack: e.stack,
          cheque: cheque
        });
      }
    }

    console.log(`📈 Import Summary:`);
    console.log(`   - Total rows processed: ${processedRows}`);
    console.log(`   - Valid cheques: ${validCheques.length}`);
    console.log(`   - Successfully processed: ${successCount}`);
    console.log(`   - Errors: ${errorCount}`);
    console.log(`   - Validation issues: ${validationIssues.length}`);

    res.send({
      message: 'Cheques uploaded with validation report.',
      totalRows: cheques.length,
      insertedCheques: uniqueCheques.length,
      validationIssues,
    });

  } catch (err) {
    console.error('❌ Critical error during Excel import:', {
      error: err.message,
      stack: err.stack,
      filePath: filePath
    });
    res.status(500).send('Server error during Excel import.');
  } finally {
    console.log('🧹 Cleaning up temporary file...');
    fs.unlink(filePath, err => {
      if (err) {
        console.error('❌ Failed to delete temp file:', err);
      } else {
        console.log('✅ Temporary file deleted successfully');
      }
    });
  }
};


// ✅ Render all cheques
export const showCheques = async (req, res) => {
  try {
    console.log('📋 Fetching cheques list...');
    const cheques = await prisma.cheque.findMany({
      orderBy: { id: 'desc' },
      include: {
        allocations: {
          include: {
            chantier: true
          }
        },
        fournisseur: true,
        banque: true,
      },
    });
    console.log(`✅ Found ${cheques.length} cheques`);

    const fournisseurs = await prisma.fournisseur.findMany();
    console.log(`✅ Found ${fournisseurs.length} fournisseurs`);

    const banques = await prisma.banque.findMany();
    console.log(`✅ Found ${banques.length} banques`);
    const { id } = req.params
    const chantiers = await prisma.chantier.findMany({
      orderBy: { nom: 'asc' },
    });
    console.log(`✅ Found ${chantiers.length} chantiers`);
    res.render("dashboard/tresorerie/reglements/cheques/index", {
      cheques,
      fournisseurs,
      banques,
      chantiers,
      id
    });
  } catch (error) {
    console.error('❌ Error fetching cheques:', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: "Erreur lors de la récupération des cheques." });
  }
};

// ✅ Create cheque (with linked fournisseur)


// ✅ Cheques for specific banque
export const showChequesForbanque = async (req, res) => {
  const { id } = req.params
  const cheques = await prisma.cheque.findMany({
    where: {
      banqueId: Number(req.params.id)
    },
    orderBy: {
      numero: 'asc'

    },
    include: {
      banque: {
        select: { name: true },
      },
      fournisseur: {
        select: { name: true, agence: true },
      },
    },
  });
  const banqueName = await prisma.banque.findUnique({ where: { id: Number(id) } })

  const banques = await prisma.banque.findMany();
  const fournisseurs = await prisma.fournisseur.findMany()
  res.render('dashboard/tresorerie/reglements/cheques/index', { cheques, banques, fournisseurs, id, banqueName });
};
export const deleteCheque = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Deleting cheque with ID: ${id}`);

    await prisma.cheque.delete({
      where: { id: parseInt(id) },
    });
    console.log(`✅ Cheque deleted successfully: ${id}`);
    res.json({ message: "Chèque supprimé avec succès." });
  } catch (error) {
    console.error('❌ Error deleting cheque:', {
      error: error.message,
      stack: error.stack,
      chequeId: req.params.id
    });
    res.status(500).json({ error: "Erreur lors de la suppression du chèque." });
  }
};

export const updateCheque = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      numero,
      montant,
      beneficiaire,
      dateEcheance,
      dateEtablissement,
      dateReglement,
      statut,
      obs,
      banque,
      chantier
    } = req.body;

    if (!beneficiaire || !banque) {
      return res.status(400).json({ error: "Fournisseur (bénéficiaire) et banque sont requis." });
    }

    // 📌 Check if fournisseur exists by name
    let fournisseur = await prisma.fournisseur.findFirst({ where: { name: beneficiaire } });

    if (!fournisseur) {
      fournisseur = await prisma.fournisseur.create({
        data: {
          name: beneficiaire,
          ice: ' ',
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
      findBanque = await prisma.banque.create({
        data: {
          name: banque,
          rib: 0,
          agence: ' ',
          solde: 0,
          dateSolde: new Date(),
          positive: 0,
          negative: 0,
          dmlt: 0
        }
      });
    }

    // 📌 Check if chantier exists by name


    // 🛠️ Build the data object dynamically, only including fields that are provided
    const data = {};

    if (numero !== undefined) data.numero = numero;
    if (montant !== undefined) {
      data.montant = parseFloat(montant.replace(/[^0-9,.]/g, '').replace(',', '.'));
    }
    if (beneficiaire !== undefined) data.beneficiaire = beneficiaire;
    if (dateEcheance !== undefined) data.dateEcheance = new Date(dateEcheance);
    if (dateEtablissement !== undefined) data.dateEtablissement = new Date(dateEtablissement);
    if (dateReglement !== undefined) data.dateReglement = dateReglement ? new Date(dateReglement) : null;
    if (statut !== undefined) data.statut = statut;
    if (statut === "payé") data.validation = false;
    if (obs !== undefined) data.obs = obs;
    if (fournisseur) data.fournisseur = { connect: { id: fournisseur.id } };
    if (findBanque) data.banque = { connect: { id: findBanque.id } };

    // 🛠️ Update cheque
    const cheque = await prisma.cheque.update({
      where: { id: parseInt(id) },
      data
    });

    console.log(`✅ cheque updated successfully: ${id}`);
    res.json(cheque);

  } catch (error) {
    console.error('❌ Error updating cheque:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: "Erreur lors de la mise à jour du chèque." });
  }
};


export const bmce = async (req, res) => {
  const { id } = req.params
  const fournisseurs = await prisma.fournisseur.findMany()
  const chantiers = await prisma.chantier.findMany()
  res.render('dashboard/tresorerie/reglements/cheques/etablir/bmce', { id, fournisseurs, chantiers })
};


export const bmci = async (req, res) => {
  const { id } = req.params
  const fournisseurs = await prisma.fournisseur.findMany()
  const chantiers = await prisma.chantier.findMany()
  res.render('dashboard/tresorerie/reglements/cheques/etablir/bmci', { id, fournisseurs, chantiers })
};


export const awb = async (req, res) => {
  const { id } = req.params
  const fournisseurs = await prisma.fournisseur.findMany()
  const chantiers = await prisma.chantier.findMany()
  res.render('dashboard/tresorerie/reglements/cheques/etablir/awb', { id, fournisseurs, chantiers })
};


export const cam = async (req, res) => {
  const { id } = req.params
  const fournisseurs = await prisma.fournisseur.findMany()
  const chantiers = await prisma.chantier.findMany()
  res.render('dashboard/tresorerie/reglements/cheques/etablir/cam', { id, fournisseurs, chantiers })
};


export const bp = async (req, res) => {
  const { id } = req.params
  const fournisseurs = await prisma.fournisseur.findMany()
  const chantiers = await prisma.chantier.findMany()
  res.render('dashboard/tresorerie/reglements/cheques/etablir/bp', { id, fournisseurs, chantiers })
};


export const cdm = async (req, res) => {
  const { id } = req.params
  const fournisseurs = await prisma.fournisseur.findMany()
  const chantiers = await prisma.chantier.findMany()
  res.render('dashboard/tresorerie/reglements/cheques/etablir/cdm', { id, fournisseurs, chantiers })
};

export const etablirCheque = async (req, res) => {
  try {
    const { numero, montant, beneficiaire, dateEcheance, ville, allocations } = req.body;
    const { id } = req.params; // banqueId
    const banqueId = parseInt(id);

    if (isNaN(banqueId)) {
      return res.status(400).json({ error: "ID banque invalide" });
    }

    // Parse allocations safely
    let parsedAllocations = [];
    try {
      parsedAllocations = allocations ? JSON.parse(allocations) : [];
    } catch (e) {
      return res.status(400).json({ error: "Format allocations invalide" });
    }

    // 1. Fournisseur (create if not exists)
    let fournisseur = await prisma.fournisseur.findFirst({ where: { name: beneficiaire } });
    if (!fournisseur) {
      fournisseur = await prisma.fournisseur.create({
        data: {
          name: beneficiaire,
          ice: ' ',
          rib: '',
          banque: '',
          agence: '',
          identifFiscal: ' ',
          telFournisseur: ' ',
          contact: ' ',
          telContact: ' ',
        },
      });
    }

    // 2. Banque
    const banque = await prisma.banque.findUnique({ where: { id: banqueId } });
    if (!banque) {
      return res.status(404).json({ error: "Banque non trouvée" });
    }

    // 3. Déterminer le numéro de chèque
    let finalNumero;

    if (numero && numero.trim() !== "") {
      finalNumero = numero.trim();

      // Vérifier que ce numéro n'existe PAS déjà pour cette banque
      const existing = await prisma.cheque.findFirst({
        where: {
          banqueId: banque.id,
          numero: finalNumero,
        },
      });

      if (existing) {
        return res.status(400).json({
          error: `Le numéro de chèque "${finalNumero}" existe déjà pour cette banque !`,
        });
      }
    } else {
      // Auto-générer le prochain numéro
      let nextNum = 1;

      const lastCheque = await prisma.cheque.findFirst({
        where: { banqueId: banque.id },
        orderBy: { id: 'desc' },
        select: { numero: true },
      });

      if (lastCheque && lastCheque.numero && !isNaN(parseInt(lastCheque.numero))) {
        nextNum = parseInt(lastCheque.numero) + 1;
      }

      // Boucle de sécurité au cas où le numéro serait déjà pris (très rare mais possible)
      while (true) {
        const exists = await prisma.cheque.findFirst({
          where: {
            banqueId: banque.id,
            numero: String(nextNum),
          },
        });

        if (!exists) {
          finalNumero = String(nextNum);
          break;
        }
        nextNum++;
      }
    }

    // 4. Créer le chèque (maintenant on est SÛR que (banqueId, numero) est unique)
    const cheque = await prisma.cheque.create({
      data: {
        numero: finalNumero,
        montant: parseFloat(montant),
        beneficiaire,
        dateEcheance: new Date(dateEcheance),
        dateEtablissement: new Date(),
        statut: 'En circulation',
        ville,
        fournisseur: { connect: { id: fournisseur.id } },
        banque: { connect: { id: banque.id } },
      },
    });

    // 5. Créer les allocations
    if (Array.isArray(parsedAllocations) && parsedAllocations.length > 0) {
      for (const alloc of parsedAllocations) {
        await prisma.chequeAllocation.create({
          data: {
            chequeId: cheque.id,
            chantierId: parseInt(alloc.chantierId),
            montant: parseFloat(alloc.amount),
          },
        });
      }
    }

    console.log(`Cheque créé → Banque ${banque.id} | N° ${finalNumero} | ID ${cheque.id}`);
    res.redirect(`/tresorerie/cheques`);

  } catch (error) {
    console.error('Error creating cheque:', error);

    // Optionnel : détecter spécifiquement l'erreur d'unicité même si on a blindé
    if (error.code === 'P2002' && error.meta?.target?.includes('banqueId_numero')) {
      return res.status(400).json({
        error: "Ce numéro de chèque existe déjà pour cette banque.",
      });
    }

    res.status(500).json({ error: "Erreur serveur lors de la création du chèque." });
  }
};



export const updateChequeStatut = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;
    console.log(`🔄 Updating statut for cheque ${id} to: ${statut}`);

    const cheque = await prisma.cheque.update({
      where: { id: parseInt(id) },

      data: { statut, validation: false },
    });
    console.log(`✅ Cheque statut updated successfully: ${id} -> ${statut}`);
    res.redirect(`/tresorerie/cheques/banque/${cheque.banqueId}`);
  } catch (error) {
    console.error('❌ Error updating cheque statut:', {
      error: error.message,
      stack: error.stack,
      chequeId: req.params.id,
      newStatut: req.body.statut
    });
    res.status(500).json({ error: "Erreur lors de la mise à jour du statut." });
  }
};



export const createCheque = async (req, res) => {
  try {
    console.log('🆕 Creating new cheque...', req.body);
    const {
      numero,
      montant,
      beneficiaire,
      dateEcheance,
      dateEtablissement,
      dateReglement,
      statut,
      obs,
      montantPaye,
      reste,
      banque,
      chantier
    } = req.body;

    // Find or create fournisseur
    let fournisseur = await prisma.fournisseur.findFirst({
      where: { name: beneficiaire },
    });

    if (!fournisseur) {
      fournisseur = await prisma.fournisseur.create({
        data: {
          name: beneficiaire,
          ice: ` `,
          rib: ` `,
          banque: '',
          identifFiscal: ` `,
          telFournisseur: ' ',
          contact: ' ',
          telContact: ' ',
        },
      });
    }

    // Find or create banque
    let findBanque = await prisma.banque.findFirst({
      where: { name: banque },
    });

    if (!findBanque) {
      findBanque = await prisma.banque.create({
        data: {
          name: banque,
          rib: 0,
          agence: ' ',
          solde: 0,
          dateSolde: new Date(),
          positive: 0,
          negative: 0,
          dmlt: 0,
        },
      });
    }

    // --- Get last effet for this banque ---
    const lastCheque = await prisma.cheque.findFirst({
      where: { banqueId: findBanque.id },
      orderBy: { id: 'desc' },
    });

    let nextNumero;
    if (numero) {
      // Use user-provided number
      nextNumero = String(numero);
    } else if (lastCheque) {
      // Auto increment from last number
      const lastNumero = parseInt(lastCheque.numero, 10);
      nextNumero = isNaN(lastNumero) ? '1' : String(lastNumero + 1);
    } else {
      // First record, default to 1
      nextNumero = '1';
    }

    // --- Create cheque ---
    const chantierData = await prisma.chantier.findFirst({
      where: { nom: chantier }
    })
    const cheque = await prisma.cheque.create({
      data: {
        numero: nextNumero,
        montant: parseFloat(montant),
        beneficiaire,
        dateEcheance: new Date(dateEcheance),
        dateEtablissement: new Date(),
        statut: 'En circulation',
        ville: "",
        obs,
        chantier: { connect: { id: parseInt(chantierData.id) } },
        fournisseur: { connect: { id: fournisseur.id } },
        banque: { connect: { id: findBanque.id } },

      },
    });
    console.log(`✅ Cheque created successfully: ${cheque.id}`);
    res.json(cheque);
  } catch (error) {
    console.error('❌ Error creating cheque:', {
      error: error.message,
      stack: error.stack,
      body: req.body,
    });
    res.status(500).json({ error: "Erreur lors de la création du chèque." });
  }
};

export const listBanquesCheques = async (req, res) => {
  const banques = await prisma.banque.findMany();
  res.render('dashboard/tresorerie/reglements/cheques/banques', { banques });
};