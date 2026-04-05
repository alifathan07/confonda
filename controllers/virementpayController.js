import * as XLSXNS from 'xlsx';
import fs from 'fs';
import ExcelJS from 'exceljs';
import prisma from '../db.js';

const XLSX = XLSXNS?.default || XLSXNS;

const SESSION_KEY_BMCE = 'virementpay_bmce_files';
const SESSION_KEY_BMCE_ERROR = 'virementpay_bmce_error';

// -------------------------- HELPERS -----------------------------
const getBmceFilesFromSession = (req) => {
    if (!req.session) return [];
    const v = req.session[SESSION_KEY_BMCE];
    return Array.isArray(v) ? v : [];
};

const setBmceFilesToSession = (req, files) => {
    if (!req.session) return;
    req.session[SESSION_KEY_BMCE] = files;
};

const setBmceErrorToSession = (req, message) => {
    if (!req.session) return;
    req.session[SESSION_KEY_BMCE_ERROR] = message;
};

const chunkArray = (arr, size) => {
    const out = [];
    const a = Array.isArray(arr) ? arr : [];
    for (let i = 0; i < a.length; i += size) out.push(a.slice(i, i + size));
    return out;
};

const parseAmount = (v) => {
    const s = (v ?? '').toString().trim();
    if (!s) return 0;
    const normalized = s.replace(/\s+/g, '').replace(',', '.');
    const n = Number.parseFloat(normalized);
    return Number.isFinite(n) ? n : 0;
};

const formatBmceAmount = (n) => {
    const val = Number.isFinite(n) ? n : 0;
    return val.toLocaleString('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).replace(/[\u00A0\u202F]/g, ' ');
};

const normalizeRib24 = (v) => {
    const s = (v ?? '').toString().replace(/\s+/g, '').trim();
    const digits = s.replace(/\D+/g, '');
    return digits;
};

const numberToFrenchWords = (n) => {
    const units = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize'];
    const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];

    const underHundred = (x) => {
        if (x < 17) return units[x];
        if (x < 20) return 'dix-' + units[x - 10];
        const t = Math.floor(x / 10);
        const u = x % 10;
        if (t === 7 || t === 9) {
            const base = tens[t];
            const rest = 10 + u;
            if (rest === 11) return base + ' et ' + units[rest];
            return base + '-' + underHundred(rest);
        }
        if (t === 8) {
            if (u === 0) return 'quatre-vingts';
            return 'quatre-vingt-' + units[u];
        }
        if (u === 0) return tens[t];
        if (u === 1 && t !== 8) return tens[t] + ' et un';
        return tens[t] + '-' + units[u];
    };

    const underThousand = (x) => {
        const h = Math.floor(x / 100);
        const r = x % 100;
        const hPart = (() => {
            if (h === 0) return '';
            if (h === 1) return 'cent';
            return units[h] + ' cent' + (r === 0 ? 's' : '');
        })();
        const rPart = r ? underHundred(r) : '';
        if (hPart && rPart) return hPart + ' ' + rPart;
        return hPart || rPart || units[0];
    };

    const abs = Math.abs(Math.floor(n));
    if (abs < 1000) return underThousand(abs);
    if (abs < 1000000) {
        const k = Math.floor(abs / 1000);
        const r = abs % 1000;
        const kPart = k === 1 ? 'mille' : underThousand(k) + ' mille';
        const rPart = r ? underThousand(r) : '';
        return (kPart + (rPart ? ' ' + rPart : '')).trim();
    }
    const m = Math.floor(abs / 1000000);
    const r = abs % 1000000;
    const mPart = m === 1 ? 'un million' : numberToFrenchWords(m) + ' millions';
    const rPart = r ? numberToFrenchWords(r) : '';
    return (mPart + (rPart ? ' ' + rPart : '')).trim();
};

const amountToFrenchMad = (amount) => {
    const n = Number.isFinite(amount) ? amount : 0;
    const totalCents = Math.round(n * 100);
    const dirhams = Math.floor(totalCents / 100);
    const cents = Math.abs(totalCents % 100);
    const dWords = numberToFrenchWords(dirhams);
    const cWords = cents ? numberToFrenchWords(cents) : '';
    const main = dWords + ' dirhams';
    const tail = cents ? ' et ' + cWords + ' centimes' : '';
    const out = (main + tail).trim();
    return out.charAt(0).toUpperCase() + out.slice(1);
};

const buildBmceWorksheet = ({
    ws,
    payrollDate,
    companyName,
    companyRib,
    obs,
    items,
}) => {
    const fontBase = { name: 'Calibri', size: 12 };
    const fontBold = { name: 'Calibri', size: 12, bold: true };
    const borderThin = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
    };
    const borderMedium = {
        top: { style: 'medium' },
        left: { style: 'medium' },
        bottom: { style: 'medium' },
        right: { style: 'medium' },
    };
    const applyBorderRange = (r1, c1, r2, c2, border) => {
        for (let r = r1; r <= r2; r++) {
            for (let c = c1; c <= c2; c++) {
                ws.getCell(r, c).border = border;
            }
        }
    };

    ws.properties.defaultRowHeight = 20;
    ws.views = [{ showGridLines: true, state: 'frozen', ySplit: 10 }];
    ws.columns = [
        { key: 'A', width: 45 },
        { key: 'B', width: 40 },
        { key: 'C', width: 20 },
    ];

    // Base font for a reasonable area
    for (let r = 1; r <= 80; r++) {
        for (let c = 1; c <= 3; c++) {
            ws.getCell(r, c).font = fontBase;
            ws.getCell(r, c).alignment = { vertical: 'middle', wrapText: true };
        }
    }

    const setLabelValue = (row, label, value) => {
        ws.getCell(`A${row}`).value = label;
        ws.mergeCells(`B${row}:C${row}`);
        ws.getCell(`B${row}`).value = value ?? '';

        ws.getCell(`A${row}`).font = fontBold;
        ws.getCell(`A${row}`).alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        ws.getCell(`B${row}`).alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

        // subtle background for sender info
        ws.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        ws.getCell(`B${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
        ws.getCell(`C${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };

        // Light box borders for sender info block
        applyBorderRange(row, 1, row, 3, borderThin);

        ws.getRow(row).height = 22;
    };
    setLabelValue(1, "Date Ordre", payrollDate || '');
    setLabelValue(2, '', '');
    setLabelValue(3, "RAISON SOCIAL (Nom de l'ordonnateur)", companyName || '');
    setLabelValue(4, 'RIB ORDONNATEUR (le RIB sur 24 positions)', normalizeRib24(companyRib || ''));
    setLabelValue(5, "NOMBRE TOTAL D'OPERATIONS (en chiffres)", String(Array.isArray(items) ? items.length : 0));

    const totalAmount = (Array.isArray(items) ? items : []).reduce((sum, r) => sum + parseAmount(r?.[2]), 0);
    const totalText = `${formatBmceAmount(totalAmount)} (${amountToFrenchMad(totalAmount)})`;
    setLabelValue(6, "MONTANT TOTAL D'OPERATIONS (en chiffres & Lettres)", totalText);
    setLabelValue(7, 'LIBELLE OPERATIONS', obs || '');
    ws.mergeCells('A8:C8');
    ws.getCell('A8').value = 'Veuillez Par le débit de notre compte, effectuer les virements en faveur des bénéficiaires';
    ws.getCell('A8').alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    applyBorderRange(8, 1, 8, 3, borderThin);

    const headerRow = 10;
    ws.getCell(`A${headerRow}`).value = 'Nom du Bénéficiaire';
    ws.getCell(`B${headerRow}`).value = 'RIB Bénéficiaire (24 positions)';
    ws.getCell(`C${headerRow}`).value = 'Montant';

    // Table header style
    ['A', 'B', 'C'].forEach((col) => {
        const cell = ws.getCell(`${col}${headerRow}`);
        cell.font = { ...fontBold, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = borderMedium;
    });

    ws.getRow(headerRow).height = 26;

    const startRow = 11;
    (Array.isArray(items) ? items : []).forEach((r, idx) => {
        const rowIdx = startRow + idx;
        const rib = normalizeRib24(r?.[1]);
        const nom = (r?.[0] ?? '').toString();
        const amountNumber = parseAmount(r?.[2]);
        const montant = formatBmceAmount(amountNumber);
        ws.getCell(`A${rowIdx}`).value = nom;
        ws.getCell(`B${rowIdx}`).value = rib;
        // Keep numeric value for proper Excel formatting
        ws.getCell(`C${rowIdx}`).value = amountNumber;
        ws.getCell(`C${rowIdx}`).numFmt = '#\\ ##0,00';

        // Body styling + borders
        ws.getCell(`A${rowIdx}`).alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        ws.getCell(`B${rowIdx}`).alignment = { vertical: 'middle', horizontal: 'left', wrapText: false };
        ws.getCell(`C${rowIdx}`).alignment = { vertical: 'middle', horizontal: 'right', wrapText: false };

        ws.getCell(`A${rowIdx}`).font = fontBase;
        ws.getCell(`B${rowIdx}`).font = fontBase;
        ws.getCell(`C${rowIdx}`).font = fontBase;

        ['A', 'B', 'C'].forEach((col) => {
            ws.getCell(`${col}${rowIdx}`).border = borderThin;
        });

        if (idx % 2 === 1) {
            ['A', 'B', 'C'].forEach((col) => {
                ws.getCell(`${col}${rowIdx}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
            });
        }

        ws.getRow(rowIdx).height = 22;
    });

    const itemCount = Array.isArray(items) ? items.length : 0;
    const tableEndRow = itemCount ? (startRow + itemCount - 1) : headerRow;

    // Amount box centered under the beneficiaries table
    const amountBoxRow = tableEndRow + 1;
    ws.mergeCells(`A${amountBoxRow}:C${amountBoxRow}`);
    ws.getCell(`A${amountBoxRow}`).value = formatBmceAmount(totalAmount);
    ws.getCell(`A${amountBoxRow}`).font = { ...fontBold, size: 13 };
    ws.getCell(`A${amountBoxRow}`).alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
    applyBorderRange(amountBoxRow, 1, amountBoxRow, 3, borderMedium);
    ['A', 'B', 'C'].forEach((col) => {
        ws.getCell(`${col}${amountBoxRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
    });
    ws.getRow(amountBoxRow).height = 26;

    const footerStartRow = amountBoxRow + 2;
    const footerEndRow = footerStartRow + 4;

    for (let r = footerStartRow; r <= footerEndRow; r++) {
        ws.mergeCells(`B${r}:C${r}`);
        ['A', 'B', 'C'].forEach((col) => {
            ws.getCell(`${col}${r}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
        });
        ws.getRow(r).height = 24;
    }

    ws.getCell(`A${footerStartRow}`).value = 'Signatures autorisées :';
    ws.getCell(`A${footerStartRow}`).font = fontBold;
    ws.getCell(`A${footerStartRow}`).alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

    ws.getCell(`B${footerStartRow}`).value = 'Authentification Signatures "Cachet Agence":';
    ws.getCell(`B${footerStartRow}`).font = fontBold;
    ws.getCell(`B${footerStartRow}`).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

    for (let r = footerStartRow; r <= footerEndRow; r++) {
        const isTop = r === footerStartRow;
        const isBottom = r === footerEndRow;

        // A column: left outer border + vertical divider on the right
        ws.getCell(`A${r}`).border = {
            top: isTop ? { style: 'thin' } : undefined,
            left: { style: 'thin' },
            bottom: isBottom ? { style: 'thin' } : undefined,
            right: { style: 'thin' },
        };

        // B:C merged region: only top/bottom outer borders, plus divider on the left
        ws.getCell(`B${r}`).border = {
            top: isTop ? { style: 'thin' } : undefined,
            left: { style: 'thin' },
            bottom: isBottom ? { style: 'thin' } : undefined,
            right: undefined,
        };

        // Column C: right outer border
        ws.getCell(`C${r}`).border = {
            top: isTop ? { style: 'thin' } : undefined,
            left: undefined,
            bottom: isBottom ? { style: 'thin' } : undefined,
            right: { style: 'thin' },
        };
    }

    // Add a neat outer border around the main blocks
    applyBorderRange(1, 1, 8, 3, borderMedium);
    applyBorderRange(headerRow, 1, tableEndRow, 3, borderThin);
};


///// views logic

export const indexVirementPay = (req, res) => {
    res.render('dashboard/virementpay/index');
};

export const bmcePay = async(req, res) => {
    const error = req.session ? req.session[SESSION_KEY_BMCE_ERROR] : null;
    if (req.session && req.session[SESSION_KEY_BMCE_ERROR]) {
        delete req.session[SESSION_KEY_BMCE_ERROR];
    }

    const files = getBmceFilesFromSession(req).map((f) => ({
        id: f.id,
        originalName: f.originalName,
        payrollDate: f.payrollDate,
        
        companyName: f.companyName,
        companyRib: f.companyRib,
        NombreOperation: f.NombreOperation,
        amouteLettres: f.amouteLettres,
        amount: f.amount,
        obs: f.obs,
        
        createdAt: f.createdAt,
        totalRows: typeof f.totalRows === 'number' ? f.totalRows : (Array.isArray(f.rows) ? f.rows.length : 0),
        status: f.status || 'Session',
    }));
    const BmceRib = await prisma.banque.findFirst({
        where: { name: 'BMCE' },
        select: { rib: true },
    });
    

    res.render('dashboard/virementpay/bmce/index', { files, error , BmceRib });
};


export const bmceUpload = async (req, res) => {

    if (!req.file) return res.status(400).send('No file uploaded.');
    const {companyName , companyRib , NombreOperation , amouteLettres , amount, obs } = req.body  

    const payrollDate = (req.body?.payrollDate || '').toString();
    const filePath = req.file.path;

    try {
        const wb = XLSX.readFile(filePath, { cellDates: true });
        const sheetName = wb.SheetNames?.[0];
        if (!sheetName) {
            return res.status(400).send('No worksheet found in Excel file.');
        }
        const sheet = wb.Sheets[sheetName];

        const allRows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
        if (!Array.isArray(allRows) || allRows.length === 0) {
            return res.status(400).send('Empty Excel file.');
        }

        const firstRow = Array.isArray(allRows[0]) ? allRows[0] : [];
        const rawHeaders = firstRow.map((h) => (h ?? '').toString().trim());
        const normalizeHeader = (v) => (v || '').toString().trim().toLowerCase();

        const headerToIndex = new Map();
        rawHeaders.forEach((h, idx) => {
            const key = normalizeHeader(h);
            if (!key) return;
            if (!headerToIndex.has(key)) headerToIndex.set(key, idx);
        });

        const idxNom = headerToIndex.get('nom');
        const idxCompte = headerToIndex.get('compte');
        const idxNet = headerToIndex.get('net');

        if (typeof idxNom !== 'number' || typeof idxCompte !== 'number' || typeof idxNet !== 'number') {
            setBmceErrorToSession(
                req,
                'Colonnes requises manquantes dans le fichier. Attendu: mle, nom, net, compte, agence, banque. (Utilisées: nom, compte, net)'
            );
            return res.redirect('/virementpay/bmce');
        }

        const headers = ['Nom Beneficiaire', 'RIB', 'Montant Virement'];
        const rows = [];
        for (let i = 1; i < allRows.length; i++) {
            const r = Array.isArray(allRows[i]) ? allRows[i] : [];
            const nom = (r[idxNom] ?? '').toString().trim();
            const rib = (r[idxCompte] ?? '').toString().trim();
            const montant = (r[idxNet] ?? '').toString().trim();

            const isEmpty = !nom && !rib && !montant;
            if (isEmpty) continue;

            rows.push([nom, rib, montant]);
        }

        const files = getBmceFilesFromSession(req);
        const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
        files.unshift({
            id,
            bankCode: 'BMCE',
            originalName: req.file.originalname,
            companyName,
            companyRib,
            NombreOperation,
            amouteLettres,
            amount,
            obs,
            payrollDate: payrollDate || null,
            createdAt: new Date().toISOString(),
            status: 'Session',
            headers,
            rows,
            totalRows: rows.length,
        });
        setBmceFilesToSession(req, files);

        return res.redirect('/virementpay/bmce');
    } catch (error) {
        console.error('Error processing Excel:', error);
        const msg = (error && error.message) ? String(error.message) : '';
        setBmceErrorToSession(req, `Impossible de lire le fichier. Formats supportés: .xlsx / .xls / .csv / .ods. ${msg ? 'Détail: ' + msg : ''}`);
        return res.redirect('/virementpay/bmce');
    } finally {
        fs.unlink(filePath, (err) => {
            if (err) console.error('Failed to delete temp file:', err);
        });
    }
};

export const bmcePreview = (req, res) => {
    const fileId = (req.params.fileId || '').toString();
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const pageSize = 20;

    const files = getBmceFilesFromSession(req);
    const file = files.find((f) => String(f.id) === fileId);
    if (!file) return res.status(404).send('File not found in session.');

    const totalItems = Array.isArray(file.rows) ? file.rows.length : 0;
    const totalPages = Math.max(Math.ceil(totalItems / pageSize), 1);
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    const items = (file.rows || []).slice(start, start + pageSize);
    const parseAmount = (v) => {
        const s = (v ?? '').toString().trim();
        if (!s) return 0;
        const normalized = s.replace(/\s+/g, '').replace(',', '.');
        const n = Number.parseFloat(normalized);
        return Number.isFinite(n) ? n : 0;
    };

    const montantTotalGlobal = (file.rows || []).reduce((sum, row) => sum + parseAmount(row?.[2]), 0);
    const montantTotalPage = (items || []).reduce((sum, row) => sum + parseAmount(row?.[2]), 0);
    const totalOperationsGlobal = totalItems;
    const totalOperationsPage = Array.isArray(items) ? items.length : 0;
  
    
    
   
    return res.render('dashboard/virementpay/bmce/preview', {   
        file: {
            id: file.id,
            originalName: file.originalName,
            payrollDate: file.payrollDate,
            
            companyName: file.companyName || '',
            companyRib: file.companyRib || '',
            NombreOperation: file.NombreOperation || '',
            amouteLettres: file.amouteLettres || '',
            amount: file.amount || '',
            obs: file.obs || '', 
            createdAt: file.createdAt,
            totalRows: totalItems,
            totalOperationsGlobal,
            totalOperationsPage,
            montantTotalGlobal,
            montantTotalPage,
        },
        headers: Array.isArray(file.headers) ? file.headers : [],
        items,
        pagination: {
            page: safePage,
            pageSize,
            totalItems,
            totalPages,
        },
    });
};

export const bmceDelete = (req, res) => {
    const fileId = (req.params.fileId || '').toString();
    const files = getBmceFilesFromSession(req);
    const next = files.filter((f) => String(f.id) !== fileId);
    setBmceFilesToSession(req, next);
    return res.redirect('/virementpay/bmce');
};


export const bmceDownload = async (req, res) => {
  try {
    const fileId = String(req.params.fileId || '');

    const files = getBmceFilesFromSession(req);
    const file = files.find(f => String(f.id) === fileId);

    if (!file) {
      return res.status(404).send('File not found in session.');
    }

    const rows = Array.isArray(file.rows) ? file.rows : [];
    const sortedRows = [...rows].sort((a, b) => parseAmount(a?.[2]) - parseAmount(b?.[2]));
    const sheets = chunkArray(sortedRows, 20);

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Confonda';
    wb.created = new Date();


    // ─────────────────────────────
    // Create worksheets
    // ─────────────────────────────
    if (sheets.length === 0) {
      const ws = wb.addWorksheet('Ordre 1');
      buildBmceWorksheet({
        ws,
        payrollDate: file.payrollDate ?? '',
        companyName: file.companyName ?? '',
        companyRib: file.companyRib ?? '',
        obs: file.obs ?? '',
        items: [],
      });
    } else {
      sheets.forEach((items, index) => {
        const ws = wb.addWorksheet(`Ordre ${index + 1}`);
        buildBmceWorksheet({
          ws,
          payrollDate: file.payrollDate ?? '',
          companyName: file.companyName ?? '',
          companyRib: file.companyRib ?? '',
          obs: file.obs ?? '',
          items,
        });
      });
    }

    // ─────────────────────────────
    // Safe filename
    // ─────────────────────────────
    const safeName = (file.originalName || 'bmce')
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]+/g, '_');

    const fileName = `${safeName}_BMCE.xlsx`;

    // ─────────────────────────────
    // FORCE REAL DOWNLOAD
    // ─────────────────────────────
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileName}"`
    );
    res.setHeader('Cache-Control', 'no-store');

    await wb.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error('BMCE DOWNLOAD ERROR:', err);
    res.status(500).send('Failed to generate BMCE Excel file.');
  }
};

