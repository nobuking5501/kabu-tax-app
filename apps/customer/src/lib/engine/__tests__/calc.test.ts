import { describe, it, expect } from "vitest";
import { calcCapitalGains } from "../calc";
import type { SubmissionInput } from "../types";

describe("calcCapitalGains", () => {
  it("A: 単純な買→売（手数料あり）", () => {
    const input: SubmissionInput = {
      email: "test@example.com",
      currency: "USD",
      symbol: "TEST",
      years: [2024],
      transactions: [
        {
          date: "2024-01-10",
          activity: "Purchased",
          quantity: 100,
          price: 150,
          commission: 10,
        },
        {
          date: "2024-06-15",
          activity: "Sold",
          quantity: 100,
          price: 180,
          commission: 5,
        },
      ],
    };

    const result = calcCapitalGains(input);

    // 購入: (100*150 + 10) / 100 = 150.1
    // 売却: proceeds = 100*180 - 5 = 17995, costBasis = 100*150.1 = 15010
    // 実現損益 = 17995 - 15010 = 2985
    expect(result.summaries).toHaveLength(1);
    expect(result.summaries[0].year).toBe(2024);
    expect(result.summaries[0].sellQuantity).toBe(100);
    expect(result.summaries[0].proceeds).toBe(17995);
    expect(result.summaries[0].costBasis).toBe(15010);
    expect(result.summaries[0].realizedGain).toBe(2985);
    expect(result.finalHoldings).toHaveLength(0);
  });

  it("B: 複数買い→一部売り（FIFO検証）", () => {
    const input: SubmissionInput = {
      email: "test@example.com",
      currency: "USD",
      symbol: "TEST",
      years: [2024],
      transactions: [
        {
          date: "2024-01-10",
          activity: "Purchased",
          quantity: 100,
          price: 100,
          commission: 10,
        },
        {
          date: "2024-02-15",
          activity: "Purchased",
          quantity: 100,
          price: 120,
          commission: 10,
        },
        {
          date: "2024-06-20",
          activity: "Sold",
          quantity: 150,
          price: 150,
          commission: 15,
        },
      ],
    };

    const result = calcCapitalGains(input);

    // ロット1: (100*100 + 10)/100 = 100.1
    // ロット2: (100*120 + 10)/100 = 120.1
    // 売却: FIFOで100株@100.1 + 50株@120.1
    // costBasis = 100*100.1 + 50*120.1 = 10010 + 6005 = 16015
    // proceeds = 150*150 - 15 = 22485
    // gain = 22485 - 16015 = 6470
    expect(result.summaries[0].sellQuantity).toBe(150);
    expect(result.summaries[0].proceeds).toBe(22485);
    expect(result.summaries[0].costBasis).toBe(16015);
    expect(result.summaries[0].realizedGain).toBe(6470);

    // 残ロット: 50株@120.1
    expect(result.finalHoldings).toHaveLength(1);
    expect(result.finalHoldings[0].quantity).toBe(50);
    expect(result.finalHoldings[0].unitCost).toBe(120.1);
  });

  it("C: 年跨ぎ（2024/2025の集計）", () => {
    const input: SubmissionInput = {
      email: "test@example.com",
      currency: "USD",
      symbol: "TEST",
      years: [2024, 2025],
      transactions: [
        {
          date: "2024-01-10",
          activity: "Purchased",
          quantity: 100,
          price: 100,
          commission: 0,
        },
        {
          date: "2024-06-15",
          activity: "Sold",
          quantity: 50,
          price: 150,
          commission: 0,
        },
        {
          date: "2025-03-20",
          activity: "Sold",
          quantity: 50,
          price: 200,
          commission: 0,
        },
      ],
    };

    const result = calcCapitalGains(input);

    expect(result.summaries).toHaveLength(2);

    // 2024年: 50株売却 @ 150
    const y2024 = result.summaries.find((s) => s.year === 2024)!;
    expect(y2024.sellQuantity).toBe(50);
    expect(y2024.proceeds).toBe(7500); // 50*150
    expect(y2024.costBasis).toBe(5000); // 50*100
    expect(y2024.realizedGain).toBe(2500);

    // 2025年: 50株売却 @ 200
    const y2025 = result.summaries.find((s) => s.year === 2025)!;
    expect(y2025.sellQuantity).toBe(50);
    expect(y2025.proceeds).toBe(10000); // 50*200
    expect(y2025.costBasis).toBe(5000); // 50*100
    expect(y2025.realizedGain).toBe(5000);
  });

  it("D: 保有超過売却でエラー", () => {
    const input: SubmissionInput = {
      email: "test@example.com",
      currency: "USD",
      symbol: "TEST",
      years: [2024],
      transactions: [
        {
          date: "2024-01-10",
          activity: "Purchased",
          quantity: 100,
          price: 100,
          commission: 0,
        },
        {
          date: "2024-06-15",
          activity: "Sold",
          quantity: 150,
          price: 150,
          commission: 0,
        },
      ],
    };

    expect(() => calcCapitalGains(input)).toThrowError(
      "保有数量を超える売却が発生しています"
    );
  });

  it("E: 売却手数料が一度だけ控除されること", () => {
    const input: SubmissionInput = {
      email: "test@example.com",
      currency: "USD",
      symbol: "TEST",
      years: [2024],
      transactions: [
        {
          date: "2024-01-10",
          activity: "Purchased",
          quantity: 100,
          price: 100,
          commission: 0,
        },
        {
          date: "2024-06-15",
          activity: "Sold",
          quantity: 100,
          price: 150,
          commission: 50,
        },
      ],
    };

    const result = calcCapitalGains(input);

    // proceeds = 100*150 - 50 = 14950（手数料は一度だけ）
    // costBasis = 100*100 = 10000
    // gain = 14950 - 10000 = 4950
    expect(result.summaries[0].proceeds).toBe(14950);
    expect(result.summaries[0].costBasis).toBe(10000);
    expect(result.summaries[0].realizedGain).toBe(4950);
  });

  it("F: 売却数量が負の場合も正規化される", () => {
    const input: SubmissionInput = {
      email: "test@example.com",
      currency: "USD",
      symbol: "TEST",
      years: [2024],
      transactions: [
        {
          date: "2024-01-10",
          activity: "Purchased",
          quantity: 100,
          price: 100,
          commission: 0,
        },
        {
          date: "2024-06-15",
          activity: "Sold",
          quantity: -50, // マイナス入力
          price: 150,
          commission: 0,
        },
      ],
    };

    const result = calcCapitalGains(input);

    // 正規化されて50株として扱われる
    expect(result.summaries[0].sellQuantity).toBe(50);
    expect(result.summaries[0].proceeds).toBe(7500);
  });
});
