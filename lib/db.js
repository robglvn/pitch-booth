import { neon } from '@neondatabase/serverless';
import { HttpError } from './http.js';

// Tagged-template SQL client (Neon over HTTP). Tables are created on first use.
let sqlImpl = null;
let ready = null;

// Lets local tests swap in a different Postgres client with the same tagged-template shape.
export function setSql(fn) { sqlImpl = fn; ready = null; }

export async function db() {
  if (!sqlImpl) {
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!url) throw new HttpError(500, 'No database is connected. Add Neon Postgres under Storage in Vercel.', 'no_database');
    sqlImpl = neon(url);
  }
  if (!ready) ready = migrate(sqlImpl).catch(e => { ready = null; throw e; });
  await ready;
  return sqlImpl;
}

async function migrate(sql) {
  await sql`CREATE TABLE IF NOT EXISTS people (
    id text PRIMARY KEY,
    code text UNIQUE NOT NULL,
    label text NOT NULL DEFAULT '',
    name text NOT NULL DEFAULT '',
    sells text NOT NULL DEFAULT '',
    city text NOT NULL DEFAULT '',
    prefs jsonb NOT NULL DEFAULT '{}'::jsonb,
    revoked boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    last_seen timestamptz
  )`;
  // summary: what lists and the admin page need (scores, mode). detail: the full scorecard and transcript, owner-only.
  await sql`CREATE TABLE IF NOT EXISTS calls (
    id text PRIMARY KEY,
    person_id text NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    mode text NOT NULL DEFAULT '',
    difficulty text NOT NULL DEFAULT '',
    overall double precision NOT NULL DEFAULT 0,
    asked_for_sale boolean NOT NULL DEFAULT false,
    summary jsonb NOT NULL DEFAULT '{}'::jsonb,
    detail jsonb NOT NULL DEFAULT '{}'::jsonb
  )`;
  await sql`CREATE INDEX IF NOT EXISTS calls_person ON calls (person_id, created_at DESC)`;
  await sql`CREATE TABLE IF NOT EXISTS usage (
    id bigserial PRIMARY KEY,
    ts timestamptz NOT NULL DEFAULT now(),
    day date NOT NULL,
    person_id text NOT NULL,
    role text NOT NULL,
    model text NOT NULL DEFAULT '',
    status integer NOT NULL DEFAULT 0,
    input integer NOT NULL DEFAULT 0,
    cache_read integer NOT NULL DEFAULT 0,
    cache_write integer NOT NULL DEFAULT 0,
    output integer NOT NULL DEFAULT 0,
    cost double precision NOT NULL DEFAULT 0
  )`;
  await sql`CREATE INDEX IF NOT EXISTS usage_person_day ON usage (person_id, day)`;
  await sql`CREATE INDEX IF NOT EXISTS usage_ts ON usage (ts)`;
}
