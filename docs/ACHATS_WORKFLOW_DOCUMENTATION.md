# Confonda - Module Achats Documentation
## Bon de Commande (BC) → Bon de Livraison (BL) → Facture Workflow

---

## 1. OVERVIEW / ARCHITECTURE

### Data Models Relationships

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   BondeCommande     │────<│ BondeLivraisonBonde │>────│   BondeLivraison    │
│   (BC)              │     │    Commande         │     │   (BL)              │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
         │                                                        │
         │                                                ┌─────────────┐
         │                                                │             │
         │                                          ┌─────┴────┐   ┌────┴────┐
         │                                          │          │   │         │
         │                                          ▼          ▼   ▼         │
         │                                   ┌────────────┐ ┌────────────┐    │
         │                                   │  Facture   │ │FactureAvoir│    │
         │                                   │            │ │            │    │
         │                                   └────────────┘ └────────────┘    │
         │                                                                    │
         └────────────────────────────────────────────────────────────────────┘
                        (via bondeCommandeLinks on Facture)
```

### Key Models (Prisma Schema)

**BondeCommande**
- `id`, `numero`, `date`, `fournisseurId`, `statut`
- Relations: `commandesItems[]`, `bondeLivraisonLinks[]`
- Status: `en_attente_bl`, `partiel`, `livre`, `annule`

**BondeLivraison**
- `id`, `numero`, `date`, `fournisseurId`, `status`
- Relations: `items[]`, `bondeCommandeLinks[]`, `factureLinks[]`, `avoirs[]`
- Items track: `qtyRetourne` (for returns)

**Facture**
- `id`, `numero`, `date`, `fournisseurId`, `totalHt`, `totalTtc`, `tauxTva`
- Relations: `items[]`, `bondeLivraisonLinks[]`, `avoirs[]`
- Can have multiple BLs linked

**FactureAvoir**
- `id`, `numero`, `date`, `type` (retour/remise/escompte)
- Relations: `facture`, `bondeLivraison`
- Updates `BondeLivraisonItem.qtyRetourne` when created

---

## 2. WORKFLOW DESCRIPTION

### Phase 1: Bon de Commande (BC) Creation

1. **Create BC**
   - Route: `POST /achat/bc`
   - Controller: `storeBc()`
   - Data: supplier, items, chantier distribution
   - Status: `en_attente_bl`

2. **BC List View**
   - Route: `GET /achat/bon-commande`
   - Shows: BC number, date, supplier, chantiers, articles count, BLs linked, status
   - Actions: Edit, Dashboard, PDF, Delete, Create BL, Affect BL

### Phase 2: Bon de Livraison (BL) Management

#### Option A: Create BL from BC
1. **Open Create BL Modal**
   - Route: `POST /api/bons-livraison`
   - Controller: `createBondeLivraison()`
   - Data: `bcId`, `numeroBL`, `dateReception`, `articles[]`
   - Auto-links BL to BC via `BondeLivraisonBondeCommande`

2. **Update BC Status**
   - Calculated from: `articlesRecus / articlesTotal`
   - If `articlesRecus === 0` → `en_attente_bl`
   - If `articlesRecus < articlesTotal` → `partiel`
   - If `articlesRecus >= articlesTotal` → `livre`

#### Option B: Affect Existing BL to BC
1. **Search Available BLs**
   - Route: `GET /api/bons-livraison/search`
   - Filter: Same supplier, not linked to other BC

2. **Link BL to BC**
   - Route: `PATCH /api/bons-commande/:bc_id/affecter-bl/:bl_id`
   - Controller: `affecterBL()`
   - Creates entry in `BondeLivraisonBondeCommande`

### Phase 3: Facture Creation & Linking

#### Option A: Create Facture from BL
1. **Create Facture**
   - Route: `POST /api/factures`
   - Controller: `createFacture()`
   - Auto-sets: `fournisseurId` from BL
   - Links: BL via `FactureBondeLivraison`

#### Option B: Affect BL to Existing Facture
1. **Fetch Factures by Supplier**
   - Route: `GET /api/factures/by-fournisseur/:fournisseurId`
   - Filter: Same supplier (by name matching)
   
2. **Link BL to Facture**
   - Route: `POST /api/factures/:id/affecter-bl`
   - Validation: BL supplier === Facture supplier (by name)
   - Creates entry in `FactureBondeLivraison`

### Phase 4: Facture Avoir (Credit Note)

#### Create Facture Avoir from BL
1. **Open Avoir Modal**
   - Select type: `retour`, `remise`, `escompte`
   - For `retour`: Max qty = `item.quantite - item.qtyRetourne`

2. **Create Avoir**
   - Route: `POST /api/factures-avoir`
   - Controller: `createFactureAvoir()`
   - Updates: `BondeLivraisonItem.qtyRetourne += avoirItem.quantite`
   - Links: To BL and Facture

---

## 3. FILE UPLOAD/DOWNLOAD SYSTEM

### BL File Upload
- Storage: `./uploads/bl/`
- Route: `POST /api/bons-livraison/:id/upload`
- Allowed: PDF, JPG, JPEG, PNG
- Max size: 10MB

### Facture File Upload
- Storage: `./uploads/factures/`
- Route: `POST /api/factures/:id/upload`
- Same restrictions as BL

---

## 4. BC DASHBOARD FEATURE

### Route
`GET /achats/bons-commande/:id/dashboard`

### Controller
`getBCDashboard()` in `bcController.js`

### Display
1. **Header**: BC info, supplier, stats
2. **Articles Section**: All BC items with details
3. **BLs Section**: Each linked BL with:
   - BL number (clickable)
   - Items table: Qté cmd, Qté reçue, Qté Retournée
   - Linked factures for each BL
4. **Factures Section**: All unique factures with totals

---

## 5. KEY VALIDATION RULES

1. **Supplier Matching**
   - BL can only link to Facture with same supplier
   - Compared by `fournisseur.name` (case-insensitive)

2. **Qty Return Cap**
   - `maxRetournable = item.quantite - item.qtyRetourne`
   - Enforced in frontend and backend

3. **BC Status Auto-Update**
   - Based on linked BLs received quantities
   - Excludes cancelled BLs

---

## 6. FRONTEND ENHANCEMENT PROMPT

```
I need you to analyze the Confonda Achats module frontend and suggest comprehensive UX/UI improvements.

Current Features:
- BC List: Shows BCs with supplier, chantiers, articles count, BLs linked, status
- BC Dashboard: Shows BC → BLs → Factures chain with all details
- BL List: Shows BLs with status, linked BCs, linked Factures
- Facture List: Shows factures with totals, linked BLs, avoirs, file upload/download
- Modals: Create BL, Affect BL, Create Facture, Create Facture Avoir

Current Tech Stack:
- EJS templates
- Bootstrap 4
- Vanilla JavaScript
- DataTables (in some places)

Your Task:
Analyze the current implementation and suggest specific improvements for:

1. USER EXPERIENCE:
   - Reduce clicks needed for common actions
   - Better visual hierarchy and information density
   - Improved navigation between related entities (BC ↔ BL ↔ Facture)
   - Better empty states and loading states

2. UI MODERNIZATION:
   - Consistent color coding (BC=blue, BL=purple, Facture=green, Avoir=orange)
   - Better badge/button styling
   - Improved table readability
   - Card-based layouts where appropriate

3. INTERACTION IMPROVEMENTS:
   - Inline editing possibilities
   - Bulk actions (bulk PDF, bulk status update)
   - Better search/filter experience
   - Keyboard shortcuts

4. MOBILE RESPONSIVENESS:
   - Current pain points on mobile
   - Suggested mobile-first improvements

5. PERFORMANCE:
   - Lazy loading for large lists
   - Virtual scrolling
   - Optimized data fetching

6. ERROR HANDLING & FEEDBACK:
   - Better toast notifications
   - Form validation UX
   - Confirmation dialogs for destructive actions

Please provide:
- Specific recommendations with examples
- Code snippets where relevant
- Priority ranking (high/medium/low)
- Effort estimation for each suggestion
- Quick wins vs long-term improvements
```

---

## 7. API ENDPOINTS SUMMARY

### BC Endpoints
```
GET    /achat/bon-commande              # List BCs
GET    /achats/bons-commande/:id/dashboard  # BC Dashboard
POST   /achat/bc                        # Create BC
GET    /achat/bc/:id/edit               # Edit BC form
PUT    /achat/bc/:id                    # Update BC
DELETE /achat/bc/:id                    # Delete BC
GET    /api/bons-commande/:id/articles-remaining  # Get articles with received qty
```

### BL Endpoints
```
GET    /achats/bons-livraison           # List BLs
POST   /api/bons-livraison              # Create BL
GET    /api/bons-livraison/search       # Search available BLs
POST   /api/bons-livraison/:bl_id/affecter-bc  # Affect BC to existing BL
PATCH  /api/bons-commande/:bc_id/affecter-bl/:bl_id  # Link BL to BC
POST   /api/bons-livraison/:id/upload   # Upload file
GET    /api/bons-livraison/:id/download # Download file
GET    /achats/bons-livraison/:id/edit  # Edit BL
```

### Facture Endpoints
```
GET    /achats/factures                 # List Factures
POST   /api/factures                    # Create Facture
GET    /api/factures/by-fournisseur/:fournisseurId  # Get by supplier
POST   /api/factures/:id/affecter-bl    # Link BL to Facture
POST   /api/factures/:id/upload         # Upload file
GET    /api/factures/:id/download       # Download file
POST   /api/factures-avoir              # Create Facture Avoir
```

---

## 8. DATABASE RELATIONS

### BondeLivraisonBondeCommande (Join Table)
- `id`, `bondeLivraisonId`, `bondeCommandeId`, `createdAt`
- Unique constraint: `[bondeLivraisonId, bondeCommandeId]`

### FactureBondeLivraison (Join Table)
- `id`, `factureId`, `bondeLivraisonId`, `createdAt`
- Unique constraint: `[factureId, bondeLivraisonId]`

### FactureAvoir
- `id`, `numero`, `date`, `type`, `totalTtc`, `factureId`, `bondeLivraisonId`
- Types: `retour`, `remise`, `escompte`

---

## 9. STATUS FLOW

### BC Status
```
en_attente_bl → partiel → livre
                    ↓
                  annule
```

### BL Status
```
Actif → Annulé
```

### Facture Status
```
en_attente → valide → payee
```

---

## 10. IMPORTANT IMPLEMENTATION NOTES

1. **Supplier Name vs ID Matching**
   - Due to data inconsistencies, supplier matching uses name comparison
   - Case-insensitive search using `contains` in Prisma

2. **Qty Retourne Tracking**
   - Stored at `BondeLivraisonItem` level
   - Incremented when creating `retour` type FactureAvoir
   - Prevents returning more than received

3. **File Storage**
   - All files stored in `./uploads/` with subdirectories
   - Filename format: `{type}-{id}-{timestamp}-{random}.{ext}`
   - Files served via download endpoint with proper headers

4. **BC Dashboard Aggregation**
   - Factures are collected from all BLs
   - Uses Map to ensure uniqueness (one facture may link to multiple BLs)

---

## Quick Reference: File Locations

| Component | File Path |
|-----------|-----------|
| BC Controller | `/controllers/bcController.js` |
| BL Controller | `/controllers/blController.js` |
| Facture Controller | `/controllers/factureController.js` |
| BC List View | `/views/dashboard/Achats/bc/list.ejs` |
| BC Dashboard | `/views/dashboard/Achats/bc/dashboard.ejs` |
| BL List View | `/views/dashboard/Achats/bl/list.ejs` |
| Facture List | `/views/dashboard/Achats/factures/list.ejs` |
| Routes | `/routes/dashboard.js` |
| Prisma Schema | `/prisma/schema.prisma` |

---

*Document Version: 1.0*
*Last Updated: April 2026*
