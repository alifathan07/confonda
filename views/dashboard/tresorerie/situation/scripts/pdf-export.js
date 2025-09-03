
import { parseFrenchNumber, formatFrenchNumber } from './helpers.js';
import elements from './dom-elements.js';

const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
};

const generatePDF = (title, rows, headers, filename, columnWidths) => {
  const loadingMsg = document.createElement('div');
  loadingMsg.innerHTML = `<div class="alert alert-info">Génération du PDF ${title.toLowerCase()}...</div>`;
  document.body.appendChild(loadingMsg);

  loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')
    .then(() => {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('l', 'mm', 'a4');

      pdf.setFontSize(18);
      pdf.setTextColor(0, 0, 128);
      pdf.text(title, 20, 20);

      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 20, 30);

      const data = [];
      let totalAmount = 0;

      rows.forEach(row => {
        if (row.style.display !== 'none') {
          const cells = row.querySelectorAll('td');
          if (cells.length >= headers.length) {
            const montantValue = parseFrenchNumber(cells[1].textContent.trim());
            totalAmount += montantValue;
            data.push(cells.map(cell => cell.textContent.trim()));
          }
        }
      });

      let yPosition = 45;
      const startX = 15;
      const cellHeight = 8;

      pdf.setFontSize(9);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(255, 255, 255);

      let currentX = startX;
      headers.forEach((header, index) => {
        pdf.setFillColor(0, 102, 204);
        pdf.rect(currentX, yPosition - 6, columnWidths[index], cellHeight, 'F');
        pdf.text(header, currentX + 1, yPosition);
        currentX += columnWidths[index];
      });
      yPosition += cellHeight;

      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(0, 0, 0);

      data.forEach(row => {
        if (yPosition > 180) {
          pdf.addPage();
          yPosition = 20;
          currentX = startX;
          pdf.setFont(undefined, 'bold');
          pdf.setTextColor(255, 255, 255);
          headers.forEach((header, index) => {
            pdf.setFillColor(0, 102, 204);
            pdf.rect(currentX, yPosition - 6, columnWidths[index], cellHeight, 'F');
            pdf.text(header, currentX + 1, yPosition);
            currentX += columnWidths[index];
          });
          yPosition += cellHeight;
          pdf.setFont(undefined, 'normal');
          pdf.setTextColor(0, 0, 0);
        }

        currentX = startX;
        row.forEach((cell, index) => {
          const maxLength = index === 3 || index === 5 ? 20 : 15;
          const displayText = cell.length > maxLength ? cell.substring(0, maxLength) + '...' : cell;
          pdf.setDrawColor(0, 102, 204);
          pdf.rect(currentX, yPosition - 6, columnWidths[index], cellHeight);
          pdf.text(displayText, currentX + 1, yPosition);
          currentX += columnWidths[index];
        });
        yPosition += cellHeight;
      });

      yPosition += 5;
      pdf.setDrawColor(0, 102, 204);
      pdf.line(startX, yPosition, startX + 70, yPosition);
      yPosition += 8;
      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(10);
      pdf.text(`Total: ${formatFrenchNumber(totalAmount)} MAD`, startX, yPosition);

      yPosition += 15;
      pdf.setFontSize(8);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Nombre d'éléments: ${data.length}`, startX, yPosition);

      pdf.save(filename);
      document.body.removeChild(loadingMsg);
    })
    .catch(error => {
      console.error('Error:', error);
      document.body.removeChild(loadingMsg);
      alert(`Erreur lors de la génération du PDF: ${error.message}`);
    });
};

const downloadChequesPDF = () => {
  generatePDF(
    'Chèques à payer',
    elements.chequesRows,
    ['Numéro', 'Montant', 'Date Échéance', 'Bénéficiaire', 'Banque', 'Statut', 'Observation'],
    'cheques-a-payer.pdf',
    [30, 30, 30, 50, 40, 30, 50]
  );
};

const downloadEffetsPDF = () => {
  generatePDF(
    'Effets à payer',
    elements.effetsRows,
    ['Numéro', 'Montant', 'Date Échéance', 'Bénéficiaire', 'Banque', 'Statut'],
    'effets-a-payer.pdf',
    [30, 30, 30, 50, 40, 30]
  );
};

const downloadPayavenirsPDF = () => {
  generatePDF(
    'Paiements à venir',
    elements.payavenirsRows,
    ['Désignation', 'Montant', 'Date Échéance', 'Statut', 'Date Paiement', 'Fournisseur', 'Banque'],
    'paiements-a-venir.pdf',
    [50, 30, 30, 30, 30, 50, 40]
  );
};

const downloadRecettesPDF = () => {
  generatePDF(
    'Recettes à venir',
    elements.recavenirsRows,
    ['Client', 'Désignation', 'Montant', 'Date Échéance', 'Statut', 'Banque'],
    'recettes-a-venir.pdf',
    [50, 50, 30, 30, 30, 40]
  );
};

const downloadFullPagePDF = () => {
  const loadingMsg = document.createElement('div');
  loadingMsg.innerHTML = '<div class="alert alert-info">Génération du PDF complet...</div>';
  document.body.appendChild(loadingMsg);

  loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')
    .then(() => {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('l', 'mm', 'a4');

      pdf.setFontSize(18);
      pdf.setTextColor(0, 0, 128);
      pdf.text('Situation Bancaire Complète', 20, 20);

      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 20, 30);

      let yPosition = 40;
      const startX = 15;
      const cellHeight = 8;

      const addTable = (title, rows, headers, columnWidths) => {
        pdf.setFontSize(14);
        pdf.setTextColor(0, 0, 128);
        pdf.text(title, 20, yPosition);
        yPosition += 10;

        const data = [];
        let totalAmount = 0;

        rows.forEach(row => {
          if (row.style.display !== 'none') {
            const cells = row.querySelectorAll('td');
            if (cells.length >= headers.length) {
              const montantValue = parseFrenchNumber(cells[1].textContent.trim());
              totalAmount += montantValue;
              data.push(cells.map(cell => cell.textContent.trim()));
            }
          }
        });

        pdf.setFontSize(9);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(255, 255, 255);

        let currentX = startX;
        headers.forEach((header, index) => {
          pdf.setFillColor(0, 102, 204);
          pdf.rect(currentX, yPosition - 6, columnWidths[index], cellHeight, 'F');
          pdf.text(header, currentX + 1, yPosition);
          currentX += columnWidths[index];
        });
        yPosition += cellHeight;

        pdf.setFont(undefined, 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(0, 0, 0);

        data.forEach(row => {
          if (yPosition > 180) {
            pdf.addPage();
            yPosition = 20;
            currentX = startX;
            pdf.setFont(undefined, 'bold');
            pdf.setTextColor(255, 255, 255);
            headers.forEach((header, index) => {
              pdf.setFillColor(0, 102, 204);
              pdf.rect(currentX, yPosition - 6, columnWidths[index], cellHeight, 'F');
              pdf.text(header, currentX + 1, yPosition);
              currentX += columnWidths[index];
            });
            yPosition += cellHeight;
            pdf.setFont(undefined, 'normal');
            pdf.setTextColor(0, 0, 0);
          }

          currentX = startX;
          row.forEach((cell, index) => {
            const maxLength = index === 3 || index === 5 ? 20 : 15;
            const displayText = cell.length > maxLength ? cell.substring(0, maxLength) + '...' : cell;
            pdf.setDrawColor(0, 102, 204);
            pdf.rect(currentX, yPosition - 6, columnWidths[index], cellHeight);
            pdf.text(displayText, currentX + 1, yPosition);
            currentX += columnWidths[index];
          });
          yPosition += cellHeight;
        });

        yPosition += 5;
        pdf.setDrawColor(0, 102, 204);
        pdf.line(startX, yPosition, startX + 70, yPosition);
        yPosition += 8;
        pdf.setFont(undefined, 'bold');
        pdf.setFontSize(10);
        pdf.text(`Total: ${formatFrenchNumber(totalAmount)} MAD`, startX, yPosition);

        yPosition += 15;
        pdf.setFontSize(8);
        pdf.setFont(undefined, 'normal');
        pdf.text(`Nombre d'éléments: ${data.length}`, startX, yPosition);
        yPosition += 20;
      };

      addTable(
        'Chèques à payer',
        elements.chequesRows,
        ['Numéro', 'Montant', 'Date Échéance', 'Bénéficiaire', 'Banque', 'Statut', 'Observation'],
        [30, 30, 30, 50, 40, 30, 50]
      );

      addTable(
        'Effets à payer',
        elements.effetsRows,
        ['Numéro', 'Montant', 'Date Échéance', 'Bénéficiaire', 'Banque', 'Statut'],
        [30, 30, 30, 50, 40, 30]
      );

      addTable(
        'Paiements à venir',
        elements.payavenirsRows,
        ['Désignation', 'Montant', 'Date Échéance', 'Statut', 'Date Paiement', 'Fournisseur', 'Banque'],
        [50, 30, 30, 30, 30, 50, 40]
      );

      addTable(
        'Recettes à venir',
        elements.recavenirsRows,
        ['Client', 'Désignation', 'Montant', 'Date Échéance', 'Statut', 'Banque'],
        [50, 50, 30, 30, 30, 40]
      );

      pdf.save('situation-bancaire-complete.pdf');
      document.body.removeChild(loadingMsg);
    })
    .catch(error => {
      console.error('Error:', error);
      document.body.removeChild(loadingMsg);
      alert(`Erreur lors de la génération du PDF: ${error.message}`);
    });
};

export { generatePDF, downloadChequesPDF, downloadEffetsPDF, downloadPayavenirsPDF, downloadRecettesPDF, downloadFullPagePDF };