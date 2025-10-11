import { getFirestoreClient } from "./client";
import type { Submission, Transaction, Customer } from "./types";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

// Submission関連
export async function createSubmission(data: {
  email: string;
  symbol: string;
  currency: string;
  years: number[];
  transaction_count: number;
}): Promise<string> {
  const db = getFirestoreClient();

  const docRef = await db.collection("submissions").add({
    email: data.email,
    symbol: data.symbol,
    currency: data.currency,
    years: data.years,
    transaction_count: data.transaction_count,
    pdf_generated: true,
    created_at: FieldValue.serverTimestamp(),
    updated_at: FieldValue.serverTimestamp(),
  });

  return docRef.id;
}

export async function getAllSubmissions(): Promise<Submission[]> {
  const db = getFirestoreClient();

  const snapshot = await db
    .collection("submissions")
    .orderBy("created_at", "desc")
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      email: data.email,
      symbol: data.symbol,
      currency: data.currency,
      years: data.years,
      transaction_count: data.transaction_count,
      pdf_generated: data.pdf_generated,
      created_at: data.created_at?.toDate() || new Date(),
      updated_at: data.updated_at?.toDate() || new Date(),
    } as Submission;
  });
}

export async function getSubmissionsByEmail(
  email: string
): Promise<Submission[]> {
  const db = getFirestoreClient();

  const snapshot = await db
    .collection("submissions")
    .where("email", "==", email)
    .orderBy("created_at", "desc")
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      email: data.email,
      symbol: data.symbol,
      currency: data.currency,
      years: data.years,
      transaction_count: data.transaction_count,
      pdf_generated: data.pdf_generated,
      created_at: data.created_at?.toDate() || new Date(),
      updated_at: data.updated_at?.toDate() || new Date(),
    } as Submission;
  });
}

// Transaction関連
export async function createTransaction(data: {
  submission_id: string;
  date: string;
  activity: "Purchased" | "Sold";
  quantity: number;
  price: number;
  commission?: number;
}): Promise<void> {
  const db = getFirestoreClient();

  await db
    .collection("submissions")
    .doc(data.submission_id)
    .collection("transactions")
    .add({
      date: data.date,
      activity: data.activity,
      quantity: data.quantity,
      price: data.price,
      commission: data.commission || null,
      created_at: FieldValue.serverTimestamp(),
    });
}

export async function getTransactionsBySubmission(
  submissionId: string
): Promise<Transaction[]> {
  const db = getFirestoreClient();

  const snapshot = await db
    .collection("submissions")
    .doc(submissionId)
    .collection("transactions")
    .orderBy("date", "asc")
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      submission_id: submissionId,
      date: data.date,
      activity: data.activity,
      quantity: data.quantity,
      price: data.price,
      commission: data.commission,
      created_at: data.created_at?.toDate() || new Date(),
    } as Transaction;
  });
}

// Customer関連
export async function getAllCustomers(): Promise<Customer[]> {
  const db = getFirestoreClient();

  const snapshot = await db
    .collection("submissions")
    .orderBy("created_at", "desc")
    .get();

  // JavaScriptで集計
  const customerMap = new Map<string, Customer>();

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    const email = data.email;
    const createdAt = data.created_at?.toDate() || new Date();
    const existing = customerMap.get(email);

    if (!existing) {
      customerMap.set(email, {
        email: email,
        first_submission: createdAt,
        last_submission: createdAt,
        total_submissions: 1,
        total_pdfs: data.pdf_generated ? 1 : 0,
      });
    } else {
      existing.total_submissions++;
      if (data.pdf_generated) existing.total_pdfs++;
      if (createdAt < existing.first_submission) {
        existing.first_submission = createdAt;
      }
      if (createdAt > existing.last_submission) {
        existing.last_submission = createdAt;
      }
    }
  });

  return Array.from(customerMap.values()).sort(
    (a, b) => b.last_submission.getTime() - a.last_submission.getTime()
  );
}

// 統計
export async function getStats() {
  const db = getFirestoreClient();

  const snapshot = await db.collection("submissions").get();

  if (snapshot.empty) {
    return {
      totalCustomers: 0,
      totalSubmissions: 0,
      totalPDFs: 0,
      popularSymbols: [],
    };
  }

  // JavaScriptで集計
  const uniqueEmails = new Set<string>();
  let totalPDFs = 0;
  const symbolCounts = new Map<string, number>();

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    uniqueEmails.add(data.email);
    if (data.pdf_generated) totalPDFs++;
    symbolCounts.set(data.symbol, (symbolCounts.get(data.symbol) || 0) + 1);
  });

  const popularSymbols = Array.from(symbolCounts.entries())
    .map(([symbol, count]) => ({ symbol, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalCustomers: uniqueEmails.size,
    totalSubmissions: snapshot.size,
    totalPDFs,
    popularSymbols,
  };
}
