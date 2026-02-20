# DemandeDePrix Migration Guide

## Overview
This migration converts your DemandeDePrix system from a single-supplier model to a many-to-many relationship using the new `demandeandfournisseur` join table.

## Files Created/Modified

### New Files
- `migrate_demandeprix_data.js` - Helper functions for data migration and CRUD operations
- `run_migration.js` - Script to run the migration
- `DEMANDEPRIX_MIGRATION_README.md` - This documentation

### Modified Files
- `controllers/demandeprixController.js` - Updated to use new helper functions
- `views/dashboard/Achats/demandeprix/edit.ejs` - Updated JavaScript for ES5 compatibility

## Prerequisites
- Your Prisma schema should have the `demandeandfournisseur` model
- Database should be accessible

## Migration Steps

### 1. Run Data Migration
```bash
cd c:\Users\alifa\Desktop\confonda
node run_migration.js
```

This will:
- Find all existing DemandeDePrix records
- Create corresponding `demandeandfournisseur` records for any existing single-supplier relationships
- Provide detailed logging of the process

### 2. Test the Application
- Start your Node.js application
- Test creating new DemandeDePrix with multiple suppliers
- Test editing existing DemandeDePrix
- Verify supplier relationships work correctly

## New Data Structure

### Before (Old Schema)
```javascript
// Single supplier relationship
{
  id: 1,
  fournisseurId: 123, // Single supplier
  date: "2025-01-01",
  articles: [...]
}
```

### After (New Schema)
```javascript
// Many-to-many relationship
{
  id: 1,
  date: "2025-01-01",
  articles: [...],
  fournisseurs: [
    { id: 123, name: "Supplier A", email: "a@example.com" },
    { id: 124, name: "Supplier B", email: "b@example.com" }
  ],
  fournisseurIds: [123, 124],
  fournisseur: { id: 123, name: "Supplier A" } // Backward compatibility
}
```

## Helper Functions Available

### `getDemandePrixWithFlattenedSuppliers(id)`
- Gets a DemandeDePrix with flattened supplier data
- Returns object with `fournisseurs` array and `fournisseurIds` array
- Maintains backward compatibility with `fournisseur` (first supplier)

### `createDemandePrixWithSuppliers(data, supplierIds)`
- Creates new DemandeDePrix with multiple suppliers
- Automatically creates `demandeandfournisseur` relationships
- Returns the created DemandeDePrix

### `updateDemandePrixSuppliers(demandePrixId, supplierIds)`
- Updates suppliers for an existing DemandeDePrix
- Removes old relationships and creates new ones
- Handles additions and removals efficiently

### `migrateDemandePrixData()`
- One-time migration script
- Converts existing single-supplier relationships to many-to-many
- Safe to run multiple times (checks for existing data)

## Frontend Changes

### EJS Template (edit.ejs)
- Updated to use ES5 JavaScript for better compatibility
- Added proper error handling and debugging
- Fixed EJS-JavaScript syntax conflicts
- Select2 now works with multiple supplier selection

### JavaScript Functions
- `collectPayload()` - Collects form data including multiple suppliers
- `sendEmail()` - Sends emails to all selected suppliers
- `downloadPDF()` - Downloads PDF for the DemandeDePrix
- `addArticleRow()` / `deleteArticleRow()` - Article management

## API Endpoints

### Create (POST `/achat/demande-prix`)
```json
{
  "suppliers": [1, 2, 3],  // Array of supplier IDs
  "date": "2025-01-01",
  "articles": [
    {
      "designation": "Article name",
      "reference": "REF001",
      "unite": "PC",
      "quantite": 10
    }
  ]
}
```

### Update (PUT `/achat/demande-prix/:id`)
```json
{
  "suppliers": [1, 2, 4],  // Updated supplier list
  "date": "2025-01-02",
  "articles": [...],
  "deletedArticleIds": [5, 6]  // Articles to remove
}
```

## Testing Checklist

- [ ] Migration runs without errors
- [ ] New DemandeDePrix can be created with multiple suppliers
- [ ] Existing DemandeDePrix can be edited
- [ ] Supplier selection works in frontend
- [ ] Email sending works to multiple suppliers
- [ ] PDF generation works correctly
- [ ] All suppliers appear correctly in edit view

## Troubleshooting

### Migration Issues
- **Error: "column fournisseurId does not exist"** - Run Prisma migrate first
- **No suppliers migrated** - Check if existing data had `fournisseurId` values
- **Duplicate relations** - Migration script checks for existing data and skips

### Frontend Issues
- **Select2 not working** - Check jQuery is loaded before Select2
- **No console logs** - Check browser console for JavaScript errors
- **EJS template errors** - Verify all EJS variables are properly escaped

### Backend Issues
- **Import errors** - Ensure `migrate_demandeprix_data.js` is in correct path
- **Prisma errors** - Check database connection and schema
- **Supplier not found** - Verify supplier IDs exist in database

## Notes

- The migration is **idempotent** - safe to run multiple times
- Backward compatibility is maintained for existing code
- All new functions include proper error handling
- Frontend uses ES5 syntax for maximum browser compatibility
