#!/usr/bin/env node
/**
 * update-docs-index.mjs
 *
 * Goal: Assist agents/devs by generating a suggested diff for docs/INDEX.md.
 * - Scans docs/ directory for top-level markdown files (excludes INDEX.md itself)
 * - Compares against existing INDEX.md entries
 * - Reports: missing entries, extra entries (referenced but absent), and unchanged
 * - DOES NOT overwrite automatically: prints a structured summary + optional regenerated section.
 *
 * Usage:
 *   pnpm node scripts/update-docs-index.mjs  # or: node scripts/update-docs-index.mjs
 */

import { readFileSync, readdirSync, writeFileSync, chmodSync } from 'node:fs';
import { join, extname } from 'node:path';

const DOCS_DIR = join(process.cwd(), 'docs');
const INDEX_PATH = join(DOCS_DIR, 'INDEX.md');

function listTopLevelDocs() {
  return readdirSync(DOCS_DIR, { withFileTypes: true })
    .filter(d => d.isFile() && extname(d.name).toLowerCase() === '.md')
    .map(d => d.name)
    .filter(n => n !== 'INDEX.md')
    .sort();
}

function extractLinkedDocs(indexContent) {
  const linkRegex = /\[[^\]]+\]\(([^)]+)\)/g; // markdown links
  const found = new Set();
  let match;
  while ((match = linkRegex.exec(indexContent)) !== null) {
    const target = match[1];
    if (target.startsWith('../')) continue; // ignore references outside docs/
    if (target.includes('/')) continue; // skip subdir deep links (flows/README.md handled separately)
    if (target.endsWith('.md')) found.add(target.split('#')[0]);
  }
  return Array.from(found).sort();
}

function injectMissing(indexContent, missing) {
  if (!missing.length) return indexContent;
  // Simple strategy: append missing entries above Last Updated line in a generic section.
  const marker = '**Last Updated**:';
  const lines = indexContent.split(/\r?\n/);
  let insertAt = lines.findIndex(l => l.startsWith(marker));
  if (insertAt === -1) insertAt = lines.length;
  const block = [ '', '## 🆕 Newly Detected Docs', '', ...missing.map(name => `### [${name}](${name})\n**Purpose**: _TBD_\n**Audience**: _TBD_\n**Contains**: _TBD_`), '' ];
  lines.splice(insertAt, 0, ...block);
  // Update timestamp if present
  const tsIdx = lines.findIndex(l => l.startsWith('**Last Updated**'));
  if (tsIdx !== -1) {
    lines[tsIdx] = `**Last Updated**: ${new Date().toISOString().slice(0,10)} (auto-updated)`;
  }
  return lines.join('\n');
}

function main() {
  const existing = listTopLevelDocs();
  let indexContent = '';
  try {
    indexContent = readFileSync(INDEX_PATH, 'utf8');
  } catch (e) {
    console.error('ERROR: Cannot read docs/INDEX.md');
    process.exit(1);
  }
  const referenced = extractLinkedDocs(indexContent);

  const missing = existing.filter(f => !referenced.includes(f));
  const stale = referenced.filter(f => !existing.includes(f));
  const upToDate = existing.filter(f => referenced.includes(f));

  console.log('\nDocs Index Audit');
  console.log('=================');
  console.log('Found top-level docs (excluding INDEX.md):', existing.length); 
  console.log('Referenced in INDEX.md:', referenced.length); 
  console.log('\nMissing (present on disk, not in INDEX.md):');
  console.log(missing.length ? missing.map(f => '  - ' + f).join('\n') : '  (none)');
  console.log('\nStale (referenced but file missing):');
  console.log(stale.length ? stale.map(f => '  - ' + f).join('\n') : '  (none)');
  console.log('\nUp-to-date entries:');
  console.log(upToDate.map(f => '  - ' + f).join('\n'));

  const write = process.argv.includes('--write');
  if (write) {
    const updated = injectMissing(indexContent, missing);
    if (updated !== indexContent) {
      writeFileSync(INDEX_PATH, updated, 'utf8');
      console.log(`\nINDEX.md updated with ${missing.length} new entr${missing.length===1?'y':'ies'}.`);
    } else {
      console.log('\nNo changes written (no missing docs).');
    }
  } else {
    if (missing.length) {
      console.log('\nSuggested Markdown snippets to add (use --write to insert automatically):');
      missing.forEach(name => {
        console.log(`\n### [${name}](${name})\n**Purpose**: _TBD_\n**Audience**: _TBD_\n**Contains**: _TBD_`);
      });
    }
    console.log('\n(No files modified; pass --write to update INDEX.md)');
  }
}

main();

// Ensure executable bit (best-effort)
try { chmodSync(new URL(import.meta.url).pathname, 0o755); } catch {}
