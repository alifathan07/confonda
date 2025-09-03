/**
 * Functions for updating totals in the financial dashboard
 */
import elements from './dom-elements.js';
import { parseFrenchNumber, formatFrenchNumber } from './helpers.js';

const updateTotal = (rows, totalCellId, displayTotalId) => {
  let total = 0;
  rows.forEach(row => {
    if (row.style.display !== 'none') {
      const montantCell = row.querySelector('.montant');
      if (montantCell) {
        total += parseFrenchNumber(montantCell.textContent);
      }
    }
  });

  const totalCell = document.getElementById(totalCellId);
  if (totalCell) {
    totalCell.textContent = formatFrenchNumber(total);
  }

  const displayTotal = document.getElementById(displayTotalId);
  if (displayTotal) {
    displayTotal.textContent = formatFrenchNumber(total);
  }
};

const updateGeneralTotal = () => {
  const chequesTotal = parseFrenchNumber(document.getElementById('displayTotalCheques')?.textContent) || 0;
  const effetsTotal = parseFrenchNumber(document.getElementById('displayTotalEffets')?.textContent) || 0;
  const payavenirsTotal = parseFrenchNumber(document.getElementById('displayTotalPayavenirs')?.textContent) || 0;
  const generalTotal = chequesTotal + effetsTotal + payavenirsTotal;

  const displayGeneralTotal = document.getElementById('displayTotalGeneral');
  if (displayGeneralTotal) {
    displayGeneralTotal.textContent = formatFrenchNumber(generalTotal);
  }
};

const setupSoldeInputs = () => {
  elements.soldeInputs.forEach(input => {
    input.addEventListener('input', () => {
      const id = input.dataset.banqueId;
      const enCirculationCell = document.querySelector(`.en-circulation[data-banque-id="${id}"]`);
      const totalCell = document.querySelector(`.total-solde[data-banque-id="${id}"]`);
      
      if (enCirculationCell && totalCell) {
        const enteredSolde = parseFrenchNumber(input.value);
        const enCirculation = parseFrenchNumber(enCirculationCell.textContent);
        const total = enteredSolde + enCirculation;
        totalCell.textContent = formatFrenchNumber(total);
        totalCell.classList.toggle('text-danger', total < 0);
        totalCell.classList.toggle('text-success', total >= 0);
      }
    });
  });
};

export { updateTotal, updateGeneralTotal, setupSoldeInputs };