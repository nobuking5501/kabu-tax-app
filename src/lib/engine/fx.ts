interface FxRate {
  date: string;
  tts: number;
  ttb: number;
}

export async function loadFxTable(currency: "USD" | "EUR" | "JPY"): Promise<FxRate[]> {
  if (currency === "JPY") {
    return [];
  }

  const path = `/fx/${currency.toLowerCase()}.json`;
  const res = await fetch(path);
  if (!res.ok) {
    throw new Error(`FXデータの読み込みに失敗しました: ${currency}`);
  }

  return res.json();
}

export function pickRateOnOrBefore(
  fxTable: FxRate[],
  date: string
): { tts: number; ttb: number } {
  // JPYの場合
  if (fxTable.length === 0) {
    return { tts: 1, ttb: 1 };
  }

  // 近似一致: 指定日以下の直近
  let found = fxTable[0];
  for (const rate of fxTable) {
    if (rate.date <= date) {
      found = rate;
    } else {
      break;
    }
  }

  return { tts: found.tts, ttb: found.ttb };
}
