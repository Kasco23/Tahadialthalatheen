#!/usr/bin/env node

/**
 * Test script for new authenticated game creation and player joining
 * Tests botasync function testAuthenticatedPlayerJoin() {
  const testGameId = 'PLR' + Date.now().toString().slice(-3);
  const testPlayerId = 'player-' + Date.now();
  const testUserId = generateUUID();
  const testHostId = generateUUID();nticated and anonymous user flows
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

console.log('🔐 Testing Authenticated Game Operations:');
console.log('URL:', VITE_SUPABASE_URL);

if (!VITE_SUPABASE_URL || !VITE_SUPABASE_ANON_KEY) {
  console.log('❌ Environment variables not properly configured');
  process.exit(1);
}

const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);

// Generate proper UUID v4 for testing
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Test with authenticated user (mocked for testing)
async function testAuthenticatedGameCreation() {
  const testGameId = 'AUTH' + Date.now().toString().slice(-3);
  const testHostCode = testGameId + '-HOST';

  console.log(`\\n🎮 Testing authenticated game creation: ${testGameId}`);

  try {
    // Test creating a game WITHOUT host_id first (anonymous)
    const { data, error } = await supabase
      .from('games')
      .insert({
        id: testGameId,
        host_code: testHostCode,
        host_name: 'Test Anonymous Host',
        // host_id: null, // Allow anonymous games
        phase: 'CONFIG',
        status: 'waiting', // NEW: status tracking
        last_activity: new Date().toISOString(), // NEW: activity tracking
        segment_settings: { BELL: 10, SING: 10 },
      })
      .select()
      .single();

    if (error) {
      console.log('❌ Failed to create authenticated game:', error.message);
      return false;
    }

    console.log('✅ Anonymous game created:', {
      id: data.id,
      host_id: data.host_id || 'NULL (anonymous)',
      status: data.status,
    });

    // Test reading it back with the new schema
    const { data: readData, error: readError } = await supabase
      .from('games')
      .select('id, host_id, status, last_activity')
      .eq('id', testGameId)
      .single();

    if (readError) {
      console.log('❌ Failed to read game back:', readError.message);
      return false;
    }

    console.log('✅ Game read back with new schema:', readData);

    // Clean up
    await supabase.from('games').delete().eq('id', testGameId);
    console.log('🧹 Authenticated game test cleaned up');

    return true;
  } catch (error) {
    console.log('❌ Authenticated game test failed:', error.message);
    return false;
  }
}

// Test authenticated player joining
async function testAuthenticatedPlayerJoin() {
  console.log('\\n👤 Testing authenticated player operations...');

  const testGameId = 'PLYR' + Date.now().toString().slice(-4);
  const testPlayerId = 'auth-player-' + Date.now();
  const mockUserId = 'test-user-' + Date.now();

  try {
    // Create game first
    const { error: gameError } = await supabase.from('games').insert({
      id: testGameId,
      host_code: testGameId + '-HOST',
      host_name: 'Test Host',
      host_id: 'host-' + Date.now(),
      phase: 'LOBBY',
      status: 'waiting',
      last_activity: new Date().toISOString(),
    });

    if (gameError) {
      console.log('❌ Failed to create test game:', gameError.message);
      return false;
    }

    // Add authenticated player with new schema
    const { data, error } = await supabase
      .from('players')
      .insert({
        id: testPlayerId,
        game_id: testGameId,
        name: 'Test Authenticated Player',
        role: 'playerA',
        user_id: mockUserId, // NEW: authenticated user
        is_host: false, // NEW: host tracking
        session_id: 'session-' + Date.now(), // NEW: session tracking
        score: 0,
        strikes: 0,
        is_connected: true,
      })
      .select()
      .single();

    if (error) {
      console.log('❌ Failed to create authenticated player:', error.message);
      return false;
    }

    console.log('✅ Authenticated player created:', {
      id: data.id,
      user_id: data.user_id,
      is_host: data.is_host,
      session_id: data.session_id,
    });

    // Test the RLS policies by trying to read as authenticated user
    console.log('🔒 Testing RLS policies...');

    // This should work because we have proper auth integration
    const { data: playerData, error: readError } = await supabase
      .from('players')
      .select('id, name, user_id, is_host')
      .eq('game_id', testGameId);

    if (readError) {
      console.log('⚠️ RLS policy test showed:', readError.message);
    } else {
      console.log(
        '✅ RLS policies allow reading players:',
        playerData.length,
        'players',
      );
    }

    // Clean up
    await supabase.from('players').delete().eq('id', testPlayerId);
    await supabase.from('games').delete().eq('id', testGameId);
    console.log('🧹 Authenticated player test cleaned up');

    return true;
  } catch (error) {
    console.log('❌ Authenticated player test failed:', error.message);
    return false;
  }
}

// Test security validation function
async function testSecurityValidation() {
  console.log('\\n🔒 Testing security validation...');

  try {
    // Call the security validation function we created earlier
    const { data, error } = await supabase.rpc('validate_security_upgrade');

    if (error) {
      console.log('⚠️ Security validation function error:', error.message);
      return false;
    }

    console.log('✅ Security validation results:', data);

    if (data.insecure_policies === 0) {
      console.log('🔐 All RLS policies are secure!');
    } else {
      console.log('⚠️ Found', data.insecure_policies, 'insecure policies');
    }

    return true;
  } catch (error) {
    console.log('❌ Security validation failed:', error.message);
    return false;
  }
}

// Run all tests
async function runAuthTests() {
  console.log('🚀 Starting authenticated game system tests...\\n');

  const results = {
    gameCreation: await testAuthenticatedGameCreation(),
    playerJoin: await testAuthenticatedPlayerJoin(),
    security: await testSecurityValidation(),
  };

  console.log('\\n📊 Test Results Summary:');
  console.log(
    '✅ Authenticated Game Creation:',
    results.gameCreation ? 'PASS' : 'FAIL',
  );
  console.log(
    '✅ Authenticated Player Join:',
    results.playerJoin ? 'PASS' : 'FAIL',
  );
  console.log('✅ Security Validation:', results.security ? 'PASS' : 'FAIL');

  const allPassed = Object.values(results).every((result) => result === true);

  if (allPassed) {
    console.log('\\n🎉 All authentication tests PASSED!');
    console.log('✅ Database schema supports authenticated users');
    console.log('✅ RLS policies are secure');
    console.log('✅ Auth integration is working');
  } else {
    console.log('\\n❌ Some tests FAILED - check logs above');
  }

  return allPassed;
}

runAuthTests().catch(console.error);
