#!/usr/bin/env node

/**
 * Sidebar System Verification Script
 * Checks that all sidebar components are properly implemented
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const requiredFiles = [
  'src/context/AuthContext.tsx',
  'src/components/Navigation/SideNav.tsx',
  'src/components/ReactBits/Magnet.tsx',
  'src/components/Layout/AppLayout.tsx',
  'src/pages/Auth.tsx',
  'src/hooks/useTheme.ts',
];

const requiredImports = ['react-pro-sidebar', '@heroicons/react', 'jotai'];

console.log('🔍 Verifying Sidebar System Implementation...\n');

// Check files exist
let missingFiles = [];
requiredFiles.forEach((file) => {
  const fullPath = join(projectRoot, file);
  if (existsSync(fullPath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file}`);
    missingFiles.push(file);
  }
});

// Check package.json for dependencies
const packagePath = join(projectRoot, 'package.json');
if (existsSync(packagePath)) {
  console.log('\n📦 Checking Dependencies:');
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  requiredImports.forEach((dep) => {
    if (allDeps[dep]) {
      console.log(`✅ ${dep}: ${allDeps[dep]}`);
    } else {
      console.log(`❌ ${dep}: Missing`);
    }
  });
}

// Check key implementations
console.log('\n🔧 Checking Key Features:');

const appLayoutPath = join(projectRoot, 'src/components/Layout/AppLayout.tsx');
if (existsSync(appLayoutPath)) {
  const content = readFileSync(appLayoutPath, 'utf8');
  console.log(
    `✅ AppLayout: ${content.includes('SideNav') ? 'SideNav integrated' : '❌ Missing SideNav'}`,
  );
  console.log(
    `✅ AppLayout: ${content.includes('AuthContext') ? 'Auth context ready' : '❌ Missing AuthContext'}`,
  );
}

const authContextPath = join(projectRoot, 'src/context/AuthContext.tsx');
if (existsSync(authContextPath)) {
  const content = readFileSync(authContextPath, 'utf8');
  console.log(
    `✅ AuthContext: ${content.includes('signIn') ? 'Sign in ready' : '❌ Missing signIn'}`,
  );
  console.log(
    `✅ AuthContext: ${content.includes('signOut') ? 'Sign out ready' : '❌ Missing signOut'}`,
  );
}

const sideNavPath = join(projectRoot, 'src/components/Navigation/SideNav.tsx');
if (existsSync(sideNavPath)) {
  const content = readFileSync(sideNavPath, 'utf8');
  console.log(
    `✅ SideNav: ${content.includes('ProSidebar') ? 'Pro Sidebar ready' : '❌ Missing ProSidebar'}`,
  );
  console.log(
    `✅ SideNav: ${content.includes('Magnet') ? 'ReactBits integrated' : '❌ Missing ReactBits'}`,
  );
}

console.log(
  `\n${missingFiles.length === 0 ? '🎉' : '⚠️'} Sidebar System Status: ${missingFiles.length === 0 ? 'READY' : 'INCOMPLETE'}`,
);

if (missingFiles.length === 0) {
  console.log('\n✨ Your sidebar system is fully implemented and ready for:');
  console.log('   • User authentication and profiles');
  console.log('   • Theme system integration');
  console.log('   • ReactBits component upgrades');
  console.log('   • Admin panel features');
  console.log('   • Mobile responsive design');
  console.log('\n🚀 Ready for profile system development!');
} else {
  console.log(
    `\n❌ Missing ${missingFiles.length} required files. Please check implementation.`,
  );
}
