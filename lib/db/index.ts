/**
 * Database access.
 *
 * - DATABASE_URL set   → node-postgres (production: Neon, Supabase, RDS...).
 * - DATABASE_URL unset → embedded PGlite (real Postgres compiled to WASM) stored
 *   in .data/pglite and seeded with a demo practice. No native binaries needed.
 *
 * Migrations in ./drizzle are applied on first use in both modes.
 */
import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { PgDatabase } from 'drizzle-orm/pg-core';
import * as schema from './schema';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DB = PgDatabase<any, typeof schema>;

const MIGRATIONS_FOLDER = path.join(process.cwd(), 'drizzle');

export function isDemoMode(): boolean {
  return !process.env.DATABASE_URL;
}

async function connect(): Promise<DB> {
  if (process.env.DATABASE_URL) {
    const { Pool } = await import('pg');
    const { drizzle } = await import('drizzle-orm/node-postgres');
    const { migrate } = await import('drizzle-orm/node-postgres/migrator');
    const db = drizzle(new Pool({ connectionString: process.env.DATABASE_URL }), { schema });
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
    return db;
  }

  const { PGlite } = await import('@electric-sql/pglite');
  const { drizzle } = await import('drizzle-orm/pglite');
  const { migrate } = await import('drizzle-orm/pglite/migrator');
  // Serverless hosts (Vercel) only allow writes to /tmp: the demo then resets on cold starts.
  const dataDir = process.env.PGLITE_DIR ?? (process.env.VERCEL ? path.join(tmpdir(), 'pglite') : path.join(process.cwd(), '.data', 'pglite'));
  mkdirSync(path.dirname(dataDir), { recursive: true });
  const db = drizzle(new PGlite(dataDir), { schema });
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  const { seedDemoIfEmpty } = await import('./seed');
  await seedDemoIfEmpty(db);
  return db;
}

/** In-memory PGlite database with migrations applied — for tests. */
export async function createTestDb(): Promise<DB> {
  const { PGlite } = await import('@electric-sql/pglite');
  const { drizzle } = await import('drizzle-orm/pglite');
  const { migrate } = await import('drizzle-orm/pglite/migrator');
  const db = drizzle(new PGlite(), { schema });
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  return db;
}

// Reuse one connection across hot reloads in development.
const globalForDb = globalThis as unknown as { __fetch22Db?: Promise<DB> };

export function getDb(): Promise<DB> {
  if (!globalForDb.__fetch22Db) {
    globalForDb.__fetch22Db = connect().catch((err) => {
      globalForDb.__fetch22Db = undefined;
      throw err;
    });
  }
  return globalForDb.__fetch22Db;
}

export { schema };
