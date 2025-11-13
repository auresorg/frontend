// lib/db.ts
import { Client } from "pg";

interface QueryConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl: {
    rejectUnauthorized: boolean;
    ca: string;
  };
}

export async function query<T extends Record<string, unknown>>(
  sql: string,
  params: readonly unknown[] = []
): Promise<T[]> {
  const config: QueryConfig = {
    host: process.env.POSTGRES_HOST!,
    port: Number(process.env.POSTGRES_PORT!),
    user: process.env.POSTGRES_USER!,
    password: process.env.POSTGRES_PASSWORD!,
    database: process.env.POSTGRES_DB!,
    ssl: {
      rejectUnauthorized: true,
      ca: process.env.POSTGRES_CA!,
    },
  };

  const client = new Client(config);

  await client.connect();
  const result = await client.query<T>(sql, [...params]);
  await client.end();

  return result.rows;
}
