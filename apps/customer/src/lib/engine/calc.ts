import type { SubmissionInput, Transaction } from "./types";

interface SortedTransaction extends Transaction {
  sortOrder: number; // Purchased=0, Sold=1
}

interface YearSummarySimple {
  year: number;
  sellQuantity: number;
  proceeds: number; // 売却代金（為替換算なし）
  costBasis: number; // 取得原価
  realizedGain: number; // 実現損益
}

interface HoldingLotSimple {
  purchaseDate: string;
  quantity: number;
  unitCost: number;
}

interface CalcResultSimple {
  currency: string;
  symbol: string;
  years: number[];
  summaries: YearSummarySimple[];
  finalHoldings: HoldingLotSimple[];
}

/**
 * キャピタルゲイン計算（為替換算なし）
 * テスト用のシンプルな実装
 */
export function calcCapitalGains(input: SubmissionInput): CalcResultSimple {
  // 取引を日付昇順、同日なら Purchased → Sold の順にソート
  const sorted: SortedTransaction[] = input.transactions
    .map((tx) => ({
      ...tx,
      sortOrder: tx.activity === "Purchased" ? 0 : 1,
    }))
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.sortOrder - b.sortOrder;
    });

  // FIFO用のロット管理
  interface Lot {
    date: string;
    quantity: number;
    unitCost: number;
  }
  const lots: Lot[] = [];

  // 年別集計
  const yearMap = new Map<number, YearSummarySimple>();
  for (const year of input.years) {
    yearMap.set(year, {
      year,
      sellQuantity: 0,
      proceeds: 0,
      costBasis: 0,
      realizedGain: 0,
    });
  }

  for (const tx of sorted) {
    const year = parseInt(tx.date.substring(0, 4));

    if (tx.activity === "Purchased") {
      // 購入: 手数料を原価に含める
      const commission = tx.commission ?? 0;
      const totalCost = tx.quantity * tx.price + commission;
      const unitCost = totalCost / tx.quantity;

      lots.push({
        date: tx.date,
        quantity: tx.quantity,
        unitCost: unitCost,
      });
    } else {
      // 売却: 数量を正規化（負の場合は絶対値）
      let qty = Math.abs(tx.quantity);

      // 売却代金（手数料控除後）
      const commission = tx.commission ?? 0;
      const proceeds = qty * tx.price - commission;

      // FIFOで原価を計算
      let costBasis = 0;
      let remaining = qty;

      for (const lot of lots) {
        if (remaining <= 0) break;

        const consume = Math.min(lot.quantity, remaining);
        costBasis += consume * lot.unitCost;
        remaining -= consume;
      }

      // 保有数量チェック
      const totalHoldings = lots.reduce((sum, lot) => sum + lot.quantity, 0);
      if (qty > totalHoldings) {
        throw new Error(`${tx.date}: 保有数量を超える売却が発生しています`);
      }

      // 実現損益
      const realizedGain = proceeds - costBasis;

      // 年別集計に追加
      if (yearMap.has(year)) {
        const summary = yearMap.get(year)!;
        summary.sellQuantity += qty;
        summary.proceeds += proceeds;
        summary.costBasis += costBasis;
        summary.realizedGain += realizedGain;
      }

      // ロットから消化（FIFO）
      remaining = qty;
      while (remaining > 0 && lots.length > 0) {
        const lot = lots[0];
        const consume = Math.min(lot.quantity, remaining);
        lot.quantity -= consume;
        remaining -= consume;
        if (lot.quantity === 0) {
          lots.shift();
        }
      }
    }
  }

  // 結果の整形
  const summaries = Array.from(yearMap.values())
    .filter((s) => input.years.includes(s.year))
    .sort((a, b) => a.year - b.year)
    .map((s) => ({
      ...s,
      sellQuantity: Math.round(s.sellQuantity * 10) / 10,
      proceeds: Math.round(s.proceeds),
      costBasis: Math.round(s.costBasis),
      realizedGain: Math.round(s.realizedGain),
    }));

  const finalHoldings = lots.map((lot) => ({
    purchaseDate: lot.date,
    quantity: Math.round(lot.quantity * 10) / 10,
    unitCost: Math.round(lot.unitCost * 10) / 10,
  }));

  return {
    currency: input.currency,
    symbol: input.symbol,
    years: input.years.sort((a, b) => a - b),
    summaries,
    finalHoldings,
  };
}
