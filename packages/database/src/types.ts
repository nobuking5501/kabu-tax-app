export interface Submission {
  id: string; // FirestoreのドキュメントIDは文字列
  email: string;
  symbol: string;
  currency: string;
  years: number[];
  transaction_count: number;
  pdf_generated: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Transaction {
  id: string; // FirestoreのドキュメントIDは文字列
  submission_id: string; // 親ドキュメントIDも文字列
  date: string;
  activity: "Purchased" | "Sold";
  quantity: number;
  price: number;
  commission?: number;
  created_at: Date;
}

export interface Customer {
  email: string;
  uid?: string; // Firebase Auth UID
  displayName?: string; // Firebase Auth表示名
  photoURL?: string; // Firebase Authのプロフィール画像
  createdAt?: Date; // Firebase Authアカウント作成日
  lastSignInTime?: Date; // 最終ログイン日時
  first_submission?: Date; // 初回提出日（submissionsから取得）
  last_submission?: Date; // 最終提出日（submissionsから取得）
  total_submissions: number; // 提出回数
  total_pdfs: number; // PDF生成回数
  payment_count: number; // 決済回数
  payment_completed?: boolean; // 決済完了状態
  last_payment_date?: Date; // 最終決済日時
}
