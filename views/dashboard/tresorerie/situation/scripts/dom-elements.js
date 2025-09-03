/**
 * Defines DOM elements for the financial dashboard
 */
const elements = {
  resetDateBtn: document.getElementById('resetDateBtn'),
  dateInput: document.getElementById('toDate'),
  statutFilterEffets: document.getElementById('statutFilterEffets'),
  fournisseurFilterEffets: document.getElementById('fournisseurFilterEffets'),
  banqueFilterEffets: document.getElementById('banqueFilterEffets'),
  resetButton: document.getElementById('resetFilters'),
  effetsTable: document.getElementById('effetsTable'),
  totalMontant: document.getElementById('totalMontant'),
  statutFilterCheques: document.getElementById('statutFilterCheques'),
  fournisseurFilterCheques: document.getElementById('fournisseurFilterCheques'),
  banqueFilterCheques: document.getElementById('banqueFilterCheques'),
  statutFilterPayavenirs: document.getElementById('statutFilterPaiment'),
  fournisseurFilterPayavenirs: document.getElementById('fournisseurFilterPaiment'),
  banqueFilterPayavenirs: document.getElementById('banqueFilterPaiment'),
  statutFilterRecavenirs: document.getElementById('statutFilterRecette'),
  clientFilterRecavenirs: document.getElementById('clientFilterRecette'),
  banqueFilterRecavenirs: document.getElementById('banqueFilterRecette'),
  soldeInputs: document.querySelectorAll('input[name="positive[]"], input[name="negative[]"], input[name="dmlt[]"]'),
  chequesRows: document.querySelectorAll('.cheque-row'),
  effetsRows: document.querySelectorAll('.effet-row'),
  payavenirsRows: document.querySelectorAll('.payavenir-row'),
  recavenirsRows: document.querySelectorAll('.recavenir-row')
};

export default elements;