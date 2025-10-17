interface FxRate {
  date: string;
  tts: number;
  ttb: number;
}

export async function loadFxTable(currency: "USD" | "EUR" | "JPY"): Promise<FxRate[]> {
  if (currency === "JPY") {
    return [];
  }

  // サーバーサイドの場合はdynamic importを使用、クライアントサイドの場合はfetchを使用
  if (typeof window === 'undefined') {
    // サーバーサイド - src/data/fx/ からdynamic importで読み込み
    try {
      if (currency === 'USD') {
        const data = await import('@/data/fx/usd.json');
        return data.default as FxRate[];
      } else if (currency === 'EUR') {
        const data = await import('@/data/fx/eur.json');
        return data.default as FxRate[];
      } else {
        throw new Error(`未対応の通貨: ${currency}`);
      }
    } catch (error) {
      console.error('FXデータ読み込みエラー:', error);
      throw new Error(`FXデータの読み込みに失敗しました: ${currency}`);
    }
  } else {
    // クライアントサイド - public/fx/ からfetchで読み込み
    const path = `/fx/${currency.toLowerCase()}.json`;
    const res = await fetch(path);
    if (!res.ok) {
      throw new Error(`FXデータの読み込みに失敗しました: ${currency}`);
    }
    return res.json();
  }
}

export function pickRateOnOrBefore(
  fxTable: FxRate[],
  date: string,
  maxDaysBack = 5
): { tts: number; ttb: number } {
  // JPYの場合
  if (fxTable.length === 0) {
    return { tts: 1, ttb: 1 };
  }

  // Excel同様、最大maxDaysBack日前まで遡ってレートを検索
  for (let daysBack = 0; daysBack <= maxDaysBack; daysBack++) {
    const targetDate = subtractDays(date, daysBack);

    // 指定日以下の直近レートを検索
    let found: FxRate | null = null;
    for (const rate of fxTable) {
      if (rate.date <= targetDate) {
        found = rate;
        break;
      }
    }

    // レートが見つかり、かつ有効（0でない）場合は返す
    if (found && found.tts > 0 && found.ttb > 0) {
      return { tts: found.tts, ttb: found.ttb };
    }
  }

  // 見つからない場合は最古のレートを返す（フォールバック）
  const fallback = fxTable[fxTable.length - 1];
  return { tts: fallback.tts, ttb: fallback.ttb };
}

// 日付から指定日数を引く
function subtractDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() - days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
