import { describe, it, expect } from "vitest";
import { pickRateOnOrBefore } from "../fx";

describe("pickRateOnOrBefore", () => {
  const mockFxTable = [
    { date: "2024-12-20", tts: 156.50, ttb: 154.50 },
    { date: "2024-12-19", tts: 156.00, ttb: 154.00 },
    { date: "2024-12-18", tts: 155.50, ttb: 153.50 },
    { date: "2024-12-17", tts: 155.00, ttb: 153.00 },
    { date: "2024-12-16", tts: 154.50, ttb: 152.50 },
    { date: "2024-12-13", tts: 154.00, ttb: 152.00 }, // 週末スキップ
    { date: "2024-12-12", tts: 153.50, ttb: 151.50 },
  ];

  it("当日のレートが取得できる", () => {
    const rate = pickRateOnOrBefore(mockFxTable, "2024-12-19");
    expect(rate.tts).toBe(156.00);
    expect(rate.ttb).toBe(154.00);
  });

  it("指定日以前の直近レートが取得できる", () => {
    // 2024-12-21は存在しないので、12-20のレートを取得
    const rate = pickRateOnOrBefore(mockFxTable, "2024-12-21");
    expect(rate.tts).toBe(156.50);
    expect(rate.ttb).toBe(154.50);
  });

  it("週末など営業日でない場合は前営業日のレートを取得", () => {
    // 2024-12-14(土) → 12-13(金)のレートを取得
    const rate = pickRateOnOrBefore(mockFxTable, "2024-12-14");
    expect(rate.tts).toBe(154.00);
    expect(rate.ttb).toBe(152.00);
  });

  it("5日前まで遡ってレートを検索（週末をスキップ）", () => {
    // レートが0のケースをシミュレート
    const tableWithZero = [
      { date: "2024-12-20", tts: 0, ttb: 0 }, // 当日0
      { date: "2024-12-19", tts: 0, ttb: 0 }, // 1日前0
      { date: "2024-12-18", tts: 0, ttb: 0 }, // 2日前0
      { date: "2024-12-17", tts: 155.00, ttb: 153.00 }, // 3日前に有効なレート
      { date: "2024-12-16", tts: 154.50, ttb: 152.50 },
    ];

    const rate = pickRateOnOrBefore(tableWithZero, "2024-12-20");
    // 3日前の有効なレートを取得
    expect(rate.tts).toBe(155.00);
    expect(rate.ttb).toBe(153.00);
  });

  it("JPY（為替テーブルが空）の場合は1を返す", () => {
    const rate = pickRateOnOrBefore([], "2024-12-20");
    expect(rate.tts).toBe(1);
    expect(rate.ttb).toBe(1);
  });

  it("最古のレートより前の日付の場合は最古のレートを返す", () => {
    const rate = pickRateOnOrBefore(mockFxTable, "2024-12-10");
    expect(rate.tts).toBe(153.50);
    expect(rate.ttb).toBe(151.50);
  });

  it("Excelの遡りロジック（5日前まで）をテスト", () => {
    // Excel同様、最大5日前まで遡る
    const tableWithGaps = [
      { date: "2024-12-20", tts: 0, ttb: 0 },
      { date: "2024-12-19", tts: 0, ttb: 0 },
      { date: "2024-12-18", tts: 0, ttb: 0 },
      { date: "2024-12-17", tts: 0, ttb: 0 },
      { date: "2024-12-16", tts: 0, ttb: 0 },
      { date: "2024-12-15", tts: 0, ttb: 0 }, // 5日前も0
      { date: "2024-12-14", tts: 150.00, ttb: 148.00 }, // 6日前に有効
      { date: "2024-12-13", tts: 149.50, ttb: 147.50 },
    ];

    // 5日前まで全て0の場合、最古のレートにフォールバック
    const rate = pickRateOnOrBefore(tableWithGaps, "2024-12-20", 5);
    // 6日前のレートは取得できないので、最古のレートを返す
    expect(rate.tts).toBe(149.50);
    expect(rate.ttb).toBe(147.50);
  });
});
