import { sql } from "./client";
import type { Submission, Transaction, Customer } from "./types";

// Submission関連
export async function createSubmission(data: {
  email: string;
  symbol: string;
  currency: string;
  years: number[];
  transaction_count: number;
}): Promise<number> {
  const result = await sql.query(
    `INSERT INTO submissions (email, symbol, currency, years, transaction_count, pdf_generated)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [data.email, data.symbol, data.currency, data.years, data.transaction_count, true]
  );
  return result.rows[0].id;
}

export async function getAllSubmissions(): Promise<Submission[]> {
  const result = await sql.query(
    `SELECT * FROM submissions ORDER BY created_at DESC`
  );
  return result.rows as Submission[];
}

export async function getSubmissionsByEmail(email: string): Promise<Submission[]> {
  const result = await sql.query(
    `SELECT * FROM submissions WHERE email = $1 ORDER BY created_at DESC`,
    [email]
  );
  return result.rows as Submission[];
}

// Transaction関連
export async function createTransaction(data: {
  submission_id: number;
  date: string;
  activity: "Purchased" | "Sold";
  quantity: number;
  price: number;
  commission?: number;
}): Promise<void> {
  await sql.query(
    `INSERT INTO transactions (submission_id, date, activity, quantity, price, commission)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [data.submission_id, data.date, data.activity, data.quantity, data.price, data.commission || null]
  );
}

export async function getTransactionsBySubmission(submissionId: number): Promise<Transaction[]> {
  const result = await sql.query(
    `SELECT * FROM transactions WHERE submission_id = $1 ORDER BY date ASC`,
    [submissionId]
  );
  return result.rows as Transaction[];
}

// Customer関連
export async function getAllCustomers(): Promise<Customer[]> {
  const result = await sql.query(
    `SELECT
      email,
      MIN(created_at) as first_submission,
      MAX(created_at) as last_submission,
      COUNT(*) as total_submissions,
      SUM(CASE WHEN pdf_generated THEN 1 ELSE 0 END) as total_pdfs
    FROM submissions
    GROUP BY email
    ORDER BY last_submission DESC`
  );
  return result.rows as Customer[];
}

// 統計
export async function getStats() {
  const totalCustomers = await sql.query(
    `SELECT COUNT(DISTINCT email) as count FROM submissions`
  );

  const totalSubmissions = await sql.query(
    `SELECT COUNT(*) as count FROM submissions`
  );

  const totalPDFs = await sql.query(
    `SELECT COUNT(*) as count FROM submissions WHERE pdf_generated = true`
  );

  const popularSymbols = await sql.query(
    `SELECT symbol, COUNT(*) as count
     FROM submissions
     GROUP BY symbol
     ORDER BY count DESC
     LIMIT 5`
  );

  return {
    totalCustomers: parseInt(totalCustomers.rows[0].count),
    totalSubmissions: parseInt(totalSubmissions.rows[0].count),
    totalPDFs: parseInt(totalPDFs.rows[0].count),
    popularSymbols: popularSymbols.rows,
  };
}
