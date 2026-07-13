import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";

type StoreKey = "vehicles" | "users" | "activity" | "chats" | "uploads" | "anonymous-downloads" | "verification-codes";

export interface StoredUploadAsset {
  id: string;
  name: string;
  type: string;
  size: number;
  dataBase64: string;
  createdAt: string;
}

interface StoreShape {
  vehicles: unknown[];
  users: unknown[];
  activity: unknown[];
  chats: unknown[];
  uploads: unknown[];
  "anonymous-downloads": unknown[];
  "verification-codes": unknown[];
}

const STORE_PATH = path.join(process.cwd(), ".data", "store.json");
const DEFAULT_STORE: StoreShape = {
  vehicles: [],
  users: [],
  activity: [],
  chats: [],
  uploads: [],
  "anonymous-downloads": [],
  "verification-codes": [],
};

let pool: Pool | undefined;
let initialized = false;

function getDatabaseUrl() {
  return process.env.DATABASE_URL;
}

function getPool() {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) return undefined;

  if (!pool) {
    const needsSsl = databaseUrl.includes("sslmode=require") || process.env.PGSSLMODE === "require";
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
    });
  }

  return pool;
}

async function ensurePostgresTable() {
  const db = getPool();
  if (!db || initialized) return;

  await db.query(`
    create table if not exists app_store (
      key text primary key,
      value jsonb not null,
      updated_at timestamptz not null default now()
    )
  `);
  await db.query(`
    create table if not exists upload_assets (
      id text primary key,
      name text not null,
      type text not null,
      size integer not null,
      data_base64 text not null,
      created_at timestamptz not null default now()
    )
  `);
  initialized = true;
}

async function readFileStore(): Promise<StoreShape> {
  try {
    return { ...DEFAULT_STORE, ...JSON.parse(await readFile(STORE_PATH, "utf8")) };
  } catch {
    return DEFAULT_STORE;
  }
}

async function writeFileStore(store: StoreShape) {
  await mkdir(path.dirname(STORE_PATH), { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2));
}

export async function readStoreCollection<T>(key: StoreKey): Promise<T[]> {
  const db = getPool();

  if (db) {
    await ensurePostgresTable();
    const result = await db.query<{ value: T[] }>("select value from app_store where key = $1", [key]);
    return result.rows[0]?.value ?? [];
  }

  const store = await readFileStore();
  return (store[key] ?? []) as T[];
}

export async function deleteFromStoreCollection<T>(key: StoreKey, predicate: (item: T) => boolean): Promise<boolean> {
  const db = getPool();

  if (db) {
    await ensurePostgresTable();
    try {
      console.log(`Attempting direct PostgreSQL delete from key: ${key}`);
      
      // Use transaction for atomic operation
      const client = await db.connect();
      try {
        await client.query('BEGIN');
        
        // Read current data
        const result = await client.query<{ value: T[] }>("select value from app_store where key = $1", [key]);
        const currentData = result.rows[0]?.value ?? [];
        
        console.log(`Current data for key ${key}: ${currentData.length} items`);
        
        // Log matching items
        const matchingItems = currentData.filter(item => predicate(item));
        console.log(`Found ${matchingItems.length} items matching deletion predicate`);
        
        // Filter out items matching predicate
        const filteredData = currentData.filter(item => !predicate(item));
        
        console.log(`Filtered ${currentData.length} items to ${filteredData.length} items for key: ${key}`);
        
        // Write back filtered data
        await client.query(
          `
            insert into app_store (key, value, updated_at)
            values ($1, $2::jsonb, now())
            on conflict (key)
            do update set value = excluded.value, updated_at = now()
          `,
          [key, JSON.stringify(filteredData)],
        );
        
        await client.query('COMMIT');
        console.log(`Successfully deleted from PostgreSQL key: ${key}, remaining items: ${filteredData.length}`);
        return true;
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Transaction failed for delete from key ${key}:`, error);
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(`Error deleting from PostgreSQL for key ${key}:`, error);
      throw error;
    }
  }

  console.log(`Deleting from file system key: ${key}`);
  const store = await readFileStore();
  const currentData = (store[key] ?? []) as T[];
  console.log(`Current data for key ${key}: ${currentData.length} items`);
  
  const matchingItems = currentData.filter(item => predicate(item));
  console.log(`Found ${matchingItems.length} items matching deletion predicate`);
  
  const filteredData = currentData.filter(item => !predicate(item));
  await writeFileStore({ ...store, [key]: filteredData });
  console.log(`Successfully deleted from file system key: ${key}, remaining items: ${filteredData.length}`);
  return true;
}

export async function writeStoreCollection<T>(key: StoreKey, value: T[]) {
  const db = getPool();

  if (db) {
    await ensurePostgresTable();
    try {
      console.log(`Writing to PostgreSQL key: ${key}, items: ${value.length}`);
      
      // Use transaction for atomic operation
      const client = await db.connect();
      try {
        await client.query('BEGIN');
        
        await client.query(
          `
            insert into app_store (key, value, updated_at)
            values ($1, $2::jsonb, now())
            on conflict (key)
            do update set value = excluded.value, updated_at = now()
          `,
          [key, JSON.stringify(value)],
        );
        
        await client.query('COMMIT');
        console.log(`Successfully wrote to PostgreSQL key: ${key}`);
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Transaction failed for key ${key}:`, error);
        throw error;
      } finally {
        client.release();
      }
      return;
    } catch (error) {
      console.error(`Error writing to PostgreSQL for key ${key}:`, error);
      throw error;
    }
  }

  console.log(`Writing to file system key: ${key}, items: ${value.length}`);
  const store = await readFileStore();
  await writeFileStore({ ...store, [key]: value });
}

export async function readUploadAsset(id: string): Promise<StoredUploadAsset | undefined> {
  const db = getPool();

  if (db) {
    await ensurePostgresTable();
    const result = await db.query<{
      id: string;
      name: string;
      type: string;
      size: number;
      data_base64: string;
      created_at: Date;
    }>("select id, name, type, size, data_base64, created_at from upload_assets where id = $1", [id]);
    const row = result.rows[0];
    if (!row) return undefined;
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      size: row.size,
      dataBase64: row.data_base64,
      createdAt: row.created_at.toISOString(),
    };
  }

  const uploads = await readStoreCollection<StoredUploadAsset>("uploads");
  return uploads.find((upload) => upload.id === id);
}

export async function writeUploadAsset(upload: StoredUploadAsset) {
  const db = getPool();

  if (db) {
    await ensurePostgresTable();
    await db.query(
      `
        insert into upload_assets (id, name, type, size, data_base64, created_at)
        values ($1, $2, $3, $4, $5, $6)
        on conflict (id)
        do update set
          name = excluded.name,
          type = excluded.type,
          size = excluded.size,
          data_base64 = excluded.data_base64,
          created_at = excluded.created_at
      `,
      [upload.id, upload.name, upload.type, upload.size, upload.dataBase64, upload.createdAt],
    );
    return;
  }

  const uploads = await readStoreCollection<StoredUploadAsset>("uploads");
  await writeStoreCollection("uploads", [upload, ...uploads.filter((item) => item.id !== upload.id)]);
}
