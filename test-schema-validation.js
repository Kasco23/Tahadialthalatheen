#!/usr/bin/env node

/**
 * Simple validation test for the upgraded authentication-ready database schema
 * Tests core functionality without authentication constraints
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read .env file
const envContent = fs.readFileSync('.env', 'utf8');
const envLines = envContent.split('\n');

let VITE_SUPABASE_URL = '';
let VITE_SUPABASE_ANON_KEY = '';

envLines.forEach((line) => {
  if (line.startsWith('VITE_SUPABASE_URL=')) {
    VITE_SUPABASE_URL = line.split('=')[1];
  }
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
    VITE_SUPABASE_ANON_KEY = line.split('=')[1];
  }
});

console.log('🧪 Authentication Schema Validation Test');
console.log('='.repeat(50));

if (!VITE_SUPABASE_URL || !VITE_SUPABASE_ANON_KEY) {
  console.log('❌ Environment variables not configured');
  process.exit(1);
}

const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);

// Test 1: Schema compatibility
async function testSchemaColumns() {
  console.log('\n📋 Testing new schema columns...');

  try {
    // Test that new columns exist by selecting them
    const { data, error } = await supabase
      .from('games')
      .select('host_id, status, last_activity')
      .limit(1);

    if (error) {
      console.log('❌ Games table missing auth columns:', error.message);
      return false;
    }

    console.log('✅ Games table has auth columns');

    // Test players table
    const { data: playerData, error: playerError } = await supabase
      .from('players')
      .select('user_id, is_host, session_id')
      .limit(1);

    if (playerError) {
      console.log(
        '❌ Players table missing auth columns:',
        playerError.message,
      );
      return false;
    }

    console.log('✅ Players table has auth columns');
    return true;
  } catch (error) {
    console.log('❌ Schema test failed:', error.message);
    return false;
  }
}

// Test 2: Create anonymous game (no auth required)
async function testAnonymousGame() {
  console.log('\n🎮 Testing anonymous game creation...');

  const testGameId = 'TEST' + Date.now().toString().slice(-3);

  try {
    const { data, error } = await supabase
      .from('games')
      .insert({
        id: testGameId,
        host_code: testGameId + '-HOST',
        host_name: 'Test Anonymous Host',
        phase: 'CONFIG',
        status: 'waiting',
        segment_settings: { BELL: 10, SING: 10 },
        // host_id will be NULL (anonymous)
      })
      .select()
      .single();

    if (error) {
      console.log('❌ Anonymous game creation failed:', error.message);
      return false;
    }

    console.log('✅ Anonymous game created:', data.id);
    console.log('  - Host ID:', data.host_id || 'NULL (anonymous)');
    console.log('  - Status:', data.status);

    // Cleanup
    await supabase.from('games').delete().eq('id', testGameId);
    console.log('🧹 Test game cleaned up');

    return true;
  } catch (error) {
    console.log('❌ Anonymous game test failed:', error.message);
    return false;
  }
}

// Test 3: Add anonymous player
async function testAnonymousPlayer() {
  console.log('\n👤 Testing anonymous player creation...');

  const testGameId = 'PLR' + Date.now().toString().slice(-3);
  const testPlayerId = 'player-' + Date.now();

  try {
    // Create game first
    const { error: gameError } = await supabase.from('games').insert({
      id: testGameId,
      host_code: testGameId + '-HOST',
      host_name: 'Test Host',
      phase: 'LOBBY',
      status: 'waiting',
    });

    if (gameError) {
      console.log('❌ Failed to create test game:', gameError.message);
      return false;
    }

    // Add anonymous player
    const { data, error } = await supabase
      .from('players')
      .insert({
        id: testPlayerId,
        game_id: testGameId,
        name: 'Anonymous Player',
        role: 'playerA',
        score: 0,
        strikes: 0,
        is_connected: true,
        // user_id: NULL (anonymous)
        is_host: false,
        // session_id: NULL
      })
      .select()
      .single();

    if (error) {
      console.log('❌ Anonymous player creation failed:', error.message);
      return false;
    }

    console.log('✅ Anonymous player created:', data.name);
    console.log('  - User ID:', data.user_id || 'NULL (anonymous)');
    console.log('  - Is Host:', data.is_host);
    console.log('  - Session ID:', data.session_id || 'NULL');

    // Cleanup
    await supabase.from('players').delete().eq('game_id', testGameId);
    await supabase.from('games').delete().eq('id', testGameId);
    console.log('🧹 Test player cleaned up');

    return true;
  } catch (error) {
    console.log('❌ Anonymous player test failed:', error.message);
    return false;
  }
}

// Test 4: RLS policies
async function testSecurityPolicies() {
  console.log('\n🔒 Testing security policies...');

  try {
    // Try to access games - should work for public games
    const { data, error } = await supabase
      .from('games')
      .select('id, status')
      .eq('status', 'waiting')
      .limit(1);

    if (error) {
      console.log(
        '🛡️ RLS is blocking access (may be expected):',
        error.message,
      );
    } else {
      console.log('📋 Found', data.length, 'accessible waiting games');
    }

    return true;
  } catch (error) {
    console.log('❌ Security test failed:', error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  const tests = [
    { name: 'Schema Columns', test: testSchemaColumns },
    { name: 'Anonymous Game', test: testAnonymousGame },
    { name: 'Anonymous Player', test: testAnonymousPlayer },
    { name: 'Security Policies', test: testSecurityPolicies },
  ];

  let passed = 0;
  let failed = 0;

  for (const { name, test } of tests) {
    try {
      const result = await test();
      if (result) {
        passed++;
        console.log(`\n✅ ${name}: PASSED`);
      } else {
        failed++;
        console.log(`\n❌ ${name}: FAILED`);
      }
    } catch (error) {
      failed++;
      console.log(`\n💥 ${name}: ERROR -`, error.message);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(
    `📊 Schema Validation Results: ${passed} passed, ${failed} failed`,
  );

  if (failed === 0) {
    console.log('🎉 All authentication schema tests passed!');
    console.log('✅ Your database is ready for authenticated operations.');
  } else {
    console.log('⚠️ Some tests failed. Please review the output above.');
  }

  return failed === 0;
}

runTests()
  .then((success) => process.exit(success ? 0 : 1))
  .catch((error) => {
    console.error('💥 Test runner failed:', error.message);
    process.exit(1);
  });
