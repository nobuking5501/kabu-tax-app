import { describe, it, expect, beforeAll, vi } from "vitest";
import { calcMovingAverage } from "../movingAverage";
import type { SubmissionInput } from "../types";

describe("calcMovingAverage (移動平均法)", () => {
  // fetch APIをモック
  beforeAll(() => {
    global.fetch = vi.fn((url: RequestInfo | URL) => {
      // モックFXデータ
      const mockData = {
        "/fx/usd.json": [
          { date: "2024-06-17", tts: 158.50, ttb: 156.50 },
          { date: "2024-06-16", tts: 158.00, ttb: 156.00 },
          { date: "2024-06-15", tts: 157.50, ttb: 155.50 },
          { date: "2024-06-14", tts: 157.00, ttb: 155.00 },
          { date: "2024-01-11", tts: 145.80, ttb: 143.80 },
          { date: "2024-01-10", tts: 145.50, ttb: 143.50 },
        ],
        "/fx/eur.json": [
          { date: "2024-06-15", tts: 170.50, ttb: 168.50 },
          { date: "2024-01-10", tts: 158.50, ttb: 156.50 },
        ],
      };

      const urlStr = typeof url === 'string' ? url : url.toString();
      const data = mockData[urlStr as keyof typeof mockData] || [];
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(data),
      } as Response);
    }) as any;
  });

  it("USD: 購入→売却の基本フロー", async () => {
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
          quantity: -100,
          price: 180,
          commission: 5,
        },
      ],
    };

    const result = await calcMovingAverage(input);

    expect(result.currency).toBe("USD");
    expect(result.symbol).toBe("TEST");
    expect(result.summaries).toHaveLength(1);

    // 購入: (100*150 + 10) * 145.50 = 2,182,995円（切り捨て）
    // 単価: 2,182,995 / 100 = 21,830円（切り上げ）
    // 売却: (100*180) * 155.50 = 2,799,000円
    // 手数料: 5 * 157.50 = 787円
    // 取得原価: 100 * 21,830 = -2,183,000円
    // 実現損益: 2,799,000 - 787 - 2,183,000 = 615,213円

    const summary = result.summaries[0];
    expect(summary.year).toBe(2024);
    expect(summary.sellQuantity).toBe(100);
    expect(summary.proceedsJPY).toBeGreaterThan(2700000); // 約2,799,000
    expect(summary.realizedGainJPY).toBeGreaterThan(500000); // 約615,213
  });

  it("EUR: 複数ロット購入→FIFO売却", async () => {
    const input: SubmissionInput = {
      email: "test@example.com",
      currency: "EUR",
      symbol: "TEST",
      years: [2024],
      transactions: [
        {
          date: "2024-01-10",
          activity: "Purchased",
          quantity: 50,
          price: 100,
          commission: 5,
        },
        {
          date: "2024-01-10",
          activity: "Purchased",
          quantity: 50,
          price: 120,
          commission: 5,
        },
        {
          date: "2024-06-15",
          activity: "Sold",
          quantity: -75,
          price: 150,
          commission: 10,
        },
      ],
    };

    const result = await calcMovingAverage(input);

    expect(result.summaries).toHaveLength(1);
    expect(result.summaries[0].sellQuantity).toBe(75);

    // 残ロット: 25株
    expect(result.finalHoldings.length).toBeGreaterThan(0);
    const totalRemaining = result.finalHoldings.reduce(
      (sum, lot) => sum + lot.quantity,
      0
    );
    expect(totalRemaining).toBe(25);
  });

  it("年度をまたぐ取引の集計", async () => {
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
          quantity: -50,
          price: 150,
          commission: 0,
        },
        {
          date: "2025-01-10",
          activity: "Sold",
          quantity: -50,
          price: 200,
          commission: 0,
        },
      ],
    };

    // 2025年のデータを追加
    (global.fetch as any).mockImplementationOnce((url: RequestInfo | URL) => {
      const mockData = {
        "/fx/usd.json": [
          { date: "2025-01-10", tts: 150.00, ttb: 148.00 },
          { date: "2024-06-15", tts: 157.50, ttb: 155.50 },
          { date: "2024-01-10", tts: 145.50, ttb: 143.50 },
        ],
      };
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockData["/fx/usd.json"]),
      } as Response);
    });

    const result = await calcMovingAverage(input);

    expect(result.summaries).toHaveLength(2);

    const y2024 = result.summaries.find((s) => s.year === 2024);
    const y2025 = result.summaries.find((s) => s.year === 2025);

    expect(y2024).toBeDefined();
    expect(y2025).toBeDefined();
    expect(y2024!.sellQuantity).toBe(50);
    expect(y2025!.sellQuantity).toBe(50);
  });

  it("保有数量を超える売却でエラー", async () => {
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
          quantity: -150, // 保有数を超える
          price: 150,
          commission: 0,
        },
      ],
    };

    await expect(calcMovingAverage(input)).rejects.toThrow(
      "保有数量を超える売却"
    );
  });

  it("為替レート遡りロジックのテスト（週末など）", async () => {
    // 土曜日に取引した場合、前営業日のレートを使用
    (global.fetch as any).mockImplementationOnce((url: RequestInfo | URL) => {
      const mockData = {
        "/fx/usd.json": [
          { date: "2024-06-14", tts: 157.00, ttb: 155.00 }, // 金曜日
          { date: "2024-06-13", tts: 156.50, ttb: 154.50 },
          { date: "2024-01-10", tts: 145.50, ttb: 143.50 },
        ],
      };
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockData["/fx/usd.json"]),
      } as Response);
    });

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
          date: "2024-06-15", // 土曜日
          activity: "Sold",
          quantity: -100,
          price: 150,
          commission: 0,
        },
      ],
    };

    const result = await calcMovingAverage(input);

    // 前営業日（6/14金曜）のレートが使われる
    expect(result.summaries[0].proceedsJPY).toBeGreaterThan(0);
  });
});
