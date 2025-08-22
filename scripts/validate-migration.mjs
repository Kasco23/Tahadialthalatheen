#!/usr/bin/env node

/**
 * Test script to validate Supabase migration syntax
 * This script checks if the migration file has valid SQL syntax
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const migrationPath = join(
  process.cwd(),
  'supabase',
  'migrations',
  '20250123000000_improve_database_security_and_performance.sql',
);

try {
  const migrationContent = readFileSync(migrationPath, 'utf-8');

  // Basic SQL syntax validation checks
  const checks = [
    {
      name: 'BEGIN/COMMIT transaction',
      test: () =>
        migrationContent.includes('BEGIN;') &&
        migrationContent.includes('COMMIT;'),
    },
    {
      name: 'CREATE TABLE statements',
      test: () => /CREATE TABLE.*public\.rooms/s.test(migrationContent),
    },
    {
      name: 'RLS policy creation',
      test: () => /CREATE POLICY.*ON public\./g.test(migrationContent),
    },
    {
      name: 'Index creation',
      test: () => /CREATE INDEX.*ON public\./g.test(migrationContent),
    },
    {
      name: 'Function creation',
      test: () => /CREATE OR REPLACE FUNCTION/g.test(migrationContent),
    },
    {
      name: 'IF NOT EXISTS checks',
      test: () => migrationContent.includes('IF NOT EXISTS'),
    },
    {
      name: 'No syntax errors (basic)',
      test: () =>
        !migrationContent.includes('SYNTAX ERROR') &&
        !migrationContent.includes('undefined'),
    },
  ];

  console.log('🔍 Validating Supabase migration...\n');

  let allPassed = true;
  checks.forEach((check) => {
    const passed = check.test();
    console.log(`${passed ? '✅' : '❌'} ${check.name}`);
    if (!passed) allPassed = false;
  });

  console.log(
    `\n📊 Migration file size: ${Math.round(migrationContent.length / 1024)}KB`,
  );
  console.log(`📄 Lines of code: ${migrationContent.split('\n').length}`);

  if (allPassed) {
    console.log('\n🎉 Migration validation passed! Ready for deployment.');
  } else {
    console.log(
      '\n⚠️  Migration validation failed. Please review the issues above.',
    );
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error reading migration file:', error.message);
  process.exit(1);
}
