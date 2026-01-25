export const generateDemandeFourniturePDF = async (req, res) => {
  const { id } = req.params;
  const demandeId = parseInt(id, 10);

  if (Number.isNaN(demandeId)) {
    return res.status(400).send("ID de demande invalide");
  }

  try {
    const demande = await prisma.demandeFourniture.findUnique({
      where: { id: demandeId },
      include: {
        user: true,
        chantier: true,
        items: true,
      },
    });

    if (!demande) {
      return res.status(404).send("Demande non trouvée");
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=demande_fourniture_${demande.id}.pdf`
    );

    const doc = new PDFDocument({ margin: 0, size: "A4", layout: "landscape" });
    doc.pipe(res);

    const pageWidth = 841.89;
    const pageHeight = 595.28;
    const margin = 24;
    const contentX = margin;
    const contentW = pageWidth - margin * 2;

    const lineColor = "#111111";
    const thin = 0.6;
    const thick = 1.0;

    const logoPath = path.join(__dirname, "../public/img/logo-4.png");

    const fmtDate = (d) => {
      if (!d) return "";
      try {
        return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
      } catch {
        return "";
      }
    };

    const numStr = String(demande.numero ?? demande.id ?? "").padStart(6, "0");
    const demandeDateStr = fmtDate(demande.dateDemande);
    const chantierNom = (demande.chantier?.nom || "").toString();

    const metaCode = "EN 53 02 001";
    const metaVersion = "02";
    const metaDate = "27/01/2016";

    const footerH = 40;
    const signaturesH = 44;
    const footerTopY = pageHeight - footerH;
    const signaturesTopY = footerTopY - signaturesH;
    const tableBottomY = signaturesTopY;

    const headerH = 62;
    const infoH = 26;
    const headerTopY = margin;
    const infoTopY = headerTopY + headerH;
    const tableTopY = infoTopY + infoH;

    // Table column widths (sum = contentW) - landscape gives more room
    const col = {
      code: 55,
      designation: 240,
      unite: 40,
      qteDem: 40,
      qteStock: 40,
      dateAuPlusTot: 50,
      dateAuPlusTard: 50,
      qtePrevu: 40,
      qteRecue: 40,
      lot: 35,
      obs: contentW - (55 + 240 + 40 + 40 + 40 + 50 + 50 + 40 + 40 + 35),
    };

    const x = { start: contentX };
    x.code = x.start;
    x.designation = x.code + col.code;
    x.unite = x.designation + col.designation;
    x.qteDem = x.unite + col.unite;
    x.qteStock = x.qteDem + col.qteDem;
    x.dateAuPlusTot = x.qteStock + col.qteStock;
    x.dateAuPlusTard = x.dateAuPlusTot + col.dateAuPlusTot;
    x.qtePrevu = x.dateAuPlusTard + col.dateAuPlusTard;
    x.qteRecue = x.qtePrevu + col.qtePrevu;
    x.lot = x.qteRecue + col.qteRecue;
    x.obs = x.lot + col.lot;
    x.end = x.obs + col.obs;

    const drawRect = (rx, ry, rw, rh, w = thin) => {
      doc.lineWidth(w).strokeColor(lineColor).rect(rx, ry, rw, rh).stroke();
    };

    const drawHLine = (x1, x2, y1, w = thin) => {
      doc.lineWidth(w).strokeColor(lineColor).moveTo(x1, y1).lineTo(x2, y1).stroke();
    };

    const drawVLine = (x1, y1, y2, w = thin) => {
      doc.lineWidth(w).strokeColor(lineColor).moveTo(x1, y1).lineTo(x1, y2).stroke();
    };

    const drawHeader = () => {
      drawRect(contentX, headerTopY, contentW, headerH, thick);
      const leftW = 70;
      const rightW = 105;
      const centerW = contentW - leftW - rightW;
      const leftX = contentX;
      const centerX = leftX + leftW;
      const rightX = centerX + centerW;
      drawVLine(centerX, headerTopY, headerTopY + headerH, thick);
      drawVLine(rightX, headerTopY, headerTopY + headerH, thick);

      if (fs.existsSync(logoPath)) {
        try {
          doc.image(logoPath, leftX + 10, headerTopY + 8, { width: 46 });
        } catch (e) {
          console.error("Logo error:", e);
        }
      }
      doc.font("Helvetica").fontSize(7).fillColor("#000000")
        .text("CONFONDA", leftX + 10, headerTopY + 50, { width: leftW - 20, align: "center" });

      doc.font("Helvetica-Bold").fontSize(14).fillColor("#000000")
        .text("DEMANDE DE FOURNITURES", centerX, headerTopY + 20, { width: centerW, align: "center" });

      doc.font("Helvetica").fontSize(7.5).fillColor("#000000");
      const metaPadX = 8;
      const metaTop = headerTopY + 10;
      doc.text(`Code :    ${metaCode}`, rightX + metaPadX, metaTop, { width: rightW - metaPadX * 2 });
      doc.text(`Version : ${metaVersion}`, rightX + metaPadX, metaTop + 12, { width: rightW - metaPadX * 2 });
      doc.text(`Date :     ${metaDate}`, rightX + metaPadX, metaTop + 24, { width: rightW - metaPadX * 2 });
      doc.text(`N° :       ${numStr}`, rightX + metaPadX, metaTop + 36, { width: rightW - metaPadX * 2 });
    };

    const drawInfoRow = () => {
      drawRect(contentX, infoTopY, contentW, infoH, thick);
      const leftW = contentW * 0.68;
      const rightW = contentW - leftW;
      const splitX = contentX + leftW;
      drawVLine(splitX, infoTopY, infoTopY + infoH, thick);

      doc.font("Helvetica").fontSize(9).fillColor("#000000");
      doc.text("Code / Chantier :", contentX + 6, infoTopY + 7, { width: 90, align: "left" });
      doc.text(chantierNom || "", contentX + 98, infoTopY + 7, { width: leftW - 104, align: "left", ellipsis: true });
      doc.text("Date :", splitX + 6, infoTopY + 7, { width: 40, align: "left" });
      doc.text(demandeDateStr || "", splitX + 42, infoTopY + 7, { width: rightW - 48, align: "left" });
    };

    const drawTableHeader = (y) => {
      const h1 = 18;
      const h2 = 16;
      const totalH = h1 + h2;
      drawRect(contentX, y, contentW, totalH, thick);
      [x.designation, x.unite, x.qteDem, x.qteStock, x.dateAuPlusTot, x.dateAuPlusTard, x.qtePrevu, x.qteRecue, x.lot, x.obs].forEach(vx => {
        drawVLine(vx, y, y + totalH, thin);
      });
      drawHLine(contentX, x.end, y + h1, thin);
      drawHLine(contentX, x.qteDem, y + h1, thick);
      drawHLine(x.lot, x.end, y + h1, thick);

      doc.font("Helvetica").fontSize(7.5).fillColor("#000000");
      doc.text("Code\narticle", x.code + 2, y + 4, { width: col.code - 4, align: "center" });
      doc.text("Designations", x.designation + 2, y + 6, { width: col.designation - 4, align: "center" });
      doc.text("Unité", x.unite + 2, y + 6, { width: col.unite - 4, align: "center" });
      doc.text("Quantités", x.qteDem + 2, y + 4, { width: col.qteDem + col.qteStock - 4, align: "center" });
      doc.text("Date de livraison", x.dateAuPlusTot + 2, y + 4, { width: col.dateAuPlusTot + col.dateAuPlusTard - 4, align: "center" });
      doc.text("Quantités", x.qtePrevu + 2, y + 4, { width: col.qtePrevu + col.qteRecue - 4, align: "center" });
      doc.text("LOT", x.lot + 2, y + 6, { width: col.lot - 4, align: "center" });
      doc.text("Recommandations et Observations", x.obs + 2, y + 4, { width: col.obs - 4, align: "center" });

      doc.font("Helvetica").fontSize(7.2).fillColor("#000000");
      doc.text("Demandées", x.qteDem + 1, y + h1 + 4, { width: col.qteDem - 2, align: "center" });
      doc.text("Stockées", x.qteStock + 1, y + h1 + 4, { width: col.qteStock - 2, align: "center" });
      doc.text("Au plutôt", x.dateAuPlusTot + 1, y + h1 + 4, { width: col.dateAuPlusTot - 2, align: "center" });
      doc.text("Au plus tard", x.dateAuPlusTard + 1, y + h1 + 4, { width: col.dateAuPlusTard - 2, align: "center" });
      doc.text("Prévu", x.qtePrevu + 1, y + h1 + 4, { width: col.qtePrevu - 2, align: "center" });
      doc.text("Reçue", x.qteRecue + 1, y + h1 + 4, { width: col.qteRecue - 2, align: "center" });

      return y + totalH;
    };

    const drawTableRow = (y, item, rowH) => {
      // No borders per row (open look)
      doc.font("Helvetica").fontSize(8.5).fillColor("#000000");
      const codeTxt = (item.code || "").toString();
      const desTxt = (item.designation || "").toString();
      const uniteTxt = (item.unité || item.unite || "").toString();
      const qteTxt = (item.quantité || item.quantite || "").toString();
      const auPlutotTxt = (item.auPlutot || "").toString();
      const auPlutartTxt = (item.auPlutart || "").toString();
      const lotTxt = (item.lot || "").toString();
      const obsTxt = (item.observation || "").toString();

      doc.text(codeTxt, x.code + 2, y + 4, { width: col.code - 4, align: "left", ellipsis: true });
      doc.text(desTxt, x.designation + 2, y + 4, { width: col.designation - 4, align: "left", ellipsis: true });
      doc.text(uniteTxt, x.unite + 2, y + 4, { width: col.unite - 4, align: "center", ellipsis: true });
      doc.text(qteTxt, x.qteDem + 2, y + 4, { width: col.qteDem - 4, align: "center", ellipsis: true });
      doc.text("", x.qteStock + 2, y + 4, { width: col.qteStock - 4, align: "center" });
      doc.text(auPlutotTxt, x.dateAuPlusTot + 2, y + 4, { width: col.dateAuPlusTot - 4, align: "center", ellipsis: true });
      doc.text(auPlutartTxt, x.dateAuPlusTard + 2, y + 4, { width: col.dateAuPlusTard - 4, align: "center", ellipsis: true });
      doc.text("", x.qtePrevu + 2, y + 4, { width: col.qtePrevu - 4, align: "center" });
      doc.text("", x.qteRecue + 2, y + 4, { width: col.qteRecue - 4, align: "center" });
      doc.text(lotTxt, x.lot + 2, y + 4, { width: col.lot - 4, align: "center", ellipsis: true });
      doc.text(obsTxt, x.obs + 2, y + 4, { width: col.obs - 4, align: "left", ellipsis: true });

      return y + rowH;
    };

    const drawSignatures = () => {
      drawRect(contentX, signaturesTopY, contentW, signaturesH, thick);
      const w = contentW / 4;
      for (let i = 1; i < 4; i++) {
        drawVLine(contentX + w * i, signaturesTopY, signaturesTopY + signaturesH, thick);
      }
      doc.font("Helvetica").fontSize(8.5).fillColor("#000000");
      doc.text("Magasinier", contentX, signaturesTopY + signaturesH - 14, { width: w, align: "center" });
      doc.text("Conducteur des travaux", contentX + w, signaturesTopY + signaturesH - 14, { width: w, align: "center" });
      doc.text("Chef Chantier", contentX + w * 2, signaturesTopY + signaturesH - 14, { width: w, align: "center" });
      doc.text("Service Approvisionnement", contentX + w * 3, signaturesTopY + signaturesH - 14, { width: w, align: "center" });
    };

    const drawFooter = () => {
      drawRect(contentX, footerTopY, contentW, footerH, thick);
    };

    const drawPageFrame = () => {
      drawHeader();
      drawInfoRow();
      drawSignatures();
      drawFooter();
    };

    const items = Array.isArray(demande.items) ? demande.items : [];

    const startNewPage = () => {
      doc.addPage();
      drawPageFrame();
      return drawTableHeader(tableTopY);
    };

    drawPageFrame();
    let y = drawTableHeader(tableTopY);

    const rowH = 20;
    for (let i = 0; i < items.length; i++) {
      if (y + rowH > tableBottomY) {
        y = startNewPage();
      }
      y = drawTableRow(y, items[i], rowH);
    }

    // Fill remaining space with empty rows to match the form look
    while (y + rowH <= tableBottomY) {
      y = drawTableRow(y, {}, rowH);
    }

    doc.end();
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Erreur lors de la génération du PDF");
  }
};
