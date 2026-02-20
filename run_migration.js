#!/usr/bin/env node

/**
 * Migration Runner Script
 * Usage: node run_migration.js
 */

import { migrateDemandePrixData } from './migrate_demandeprix_data.js';

console.log('🚀 Starting DemandeDePrix data migration...');

try {
  await migrateDemandePrixData();
  console.log('✅ Migration completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
}
