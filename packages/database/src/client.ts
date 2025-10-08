import { Pool, QueryResult, QueryResultRow } from "pg";

// グローバルなプールインスタンス
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

    if (!connectionString) {
      throw new Error("DATABASE_URL or POSTGRES_URL environment variable is not set");
    }

    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false, // Supabase用
      },
    });
  }
  return pool;
}

// @vercel/postgresのsql互換インターフェース
export const sql = {
  async query<T extends QueryResultRow = any>(
    text: string,
    params?: any[]
  ): Promise<QueryResult<T>> {
    const pool = getPool();
    return await pool.query<T>(text, params);
  },
};

// テンプレートリテラル用のsql関数
export async function sqlTemplate<T extends QueryResultRow = any>(
  strings: TemplateStringsArray,
  ...values: any[]
): Promise<QueryResult<T>> {
  const pool = getPool();

  // テンプレートリテラルをパラメータ化クエリに変換
  let text = "";
  const params: any[] = [];

  for (let i = 0; i < strings.length; i++) {
    text += strings[i];
    if (i < values.length) {
      params.push(values[i]);
      text += `$${params.length}`;
    }
  }

  return await pool.query<T>(text, params);
}

// デフォルトのquery関数
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const result = await sql.query(text, params);
  return result.rows as T[];
}

// プール接続を閉じる（テスト用）
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
