import type { SubmissionInput, CalcResult, Transaction, YearSummary } from "./types";
import { loadFxTable, pickRateOnOrBefore } from "./fx";
import { roundDown0, roundUp0 } from "./round";

interface SortedTransaction extends Transaction {
  sortOrder: number; // Purchased=0, Sold=1
}

export async function calcMovingAverage(input: SubmissionInput): Promise<CalcResult> {
  // FXテーブル読み込み
  const fxTable = await loadFxTable(input.currency);

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

  let holdings = 0;
  let costBasisJPY = 0;
  let unitCostJPY = 0;

  const yearMap = new Map<number, YearSummary>();
  for (const year of input.years) {
    yearMap.set(year, {
      year,
      sellQuantity: 0,
      proceedsJPY: 0,
      realizedGainJPY: 0,
    });
  }

  const holdingLots: Array<{ date: string; qty: number }> = [];

  for (const tx of sorted) {
    const rate = pickRateOnOrBefore(fxTable, tx.date);
    const year = parseInt(tx.date.substring(0, 4));

    if (tx.activity === "Purchased") {
      // 購入: 取得手数料は原価に含める（TTS換算）
      const commission = tx.commission ?? 0;
      const acqJPY = roundDown0((tx.quantity * tx.price + commission) * rate.tts);

      holdings += tx.quantity;
      costBasisJPY += acqJPY;
      unitCostJPY = holdings > 0 ? roundUp0(costBasisJPY / holdings) : 0;

      holdingLots.push({ date: tx.date, qty: tx.quantity });
    } else {
      // 売却: 数量を正規化
      let qty = Math.abs(tx.quantity);

      // 売却代金（TTB換算）
      const grossJPY = roundDown0(qty * tx.price * rate.ttb);

      // 売却手数料（TTS換算）
      const commission = tx.commission ?? 0;
      const commissionJPY = roundDown0(commission * rate.tts);

      // 実現損益
      const unitCostPrevJPY = unitCostJPY;
      const acquisitionCostForSold = -unitCostPrevJPY * qty;
      const realized = grossJPY + acquisitionCostForSold + commissionJPY;

      // 保有数減算
      holdings -= qty;
      if (holdings < 0) {
        throw new Error(`${tx.date}: 保有数量を超える売却が発生しています`);
      }

      // 原価再計算
      costBasisJPY = holdings > 0 ? holdings * unitCostPrevJPY : 0;
      unitCostJPY = holdings > 0 ? roundUp0(costBasisJPY / holdings) : 0;

      // 年別集計
      if (yearMap.has(year)) {
        const summary = yearMap.get(year)!;
        summary.sellQuantity += qty;
        summary.proceedsJPY += grossJPY;
        summary.realizedGainJPY += realized;
      }

      // 保有ロットから消化（FIFO的に先頭から減らす）
      let remaining = qty;
      while (remaining > 0 && holdingLots.length > 0) {
        const lot = holdingLots[0];
        const consume = Math.min(lot.qty, remaining);
        lot.qty -= consume;
        remaining -= consume;
        if (lot.qty === 0) {
          holdingLots.shift();
        }
      }
    }
  }

  // 集計結果
  const summaries = Array.from(yearMap.values())
    .sort((a, b) => a.year - b.year)
    .map((s) => ({
      ...s,
      sellQuantity: Math.round(s.sellQuantity),
      proceedsJPY: Math.round(s.proceedsJPY),
      realizedGainJPY: Math.round(s.realizedGainJPY),
    }));

  // 残ロット
  const finalHoldings = holdingLots.map((lot) => ({
    purchaseDate: lot.date,
    quantity: Math.round(lot.qty),
    unitCostJPY: Math.round(unitCostJPY),
  }));

  return {
    currency: input.currency,
    symbol: input.symbol,
    years: input.years.sort((a, b) => a - b),
    summaries,
    finalHoldings,
  };
}
