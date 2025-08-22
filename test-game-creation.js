#!/usr/bin/env node

// Test script to check if we're in development mode and verify Supabase writes
// Run with: node test-game-creation.js

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

console.log('🧪 Testing Game Creation:');
console.log('URL:', VITE_SUPABASE_URL);
console.log(
  'API Key:',
  VITE_SUPABASE_ANON_KEY
    ? `${VITE_SUPABASE_ANON_KEY.slice(0, 10)}...`
    : 'MISSING',
);

if (
  !VITE_SUPABASE_URL ||
  !VITE_SUPABASE_ANON_KEY ||
  VITE_SUPABASE_ANON_KEY.includes('PLACEHOLDER')
) {
  console.log('❌ Environment variables not properly configured');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);

// Test game creation
async function testGameCreation() {
  const testGameId = 'TEST' + Date.now().toString().slice(-3);
  const testHostCode = testGameId + '-HOST';

  console.log(`\n🎮 Creating test game: ${testGameId}`);

  try {
    // Try to create a game
    const { data, error } = await supabase
      .from('games')
      .insert({
        id: testGameId,
        host_code: testHostCode,
        host_name: 'Test Host',
        phase: 'CONFIG',
        segment_settings: { BELL: 10, SING: 10 },
      })
      .select()
      .single();

    if (error) {
      console.log('❌ Failed to create game:', error.message);
      return false;
    }

    console.log('✅ Game created successfully:', data.id);

    // Try to read it back
    const { data: readData, error: readError } = await supabase
      .from('games')
      .select('*')
      .eq('id', testGameId)
      .single();

    if (readError) {
      console.log('❌ Failed to read game back:', readError.message);
      return false;
    }

    console.log('✅ Game read back successfully:', readData.id);

    // Clean up
    const { error: deleteError } = await supabase
      .from('games')
      .delete()
      .eq('id', testGameId);

    if (deleteError) {
      console.log('⚠️ Failed to clean up test game:', deleteError.message);
    } else {
      console.log('🧹 Test game cleaned up');
    }

    return true;
  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
    return false;
  }
}

// Test player creation
async function testPlayerCreation() {
  console.log('\n👤 Testing player operations...');

  // First create a test game
  const testGameId = 'PL' + Date.now().toString().slice(-4);
  const testPlayerId = 'player-' + Date.now();

  try {
    // Create game first
    const { error: gameError } = await supabase.from('games').insert({
      id: testGameId,
      host_code: testGameId + '-HOST',
      host_name: 'Test Host',
      phase: 'LOBBY',
    });

    if (gameError) {
      console.log(
        '❌ Failed to create test game for player test:',
        gameError.message,
      );
      return false;
    }

    // Add player
    const { data, error } = await supabase
      .from('players')
      .insert({
        id: testPlayerId,
        game_id: testGameId,
        name: 'Test Player',
        role: 'playerA',
        score: 0,
        strikes: 0,
        is_connected: true,
      })
      .select()
      .single();

    if (error) {
      console.log('❌ Failed to create player:', error.message);
      return false;
    }

    console.log('✅ Player created successfully:', data.name);

    // Clean up
    await supabase.from('players').delete().eq('id', testPlayerId);
    await supabase.from('games').delete().eq('id', testGameId);
    console.log('🧹 Test player cleaned up');

    return true;
  } catch (error) {
    console.log('❌ Player test failed:', error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('\n🔄 Running Supabase write tests...\n');

  const gameTestResult = await testGameCreation();
  const playerTestResult = await testPlayerCreation();

  console.log('\n📊 Test Results:');
  console.log(`Game Creation: ${gameTestResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Player Creation: ${playerTestResult ? '✅ PASS' : '❌ FAIL'}`);

  if (gameTestResult && playerTestResult) {
    console.log('\n🎉 All tests passed! Supabase writes are working.');
    console.log(
      '💡 The issue might be in the frontend development mode configuration.',
    );
  } else {
    console.log(
      '\n💥 Some tests failed. Check your Supabase configuration and permissions.',
    );
  }
}

runTests().catch(console.error);
