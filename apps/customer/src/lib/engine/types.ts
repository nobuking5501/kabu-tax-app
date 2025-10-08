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

export interface CalcResult {
  currency: Currency;
  symbol: string;
  years: number[];
  summaries: YearSummary[];
  finalHoldings: HoldingLot[];
}
