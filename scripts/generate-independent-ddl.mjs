import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, '..');
const source = await readFile(resolve(projectRoot, 'table.sql'), 'utf8');
const outputPath = resolve(
  projectRoot,
  'server/database/migrations/0002-business-independent.sql',
);
const independentDdl = source
  .replace(/^CREATE TABLE workspace_aadktftwa24hw\./gm, 'CREATE TABLE IF NOT EXISTS ')
  .replace(/workspace_[a-z0-9_]+\.user_[a-z0-9_]+/g, 'uuid')
  .replaceAll('workspace_aadktftwa24hw.', '')
  // Legacy account columns are represented as uuid in the independent schema. The
  // source dump may still contain composite-field index syntax such as
  // ((user_id).user_id), which is invalid once the column is a plain uuid.
  .replace(/\(\(([a-zA-Z_][a-zA-Z0-9_]*)\)\.user_id\)/g, '($1)')
  .replace(/\s+DEFAULT CASE[\s\S]*?END,/g, ',')
  .replaceAll('TABLESPACE pg_default', '');

const header = [
  '-- Generated from table.sql by scripts/generate-independent-ddl.mjs.',
  '-- Independent PostgreSQL schema only. No historical data is included.',
  '-- Do not edit this generated file directly; update the generator instead.',
  '',
  'CREATE EXTENSION IF NOT EXISTS pgcrypto;',
  '',
].join('\n');

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, header + independentDdl.trim() + '\n', 'utf8');
console.log('Generated ' + outputPath);
