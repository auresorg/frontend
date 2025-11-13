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
      // allow some flexibility in how the CA is provided via env (Azure may encode newlines)
      rejectUnauthorized: process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED !== '0',
      ca: (() => {
        const raw = process.env.POSTGRES_CA || "";
        let candidate = raw;
        // strip wrapping quotes if present
        if (candidate.startsWith('"') && candidate.endsWith('"')) {
          candidate = candidate.slice(1, -1);
        }
        // convert literal "\n" sequences into real newlines
        candidate = candidate.replace(/\\r/g, "").replace(/\\n/g, "\n").trim();

        // if it doesn't look like a PEM cert, try base64 decode and check again
        if (!/-----BEGIN CERTIFICATE-----/.test(candidate)) {
          try {
            const decoded = Buffer.from(candidate, 'base64').toString('utf8');
            if (/-----BEGIN CERTIFICATE-----/.test(decoded)) {
              candidate = decoded;
            }
          } catch {
            // ignore decode errors, we'll fall back to the raw candidate
          }
        }

        return candidate;
      })(),
    },
  };

  const client = new Client(config);

  await client.connect();
  const result = await client.query<T>(sql, [...params]);
  await client.end();

  return result.rows;
}
