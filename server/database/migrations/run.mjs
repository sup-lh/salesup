import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config({ quiet: true });
if (!process.env.DATABASE_URL) dotenv.config({ path: '.env.docker', quiet: true });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

const client = postgres(databaseUrl, {
  max: 1,
  onnotice: () => {},
});

try {
  const projectRoot = resolve(new URL('../../../', import.meta.url).pathname);
  const files = [
    'doc/sql/0001-independent-foundation.sql',
    'server/database/migrations/0002-business-independent.sql',
    'server/database/migrations/0003-auth-hardening.sql',
  ];

  for (const relativePath of files) {
    const sql = await readFile(resolve(projectRoot, relativePath), 'utf8');
    console.log('Applying ' + relativePath);
    await client.unsafe(sql);
  }

  console.log('Database migrations applied');
} finally {
  await client.end({ timeout: 5 });
}
