/**
 * Filter functions for financial dashboard tables
 */
import elements from './dom-elements.js';
import { updateTotal, updateGeneralTotal } from './totals.js';

const filterRows = (rows, statutSelect, fournisseurSelect, banqueSelect, clientSelect, tableId, noResultsId, updateTotalFn) => {
  const selectedStatut = statutSelect?.value.toLowerCase() || '';
  const selectedFournisseur = fournisseurSelect?.value.toLowerCase() || '';
  const selectedBanque = banqueSelect?.value.toLowerCase() || '';
  const selectedClient = clientSelect?.value.toLowerCase() || '';
  let visibleRowCount = 0;

  rows.forEach(row => {
    const rowStatut = row.getAttribute('data-statut')?.toLowerCase() || '';
    const rowFournisseur = row.getAttribute('data-fournisseur')?.toLowerCase() || '';
    const rowBanque = row.getAttribute('data-banque')?.toLowerCase() || '';
    const rowClient = row.getAttribute('data-client')?.toLowerCase() || '';

    const showStatut = !selectedStatut || rowStatut === selectedStatut;
    const showFournisseur = !selectedFournisseur || rowFournisseur === selectedFournisseur;
    const showBanque = !selectedBanque || rowBanque === selectedBanque;
    const showClient = !selectedClient || rowClient === selectedClient;

    row.style.display = (showStatut && showFournisseur && showBanque && showClient) ? '' : 'none';
    if (row.style.display === '') visibleRowCount++;
  });

  const tbody = document.querySelector(`#${tableId} tbody`);
  let msg = document.getElementById(noResultsId);
  if (visibleRowCount === 0) {
    if (!msg) {
      msg = document.createElement('tr');
      msg.id = noResultsId;
      msg.innerHTML = `<td colspan="7" class="text-muted text-center">Aucun élément trouvé pour ce filtre.</td>`;
      tbody.appendChild(msg);
    }
  } else if (msg) {
    msg.remove();
  }

  updateTotalFn?.();
};

const setupFilters = () => {
  const filterConfigs = [
    {
      rows: elements.chequesRows,
      statut: elements.statutFilterCheques,
      fournisseur: elements.fournisseurFilterCheques,
      banque: elements.banqueFilterCheques,
      tableId: 'chequesTable',
      noResultsId: 'noChequeMsg',
      updateTotal: () => updateTotal(elements.chequesRows, 'totalMontantCellCheques', 'displayTotalCheques')
    },
    {
      rows: elements.effetsRows,
      statut: elements.statutFilterEffets,
      fournisseur: elements.fournisseurFilterEffets,
      banque: elements.banqueFilterEffets,
      tableId: 'effetsTable',
      noResultsId: 'noPayavenirMsg',
      updateTotal: () => updateTotal(elements.effetsRows, 'totalMontantCellEffets', 'displayTotalEffets')
    },
    {
      rows: elements.payavenirsRows,
      statut: elements.statutFilterPayavenirs,
      fournisseur: elements.fournisseurFilterPayavenirs,
      banque: elements.banqueFilterPayavenirs,
      tableId: 'payavenirsTable',
      noResultsId: 'noPayavenirMsg',
      updateTotal: () => updateTotal(elements.payavenirsRows, 'totalMontantCellPayavenirs', 'displayTotalPayavenirs')
    },
    {
      rows: elements.recavenirsRows,
      statut: elements.statutFilterRecavenirs,
      client: elements.clientFilterRecavenirs,
      banque: elements.banqueFilterRecavenirs,
      tableId: 'recavenirsTable',
      noResultsId: 'noRecavenirMsg',
      updateTotal: () => updateTotal(elements.recavenirsRows, 'totalMontantCellRecavenirs', 'displayTotalRecavenirs')
    }
  ];

  filterConfigs.forEach(config => {
    config.statut?.addEventListener('change', () => {
      filterRows(
        config.rows,
        config.statut,
        config.fournisseur,
        config.banque,
        config.client,
        config.tableId,
        config.noResultsId,
        () => {
          config.updateTotal();
          updateGeneralTotal();
        }
      );
    });
    config.fournisseur?.addEventListener('change', () => {
      filterRows(
        config.rows,
        config.statut,
        config.fournisseur,
        config.banque,
        config.client,
        config.tableId,
        config.noResultsId,
        () => {
          config.updateTotal();
          updateGeneralTotal();
        }
      );
    });
    config.banque?.addEventListener('change', () => {
      filterRows(
        config.rows,
        config.statut,
        config.fournisseur,
        config.banque,
        config.client,
        config.tableId,
        config.noResultsId,
        () => {
          config.updateTotal();
          updateGeneralTotal();
        }
      );
    });
    config.client?.addEventListener('change', () => {
      filterRows(
        config.rows,
        config.statut,
        config.fournisseur,
        config.banque,
        config.client,
        config.tableId,
        config.noResultsId,
        () => {
          config.updateTotal();
          updateGeneralTotal();
        }
      );
    });
  });

  elements.resetButton?.addEventListener('click', () => {
    filterConfigs.forEach(config => {
      config.statut.value = '';
      config.fournisseur && (config.fournisseur.value = '');
      config.banque && (config.banque.value = '');
      config.client && (config.client.value = '');
      filterRows(
        config.rows,
        config.statut,
        config.fournisseur,
        config.banque,
        config.client,
        config.tableId,
        config.noResultsId,
        config.updateTotal
      );
    });
    updateGeneralTotal();
  });

  filterConfigs.forEach(config => {
    filterRows(
      config.rows,
      config.statut,
      config.fournisseur,
      config.banque,
      config.client,
      config.tableId,
      config.noResultsId,
      config.updateTotal
    );
  });
  updateGeneralTotal();
};

export { filterRows, setupFilters };