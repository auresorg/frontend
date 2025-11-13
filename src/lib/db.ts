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
    ca?: string;
  };
}

export async function query<T extends Record<string, unknown>>(
  sql: string,
  params: readonly unknown[] = []
): Promise<T[]> {
  const normalizeCa = (): string | undefined => {
    const raw = process.env.POSTGRES_CA || "";
    let candidate = raw;

    // strip wrapping quotes if present
    if (candidate.startsWith('"') && candidate.endsWith('"')) {
      candidate = candidate.slice(1, -1);
    }

    // convert literal "\\n" sequences into real newlines
    candidate = candidate.replace(/\\r/g, "").replace(/\\n/g, "\n").trim();

    // If the PEM is provided as a single line with spaces between blocks
    // (e.g. "-----BEGIN CERTIFICATE----- MII... UA== -----END CERTIFICATE-----"), fix it by
    // extracting the base64 body, removing whitespace, and re-chunking to 64-char lines.
    const begin = '-----BEGIN CERTIFICATE-----';
    const end = '-----END CERTIFICATE-----';
    if (candidate.includes(begin) && candidate.includes(end)) {
      const parts = candidate.split(begin);
      if (parts.length > 1) {
        const afterBegin = parts[1];
        const inner = afterBegin.split(end)[0];
        if (inner) {
          // remove all whitespace from the base64 body
          const base64Body = inner.replace(/\s+/g, '');
          if (base64Body) {
            // chunk into 64-char lines
            const chunked: string[] = [];
            for (let i = 0; i < base64Body.length; i += 64) {
              chunked.push(base64Body.slice(i, i + 64));
            }
            candidate = `${begin}\n${chunked.join('\n')}\n${end}`;
          }
        }
      }
    }

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

    return candidate || undefined;
  };

  const config: QueryConfig = {
    host: process.env.POSTGRES_HOST!,
    port: Number(process.env.POSTGRES_PORT!),
    user: process.env.POSTGRES_USER!,
    password: process.env.POSTGRES_PASSWORD!,
    database: process.env.POSTGRES_DB!,
    ssl: {
      rejectUnauthorized: process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED !== '0',
      ca: normalizeCa(),
    },
  };

  const client = new Client(config);

  await client.connect();
  const result = await client.query<T>(sql, [...params]);
  await client.end();

  return result.rows;
}
