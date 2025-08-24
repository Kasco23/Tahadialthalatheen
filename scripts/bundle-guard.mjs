import fs from 'node:fs/promises';
import path from 'node:path';
const { execSync } = require('child_process');

async function run() {
  execSync('vite build', { stdio: 'inherit' });
  const stats = JSON.parse(await fs.readFile('bundlemeta.json'));
  let oversized = stats.chunks.filter(
    (c) => c.gzipSize > 200 * 1024 && c.isEntry,
  );
  if (oversized.length) {
    console.error('⚠️ Entry bundles exceeding 200 kB gzipped:', oversized);
    process.exit(1);
  }
  console.log('✅ bundle size is within budget');
}
run().catch((e) => {
  console.error(e);
  process.exit(1);
});
