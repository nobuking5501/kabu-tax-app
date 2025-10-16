import { getFirestoreClient, getAuthClient } from "./client";
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
  const auth = getAuthClient();
  const db = getFirestoreClient();

  // Firebase Authenticationからユーザー一覧を取得
  const listUsersResult = await auth.listUsers();
  const authUsersMap = new Map<string, Customer>();

  listUsersResult.users.forEach((user) => {
    if (user.email) {
      authUsersMap.set(user.email, {
        email: user.email,
        uid: user.uid,
        displayName: user.displayName || undefined,
        photoURL: user.photoURL || undefined,
        createdAt: new Date(user.metadata.creationTime),
        lastSignInTime: user.metadata.lastSignInTime
          ? new Date(user.metadata.lastSignInTime)
          : undefined,
        total_submissions: 0,
        total_pdfs: 0,
        payment_count: 0,
      });
    }
  });

  // Firestoreから決済情報を取得（usersコレクション）
  const usersSnapshot = await db.collection("users").get();

  usersSnapshot.docs.forEach((doc) => {
    const data = doc.data();
    const uid = doc.id;

    // UIDからメールアドレスを探す
    for (const [email, customer] of authUsersMap.entries()) {
      if (customer.uid === uid) {
        // 決済情報をマージ
        if (data.paymentCompleted) {
          customer.payment_count = 1; // 現在は1回のみ対応
          customer.payment_completed = data.paymentCompleted;
          customer.last_payment_date = data.paymentDate?.toDate() || undefined;
        }
        break;
      }
    }
  });

  // Firestoreから提出履歴を取得してマージ
  const snapshot = await db
    .collection("submissions")
    .orderBy("created_at", "desc")
    .get();

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    const email = data.email;
    const createdAt = data.created_at?.toDate() || new Date();

    let customer = authUsersMap.get(email);

    if (!customer) {
      // Firebase Authに存在しないメールアドレス（旧データなど）
      customer = {
        email: email,
        total_submissions: 0,
        total_pdfs: 0,
        payment_count: 0,
      };
      authUsersMap.set(email, customer);
    }

    // 提出履歴を集計
    customer.total_submissions++;
    if (data.pdf_generated) customer.total_pdfs++;

    if (!customer.first_submission || createdAt < customer.first_submission) {
      customer.first_submission = createdAt;
    }
    if (!customer.last_submission || createdAt > customer.last_submission) {
      customer.last_submission = createdAt;
    }
  });

  // 最終ログイン日時または最終提出日時でソート
  return Array.from(authUsersMap.values()).sort((a, b) => {
    const aDate = a.last_submission || a.lastSignInTime || a.createdAt || new Date(0);
    const bDate = b.last_submission || b.lastSignInTime || b.createdAt || new Date(0);
    return bDate.getTime() - aDate.getTime();
  });
}

// 提出履歴があるお客様のみを取得（旧関数、後方互換性のため残す）
export async function getCustomersWithSubmissions(): Promise<Customer[]> {
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
      if (createdAt < (existing.first_submission || new Date())) {
        existing.first_submission = createdAt;
      }
      if (createdAt > (existing.last_submission || new Date(0))) {
        existing.last_submission = createdAt;
      }
    }
  });

  return Array.from(customerMap.values()).sort((a, b) => {
    const aDate = a.last_submission || new Date(0);
    const bDate = b.last_submission || new Date(0);
    return bDate.getTime() - aDate.getTime();
  });
}

// 顧客削除
export async function deleteCustomer(email: string, uid?: string): Promise<void> {
  const auth = getAuthClient();
  const db = getFirestoreClient();

  // Firebase Authenticationからユーザーを削除
  if (uid) {
    try {
      await auth.deleteUser(uid);
    } catch (error: any) {
      // ユーザーが既に削除されている場合はエラーを無視
      if (error.code !== "auth/user-not-found") {
        throw error;
      }
    }
  }

  // Firestoreのusersコレクションから削除
  if (uid) {
    try {
      await db.collection("users").doc(uid).delete();
    } catch (error) {
      console.error("users削除エラー:", error);
    }
  }

  // Firestoreのsubmissionsコレクションから該当するメールアドレスのドキュメントを削除
  const submissionsSnapshot = await db
    .collection("submissions")
    .where("email", "==", email)
    .get();

  const batch = db.batch();

  for (const doc of submissionsSnapshot.docs) {
    // サブコレクションのtransactionsも削除
    const transactionsSnapshot = await doc.ref.collection("transactions").get();
    transactionsSnapshot.docs.forEach((transactionDoc) => {
      batch.delete(transactionDoc.ref);
    });

    // submissionドキュメント自体も削除
    batch.delete(doc.ref);
  }

  await batch.commit();
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
