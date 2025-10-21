export type Currency = "USD" | "EUR" | "JPY";

export type Activity = "Purchased" | "Sold";

export interface Transaction {
  date: string; // YYYY-MM-DD
  activity: Activity;
  quantity: number;
  price: number;
  commission?: number;
}

export interface SubmissionInput {
  email: string;
  currency: Currency;
  symbol: string;
  years: number[];
  transactions: Transaction[];
}

export interface HoldingLot {
  purchaseDate: string;
  quantity: number;
  unitCostJPY: number;
}

export interface YearSummary {
  year: number;
  sellQuantity: number;
  proceedsJPY: number; // 売却価額（TTB後、JPY）
  realizedGainJPY: number; // 実現損益（JPY）
}

export interface TransactionDetail {
  date: string; // 取引日
  activity: Activity; // 売買区分
  quantity: number; // 数量
  fmv: number; // 外貨時価
  grossAmount: number; // 外貨総額
  commission: number; // 外貨手数料
  netAmount: number; // 外貨純額
  tts: number; // TTSレート
  ttb: number; // TTBレート
  grossProceedsJPY: number; // 円換算総額
  acquisitionCostJPY: number; // 取得原価（円）
  commissionJPY: number; // 手数料（円）
  realizedGainJPY: number; // 実現損益（円）
  holdings: number; // 保有数量
  costBasis: number; // 簿価合計
  costBasisPerHolding: number; // 1株あたり簿価
}

export interface CalcResult {
  currency: Currency;
  symbol: string;
  years: number[];
  summaries: YearSummary[];
  finalHoldings: HoldingLot[];
  transactionDetails: TransactionDetail[]; // 全取引の詳細データ
}
