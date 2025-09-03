/**
 * Main script to initialize the financial dashboard
 */
import elements from './dom-elements.js';
import { setupFilters } from './filters.js';
import { setupSoldeInputs, updateGeneralTotal } from './totals.js';

document.addEventListener('DOMContentLoaded', () => {
  elements.resetDateBtn?.addEventListener('click', () => {
    elements.dateInput.value = '';
    elements.dateInput.form.submit();
  });

  setupSoldeInputs();
  setupFilters();
  updateGeneralTotal();
});