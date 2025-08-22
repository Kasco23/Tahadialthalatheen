#!/usr/bin/env node

// Quick test script to verify Supabase connection
// Run with: node test-supabase-connection.js

import fs from 'fs';
import https from 'https';

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

console.log('🔍 Testing Supabase Connection:');
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
  console.log('\n📋 Steps to fix:');
  console.log(
    '1. Go to https://supabase.com/dashboard/project/zgvmkjefgdabumvafqch/settings/api',
  );
  console.log('2. Copy the "anon public" API key');
  console.log(
    '3. Replace PLACEHOLDER_GET_CORRECT_KEY_FROM_DASHBOARD in .env file',
  );
  process.exit(1);
}

// Test the connection
const url = new URL(`${VITE_SUPABASE_URL}/rest/v1/`);
const options = {
  hostname: url.hostname,
  port: 443,
  path: url.pathname,
  method: 'GET',
  headers: {
    apikey: VITE_SUPABASE_ANON_KEY,
    Authorization: `Bearer ${VITE_SUPABASE_ANON_KEY}`,
  },
};

const req = https.request(options, (res) => {
  console.log(`\n📡 Response Status: ${res.statusCode}`);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Connection successful!');
      console.log('📊 API Response:', data.slice(0, 100) + '...');
    } else {
      console.log('❌ Connection failed');
      console.log('📋 Response:', data);

      if (data.includes('Invalid API key')) {
        console.log("\n🔧 Fix: The API key doesn't match this project URL");
        console.log('   Get the correct key from Supabase dashboard');
      }
    }
  });
});

req.on('error', (e) => {
  console.log('❌ Request failed:', e.message);
});

req.end();
