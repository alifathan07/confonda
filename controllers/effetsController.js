import prisma from "../db.js";
import multer from 'multer';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

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

  export const importExelEffets = async (req, res) => {
    console.log('🚀 Starting Excel import for effets...');
    
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
      
      for (let rowNum = 1; rowNum <= Math.min(5, worksheet.rowCount); rowNum++) {
        const row = worksheet.getRow(rowNum);
        const headerValues = [];
        
        for (let col = 1; col <= row.cellCount; col++) {
          const cell = row.getCell(col);
          const value = cell.text?.trim().toLowerCase() || '';
          headerValues.push(value);
        }
        
        console.log(`🔍 Checking row ${rowNum} for headers:`, headerValues);
        
        const expectedHeaders = ['date', 'numero', 'banque', 'beneficiaire', 'montant', 'echeance', 'statut', 'reglement', 'obs'];
        const matchCount = expectedHeaders.filter(header => 
          headerValues.some(val => val.includes(header))
        ).length;
        
        console.log(`📊 Row ${rowNum} match count: ${matchCount} out of ${expectedHeaders.length} expected headers`);
        console.log(`📋 Raw headers found: [${headerValues.map(h => `"${h}"`).join(', ')}]`);
        
        if (matchCount >= 3) {
          headerRow = rowNum;
          console.log(`📋 Found header row at row ${rowNum}: ${headerValues.join(' | ')}`);
          
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
            } else if (headerText.includes('obs') || headerText.includes('observation')) {
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

      const missingColumns = [];
      if (!columnMap.numero) missingColumns.push('numero');
      if (!columnMap.montant) missingColumns.push('montant');

      if (missingColumns.length > 0) {
        console.error('❌ Missing essential column mappings:', missingColumns);
        console.log('🔍 Current column mapping:', columnMap);
        console.log('🔍 Please check your Excel file structure and ensure all required columns are present.');
        return res.status(400).send(`Missing essential columns: ${missingColumns.join(', ')}. Please check your Excel file structure.`);
      }

      const effets = [];
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
          obs: obsRaw,
        });

        if (rowNumber <= headerRow + 5) {
          console.log(`🔧 Column mapping debug for row ${rowNumber}:`, {
            columnMap: columnMap,
            rawRowValues: row.values,
            cellCount: row.cellCount
          });
        }

        const numero = numeroRaw || null;
        const montant = parseFloat(montantRaw) || null;
        const beneficiaire = beneficiaireRaw || 'annulé';
        const banqueName = banqueRaw || 'Default Banque';
        const dateEtablissement = parseExcelDate(dateEtablissementRaw);
        const dateEcheance = parseExcelDate(dateEcheanceRaw);
        const dateReglement = parseExcelDate(dateReglementRaw);
        const obs = obsRaw || null;
        const statut = statutRaw || 'En circulation';

        // Validation
        if (!numero) { console.warn(`⚠️ Row ${rowNumber}: Missing numero`); validationIssues.push({ row: rowNumber, field: 'numero', issue: 'Missing numero' }); }
        if (!montant) { console.warn(`⚠️ Row ${rowNumber}: Missing or invalid montant (${montantRaw})`); validationIssues.push({ row: rowNumber, field: 'montant', issue: 'Missing or invalid montant' }); }
        if (!dateEcheance) { console.warn(`⚠️ Row ${rowNumber}: Invalid dateEcheance (${dateEcheanceRaw})`); validationIssues.push({ row: rowNumber, field: 'dateEcheance', issue: 'Invalid dateEcheance' }); }
        if (!dateEtablissement) { console.warn(`⚠️ Row ${rowNumber}: Invalid dateEtablissement (${dateEtablissementRaw})`); validationIssues.push({ row: rowNumber, field: 'dateEtablissement', issue: 'Invalid dateEtablissement' }); }
        if (!obs) { console.warn(`⚠️ Row ${rowNumber}: Missing obs`); validationIssues.push({ row: rowNumber, field: 'obs', issue: 'Missing obs' }); }

        effets.push({
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
      }); // <-- CLOSE eachRow callback here

      // Now process the effets array

      console.log(`📊 Processed ${processedRows} rows, found ${effets.length} effets`);

      const validEffets = effets.filter(e => e.numero && e.numero.toString().trim() !== '');
      console.log(`✅ Valid effets: ${validEffets.length} out of ${effets.length}`);
      
      const uniqueEffets = validEffets;
      console.log(`🔄 Processing ${uniqueEffets.length} unique effets...`);

      let successCount = 0;
      let errorCount = 0;

      for (const effet of uniqueEffets) {
        try {
          console.log(`🔄 Processing effet: ${effet.numero} (row ${effet.rowNumber})`);
          
          // Find or create fournisseur
          console.log(`👤 Looking for fournisseur: ${effet.beneficiaire}`);
          let fournisseur = await prisma.fournisseur.findFirst({
            where: { name: effet.beneficiaire }
          });
          
          if (!fournisseur) {
            console.log(`🆕 Creating new fournisseur: ${effet.beneficiaire}`);
            fournisseur = await prisma.fournisseur.create({
              data: {
                name: effet.beneficiaire,
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
          console.log(`🏦 Looking for banque: ${effet.banqueName}`);
          let banque = await prisma.banque.findFirst({
            where: { name: effet.banqueName }
          });
          
          if (!banque) {
            console.log(`🆕 Creating new banque: ${effet.banqueName}`);
            banque = await prisma.banque.create({
              data: {
                name: effet.banqueName,
                rib: "",
                agence: ' ',
                solde: 0,
                dateSolde: new Date(),
                positive: 0,
                negative: 0,
                dmlt: 0
              }
            });
          }

          // Check if effet already exists
          const existing = await prisma.effet.findUnique({
            where: {
              banqueId_numero: {
                banqueId: banque.id,
                numero: effet.numero
              }
            }
          });

          const effetData = {
            montant: effet.montant,
            beneficiaire: effet.beneficiaire,
            dateEcheance: effet.dateEcheance,
            dateEtablissement: effet.dateEtablissement,
            dateReglement: effet.dateReglement,
            statut: effet.statut,
            obs: effet.obs,
            fournisseur: { connect: { id: fournisseur.id } },
            banque: { connect: { id: banque.id } },
          };

          if (existing) {
            await prisma.effet.update({
              where: { id: existing.id },
              data: effetData
            });
            console.log(`✅ Updated effet: ${effet.numero}`);
          } else {
            await prisma.effet.create({
              data: { numero: effet.numero, ...effetData }
            });
            console.log(`✅ Created effet: ${effet.numero}`);
          }
          
          successCount++;
        } catch (e) {
          errorCount++;
          console.error(`❌ Error processing effet ${effet.numero} at row ${effet.rowNumber}:`, {
            error: e.message,
            stack: e.stack,
            effet: effet
          });
        }
      }

      console.log(`📈 Import Summary:`);
      console.log(`   - Total rows processed: ${processedRows}`);
      console.log(`   - Valid effets: ${validEffets.length}`);
      console.log(`   - Successfully processed: ${successCount}`);
      console.log(`   - Errors: ${errorCount}`);
      console.log(`   - Validation issues: ${validationIssues.length}`);

      res.send({
        message: 'Effets uploaded with validation report.',
        totalRows: effets.length,
        insertedEffets: uniqueEffets.length,
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

export const showEffets = async (req, res) => {
  try {
    console.log('📋 Fetching cheques list...');
    const effets = await prisma.effet.findMany({
      include: {
        fournisseur: true,
        banque: true,
      },
    });
    console.log(`✅ Found ${effets.length} effets`);

    const fournisseurs = await prisma.fournisseur.findMany();
    console.log(`✅ Found ${fournisseurs.length} fournisseurs`);

    const banques = await prisma.banque.findMany();
    console.log(`✅ Found ${banques.length} banques`);
    const {id} = req.params 
    res.render("dashboard/tresorerie/reglements/effets/index", {
      effets,
      fournisseurs,
      banques,
      id
    });
  } catch (error) {
    console.error('❌ Error fetching effets:', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: "Erreur lors de la récupération des effets." });
  }
};

// export const showEffetsForbanque = async (req, res) => {
//   const {id} = req.params
//   const effets = await prisma.effet.findMany({
//     where: {
//       banqueId: Number(id)
//     },
//     include: {
//       banque: {
//         select: { name: true },
//       },
//       fournisseur: {
//         select: { name: true },
//       },
//     },
//   });
//   const banques = await prisma.banque.findMany();
//   const fournisseurs = await prisma.fournisseur.findMany();
//   const banqueName = await prisma.banque.findMany({
//     where : {
//       id : Number(id)
//     }
//   })
  
//   res.render('dashboard/tresorerie/reglements/effets/index', { effets, banques , fournisseurs, id, banqueName });
// };


export const showEffetsForbanque = async (req, res) => {
  const { id } = req.params
  const effets = await prisma.effet.findMany({
    where: {
      banqueId: Number(req.params.id)
    },
    include: {
      banque: {
        select: { name: true },
      },
      fournisseur: {
        select: { name: true },
      },
    },
  });
  const banqueName = await prisma.banque.findUnique({where:{id:Number(id)}})

  const banques = await prisma.banque.findMany();
  const fournisseurs = await prisma.fournisseur.findMany()
  res.render('dashboard/tresorerie/reglements/effets/index', { effets, banques , fournisseurs, id, banqueName });
};


export const Ebmce = async (req, res) => {
  const {id} = req.params     
  const fournisseurs = await prisma.fournisseur.findMany()
  const banques = await prisma.banque.findMany()
  res.render('dashboard/tresorerie/reglements/effets/etablir/bmce', {id , fournisseurs , banques})
};
export const Ebmci = async (req, res) => {
  const {id} = req.params     
  const fournisseurs = await prisma.fournisseur.findMany()
  const banques = await prisma.banque.findMany()
  res.render('dashboard/tresorerie/reglements/effets/etablir/bmci', {id , fournisseurs , banques})
};
export const Eawb = async (req, res) => {
  const {id} = req.params     
  const fournisseurs = await prisma.fournisseur.findMany()
  const banques = await prisma.banque.findMany()
  res.render('dashboard/tresorerie/reglements/effets/etablir/awb', {id , fournisseurs , banques})
};
export const Ecam = async (req, res) => {
  const {id} = req.params     
  const fournisseurs = await prisma.fournisseur.findMany()
  const banques = await prisma.banque.findMany()
  res.render('dashboard/tresorerie/reglements/effets/etablir/cam', {id , fournisseurs , banques})
};
export const Ebp = async (req, res) => {
  const {id} = req.params     
  const fournisseurs = await prisma.fournisseur.findMany()
  const banques = await prisma.banque.findMany()
  res.render('dashboard/tresorerie/reglements/effets/etablir/bp', {id , fournisseurs , banques})
};
export const Ecdm = async (req, res) => {
  const {id} = req.params     
  const fournisseurs = await prisma.fournisseur.findMany()
  const banques = await prisma.banque.findMany()
  res.render('dashboard/tresorerie/reglements/effets/etablir/cdm', {id , fournisseurs , banques})
};

export const createEffet = async (req, res) => {
  try {
    console.log('🆕 Creating new effet...', req.body);
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
      banque
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
          banque : '',
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

    const effet = await prisma.effet.create({
      data: {
        numero,
        montant: parseFloat(montant),
        beneficiaire,
        dateEcheance: new Date(dateEcheance),
        dateEtablissement: new Date(dateEtablissement),
        dateReglement: dateReglement ? new Date(dateReglement) : new Date("2025-10-02"),
        statut,
        obs,
        montantPaye: parseFloat(montantPaye), // ✅ Convert to Float
        reste: parseFloat(reste), // ✅ Convert to Float
        fournisseur: { connect: { id: fournisseur.id } },
        banque: { connect: { id: findBanque.id } },
      },
    });

    console.log(`✅ Effet created successfully: ${effet.id}`);
    res.json(effet);
  } catch (error) {
    console.error('❌ Error creating effet:', {
      error: error.message,
      stack: error.stack,
      body: req.body,
    });
    res.status(500).json({ error: "Erreur lors de la création du chèque." });
  }
};

export const etablirEffet = async (req, res) => {
  try {
    const { numero, montant, beneficiaire, dateEcheance, ville, obs } = req.body;
    const { id } = req.params; // banque id

    // --- Check or create fournisseur ---
    let fournisseur = await prisma.fournisseur.findFirst({ where: { name: beneficiaire } });
    if (!fournisseur) {
      fournisseur = await prisma.fournisseur.create({
        data: { name: beneficiaire, ice: ' ', rib: ' ', banque: '', identifFiscal: ' ', telFournisseur: ' ', contact: ' ', telContact: ' ' },
      });
    }

    // --- Check or create banque ---
    let findBanque = await prisma.banque.findFirst({ where: { id: parseInt(id) } });
    if (!findBanque) {
      findBanque = await prisma.banque.create({
        data: { name: ' ', rib: 0, agence: ' ', solde: 0, dateSolde: new Date(), positive: 0, negative: 0, dmlt: 0 },
      });
    }

    // --- Get last cheque for this banque ---
    const lastEffet = await prisma.effet.findFirst({
      where: { banqueId: findBanque.id },
      orderBy: { id: 'desc' },
    });

    let nextNumero;
    if (numero) {
      // Use user-provided number
      nextNumero = String(numero);
    } else if (lastEffet) {
      // Auto increment from last number
      const lastNumero = parseInt(lastEffet.numero, 10);
      nextNumero = isNaN(lastNumero) ? '1' : String(lastNumero + 1);
    } else {
      // First record, default to 1
      nextNumero = '1';
    }

    // --- Create cheque ---
    const effet = await prisma.effet.create({
      data: {
        numero: nextNumero,
        montant: parseFloat(montant),
        beneficiaire,
        dateEcheance: new Date(dateEcheance),
        dateEtablissement: new Date(),
        statut: 'En circulation',
        ville,
        obs,
        fournisseur: { connect: { id: fournisseur.id } },
        banque: { connect: { id: findBanque.id } },
      },
    });

    console.log(`✅ Effet created successfully: ${effet.id}`);
    res.redirect(`/tresorerie/effets/banque/${id}`);
  } catch (error) {
    console.error('❌ Error creating cheque:', {
      error: error.message,
      stack: error.stack,
      body: req.body,
    });
    res.status(500).json({ error: "Erreur lors de la création du chèque." });
  }
};


export const updateEffet = async (req, res) => {
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
      montantPaye,
      reste,
      banque
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
          ice: ` `,
          rib: ` `,
          banque : '',
          identifFiscal: ` `,
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
          agence: '',
          solde: 0,
          dateSolde: new Date(),
          positive: 0,
          negative: 0,
          dmlt: 0
        }
      });
    }

    // 🛠️ Build the data object dynamically
    const data = {};

    if (numero !== undefined) data.numero = numero;
    if (montant !== undefined) {
      const cleanedMontant = montant.replace(/[^0-9,.]/g, '').replace(',', '.');
      if (isNaN(parseFloat(cleanedMontant))) {
        return res.status(400).json({ error: "Montant must be a valid number." });
      }
      data.montant = parseFloat(cleanedMontant);
    }
    if (beneficiaire !== undefined) data.beneficiaire = beneficiaire;
    if (dateEcheance !== undefined) data.dateEcheance = new Date(dateEcheance);
    if (dateEtablissement !== undefined) data.dateEtablissement = new Date(dateEtablissement);
    if (dateReglement !== undefined) data.dateReglement = dateReglement ? new Date(dateReglement) : null;
    if (statut !== undefined) data.statut = statut;
    if (obs !== undefined) data.obs = obs;
    if (montantPaye !== undefined) {
      const cleanedMontantPaye = montantPaye.replace(/[^0-9,.]/g, '').replace(',', '.');
      if (isNaN(parseFloat(cleanedMontantPaye))) {
        return res.status(400).json({ error: "MontantPaye must be a valid number." });
      }
      data.montantPaye = parseFloat(cleanedMontantPaye);
    }
    if (reste !== undefined) {
      const cleanedReste = reste.replace(/[^0-9,.]/g, '').replace(',', '.');
      if (isNaN(parseFloat(cleanedReste))) {
        return res.status(400).json({ error: "Reste must be a valid number." });
      }
      data.reste = parseFloat(cleanedReste);
    }
    if (fournisseur) data.fournisseur = { connect: { id: fournisseur.id } };
    if (findBanque) data.banque = { connect: { id: findBanque.id } };

    // 🛠️ Update effet
    const effet = await prisma.effet.update({
      where: { id: parseInt(id) },
      data
    });

    console.log(`✅ Effet updated successfully: ${id}`);
    res.json(effet);

  } catch (error) {
    console.error('❌ Error updating effet:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: "Erreur lors de la mise à jour du effet." });
  }
};
export const updateEffetStatut = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;
    console.log(`🔄 Updating statut for effet ${id} to: ${statut}`);
    
    const effet = await prisma.effet.update({
      where: { id: parseInt(id) },
      data: { statut },
    });
    console.log(`✅ Effet statut updated successfully: ${id} -> ${statut}`);
    res.redirect(`/tresorerie/effets/banque/${effet.banqueId}`);
  } catch (error) {
    console.error('❌ Error updating effet statut:', {
      error: error.message,
      stack: error.stack,
      effetId: req.params.id,
      newStatut: req.body.statut
    });
    res.status(500).json({ error: "Erreur lors de la mise à jour du statut." });
  }
};
export const deleteEffet = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Deleting effet with ID: ${id}`);
    
    await prisma.effet.delete({
      where: { id: parseInt(id) },
    });
    console.log(`✅ Effet deleted successfully: ${id}`);
    res.json({ message: "Effet supprimé avec succès." });
  } catch (error) {
    console.error('❌ Error deleting effet:', {
      error: error.message,
      stack: error.stack,
      effetId: req.params.id
    });
    res.status(500).json({ error: "Erreur lors de la suppression de l'effet." });
  }
};
