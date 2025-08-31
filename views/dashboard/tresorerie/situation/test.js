<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
  <meta name="description" content="Situation Bancaire" />
  <meta name="author" content="Confonda" />
  <title>Situation Bancaire</title>
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" rel="stylesheet" type="text/css" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&display=swap" rel="stylesheet" />
  <link href="/css/sb-admin-2.min.css" rel="stylesheet" />
  <style>
    :root {
      --primary-color: #ab3029;
      --second-color: #e97872;
      --secondary-color: #6b7280;
      --success-color: #22c55e;
      --warning-color: #facc15;
      --danger-color: #ef4444;
      --info-color: #3b82f6;
      --light-color: #f8f9fa;
      --dark-color: #1f2937;
      --border-radius: 4px;
      --shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    * {
      font-family: 'Inter', sans-serif;
      box-sizing: border-box;
    }

    body {
      background: var(--light-color);
      min-height: 100vh;
      margin: 0;
    }

    .container-fluid {
      padding: 1rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .card {
      border: 1px solid #dee2e6;
      border-radius: var(--border-radius);
      background: white;
      box-shadow: var(--shadow);
    }

    .card-header {
      background: var(--primary-color);
      color: white;
      border-bottom: 1px solid #dee2e6;
      padding: 0.75rem;
      border-radius: var(--border-radius) var(--border-radius) 0 0;
    }

    .card-header h2 {
      font-size: 1.1rem;
      font-weight: 400;
      margin: 0;
    }

    .card-body {
      padding: 1rem;
    }

    .page-title {
      color: var(--dark-color);
      font-size: 1.5rem;
      font-weight: 400;
      text-align: center;
      margin-bottom: 1rem;
    }

    .excel-table {
      border-collapse: collapse;
      width: 100%;
      font-size: 0.875rem;
      min-width: 600px;
      border: 1px solid #dee2e6;
    }

    .excel-table th {
      background: var(--second-color);
      color: white;
      font-weight: 400;
      padding: 0.5rem;
      text-align: left;
      font-size: 0.75rem;
      text-transform: uppercase;
      border: 1px solid #dee2e6;
    }

    .excel-table td {
      padding: 0.5rem;
      border: 1px solid #dee2e6;
      background: white;
    }

    .excel-table tfoot td {
      background: var(--light-color);
      color: var(--dark-color);
      font-weight: 400;
      border: 1px solid #dee2e6;
    }

    .form-control {
      border: 1px solid #dee2e6;
      border-radius: 4px;
      padding: 0.5rem;
      font-size: 0.875rem;
    }

    .form-control:focus {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
      outline: none;
    }

    .btn {
      border-radius: 4px;
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      font-weight: 400;
      border: none;
      cursor: pointer;
    }

    .btn-primary {
      background: var(--primary-color);
      color: white;
    }

    .btn-primary:hover {
      background: #2563eb;
    }

    .btn-success {
      background: var(--success-color);
      color: white;
    }

    .btn-success:hover {
      background: #16a34a;
    }

    .btn-warning {
      background: var(--warning-color);
      color: var(--dark-color);
    }

    .btn-warning:hover {
      background: #eab308;
    }

    .btn-info {
      background: var(--info-color);
      color: white;
    }

    .btn-info:hover {
      background: #2563eb;
    }

    .btn-danger {
      background: var(--danger-color);
      color: white;
      border-radius: 50%;
      width: 28px;
      height: 28px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .btn-danger:hover {
      background: #dc2626;
    }

    .stats-card {
      background: white;
      border: 1px solid #dee2e6;
      border-radius: var(--border-radius);
      padding: 1rem;
      box-shadow: var(--shadow);
    }

    .stats-card .stats-number {
      font-size: 1.25rem;
      font-weight: 400;
      color: var(--dark-color);
    }

    .stats-card .stats-label {
      font-size: 0.75rem;
      color: var(--secondary-color);
      text-transform: uppercase;
    }

    .stats-card .stats-icon {
      font-size: 1.5rem;
      color: var(--secondary-color);
      margin-bottom: 0.5rem;
      display: block;
    }

    .filter-section {
      background: white;
      border: 1px solid #dee2e6;
      border-radius: var(--border-radius);
      padding: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .form-inline {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;
    }

    .form-inline label {
      font-size: 0.875rem;
      color: var(--dark-color);
    }

    .modal-content {
      border: 1px solid #dee2e6;
      border-radius: var(--border-radius);
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
    }

    .modal-header {
      background: var(--primary-color);
      color: white;
      border-bottom: 1px solid #dee2e6;
      border-radius: var(--border-radius) var(--border-radius) 0 0;
    }

    .modal-title {
      font-size: 1.1rem;
      font-weight: 400;
    }

    .modal-body,
    .modal-footer {
      padding: 1rem;
    }

    .modal-footer {
      border-top: 1px solid #dee2e6;
    }

    .badge {
      padding: 0.3rem 0.5rem;
      font-size: 0.75rem;
      font-weight: 400;
      border-radius: 4px;
    }

    .badge-success { background: var(--success-color); color: white; }
    .badge-warning { background: var(--warning-color); color: var(--dark-color); }
    .badge-danger { background: var(--danger-color); color: white; }
    .badge-info { background: var(--info-color); color: white; }

    /* Responsive Design */
    @media (max-width: 768px) {
      .container-fluid {
        padding: 0.5rem;
      }

      .page-title {
        font-size: 1.25rem;
      }

      .excel-table {
        font-size: 0.75rem;
      }

      .excel-table th,
      .excel-table td {
        padding: 0.4rem;
      }

      .form-control,
      .btn {
        width: 100%;
        margin-bottom: 0.5rem;
      }

      .form-inline {
        flex-direction: column;
        align-items: stretch;
      }

      .stats-card {
        text-align: center;
      }

      .row > [class*="col-"] {
        flex: 0 0 100%;
        max-width: 100%;
      }
    }

    @media (max-width: 576px) {
      .excel-table th,
      .excel-table td {
        font-size: 0.7rem;
        padding: 0.3rem;
      }

      .stats-card .stats-number {
        font-size: 1rem;
      }

      .card-header h2 {
        font-size: 1rem;
      }
    }

    @media (min-width: 768px) {
      .row > [class*="col-md-3"] {
        flex: 0 0 25%;
        max-width: 25%;
      }
    }

    .row {
      display: flex;
      flex-wrap: wrap;
      margin: -0.5rem;
    }

    .row > [class*="col-"] {
      padding: 0.5rem;
    }

    .table-responsive {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    .fade-in {
      animation: fadeIn 0.3s ease-in;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @media print {
      .btn, .modal, .filter-section {
        display: none;
      }
      .card {
        border: 1px solid #dee2e6;
        box-shadow: none;
      }
    }
  </style>
</head>
<body id="page-top"> 
  <div id="wrapper">
    <%- include('../../../layouts/sidebar') %>
    <div id="content-wrapper" class="d-flex flex-column">
      <div id="content">
        <%- include('../../../layouts/topbar') %>
        <div class="container-fluid">
          <h1 class="page-title fade-in">Situation Bancaire</h1>
          <div class="filter-section">
            <form class="form-inline">
              <label>Au :</label>
              <input type="date" name="to" id="toDate" class="form-control" value="<%= to %>">
          
              <button class="btn btn-primary" type="submit" aria-label="Filtrer">Filtrer</button>
              
              <label>Statut :</label>
              <select id="statutFilterCheques" class="form-control">
                <option value="">Tous</option>
                <option value="En circulation">En Circulation</option>
                <option value="Impayé">Impayé</option>
              </select>
          
              <label>Fournisseur :</label>
              <select id="fournisseurFilterCheques" class="form-control">
                <option value="">Tous</option>
                <% fournisseurs.forEach(f => { %>
                  <option value="<%= f.name %>"><%= f.name %></option>
                <% }) %>
              </select>
          
              <label>Banque :</label>
              <select id="banqueFilterCheques" class="form-control">
                <option value="">Tous</option>
                <% banques.forEach(b => { %>
                  <option value="<%= b.name %>"><%= b.name %></option>
                <% }) %>
              </select>
          
              <button class="btn btn-primary" type="button" aria-label="Annuler filtre" id="resetDateBtn">
                Annuler
              </button>
          
              <input type="date" name="from" class="form-control" value="01/01/2020" hidden>
            </form>
          </div>
          <!-- Daily Solde Input Table -->
          <form id="soldeForm" action="/tresorerie/situation" method="POST">
            <div class="card mb-4 fade-in">
              <div class="card-header">
                <h2>Soldes Bancaires</h2>
              </div>
              <div class="card-body">
                <div class="table-responsive">
                  <table class="excel-table">
                    <thead>
                      <tr>
                        <th>Banque</th>
                        <th>Solde Positif</th>
                        <th>Solde Négatif</th>
                        <th></th>
                        <th>Dette MLT</th>
                      </tr>
                    </thead>
                   <tbody>
  <% banques.forEach((b, index) => { %>
    <tr>
      <td><strong><%= b.name %></strong></td>
      <td>
        <input 
          type="text" 
          name="positive[]" 
          value="<%= b.positive != null ?  b.positive.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\u202F/g, ' ') 
          : '' %>"
          class="form-control text-right" 
        />
      </td>
      <td>
        <input 
          type="text" 
          name="negative[]" 
          value="<%= b.negative != null ? b.negative.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\u202F/g, ' ') 
          : '' %>"  
          class="form-control text-right" 
        />
      </td>
      <td></td>
      <td>
        <input 
        type="text" 
        name="dmlt[]" 
        value="<%= b.dmlt != null 
          ? b.dmlt.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\u202F/g, ' ') 
          : '' %>" 
        class="form-control text-right" 
      />
      
      </td>
      <input type="hidden" name="banqueId[]" value="<%= b.id %>" />
    </tr>
  <% }); %>
</tbody>

  <tfoot>
    <tr>
      <td>Total</td>
      <td>
        <input type="text" name="totalPositive" class="form-control text-right" 
        value="<%= (banques.reduce((acc, b) => acc + b.positive, 0))
        .toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        .replace(/\u202F/g, ' ') %>"
       readonly />
      </td>
      <td>
        <input type="text" name="totalNegative" class="form-control text-right" 
          value="<%= (banques.reduce((acc, b) => acc + b.negative, 0))
          .toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          .replace(/\u202F/g, ' ') %>" readonly />
      </td>
      <td></td>
      <td>
        <input type="text" name="totalDmlt" class="form-control text-right" 
          value="<%= (banques.reduce((acc, b) => acc + b.dmlt, 0))
         .toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
         .replace(/\u202F/g, ' ')  %>" readonly />
      </td>
      <td></td>
    </tr>
  </tfoot>
                  </table>
                </div>
              </div>
              <div class="card-footer d-flex justify-content-end gap-2">
                <button type="submit" class="btn btn-primary" hidden>Mettre à jour</button>
              </div>
            </div>
          </form>

          <!-- Recettes à venir -->
          <div class="card mb-4 fade-in">
            <div class="card-header">
              <h2>Recettes à venir</h2>
            </div>
            <div class="filter-section">
              <form class="form-inline">
               
               
                <a href="/tresorerie/recettes_a_venir" class="btn btn-primary" type="button" aria-label="Annuler filtre">Ajouter une recette </a>
              </form>
            </div>
            <div class="card-body">
              <% if (recavenirs.length === 0) { %>
                <p class="text-center text-muted">Aucune recette à venir.</p>
              <% } else { %>
                <div class="table-responsive">
                  <table id="recavenirsTable" class="excel-table">
                    <thead>
                      <tr>
                        <th>Client</th>
                        <th>Désignation</th>
                        <th>Montant</th>
                        <th>Date Échéance</th>
                        <th>Statut</th>
                        <th>Banque</th>
                      </tr>
                    </thead>
                    <tbody>
                      <% recavenirs.forEach(c => { %>
                        <tr class="recavenir-row" data-client="<%= c.client.name %>" data-banque="<%= c.banque.name %>" data-statut="<%= c.statut %>">
                          <td><%= c.client.name %></td>
                          <td><%= c.designation %></td>
                          <td class="text-right"><%= c.montant.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\u202F/g, ' ') %> MAD</td>
                          <td><%= new Date(c.dateEcheance).toLocaleDateString() %></td>
                          <td>
                            <span class="badge badge-<%= c.statut === 'échu' ? 'warning' : c.statut === 'impayé' ? 'danger' : 'success' %>">
                              <%= c.statut %>
                            </span>
                          </td>
                          <td><%= c.banque.name %></td>
                        </tr>
                      <% }); %>
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colspan="2">Total</td>
                        <td class="text-right"><%= recavenirs.reduce((acc, c) => acc + c.montant, 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\u202F/g, ' ') %> MAD</td>
                        <td colspan="3"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              <% } %>
            </div>
          </div>

          <!-- Total Général -->
          

          <!-- Banque Modal -->
          <div class="modal fade" id="banqueModal" tabindex="-1" role="dialog" aria-labelledby="banqueModalLabel" aria-hidden="true">
            <div class="modal-dialog" role="document">
              <form id="banqueForm" action="/tresorerie/situation/create/banque" method="POST">
                <div class="modal-content">
                  <div class="modal-header">
                    <h5 class="modal-title" id="banqueModalLabel">Ajouter une Banque</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Fermer">
                      <span aria-hidden="true">&times;</span>
                    </button>
                  </div>
                  <div class="modal-body">
                    <div class="form-group">
                      <label for="name">Nom de la banque</label>
                      <input type="text" class="form-control" id="name" name="name" required>
                    </div>
                    <div class="form-group">
                      <label for="rib">RIB</label>
                      <input type="text" class="form-control" id="rib" name="rib" required>
                    </div>
                    <div class="form-group">
                      <label for="agence">Agence</label>
                      <input type="text" class="form-control" id="agence" name="agence" required>
                    </div>
                  </div>
                  <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal" aria-label="Fermer">Fermer</button>
                    <button type="submit" class="btn btn-primary" aria-label="Ajouter banque">Ajouter</button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          <!-- Chèques à payer -->
         <div class="card mb-4 fade-in">
  <div class="card-header">
    <h2>Chèques à payer</h2>
  </div>
  
  
  <script>
    document.getElementById("resetDateBtn").addEventListener("click", function () {
      const dateInput = document.getElementById("toDate");
      dateInput.value = "";        // clear date
      dateInput.form.submit();     // submit form with empty "to"
    });
  </script>
  
  <div class="card-body">
    <% if (cheques.length === 0) { %>
      <p class="text-center text-muted">Aucun chèque trouvé.</p>
    <% } else { %>
      <div class="table-responsive">
        <table id="chequesTable" class="excel-table">
          <thead>
            <tr>
              <th>Numéro</th>
              <th>Montant</th>
              <th>Date Échéance</th>
              <th>Bénéficiaire</th>
              <th>Banque</th>
              <th>Statut</th>
              <th>obs</th>
            </tr>
          </thead>
          <tbody>
            <% cheques.forEach(c => { %>
              <tr class="cheque-row" data-fournisseur="<%= c.beneficiaire %>" data-banque="<%= c.banque.name %>" data-statut="<%= c.statut %>">
                <td><%= c.numero %></td>
                <td class="text-right montant"><%= c.montant.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) %> MAD</td>
                <td><%= new Date(c.dateEcheance).toLocaleDateString() %></td>
                <td><%= c.beneficiaire %></td>
                <td><%= c.banque.name %></td>
                <td>
                  <span class="badge badge-<%= c.statut === 'En circulation' || c.statut === 'En Circulation'  ? 'info' : c.statut === 'Impayé' ? 'danger' : 'success' %>">
                    <%= c.statut %>
                  </span> 
                </td>
               <form action="/tresorerie/cheques/situation/<%= c.id %>?_method=PATCH" method="post">
  <td>
    <input type="text" value="<%= c.obs %>" class="form-control" name="obs">
  </td>
</form>
              </tr>
            <% }); %>
          </tbody>
          <tfoot>
            <tr>
              <td>Total</td>
              <td class="text-right" id="totalMontantCellCheques">0,00 MAD</td>
              <td colspan="4"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    <% } %>
  </div>
</div>
          <!-- Effets à payer -->
         <div class="card mb-4 fade-in">
  <div class="card-header">
    <h2>Effets à payer</h2>
  </div>
  <div class="filter-section">
    <form class="form-inline">
      <label>Statut :</label>
      <select id="statutFilterEffets" class="form-control">
        <option value="">Tous</option>
        <option value="En circulation">En Circulation</option>
        <option value="Impayé">Impayé</option>
      </select>
      <label>Fournisseur :</label>
      <select id="fournisseurFilterEffets" class="form-control">
        <option value="">Tous</option>
        <% fournisseurs.forEach(f => { %>
          <option value="<%= f.name %>"><%= f.name %></option>
        <% }) %>
      </select>
      <label>Banque :</label>
      <select id="banqueFilterEffets" class="form-control">
        <option value="">Tous</option>
        <% banques.forEach(b => { %>
          <option value="<%= b.name %>"><%= b.name %></option>
        <% }) %>
      </select>
    </form>
  </div>
  <div class="card-body">
    <% if (effets.length === 0) { %>
      <p class="text-center text-muted">Aucun effet trouvé.</p>
    <% } else { %>
      <div class="table-responsive">
        <table id="effetsTable" class="excel-table">
          <thead>
            <tr>
              <th>Numéro</th>
              <th>Montant</th>
              <th>Date Échéance</th>
              <th>Bénéficiaire</th>
              <th>Banque</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            <% effets.forEach(e => { %>
              <tr class="effet-row" data-fournisseur="<%= e.beneficiaire %>" data-banque="<%= e.banque.name %>" data-statut="<%= e.statut %>">
                <td><%= e.numero %></td>
                <td class="text-right"><%= e.montant.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) %> MAD</td>
                <td><%= new Date(e.dateEcheance).toLocaleDateString() %></td>
                <td><%= e.beneficiaire %></td>
                <td><%= e.banque.name %></td>
                <td>
                  <span class="badge badge-<%= e.statut === 'En circulation' || e.statut === 'en circulation' ? 'info' : e.statut === 'En garantie' || e.statut === 'en garantie' ? 'warning' : e.statut === 'Impayé' || e.statut === 'impayé' ? 'danger' : 'success' %>">
                    <%= e.statut %>
                  </span>
                </td>
              </tr>
            <% }); %>
          </tbody>
          <tfoot>
            <tr>
              <td>Total</td>
              <td class="text-right" id="totalMontant"><%= effets.reduce((acc, e) => acc + e.montant, 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\u202F/g, ' ') %> MAD</td>
              <td colspan="4"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    <% } %>
  </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
  const statutFilter = document.getElementById('statutFilterEffets');
  const fournisseurFilter = document.getElementById('fournisseurFilterEffets');
  const banqueFilter = document.getElementById('banqueFilterEffets');
  const resetButton = document.getElementById('resetFilters');
  const table = document.getElementById('effetsTable');
  const rows = table ? table.querySelectorAll('tbody tr.effet-row') : [];
  const totalMontant = document.getElementById('totalMontant');

  function applyFilters() {
    let total = 0;
    const statutValue = statutFilter.value.toLowerCase();
    const fournisseurValue = fournisseurFilter.value;
    const banqueValue = banqueFilter.value;

    rows.forEach(row => {
      const statut = row.dataset.statut.toLowerCase();
      const fournisseur = row.dataset.fournisseur;
      const banque = row.dataset.banque;

      const statutMatch = !statutValue || statut === statutValue;
      const fournisseurMatch = !fournisseurValue || fournisseur === fournisseurValue;
      const banqueMatch = !banqueValue || banque === banqueValue;

      if (statutMatch && fournisseurMatch && banqueMatch) {
        row.style.display = '';
        const montantText = row.querySelector('td:nth-child(2)').textContent;
        const montant = parseFloat(montantText.replace(/[^\d,.]/g, '').replace(',', '.'));
        total += montant;
      } else {
        row.style.display = 'none';
      }
    });

    if (totalMontant) {
      totalMontant.textContent = total.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MAD';
    }
  }

  function resetFilters() {
    statutFilter.value = '';
    fournisseurFilter.value = '';
    banqueFilter.value = '';
    applyFilters();
  }

  if (statutFilter) statutFilter.addEventListener('change', applyFilters);
  if (fournisseurFilter) fournisseurFilter.addEventListener('change', applyFilters);
  if (banqueFilter) banqueFilter.addEventListener('change', applyFilters);
  if (resetButton) resetButton.addEventListener('click', resetFilters);

  // Apply filters initially
  applyFilters();
});
</script>

          <!-- Paiements à venir -->
          <div class="card mb-4 fade-in">
            <div class="card-header">
              <h2>Paiements à venir</h2>
            </div>
            <div class="filter-section">
              <form class="form-inline">
                <label>Statut :</label>
                <select id="statutFilterPaiment" class="form-control">
                  <option value="">Tous</option>
                  <option value="échu">Échu</option>
                  <option value="impayé">Impayé</option>
                  <option value="non échu">Non échu</option>
                </select>
                <label>Fournisseur :</label>
                <select id="fournisseurFilterPaiment" class="form-control">
                  <option value="">Tous</option>
                  <% fournisseurs.forEach(f => { %>
                    <option value="<%= f.name %>"><%= f.name %></option>
                  <% }) %>
                </select>
                <label>Banque :</label>
                <select id="banqueFilterPaiment" class="form-control">
                  <option value="">Tous</option>
                  <% banques.forEach(b => { %>
                    <option value="<%= b.name %>"><%= b.name %></option>
                  <% }) %>
                </select>
                <button class="btn btn-primary" type="button" aria-label="Annuler filtre">Annuler</button>
                <input type="date" name="from" class="form-control" value="01/01/2020" hidden>
                <label>Au :</label>
                <input type="date" name="to" id="to" class="form-control" value="">
                <button class="btn btn-primary" type="button" onclick="filterPayavenirs()" aria-label="Filtrer">Filtrer</button>
              </form>
            </div>
            <div class="card-body">
              <% if (payavenirs.length === 0) { %>
                <p class="text-center text-muted">Aucun paiement à venir.</p>
              <% } else { %>
                <div class="table-responsive">
                  <table id="payavenirsTable" class="excel-table">
                    <thead>
                      <tr>
                        <th>Désignation</th>
                        <th>Montant</th>
                        <th>Date Échéance</th>
                        <th>Statut</th>
                        <th>Date de Paiement</th>
                        <th>Fournisseur</th>
                        <th>Banque</th>
                      </tr>
                    </thead>
                    <tbody>
                      <% payavenirs.forEach(c => { %>
                        <tr class="payavenir-row" data-fournisseur="<%= c.fournisseur.name %>" data-banque="<%= c.banque.name %>" data-statut="<%= c.statut %>">
                          <td><%= c.designation %></td>
                          <td class="text-right"><%= c.montant.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) %> MAD</td>
                          <td><%= new Date(c.dateEcheance).toLocaleDateString() %></td>
                          <td>
                            <span class="badge badge-<%= c.statut === 'échu' ? 'warning' : c.statut === 'impayé' ? 'danger' : 'success' %>">
                              <%= c.statut %>
                            </span>
                          </td>
                          <td><%= new Date(c.dateReglement).toLocaleDateString() %></td>
                          <td><%= c.fournisseur.name %></td>
                          <td><%= c.banque.name %></td>
                        </tr>
                      <% }); %>
                    </tbody>
                    <tfoot>
                      <tr>
                        <td>Total</td>
                        <td class="text-right"><%= payavenirs.reduce((acc, c) => acc + c.montant, 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) %> MAD</td>
                        <td colspan="5"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              <% } %>
            </div>
          </div>
          <div class="card mb-4 fade-in">
            <div class="card-header">
              <h2>Total Général au <input type="date" name="to" class="form-control d-inline-block" value="<%= !to ? new Date().toISOString().split('T')[0] : to %>" style="width: auto;" disabled></h2>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-3 col-sm-6">
                  <div class="stats-card">
                    <i class="fas fa-money-check-alt stats-icon"></i>
                    <div class="stats-number"><%= (cheques.reduce((acc, c) => acc + c.montant, 0)).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) %> MAD</div>
                    <div class="stats-label">Total Chèques</div>
                  </div>
                </div>
                <div class="col-md-3 col-sm-6">
                  <div class="stats-card">
                    <i class="fas fa-file-invoice stats-icon"></i>
                    <div class="stats-number"><%= (effets.reduce((acc, e) => acc + e.montant, 0)).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) %> MAD</div>
                    <div class="stats-label">Total Effets</div>
                  </div>
                </div>
                <div class="col-md-3 col-sm-6">
                  <div class="stats-card">
                    <i class="fas fa-arrow-up stats-icon"></i>
                    <div class="stats-number"><%= (recavenirs.reduce((acc, c) => acc + c.montant, 0)).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) %> MAD</div>
                    <div class="stats-label">Total Recettes</div>
                  </div>
                </div>
                <div class="col-md-3 col-sm-6">
                  <div class="stats-card">
                    <i class="fas fa-chart-line stats-icon"></i>
                    <div class="stats-number"><%= ((cheques.reduce((acc, c) => acc + c.montant, 0)) + (effets.reduce((acc, e) => acc + e.montant, 0)) + (payavenirs.reduce((acc, c) => acc + c.montant, 0))).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) %> MAD</div>
                    <div class="stats-label">Total Général</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- Download Buttons -->
          <div class="card mb-4 fade-in">
            <div class="card-header">
              <h2>Téléchargements</h2>
            </div>
            <div class="card-body d-flex flex-wrap gap-2 justify-content-center">
              <button class="btn btn-primary" onclick="downloadFullPagePDF()" aria-label="Télécharger PDF complet">
                <i class="fas fa-file-pdf"></i> PDF Complet
              </button>
              <button class="btn btn-info" onclick="downloadChequesPDF()" aria-label="Télécharger PDF chèques">
                <i class="fas fa-money-check-alt"></i> PDF Chèques
              </button>
              <button class="btn btn-warning" onclick="downloadEffetsPDF()" aria-label="Télécharger PDF effets">
                <i class="fas fa-file-invoice"></i> PDF Effets
              </button>
              <button class="btn btn-success" onclick="downloadPayavenirsPDF()" aria-label="Télécharger PDF paiements">
                <i class="fas fa-hand-holding-usd"></i> PDF Paiements
              </button>
              <button class="btn btn-success" onclick="downloadRecettesPDF()" aria-label="Télécharger PDF recettes">
                <i class="fas fa-arrow-up"></i> PDF Recettes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Scripts -->
  <script src="/vendor/jquery/jquery.min.js"></script>
  <script src="/vendor/bootstrap/js/bootstrap.bundle.min.js"></script>
  <script src="/vendor/jquery-easing/jquery.easing.min.js"></script>
  <script src="/js/sb-admin-2.min.js"></script>
  <script>
    function openBanqueModal() {
      $('#banqueModal').modal('show');
    }

    function filterPayavenirs() {
      const statut = $('#statutFilterPaiment').val();
      const fournisseur = $('#fournisseurFilterPaiment').val();
      const banque = $('#banqueFilterPaiment').val();
      const toDate = $('#to').val();

      $('#payavenirsTable tbody tr').each(function() {
        const row = $(this);
        const rowStatut = row.data('statut');
        const rowFournisseur = row.data('fournisseur');
        const rowBanque = row.data('banque');
        const rowDate = row.find('td').eq(2).text();
        
        let show = true;
        if (statut && rowStatut !== statut) show = false;
        if (fournisseur && rowFournisseur !== fournisseur) show = false;
        if (banque && rowBanque !== banque) show = false;
        if (toDate && new Date(rowDate) > new Date(toDate)) show = false;

        row.toggle(show);
      });
    }
  </script>
</body>
</html>
  <script>
    function openBanqueModal() {
      $('#banqueModal').modal('show');
    }

    function filterPayavenirs() {
      const statut = $('#statutFilterPaiment').val();
      const fournisseur = $('#fournisseurFilterPaiment').val();
      const banque = $('#banqueFilterPaiment').val();
      const toDate = $('#to').val();

      $('#payavenirsTable tbody tr').each(function() {
        const row = $(this);
        const rowStatut = row.data('statut');
        const rowFournisseur = row.data('fournisseur');
        const rowBanque = row.data('banque');
        const rowDate = row.find('td').eq(2).text();
        
        let show = true;
        if (statut && rowStatut !== statut) show = false;
        if (fournisseur && rowFournisseur !== fournisseur) show = false;
        if (banque && rowBanque !== banque) show = false;
        if (toDate && new Date(rowDate) > new Date(toDate)) show = false;

        row.toggle(show);
      });
    }
  </script>
</body>
</html>
  <script>
    function openBanqueModal() {
      $('#banqueModal').modal('show');
    }

    // Basic client-side filtering for tables (example, adjust as needed)
    function filterPayavenirs() {
      const statut = $('#statutFilterPaiment').val();
      const fournisseur = $('#fournisseurFilterPaiment').val();
      const banque = $('#banqueFilterPaiment').val();
      const toDate = $('#to').val();

      $('#payavenirsTable tbody tr').each(function() {
        const row = $(this);
        const rowStatut = row.data('statut');
        const rowFournisseur = row.data('fournisseur');
        const rowBanque = row.data('banque');
        const rowDate = row.find('td').eq(2).text();
        
        let show = true;
        if (statut && rowStatut !== statut) show = false;
        if (fournisseur && rowFournisseur !== fournisseur) show = false;
        if (banque && rowBanque !== banque) show = false;
        if (toDate && new Date(rowDate) > new Date(toDate)) show = false;

        row.toggle(show);
      });
    }

    // Add similar filtering for other tables if needed
  </script>
</body>
</html>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      // Get filter elements for cheques
      const statutSelectCheques = document.getElementById('statutFilterCheques');
      const fournisseurSelectCheques = document.getElementById('fournisseurFilterCheques');
      const banqueSelectCheques = document.getElementById('banqueFilterCheques');
      
      // Get filter elements for effets
      const statutSelectEffets = document.getElementById('statutFilterEffets');
      const fournisseurSelectEffets = document.getElementById('fournisseurFilterEffets');
      const banqueSelectEffets = document.getElementById('banqueFilterEffets');
  
      // Get filter elements for payavenirs
      const statutSelectPayavenirs = document.getElementById('statutFilterPaiment');
      const fournisseurSelectPayavenirs = document.getElementById('fournisseurFilterPaiment');
      const banqueSelectPayavenirs = document.getElementById('banqueFilterPaiment');

      // Get filter elements for recavenirs
      const statutSelectRecavenirs = document.getElementById('statutFilterRecette');
      const clientSelectRecavenirs = document.getElementById('clientFilterRecette');
      const banqueSelectRecavenirs = document.getElementById('banqueFilterRecette');
      
      // Get solde inputs
      const soldeInputs = document.querySelectorAll('input[name="positive[]"], input[name="negative[]"], input[name="dmlt[]"]');
      
      // Get row elements
      const chequesRows = document.querySelectorAll('.cheque-row');
      const effetsRows = document.querySelectorAll('.effet-row');
      const payavenirsRows = document.querySelectorAll('.payavenir-row');
      const recavenirsRows = document.querySelectorAll('.recavenir-row');
  
      // Update totalMontant for chèques
      function updateTotalMontantCheques() {
        let total = 0;
        
        chequesRows.forEach(row => {
          if (row.style.display !== 'none') {
            const montantCell = row.querySelector('.montant');
            if (montantCell) {
              const raw = montantCell.textContent;
              const montant = parseFloat(raw.replace(/\s/g, '').replace(',', '.'));
              if (!isNaN(montant)) total += montant;
            }
          }
        });
  
        const totalCell = document.getElementById('totalMontantCellCheques');
        if (totalCell) {
          totalCell.textContent = total.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\u202F/g, ' ') 
        
        }
        
        // Update display total
        const displayTotal = document.getElementById('displayTotalCheques');
        if (displayTotal) {
          displayTotal.textContent = total.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
        
        updateGeneralTotal();
      }
  
      // Update totalMontant for effets
      function updateTotalMontantEffets() {
        let total = 0;
        
        effetsRows.forEach(row => {
          if (row.style.display !== 'none') {
            const montantCell = row.querySelector('.montant');
            if (montantCell) {
              const raw = montantCell.textContent;
              const montant = parseFloat(raw.replace(/\s/g, '').replace(',', '.'));
              if (!isNaN(montant)) total += montant;
            }
          }
        });
  
        const totalCell = document.getElementById('totalMontantCellEffets');
        if (totalCell) {
          totalCell.textContent = total.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
        
        // Update display total
        const displayTotal = document.getElementById('displayTotalEffets');
        if (displayTotal) {
          displayTotal.textContent = total.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
        
        updateGeneralTotal();
      }
  
      // Update totalMontant for payavenirs
      function updateTotalMontantPayavenirs() {
        let total = 0;
        
        payavenirsRows.forEach(row => {
          if (row.style.display !== 'none') {
            const montantCell = row.querySelector('.montant');
            if (montantCell) {
              const raw = montantCell.textContent;
              const montant = parseFloat(raw.replace(/\s/g, '').replace(',', '.'));
              if (!isNaN(montant)) total += montant;
            }
          }
        });
  
        const totalCell = document.getElementById('totalMontantCellPayavenirs');
        if (totalCell) {
          totalCell.textContent = total.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
        
        // Update display total
        const displayTotal = document.getElementById('displayTotalPayavenirs');
        if (displayTotal) {
          displayTotal.textContent = total.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
        
        updateGeneralTotal();
      }
  
      // Update general total (chèques + effets + payavenirs)
      function updateGeneralTotal() {
        const chequesTotal = parseFloat(document.getElementById('displayTotalCheques')?.textContent?.replace(/\s/g, '').replace(',', '.')) || 0;
        const effetsTotal = parseFloat(document.getElementById('displayTotalEffets')?.textContent?.replace(/\s/g, '').replace(',', '.')) || 0;
        const payavenirsTotal = parseFloat(document.getElementById('displayTotalPayavenirs')?.textContent?.replace(/\s/g, '').replace(',', '.')) || 0;
        const generalTotal = chequesTotal + effetsTotal + payavenirsTotal;
        
        const displayGeneralTotal = document.getElementById('displayTotalGeneral');
        if (displayGeneralTotal) {
          displayGeneralTotal.textContent = generalTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
      }
  
      // Filter chèques rows
      function filterChequesRows() {
        const selectedStatut = statutSelectCheques.value.toLowerCase();
        const selectedFournisseur = fournisseurSelectCheques.value.toLowerCase();
        const selectedBanque = banqueSelectCheques.value.toLowerCase();
        let visibleRowCount = 0;
        
        chequesRows.forEach(row => {
          const rowStatut = row.getAttribute('data-statut').toLowerCase();
          const rowFournisseur = row.getAttribute('data-fournisseur').toLowerCase();
          const rowBanque = row.getAttribute('data-banque').toLowerCase();
  
          const showStatut = !selectedStatut || rowStatut === selectedStatut;
          const showFournisseur = !selectedFournisseur || rowFournisseur === selectedFournisseur;
          const showBanque = !selectedBanque || rowBanque === selectedBanque;
  
          if (showStatut && showFournisseur && showBanque) {
            row.style.display = '';
            visibleRowCount++;
          } else {
            row.style.display = 'none';
          }
        });
  
        // Show/hide "no results" row for chèques
        let msg = document.getElementById('noChequeMsg');
        if (visibleRowCount === 0) {
          if (!msg) {
            msg = document.createElement('tr');
            msg.id = 'noChequeMsg';
            msg.innerHTML = `<td colspan="6" class="text-muted text-center">Aucun chèque trouvé pour ce filtre.</td>`;
            document.querySelector('#chequesTable tbody').appendChild(msg);
          }
        } else {
          if (msg) msg.remove();
        }
  
        updateTotalMontantCheques();
      }
  
      // Filter effets rows
      function filterEffetsRows() {
        const selectedStatut = statutSelectEffets.value.toLowerCase();
        const selectedFournisseur = fournisseurSelectEffets.value.toLowerCase();
        const selectedBanque = banqueSelectEffets.value.toLowerCase();
        let visibleRowCount = 0;
  
        effetsRows.forEach(row => {
          const rowStatut = row.getAttribute('data-statut').toLowerCase();
          const rowFournisseur = row.getAttribute('data-fournisseur').toLowerCase();
          const rowBanque = row.getAttribute('data-banque').toLowerCase();
  
          const showStatut = !selectedStatut || rowStatut === selectedStatut;
          const showFournisseur = !selectedFournisseur || rowFournisseur === selectedFournisseur;
          const showBanque = !selectedBanque || rowBanque === selectedBanque;
  
          if (showStatut && showFournisseur && showBanque) {
            row.style.display = '';
            visibleRowCount++;
          } else {
            row.style.display = 'none';
          }
        });
  
        // Show/hide "no results" row for payavenirs
        let msg = document.getElementById('noPayavenirMsg');
        if (visibleRowCount === 0) {
          if (!msg) {
            msg = document.createElement('tr');
            msg.id = 'noPayavenirMsg';
            msg.innerHTML = `<td colspan="6" class="text-muted text-center">Aucun effet trouvé pour ce filtre.</td>`;
            document.querySelector('#effetsTable tbody').appendChild(msg);
          }
        } else {
          if (msg) msg.remove();
        }
  
        updateTotalMontantEffets();
      }
  
      // Filter payavenirs rows
      function filterPayavenirsRows() {
        const selectedStatut = statutSelectPayavenirs.value.toLowerCase();
        const selectedFournisseur = fournisseurSelectPayavenirs.value.toLowerCase();
        const selectedBanque = banqueSelectPayavenirs.value.toLowerCase();
        let visibleRowCount = 0;
  
        payavenirsRows.forEach(row => {
          const rowStatut = row.getAttribute('data-statut').toLowerCase();
          const rowFournisseur = row.getAttribute('data-fournisseur').toLowerCase();
          const rowBanque = row.getAttribute('data-banque').toLowerCase();
  
          const showStatut = !selectedStatut || rowStatut === selectedStatut;
          const showFournisseur = !selectedFournisseur || rowFournisseur === selectedFournisseur;
          const showBanque = !selectedBanque || rowBanque === selectedBanque;
  
          if (showStatut && showFournisseur && showBanque) {
            row.style.display = '';
            visibleRowCount++;
          } else {
            row.style.display = 'none';
          }
        });
  
        // Show/hide "no results" row for payavenirs
        let msg = document.getElementById('noPayavenirMsg');
        if (visibleRowCount === 0) {
          if (!msg) {
            msg = document.createElement('tr');
            msg.id = 'noPayavenirMsg';
            msg.innerHTML = `<td colspan="6" class="text-muted text-center">Aucun effet trouvé pour ce filtre.</td>`;
            document.querySelector('#payavenirsTable tbody').appendChild(msg);
          }
        } else {
          if (msg) msg.remove();
        }
  
        updateTotalMontantPayavenirs();
      }
  
      function filterRecavenirsRows(){
  const selectedStatut = statutSelectRecavenirs.value.toLowerCase();
  const selectedClient = clientSelectRecavenirs.value.toLowerCase();
  const selectedBanque = banqueSelectRecavenirs.value.toLowerCase();
  let visibleRowCount = 0;

  recavenirsRows.forEach(row => {
    const rowStatut = row.getAttribute('data-statut').toLowerCase();
    const rowClient = row.getAttribute('data-client').toLowerCase();
    const rowBanque = row.getAttribute('data-banque').toLowerCase();

    const showStatut = !selectedStatut || rowStatut === selectedStatut;
    const showClient = !selectedClient || rowClient === selectedClient;
    const showBanque = !selectedBanque || rowBanque === selectedBanque;

    if (showStatut && showClient && showBanque) {
      row.style.display = '';
      visibleRowCount++;
    } else {
      row.style.display = 'none';
    }
  });

  // Show/hide "no results" row for recavenirs
  let msg = document.getElementById('noRecavenirMsg');
  if (visibleRowCount === 0) {
    if (!msg) {
      msg = document.createElement('tr');
      msg.id = 'noRecavenirMsg';
      msg.innerHTML = `<td colspan="7" class="text-muted text-center">Aucune recette trouvée pour ce filtre.</td>`;
      document.querySelector('#recavenirsTable tbody').appendChild(msg);
    }
  } else {
    if (msg) msg.remove();
  }

  updateTotalMontantRecavenirs(); // This was missing!
}

// Add filter listeners for recavenirs (add this around line 450 with other event listeners)
// Filter listeners for recavenirs
if (statutSelectRecavenirs) {
  statutSelectRecavenirs.addEventListener('change', filterRecavenirsRows);
}
if (clientSelectRecavenirs) {
  clientSelectRecavenirs.addEventListener('change', filterRecavenirsRows);
}
if (banqueSelectRecavenirs) {
  banqueSelectRecavenirs.addEventListener('change', filterRecavenirsRows);
}
      // Input listeners for solde
      soldeInputs.forEach(input => {
        input.addEventListener('input', () => {
          const id = input.dataset.banqueId;
          const enCirculationCell = document.querySelector(`.en-circulation[data-banque-id="${id}"]`);
          const totalCell = document.querySelector(`.total-solde[data-banque-id="${id}"]`);
          
          if (enCirculationCell && totalCell) {
            const enteredSolde = parseFloat(input.value) || 0;
            const enCirculation = parseFloat(enCirculationCell.textContent) || 0;
            const total = enteredSolde + enCirculation;
  
            totalCell.textContent = total.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            totalCell.classList.toggle('text-danger', total < 0);
            totalCell.classList.toggle('text-success', total >= 0);
          }
        });
      });
  
      // Filter listeners for chèques
      if (statutSelectCheques) {
        statutSelectCheques.addEventListener('change', filterChequesRows);
      }
      if (fournisseurSelectCheques) {
        fournisseurSelectCheques.addEventListener('change', filterChequesRows);
      }
      if (banqueSelectCheques) {
        banqueSelectCheques.addEventListener('change', filterChequesRows);
      }
  
      // Filter listeners for effets
      if (statutSelectEffets) {
        statutSelectEffets.addEventListener('change', filterEffetsRows);
      }
      if (fournisseurSelectEffets) {
        fournisseurSelectEffets.addEventListener('change', filterEffetsRows);
      }
      if (banqueSelectEffets) {
        banqueSelectEffets.addEventListener('change', filterEffetsRows);
      }
  
      // Filter listeners for payavenirs
      if (statutSelectPayavenirs) {
        statutSelectPayavenirs.addEventListener('change', filterPayavenirsRows);
      }
      if (fournisseurSelectPayavenirs) {
        fournisseurSelectPayavenirs.addEventListener('change', filterPayavenirsRows);
      }
      if (banqueSelectPayavenirs) {
        banqueSelectPayavenirs.addEventListener('change', filterPayavenirsRows);
      }
  
      // Initial run
      filterChequesRows();
      filterEffetsRows();
      filterPayavenirsRows();
      filterRecavenirsRows();
      updateGeneralTotal();
    });
  
    // Helper function to properly format numbers in French format
    function formatFrenchNumber(value) {
      if (!value) return '0,00';
      
      // Convert to string and clean it
      let cleanValue = value.toString().replace(/\s/g, '').replace(/[^\d,.-]/g, '');
      
      // Handle different decimal separators
      if (cleanValue.includes(',')) {
        cleanValue = cleanValue.replace(',', '.');
      }
      
      const numValue = parseFloat(cleanValue);
      if (isNaN(numValue)) return '0,00';
      
      // Format with French locale: space as thousand separator, comma as decimal
      return numValue.toLocaleString('fr-FR', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
    }
  
    // Helper function to parse French formatted numbers back to float
    function parseFrenchNumber(value) {
      if (!value) return 0;
      
      // Remove spaces and replace comma with dot
      const cleanValue = value.toString().replace(/\s/g, '').replace(',', '.');
      const numValue = parseFloat(cleanValue);
      return isNaN(numValue) ? 0 : numValue;
    }
  
    function downloadFullPagePDF() {
  // Display loading message
  const loadingMsg = createLoadingMessage();
  document.body.appendChild(loadingMsg);

  // Load jsPDF and autoTable plugin sequentially
  loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')
    .then(() => loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js'))
    .then(() => generatePDF())
    .catch(error => handleError(error, loadingMsg))
    .finally(() => document.body.removeChild(loadingMsg));

  // Helper function to create loading message
  function createLoadingMessage() {
    const div = document.createElement('div');
    div.innerHTML = '<div class="alert alert-info" style="position: fixed; top: 20px; right: 20px; z-index: 1000;">Génération du PDF complet en cours...</div>';
    return div;
  }

  // Helper function to load scripts dynamically
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(script);
    });
  }

  // Helper function to format numbers in French format with space instead of '/'
  function formatFrenchNumber(value) {
    if (isNaN(value)) return '0,00';
    return value
      .toFixed(2)
      .replace(/\B(?=(\d{3})+(?!\d))/g, ' ') // Use space as thousand separator
      .replace('.', ','); // Use comma for decimal
  }

  // Helper function to parse French number strings
  function parseFrenchNumber(text) {
    if (!text) return 0;
    // Remove any '/' and replace with space, then handle standard French format
    return parseFloat(text.replace(/[\/\s]/g, '').replace(',', '.')) || 0;
  }

  // Helper function to add a section table
  function addSectionTable(pdf, title, headers, data, yPosition, columnStyles, hasTotals = true) {
    if (yPosition > 220) {
      pdf.addPage();
      yPosition = 20;
    }

    pdf.setFontSize(16);
    pdf.text(title, 20, yPosition);
    yPosition += 10;

    if (data.length > 0) {
      pdf.autoTable({
        head: [headers],
        body: data,
        startY: yPosition,
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [52, 144, 220], textColor: 255, fontStyle: 'bold' },
        columnStyles,
        didParseCell: (data) => {
          if (hasTotals && data.row.index === data.table.body.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [240, 240, 240];
          }
        },
      });
      return pdf.lastAutoTable.finalY + 20;
    } else {
      pdf.setFontSize(10);
      pdf.text(`Aucun élément trouvé pour cette période.`, 20, yPosition);
      return yPosition + 15;
    }
  }

  // Main function to generate the PDF
  function generatePDF() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');

    // Add header and date
    pdf.setFontSize(20);
    pdf.text('Situation Bancaire Complète', 20, 20);
    pdf.setFontSize(12);
    pdf.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 20, 30);
    let yPosition = 45;

    // Section 1: Situation Bancaire
    const bankData = [];
let totalPositive = 0,
  totalNegative = 0,
  totalDmlt = 0;

document.querySelectorAll('#situationBancaire tbody tr').forEach((row) => {
  const cells = row.querySelectorAll('td');
  if (cells.length >= 5) {
    // Extract bank name
    const bankName =
      cells[0].textContent.trim() ||
      cells[0].querySelector('strong')?.textContent.trim();

    // Extract values from input fields
    const positiveInput = cells[1].querySelector('input')?.value.trim();
    const negativeInput = cells[2].querySelector('input')?.value.trim();
    const dmltInput = cells[4].querySelector('input')?.value.trim();

    // Parse French-formatted numbers
    const positive = parseFrenchNumber(positiveInput);
    const negative = parseFrenchNumber(negativeInput);
    const dmlt = parseFrenchNumber(dmltInput);

    // Ensure valid numbers before adding to totals
    if (!isNaN(positive)) totalPositive += positive;
    if (!isNaN(negative)) totalNegative += negative;
    if (!isNaN(dmlt)) totalDmlt += dmlt;

    // Push formatted data to bankData
    bankData.push([
      bankName,
      formatFrenchNumber(positive),
      formatFrenchNumber(negative),
      formatFrenchNumber(dmlt),
    ]);
  }
});

// Add totals to bankData
bankData.push([
  'TOTAL',
  formatFrenchNumber(totalPositive),
  formatFrenchNumber(totalNegative),
  formatFrenchNumber(totalDmlt),
]);

// Add table to PDF
yPosition = addSectionTable(
  pdf,
  '1. Situation Bancaire',
  ['Banque', 'Solde Positif', 'Solde Négatif', 'Dette Moyen Long Terme'],
  bankData,
  yPosition,
  { 0: { halign: 'left' }, 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } }
);
    // Section 2: Chèques en circulation
    const visibleCheques = [];
    let chequesTotalAmount = 0;

    document.querySelectorAll('.cheque-row').forEach(row => {
      if (row.style.display !== 'none') {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 6) {
          const montantValue = parseFrenchNumber(cells[1].textContent.trim());
          chequesTotalAmount += montantValue;
          visibleCheques.push([
            cells[0].textContent.trim(),
            formatFrenchNumber(montantValue),
            cells[2].textContent.trim(),
            cells[3].textContent.trim(),
            cells[4].textContent.trim(),
            cells[5].textContent.trim(),
          ]);
        }
      }
    });

    if (visibleCheques.length > 0) {
      visibleCheques.push(['TOTAL', formatFrenchNumber(chequesTotalAmount), '', '', '', '']);
    }

    yPosition = addSectionTable(
      pdf,
      '2. Chèques en circulation',
      ['Numéro', 'Montant', 'Date Échéance', 'Bénéficiaire', 'Banque', 'Statut'],
      visibleCheques,
      yPosition,
      {
        0: { halign: 'left', cellWidth: 25 },
        1: { halign: 'right', cellWidth: 25 },
        2: { halign: 'center', cellWidth: 25 },
        3: { halign: 'left', cellWidth: 40 },
        4: { halign: 'left', cellWidth: 30 },
        5: { halign: 'center', cellWidth: 25 },
      }
    );

    // Section 3: Effets en circulation
    const visibleEffets = [];
    let effetsTotalAmount = 0;

    document.querySelectorAll('.effet-row').forEach(row => {
      if (row.style.display !== 'none') {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 6) {
          const montantValue = parseFrenchNumber(cells[1].textContent.trim());
          effetsTotalAmount += montantValue;
          visibleEffets.push([
            cells[0].textContent.trim(),
            formatFrenchNumber(montantValue),
            cells[2].textContent.trim(),
            cells[3].textContent.trim(),
            cells[4].textContent.trim(),
            cells[5].textContent.trim(),
          ]);
        }
      }
    });

    if (visibleEffets.length > 0) {
      visibleEffets.push(['TOTAL', formatFrenchNumber(effetsTotalAmount), '', '', '', '']);
    }

    yPosition = addSectionTable(
      pdf,
      '3. Effets en circulation',
      ['Numéro', 'Montant', 'Date Échéance', 'Bénéficiaire', 'Banque', 'Statut'],
      visibleEffets,
      yPosition,
      {
        0: { halign: 'left', cellWidth: 25 },
        1: { halign: 'right', cellWidth: 25 },
        2: { halign: 'center', cellWidth: 25 },
        3: { halign: 'left', cellWidth: 40 },
        4: { halign: 'left', cellWidth: 30 },
        5: { halign: 'center', cellWidth: 25 },
      }
    );

    // Section 4: Paiements à venir
    const visiblePayavenirs = [];
    let payavenirsTotalAmount = 0;

    document.querySelectorAll('.payavenir-row').forEach(row => {
      if (row.style.display !== 'none') {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 7) {
          const montantValue = parseFrenchNumber(cells[1].textContent.trim());
          payavenirsTotalAmount += montantValue;
          visiblePayavenirs.push([
            cells[0].textContent.trim(),
            formatFrenchNumber(montantValue),
            cells[2].textContent.trim(),
            cells[3].textContent.trim(),
            cells[4].textContent.trim(),
            cells[5].textContent.trim(),
            cells[6].textContent.trim(),
          ]);
        }
      }
    });

    if (visiblePayavenirs.length > 0) {
      visiblePayavenirs.push(['TOTAL', formatFrenchNumber(payavenirsTotalAmount), '', '', '', '', '']);
    }

    yPosition = addSectionTable(
      pdf,
      '4. Paiements à venir',
      ['Désignation', 'Montant', 'Date Échéance', 'Statut', 'Date Paiement', 'Fournisseur', 'Banque'],
      visiblePayavenirs,
      yPosition,
      {
        0: { halign: 'left', cellWidth: 35 },
        1: { halign: 'right', cellWidth: 25 },
        2: { halign: 'center', cellWidth: 25 },
        3: { halign: 'center', cellWidth: 20 },
        4: { halign: 'center', cellWidth: 25 },
        5: { halign: 'left', cellWidth: 30 },
        6: { halign: 'left', cellWidth: 25 },
      }
    );

    // Section 5: Résumé Général
    if (yPosition > 220) {
      pdf.addPage();
      yPosition = 20;
    }

    pdf.setFontSize(16);
    pdf.text('5. Résumé Général', 20, yPosition);
    yPosition += 15;

    const generalTotal = chequesTotalAmount + effetsTotalAmount + payavenirsTotalAmount;
    const summaryData = [
      ['Total Chèques', formatFrenchNumber(chequesTotalAmount)],
      ['Total Effets', formatFrenchNumber(effetsTotalAmount)],
      ['Total Paiements à venir', formatFrenchNumber(payavenirsTotalAmount)],
      ['TOTAL GÉNÉRAL', formatFrenchNumber(generalTotal)],
    ];

    pdf.autoTable({
      head: [['Description', 'Montant']],
      body: summaryData,
      startY: yPosition,
      theme: 'striped',
      styles: { fontSize: 12, cellPadding: 4 },
      headStyles: { fillColor: [52, 144, 220], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { halign: 'left', cellWidth: 80 },
        1: { halign: 'right', cellWidth: 50 },
      },
      didParseCell: (data) => {
        if (data.row.index === 3) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [76, 175, 80];
          data.cell.styles.textColor = 255;
          data.cell.styles.fontSize = 14;
        }
      },
    });

    // Add footer statistics
    const finalY = pdf.lastAutoTable.finalY + 15;
    pdf.setFontSize(10);
    pdf.text(`Nombre de chèques: ${visibleCheques.length > 0 ? visibleCheques.length - 1 : 0}`, 20, finalY);
    pdf.text(`Nombre d'effets: ${visibleEffets.length > 0 ? visibleEffets.length - 1 : 0}`, 20, finalY + 8);
    pdf.text(`Nombre de paiements à venir: ${visiblePayavenirs.length > 0 ? visiblePayavenirs.length - 1 : 0}`, 20, finalY + 16);
    pdf.text(`Généré le: ${new Date().toLocaleString('fr-FR')}`, 20, finalY + 24);

    // Save the PDF
    pdf.save(`situation-bancaire-complete-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  // Error handling function
  function handleError(error, loadingMsg) {
    console.error('Error generating complete PDF:', error);
    if (loadingMsg && document.body.contains(loadingMsg)) {
      document.body.removeChild(loadingMsg);
    }
    alert(`Erreur lors de la génération du PDF complet: ${error.message}`);
  }
}

function downloadChequesPDF() {
  // Show loading
  const loadingMsg = document.createElement('div');
  loadingMsg.innerHTML = '<div class="alert alert-info">Génération du PDF chèques...</div>';
  document.body.appendChild(loadingMsg);

  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  script.onload = function() {
    try {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape for better table fit

      // Add title
      pdf.setFontSize(18);
      pdf.setTextColor(0, 0, 128); // Dark blue
      pdf.text('Chèques à payer', 20, 20);

      // Add date
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Date: ' + new Date().toLocaleDateString('fr-FR'), 20, 30);

      // Get visible cheques data
      const visibleCheques = [];
      const chequeRows = document.querySelectorAll('.cheque-row');
      let totalAmount = 0;

      chequeRows.forEach(row => {
        if (row.style.display !== 'none') {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 6) {
            const montantText = cells[1].textContent.trim();
            const montantValue = parseFrenchNumber(montantText.replace(/[\/]/g, ' '));
            totalAmount += montantValue;

            visibleCheques.push([
              cells[0].textContent.trim().replace(/\//g, ' ').replace(/\s+/g, ' '),
              formatFrenchNumber(montantValue).replace(/\//g, ' ').replace(/\s+/g, ' '),
              cells[2].textContent.trim(),
              cells[3].textContent.trim(),
              cells[4].textContent.trim().replace(/\//g, ' ').replace(/\s+/g, ' '),
              cells[5].textContent.trim().replace(/\//g, ' ').replace(/\s+/g, ' ')
            ]);
          }
        }
      });

      // Table setup
      let yPosition = 45;
      const columnWidths = [35, 35, 35, 60, 50, 30];
      const startX = 20;
      const cellHeight = 8;

      // Headers
      pdf.setFontSize(9);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(255, 255, 255); // White text
      const headers = ['Numéro', 'Montant', 'Date Échéance', 'Bénéficiaire', 'Banque', 'Statut'];

      // Draw header cells with blue background
      let currentX = startX;
      headers.forEach((header, index) => {
        pdf.setFillColor(0, 102, 204); // Blue background
        pdf.rect(currentX, yPosition - 6, columnWidths[index], cellHeight, 'F'); // Filled rectangle
        pdf.text(header, currentX + 2, yPosition);
        currentX += columnWidths[index];
      });
      yPosition += cellHeight;

      // Data rows
      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(0, 0, 0);

      visibleCheques.forEach((row, rowIndex) => {
        if (yPosition > 180) { // Check if we need a new page
          pdf.addPage();
          yPosition = 20;

          // Redraw headers on new page
          currentX = startX;
          pdf.setFont(undefined, 'bold');
          pdf.setTextColor(255, 255, 255);
          headers.forEach((header, index) => {
            pdf.setFillColor(0, 102, 204);
            pdf.rect(currentX, yPosition - 6, columnWidths[index], cellHeight, 'F');
            pdf.text(header, currentX + 2, yPosition);
            currentX += columnWidths[index];
          });
          yPosition += cellHeight;
          pdf.setFont(undefined, 'normal');
          pdf.setTextColor(0, 0, 0);
        }

        currentX = startX;
        row.forEach((cell, cellIndex) => {
          const text = cell.toString();
          const maxLength = cellIndex === 3 ? 25 : 15;
          const displayText = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
          pdf.setDrawColor(0, 102, 204); // Blue borders
          pdf.rect(currentX, yPosition - 6, columnWidths[cellIndex], cellHeight);
          pdf.text(displayText, currentX + 2, yPosition);
          currentX += columnWidths[cellIndex];
        });
        yPosition += cellHeight;
      });

      // Add total
      yPosition += 5;
      pdf.setDrawColor(0, 102, 204);
      pdf.line(startX, yPosition, startX + 70, yPosition);
      yPosition += 8;
      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(10);
      pdf.text(`Total: ${formatFrenchNumber(totalAmount).replace(/\//g, ' ').replace(/\s+/g, ' ')}`, startX, yPosition);

      // Add summary
      yPosition += 15;
      pdf.setFontSize(8);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Nombre de chèques: ${visibleCheques.length}`, startX, yPosition);

      pdf.save('cheques-en-circulation.pdf');
      document.body.removeChild(loadingMsg);
    } catch (error) {
      console.error('Error:', error);
      document.body.removeChild(loadingMsg);
      alert('Erreur lors de la génération du PDF des chèques');
    }
  };
  document.head.appendChild(script);
}

function downloadEffetsPDF() {
  const loadingMsg = document.createElement('div');
  loadingMsg.innerHTML = '<div class="alert alert-info">Génération du PDF effets...</div>';
  document.body.appendChild(loadingMsg);

  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  script.onload = function() {
    try {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('l', 'mm', 'a4');

      pdf.setFontSize(18);
      pdf.setTextColor(0, 0, 128);
      pdf.text("Effets en circulation", 20, 20);

      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text("Date: " + new Date().toLocaleDateString('fr-FR'), 20, 30);

      // Helper to format numbers with spaces
      function formatNumberWithSpace(num) {
        return num.toLocaleString('fr-FR').replace(/\./g, ' ');
      }

      const visibleEffets = [];
      const effetRows = document.querySelectorAll('.effet-row');
      let totalAmount = 0;

      effetRows.forEach(row => {
        if (row.style.display !== 'none') {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 6) {
            const montantValue = parseFrenchNumber(cells[1].textContent.trim().replace(/\s/g, ''));
            totalAmount += montantValue;

            visibleEffets.push([
              cells[0].textContent.trim(),
              formatFrenchNumber(montantValue).replace(/\//g, ' ').replace(/\s+/g, ' '),

              cells[2].textContent.trim(),
              cells[3].textContent.trim(),
              cells[4].textContent.trim(),
              cells[5].textContent.trim()
            ]);
          }
        }
      });

      let yPosition = 45;
      const columnWidths = [35, 35, 35, 60, 50, 30];
      const startX = 20;
      const cellHeight = 8;

      pdf.setFontSize(9);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(255, 255, 255);
      const headers = ['Numéro', 'Montant', 'Date Échéance', 'Bénéficiaire', 'Banque', 'Statut'];

      let currentX = startX;
      headers.forEach((header, index) => {
        pdf.setFillColor(0, 102, 204);
        pdf.rect(currentX, yPosition - 6, columnWidths[index], cellHeight, 'F');
        pdf.text(header, currentX + 2, yPosition);
        currentX += columnWidths[index];
      });
      yPosition += cellHeight;

      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(0, 0, 0);

      visibleEffets.forEach(row => {
        if (yPosition > 180) {
          pdf.addPage();
          yPosition = 20;

          currentX = startX;
          pdf.setFont(undefined, 'bold');
          pdf.setTextColor(255, 255, 255);
          headers.forEach((header, index) => {
            pdf.setFillColor(0, 102, 204);
            pdf.rect(currentX, yPosition - 6, columnWidths[index], cellHeight, 'F');
            pdf.text(header, currentX + 2, yPosition);
            currentX += columnWidths[index];
          });
          yPosition += cellHeight;
          pdf.setFont(undefined, 'normal');
          pdf.setTextColor(0, 0, 0);
        }

        currentX = startX;
        row.forEach((cell, cellIndex) => {
          const text = cell.toString();
          const maxLength = cellIndex === 3 ? 25 : 15;
          const displayText = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
          pdf.setDrawColor(0, 102, 204);
          pdf.rect(currentX, yPosition - 6, columnWidths[cellIndex], cellHeight);
          pdf.text(displayText, currentX + 2, yPosition);
          currentX += columnWidths[cellIndex];
        });
        yPosition += cellHeight;
      });

      yPosition += 5;
      pdf.setDrawColor(0, 102, 204);
      pdf.line(startX, yPosition, startX + 70, yPosition);
      yPosition += 8;
      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(10);
      pdf.text(`Total: ${formatFrenchNumber(totalAmount).replace(/\//g, ' ').replace(/\s+/g, ' ')}`, startX, yPosition);

      yPosition += 15;
      pdf.setFontSize(8);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Nombre d'effets: ${visibleEffets.length}`, startX, yPosition);

      pdf.save('effets-en-circulation.pdf');
      document.body.removeChild(loadingMsg);
    } catch (error) {
      console.error('Error:', error);
      document.body.removeChild(loadingMsg);
      alert("Erreur lors de la génération du PDF des effets");
    }
  };
  document.head.appendChild(script);
}

function downloadPayavenirsPDF() {
  // Show loading
  const loadingMsg = document.createElement('div');
  loadingMsg.innerHTML = '<div class="alert alert-info">Génération du PDF paiements à venir...</div>';
  document.body.appendChild(loadingMsg);

  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  script.onload = function() {
    try {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape

      // Add title
      pdf.setFontSize(18);
      pdf.setTextColor(0, 0, 128); // Dark blue
      pdf.text("Paiements à venir", 20, 20);

      // Add date
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text("Date: " + new Date().toLocaleDateString('fr-FR'), 20, 30);

      // Get visible payavenirs data
      const visiblePayavenirs = [];
      const payavenirRows = document.querySelectorAll('.payavenir-row');
      let totalAmount = 0;

      payavenirRows.forEach(row => {
        if (row.style.display !== 'none') {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 7) {
            const montantText = cells[1].textContent.trim();
            const montantValue = parseFrenchNumber(montantText.replace(/\s/g, ''));
            totalAmount += montantValue;

            visiblePayavenirs.push([
              cells[0].textContent.trim(),
              formatFrenchNumber(montantValue),
              cells[2].textContent.trim(),
              cells[3].textContent.trim(),
              cells[4].textContent.trim(),
              cells[5].textContent.trim(),
              cells[6].textContent.trim()
            ]);
          }
        }
      });

      // Table setup
      let yPosition = 45;
      const columnWidths = [40, 30, 30, 25, 30, 40, 30];
      const startX = 15;
      const cellHeight = 8;

      // Headers
      pdf.setFontSize(8);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(255, 255, 255); // White text
      const headers = ['Désignation', 'Montant', 'Date Échéance', 'Statut', 'Date Paiement', 'Fournisseur', 'Banque'];

      // Draw header cells with blue background
      let currentX = startX;
      headers.forEach((header, index) => {
        pdf.setFillColor(0, 102, 204); // Blue
        pdf.rect(currentX, yPosition - 6, columnWidths[index], cellHeight, 'F');
        pdf.text(header, currentX + 1, yPosition);
        currentX += columnWidths[index];
      });
      yPosition += cellHeight;

      // Data rows
      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(0, 0, 0);

      visiblePayavenirs.forEach(row => {
        if (yPosition > 180) {
          pdf.addPage();
          yPosition = 20;

          // Redraw headers on new page
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
        row.forEach((cell, cellIndex) => {
          const text = cell.toString();
          let maxLength;
          switch(cellIndex) {
            case 0: maxLength = 20; break;
            case 5: maxLength = 20; break;
            default: maxLength = 15; break;
          }
          const displayText = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
          pdf.setDrawColor(0, 102, 204); // Blue borders
          pdf.rect(currentX, yPosition - 6, columnWidths[cellIndex], cellHeight);
          pdf.text(displayText, currentX + 1, yPosition);
          currentX += columnWidths[cellIndex];
        });
        yPosition += cellHeight;
      });

      // Add total
      yPosition += 5;
      pdf.setDrawColor(0, 102, 204);
      pdf.line(startX, yPosition, startX + 70, yPosition);
      yPosition += 8;
      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(10);
      pdf.text(`Total: ${formatFrenchNumber(totalAmount)}`, startX, yPosition);

      // Add summary
      yPosition += 15;
      pdf.setFontSize(8);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Nombre de paiements à venir: ${visiblePayavenirs.length}`, startX, yPosition);

      pdf.save('paiements-a-venir.pdf');
      document.body.removeChild(loadingMsg);
    } catch (error) {
      console.error('Error:', error);
      document.body.removeChild(loadingMsg);
      alert('Erreur lors de la génération du PDF des paiements à venir');
    }
  };
  document.head.appendChild(script);
}

function downloadRecettesPDF() {
  // Show loading
  const loadingMsg = document.createElement('div');
  loadingMsg.innerHTML = '<div class="alert alert-info">Génération du PDF recettes...</div>';
  document.body.appendChild(loadingMsg);

  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  script.onload = function() {
    try {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape

      // Add title
      pdf.setFontSize(18);
      pdf.setTextColor(0, 0, 128); // Dark blue
      pdf.text("Recettes à venir", 20, 20);

      // Add date
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text("Date: " + new Date().toLocaleDateString('fr-FR'), 20, 30);

      // Get visible recettes data
      const visibleRecettes = [];
      const recetteRows = document.querySelectorAll('.recavenir-row');
      let totalAmount = 0;

      recetteRows.forEach(row => {
        if (row.style.display !== 'none') {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 7) {
            const montantText = cells[1].textContent.trim();
            const montantValue = parseFrenchNumber(montantText.replace(/\s/g, ''));
            totalAmount += montantValue;

            visibleRecettes.push([
              cells[0].textContent.trim(),
              formatFrenchNumber(montantValue),
              cells[2].textContent.trim(),
              cells[3].textContent.trim(),
              cells[4].textContent.trim(),
              cells[5].textContent.trim(),
              cells[6].textContent.trim()
            ]);
          }
        }
      });

      // Table setup
      let yPosition = 45;
      const columnWidths = [40, 30, 30, 25, 30, 40, 30];
      const startX = 15;
      const cellHeight = 8;

      // Headers
      pdf.setFontSize(8);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(255, 255, 255); // White text
      const headers = ['Désignation', 'Montant', 'Date Échéance', 'Statut', 'Date Paiement', 'Client', 'Banque'];

      // Draw header cells with blue background
      let currentX = startX;
      headers.forEach((header, index) => {
        pdf.setFillColor(0, 102, 204); // Blue
        pdf.rect(currentX, yPosition - 6, columnWidths[index], cellHeight, 'F');
        pdf.text(header, currentX + 1, yPosition);
        currentX += columnWidths[index];
      });
      yPosition += cellHeight;

      // Data rows
      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(0, 0, 0);

      visibleRecettes.forEach(row => {
        if (yPosition > 180) {
          pdf.addPage();
          yPosition = 20;

          // Redraw headers on new page
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
        row.forEach((cell, cellIndex) => {
          const text = cell.toString();
          let maxLength;
          switch(cellIndex) {
            case 0: maxLength = 20; break; // Désignation
            case 5: maxLength = 20; break; // Client
            default: maxLength = 15; break;
          }
          const displayText = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
          pdf.setDrawColor(0, 102, 204); // Blue borders
          pdf.rect(currentX, yPosition - 6, columnWidths[cellIndex], cellHeight);
          pdf.text(displayText, currentX + 1, yPosition);
          currentX += columnWidths[cellIndex];
        });
        yPosition += cellHeight;
      });

      // Add total
      yPosition += 5;
      pdf.setDrawColor(0, 102, 204);
      pdf.line(startX, yPosition, startX + 70, yPosition);
      yPosition += 8;
      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(10);
      pdf.text(`Total: ${formatFrenchNumber(totalAmount)}`, startX, yPosition);

      // Add summary
      yPosition += 15;
      pdf.setFontSize(8);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Nombre de recettes à venir: ${visibleRecettes.length}`, startX, yPosition);

      pdf.save('recettes-a-venir.pdf');
      document.body.removeChild(loadingMsg);
    } catch (error) {
      console.error('Error:', error);
      document.body.removeChild(loadingMsg);
      alert('Erreur lors de la génération du PDF des recettes à venir');
    }
  };
  document.head.appendChild(script);
}

function downloadExcel() {
      // Show loading
      const loadingMsg = document.createElement('div');
      loadingMsg.innerHTML = '<div class="alert alert-info">Génération du fichier Excel...</div>';
      document.body.appendChild(loadingMsg);
      
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      script.onload = function() {
        try {
          const wb = XLSX.utils.book_new();
          
          // Cheques sheet
          const chequesData = [];
          chequesData.push(['Numéro', 'Montant', 'Date Échéance', 'Bénéficiaire', 'Banque', 'Statut']);
          let chequesTotalAmount = 0;
          
          document.querySelectorAll('.cheque-row').forEach(row => {
            if (row.style.display !== 'none') {
              const cells = row.querySelectorAll('td');
              if (cells.length >= 6) {
                const montantText = cells[1].textContent.trim();
                const montantValue = parseFrenchNumber(montantText.replace(/\//g, ''));
                chequesTotalAmount += montantValue;
                
                chequesData.push([
                  cells[0].textContent.trim(),
                  formatFrenchNumber(montantValue),
                  cells[2].textContent.trim(),
                  cells[3].textContent.trim(),
                  cells[4].textContent.trim(),
                  cells[5].textContent.trim()
                ]);
              }
            }
          });
          
          chequesData.push(['TOTAL', formatFrenchNumber(chequesTotalAmount), '', '', '', '']);
          
          const chequesSheet = XLSX.utils.aoa_to_sheet(chequesData);
          XLSX.utils.book_append_sheet(wb, chequesSheet, 'Chèques');
          
          // Effets sheet
          const effetsData = [];
          effetsData.push(['Numéro', 'Montant', 'Date Échéance', 'Bénéficiaire', 'Banque', 'Statut']);
          let effetsTotalAmount = 0;
          
          document.querySelectorAll('.effet-row').forEach(row => {
            if (row.style.display !== 'none') {
              const cells = row.querySelectorAll('td');
              if (cells.length >= 6) {
                const montantText = cells[1].textContent.trim();
                const montantValue = parseFrenchNumber(montantText.replace(/\//g, ''));
                effetsTotalAmount += montantValue;
                
                effetsData.push([
                  cells[0].textContent.trim(),
                  formatFrenchNumber(montantValue),
                  cells[2].textContent.trim(),
                  cells[3].textContent.trim(),
                  cells[4].textContent.trim(),
                  cells[5].textContent.trim()
                ]);
              }
            }
          });
          
          effetsData.push(['TOTAL', formatFrenchNumber(effetsTotalAmount), '', '', '', '']);
          
          const effetsSheet = XLSX.utils.aoa_to_sheet(effetsData);
          XLSX.utils.book_append_sheet(wb, effetsSheet, 'Effets');
          
          // Payavenirs sheet
          const payavenirsData = [];
          payavenirsData.push(['Désignation', 'Montant', 'Date Échéance', 'Statut', 'Date Paiement', 'Fournisseur', 'Banque']);
          let payavenirsTotalAmount = 0;
          
          document.querySelectorAll('.payavenir-row').forEach(row => {
            if (row.style.display !== 'none') {
              const cells = row.querySelectorAll('td');
              if (cells.length >= 7) {
                const montantText = cells[1].textContent.trim();
                const montantValue = parseFrenchNumber(montantText.replace(/\//g, ''));
                payavenirsTotalAmount += montantValue;
                
                payavenirsData.push([
                  cells[0].textContent.trim(),
                  formatFrenchNumber(montantValue),
                  cells[2].textContent.trim(),
                  cells[3].textContent.trim(),
                  cells[4].textContent.trim(),
                  cells[5].textContent.trim(),
                  cells[6].textContent.trim()
                ]);
              }
            }
          });
          
          payavenirsData.push(['TOTAL', formatFrenchNumber(payavenirsTotalAmount), '', '', '', '', '']);
          
          const payavenirsSheet = XLSX.utils.aoa_to_sheet(payavenirsData);
          XLSX.utils.book_append_sheet(wb, payavenirsSheet, 'Paiements à venir');
          
          // Summary sheet
          const generalTotal = chequesTotalAmount + effetsTotalAmount + payavenirsTotalAmount;
          const summaryData = [
            ['Résumé Général - Situation Bancaire'],
            ['Date:', new Date().toLocaleDateString('fr-FR')],
            [''],
            ['Type', 'Montant', 'Nombre d\'éléments'],
            ['Total Chèques', formatFrenchNumber(chequesTotalAmount), (chequesData.length - 2).toString()],
            ['Total Effets', formatFrenchNumber(effetsTotalAmount), (effetsData.length - 2).toString()],
            ['Total Paiements à venir', formatFrenchNumber(payavenirsTotalAmount), (payavenirsData.length - 2).toString()],
            [''],
            ['Total Général', formatFrenchNumber(generalTotal), '']
          ];
          
          const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
          XLSX.utils.book_append_sheet(wb, summarySheet, 'Résumé');
          
          // Save file
          XLSX.writeFile(wb, 'situation-bancaire-' + new Date().toISOString().split('T')[0] + '.xlsx');
          document.body.removeChild(loadingMsg);
        } catch (error) {
          console.error('Error:', error);
          document.body.removeChild(loadingMsg);
          alert('Erreur lors de la génération du fichier Excel');
        }
      };
      document.head.appendChild(script);
    }
  
    
  
    function deleteBanque(id) {
      fetch(`/tresorerie/banques/delete/${id}`, {
        method: 'DELETE',
        body: JSON.stringify({ id }),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(response => {
        if (response.ok) {
          alert('Banque supprimée avec succès');
          location.reload();
        } else {
          alert('Erreur lors de la suppression de la banque');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('Erreur lors de la suppression de la banque');
      });
    }
    </script>