import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';
import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config({ quiet: true });
if (!process.env.DATABASE_URL) dotenv.config({ path: '.env.docker', quiet: true });

const scrypt = promisify(scryptCallback);
const databaseUrl = process.env.DATABASE_URL;
const username = process.env.ADMIN_USERNAME;
const password = process.env.ADMIN_PASSWORD;
const displayName = process.env.ADMIN_DISPLAY_NAME || username;
const createOnly = process.env.ADMIN_CREATE_ONLY === 'true';

if (!databaseUrl || !username || !password) {
  throw new Error('DATABASE_URL, ADMIN_USERNAME and ADMIN_PASSWORD are required');
}

const salt = randomBytes(16).toString('hex');
const key = await scrypt(password, salt, 64);
const passwordHash = 'scrypt$' + salt + '$' + key.toString('hex');
const sql = postgres(databaseUrl, { max: 1 });

try {
  let userId;
  let accountExists = false;
  if (createOnly) {
    const existing = await sql.unsafe('SELECT id FROM users WHERE username = $1 LIMIT 1', [username.trim()]);
    if (existing.length > 0) {
      accountExists = true;
      userId = existing[0].id;
    }
  }
  if (!userId) {
    const users = await sql.unsafe(
      "INSERT INTO users (username, display_name, password_hash) VALUES ($1, $2, $3) ON CONFLICT (username) DO UPDATE SET display_name = EXCLUDED.display_name, password_hash = EXCLUDED.password_hash, status = 'active', updated_at = CURRENT_TIMESTAMP RETURNING id",
      [username.trim(), displayName.trim(), passwordHash],
    );
    userId = users[0].id;
  }
  await sql.unsafe(
    "INSERT INTO user_roles (user_id, role_id) SELECT $1, id FROM roles WHERE role_key = 'admin' ON CONFLICT DO NOTHING",
    [userId],
  );
  console.log(accountExists ? 'Admin account already exists: ' + username.trim() : 'Admin account initialized: ' + username.trim());
} finally {
  await sql.end({ timeout: 5 });
}
