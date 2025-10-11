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
  first_submission: Date;
  last_submission: Date;
  total_submissions: number;
  total_pdfs: number;
}
