# Dynamic Status Badges - Implementation Summary

## Changes Made

### 1. Prisma Schema (prisma/schema.prisma)
- Added `statut` column to `BondeCommande` model
- Added enum `StatutBondeCommande` with values: `en_attente_bl`, `partiel`, `livre`, `annule`
- Added `BondeLivraison` and `BondeLivraisonItem` models with relations

### 2. Backend (controllers/bcController.js)
- Added `calculateBCStatus(bc)` helper function (lines ~1325-1393)
  - Calculates status based on BL linkages and article reception
  - Returns status, label, color, articlesRecus, articlesTotal
  
- Added `updateBCStatusInDB(bcId)` helper function (lines ~1398-1421)
  - Fetches BC with items and linked BLs
  - Calculates status
  - Updates database
  - Returns status info

- Updated `listBc` function to:
  - Include `bondeLivraisons` in Prisma query
  - Calculate status for each BC using `calculateBCStatus()`
  - Pass status data to template (statusLabel, statusColor, statusValue, articlesRecus, articlesTotal)

### 3. Routes (routes/dashboard.js)
- Added BL API routes (already in place at lines 459-467):
  - GET `/api/bons-commande/:id/articles-remaining` - Get articles with received quantities
  - POST `/api/bons-livraison` - Create new BL (returns updated status)
  - GET `/api/bons-livraison/unlinked` - Get unlinked BLs
  - PATCH `/api/bons-commande/:bc_id/affecter-bl/:bl_id` - Link BL to BC (returns updated status)

### 4. Frontend (views/dashboard/Achats/bc/list.ejs)
- Added Status column in table header (line 474)
- Added status badge display in each row (lines 533-539)
  - Shows colored badge with status label
  - Shows progress (articles received / total)
- Added filter pills above table (lines 454-462)
- Added `filterByStatus()` JavaScript function (lines 1105-1142)

## Status Logic

| Status | Condition | Badge Color | Label |
|--------|-----------|-------------|-------|
| `en_attente_bl` | No BL linked | secondary (gray) | "Att. BL" |
| `partiel` | BL linked, partial reception | info (blue) | "Partiel" |
| `livre` | All articles fully received | success (green) | "Livré ✓" |

## Next Steps

### 1. Run Prisma Migration (Required)
```bash
npx prisma migrate dev --name add_statut_to_bondecommande
```

### 2. Test the Feature
1. Go to "Liste des Bon de Commandes"
2. Check status badges are displayed
3. Test creating a BL - status should update
4. Test filtering by status

### 3. Optional: Backfill Existing BCs
If you have existing BCs, you may want to run a script to calculate and update their status:
```javascript
// Run this once to update all existing BCs
const bcs = await prisma.bondeCommande.findMany({
  include: { commandesItems: true, bondeLivraisons: { where: { status: 'Actif' }, include: { items: true } } }
});
for (const bc of bcs) {
  await updateBCStatusInDB(bc.id);
}
```

## Files Modified
- `prisma/schema.prisma` - Added statut column and BL models
- `controllers/bcController.js` - Added status helpers and updated listBc
- `views/dashboard/Achats/bc/list.ejs` - Added status badge column and filters
- `routes/dashboard.js` - BL API routes (already present)

## Verification Commands
```bash
# Check Prisma schema is valid
npx prisma validate

# Check for syntax errors in bcController.js
node -e "require('./controllers/bcController.js')" 2>&1

# Generate Prisma client (after migration)
npx prisma generate
```
