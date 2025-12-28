import { Pool, PoolConfig } from "pg";

// --- 1. OPTIMIZATION: Run Configuration & CA Logic ONCE ---

const normalizeCa = (): string | undefined => {
    const raw = process.env.POSTGRES_CA || "";
    let candidate = raw;

    if (candidate.startsWith('"') && candidate.endsWith('"')) {
        candidate = candidate.slice(1, -1);
    }

    candidate = candidate.replace(/\\r/g, "").replace(/\\n/g, "\n").trim();

    const begin = '-----BEGIN CERTIFICATE-----';
    const end = '-----END CERTIFICATE-----';
    if (candidate.includes(begin) && candidate.includes(end)) {
        const parts = candidate.split(begin);
        if (parts.length > 1) {
            const afterBegin = parts[1];
            const inner = afterBegin.split(end)[0];
            if (inner) {
                const base64Body = inner.replace(/\s+/g, '');
                if (base64Body) {
                    const chunked: string[] = [];
                    for (let i = 0; i < base64Body.length; i += 64) {
                        chunked.push(base64Body.slice(i, i + 64));
                    }
                    candidate = `${begin}\n${chunked.join('\n')}\n${end}`;
                }
            }
        }
    }

    if (!/-----BEGIN CERTIFICATE-----/.test(candidate)) {
        try {
            const decoded = Buffer.from(candidate, 'base64').toString('utf8');
            if (/-----BEGIN CERTIFICATE-----/.test(decoded)) {
                candidate = decoded;
            }
        } catch {
            // ignore
        }
    }

    return candidate || undefined;
};

// Define config once
const config: PoolConfig = {
    host: process.env.POSTGRES_HOST!,
    port: Number(process.env.POSTGRES_PORT!),
    user: process.env.POSTGRES_USER!,
    password: process.env.POSTGRES_PASSWORD!,
    database: process.env.POSTGRES_DB!,
    ssl: {
        rejectUnauthorized: process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED !== '0',
        ca: normalizeCa(),
    },
    max: 1,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
};

// --- 2. OPTIMIZATION: Global Singleton Pattern ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalAny: any = global;
let pool: Pool = globalAny.postgresPool;

if (!pool) {
    pool = new Pool(config);
    globalAny.postgresPool = pool;
}

// --- 3. OPTIMIZATION: Simplified Query Function ---

export async function query<T extends Record<string, unknown>>(
    sql: string,
    params: readonly unknown[] = []
): Promise<T[]> {
    const result = await pool.query<T>(sql, [...params]);
    return result.rows;
}