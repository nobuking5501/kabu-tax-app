import { getSupabaseClient } from "./client";
import type { Submission, Transaction, Customer } from "./types";

// Submission関連
export async function createSubmission(data: {
  email: string;
  symbol: string;
  currency: string;
  years: number[];
  transaction_count: number;
}): Promise<number> {
  const supabase = getSupabaseClient();

  const { data: result, error } = await supabase
    .from("submissions")
    .insert({
      email: data.email,
      symbol: data.symbol,
      currency: data.currency,
      years: data.years,
      transaction_count: data.transaction_count,
      pdf_generated: true,
    })
    .select("id")
    .single();

  if (error) throw error;
  return result.id;
}

export async function getAllSubmissions(): Promise<Submission[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as Submission[]) || [];
}

export async function getSubmissionsByEmail(email: string): Promise<Submission[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("email", email)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as Submission[]) || [];
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
  const supabase = getSupabaseClient();

  const { error } = await supabase.from("transactions").insert({
    submission_id: data.submission_id,
    date: data.date,
    activity: data.activity,
    quantity: data.quantity,
    price: data.price,
    commission: data.commission || null,
  });

  if (error) throw error;
}

export async function getTransactionsBySubmission(submissionId: number): Promise<Transaction[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("submission_id", submissionId)
    .order("date", { ascending: true });

  if (error) throw error;
  return (data as Transaction[]) || [];
}

// Customer関連
export async function getAllCustomers(): Promise<Customer[]> {
  const supabase = getSupabaseClient();

  // Supabaseでは複雑な集計クエリはRPCを使う必要があります
  // ここでは全データを取得して、JavaScriptで集計します
  const { data: submissions, error } = await supabase
    .from("submissions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!submissions) return [];

  // JavaScriptで集計
  const customerMap = new Map<string, Customer>();

  submissions.forEach((sub: any) => {
    const existing = customerMap.get(sub.email);

    if (!existing) {
      customerMap.set(sub.email, {
        email: sub.email,
        first_submission: sub.created_at,
        last_submission: sub.created_at,
        total_submissions: 1,
        total_pdfs: sub.pdf_generated ? 1 : 0,
      });
    } else {
      existing.total_submissions++;
      if (sub.pdf_generated) existing.total_pdfs++;
      if (new Date(sub.created_at) < new Date(existing.first_submission)) {
        existing.first_submission = sub.created_at;
      }
      if (new Date(sub.created_at) > new Date(existing.last_submission)) {
        existing.last_submission = sub.created_at;
      }
    }
  });

  return Array.from(customerMap.values()).sort(
    (a, b) =>
      new Date(b.last_submission).getTime() -
      new Date(a.last_submission).getTime()
  );
}

// 統計
export async function getStats() {
  const supabase = getSupabaseClient();

  const { data: submissions, error } = await supabase
    .from("submissions")
    .select("*");

  if (error) throw error;
  if (!submissions) {
    return {
      totalCustomers: 0,
      totalSubmissions: 0,
      totalPDFs: 0,
      popularSymbols: [],
    };
  }

  // JavaScriptで集計
  const uniqueEmails = new Set(submissions.map((s: any) => s.email));
  const totalPDFs = submissions.filter((s: any) => s.pdf_generated).length;

  // シンボル集計
  const symbolCounts = new Map<string, number>();
  submissions.forEach((s: any) => {
    symbolCounts.set(s.symbol, (symbolCounts.get(s.symbol) || 0) + 1);
  });

  const popularSymbols = Array.from(symbolCounts.entries())
    .map(([symbol, count]) => ({ symbol, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalCustomers: uniqueEmails.size,
    totalSubmissions: submissions.length,
    totalPDFs,
    popularSymbols,
  };
}
