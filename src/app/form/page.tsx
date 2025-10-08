"use client";

import { useState, FormEvent } from "react";
import { getMainLink, getSubLink } from "@/lib/sheetsLinks";
import FormNavigation from "@/components/FormNavigation";

type Row = {
  date: string;
  activity: "Purchased" | "Sold";
  quantity: string;
  fmv: string;
  commission: string;
};

export default function FormPage() {
  const today = new Date().toISOString().split("T")[0];

  const [email, setEmail] = useState("");
  const [currency, setCurrency] = useState<"USD" | "EUR">("USD");
  const [stockName, setStockName] = useState("");
  const [years, setYears] = useState<string[]>(["", "", "", "", ""]);
  const [rows, setRows] = useState<Row[]>([
    { date: today, activity: "Purchased", quantity: "1", fmv: "1", commission: "" },
  ]);

  const [validationErrors, setValidationErrors] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // 保有株式数計算
  const holdings = rows.reduce((sum, row) => {
    return sum + (parseFloat(row.quantity) || 0);
  }, 0);

  // サンプルデータ入力（シンプル）
  const loadSampleDataSimple = () => {
    setEmail("test@example.com");
    setCurrency("USD");
    setStockName("GOOGL");
    setYears(["2024", "", "", "", ""]);
    setRows([
      { date: "2024-01-10", activity: "Purchased", quantity: "100", fmv: "150", commission: "10" },
      { date: "2024-06-15", activity: "Sold", quantity: "-100", fmv: "180", commission: "5" },
    ]);
    setValidationErrors([]);
    setSuccessMessage("");
    setErrorMessage("");
  };

  // サンプルデータ入力（複雑）
  const loadSampleDataComplex = () => {
    setEmail("test@example.com");
    setCurrency("USD");
    setStockName("AAPL");
    setYears(["2024", "2025", "", "", ""]);
    setRows([
      { date: "2024-01-10", activity: "Purchased", quantity: "50", fmv: "100", commission: "5" },
      { date: "2024-03-15", activity: "Purchased", quantity: "50", fmv: "120", commission: "5" },
      { date: "2024-06-20", activity: "Sold", quantity: "-75", fmv: "150", commission: "10" },
      { date: "2024-12-10", activity: "Purchased", quantity: "30", fmv: "140", commission: "3" },
      { date: "2025-02-15", activity: "Sold", quantity: "-35", fmv: "160", commission: "8" },
    ]);
    setValidationErrors([]);
    setSuccessMessage("");
    setErrorMessage("");
  };

  // 行追加
  const addRow = () => {
    if (rows.length >= 50) {
      alert("最大50行までです");
      return;
    }
    setRows([
      ...rows,
      { date: today, activity: "Purchased", quantity: "", fmv: "", commission: "" },
    ]);
  };

  // 行削除
  const removeRow = (index: number) => {
    if (rows.length === 1) {
      alert("最低1行は必要です");
      return;
    }
    setRows(rows.filter((_, i) => i !== index));
    setValidationErrors(validationErrors.filter((ei) => ei !== index));
  };

  // 入力変更
  const updateRow = (index: number, field: keyof Row, value: string) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setRows(newRows);

    // エラークリア
    if (validationErrors.includes(index)) {
      setValidationErrors(validationErrors.filter((ei) => ei !== index));
    }
  };

  // 入力サニタイズ
  const sanitizeQuantity = (value: string) => value.replace(/[^\d.-]/g, "");
  const sanitizeNumber = (value: string) => value.replace(/[^\d.]/g, "");

  // 年度変更
  const updateYear = (index: number, value: string) => {
    const newYears = [...years];
    newYears[index] = value;
    setYears(newYears);
  };

  // スプレッドシートリンクを開く
  const openMainSheet = () => {
    try {
      const url = getMainLink();
      window.open(url, "_blank");
    } catch (error: any) {
      alert(error.message || "メインシートのリンクを開けませんでした");
    }
  };

  const openSubSheet = () => {
    try {
      const url = getSubLink();
      if (url) {
        window.open(url, "_blank");
      }
    } catch (error: any) {
      alert(error.message || "サブシートのリンクを開けませんでした");
    }
  };

  // 送信処理
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");
    setValidationErrors([]);

    // バリデーション: Soldの場合はマイナス必須
    const errors: number[] = [];
    rows.forEach((row, index) => {
      if (row.activity === "Sold") {
        const qty = parseFloat(row.quantity);
        if (isNaN(qty) || qty >= 0) {
          errors.push(index);
        }
      }
    });

    if (errors.length > 0) {
      setValidationErrors(errors);
      setErrorMessage("「売却/Sold」の場合、数量にはマイナスの値を入力してください。");
      return;
    }

    // API送信処理
    setLoading(true);

    try {
      // 年度フィルター（空文字を除外）
      const validYears = years
        .filter((y) => y.trim() !== "")
        .map((y) => parseInt(y, 10))
        .filter((y) => !isNaN(y));

      if (validYears.length === 0) {
        setErrorMessage("対象年度を少なくとも1つ入力してください。");
        setLoading(false);
        return;
      }

      // トランザクションデータの整形
      const transactions = rows.map((row) => ({
        date: row.date,
        activity: row.activity,
        quantity: parseFloat(row.quantity),
        price: parseFloat(row.fmv),
        commission: row.commission ? parseFloat(row.commission) : undefined,
      }));

      const payload = {
        email,
        currency,
        symbol: stockName,
        years: validYears,
        transactions,
      };

      // API呼び出し
      const response = await fetch("/api/submission", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "サーバーエラーが発生しました");
      }

      // 成功: PDFダウンロード
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kabu-tax-${stockName}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setSuccessMessage("計算結果の取得に成功しました！PDFがダウンロードされました。");
    } catch (error: any) {
      setErrorMessage(error.message || "エラーが発生しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  // サブシートのリンクが存在するか確認
  const hasSubSheet = getSubLink() !== null;

  return (
    <div className="min-h-screen bg-gray-50">
      <FormNavigation />
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* ページタイトル */}
        <h1 className="text-3xl font-bold mb-4 text-gray-800">
          株式取引情報入力フォーム
        </h1>
        <p className="text-sm text-gray-500 mb-4">
          以下のフォームに必要事項を入力後、『計算結果を取得する』ボタンを押してください。
        </p>

        {/* サンプルデータ読み込みボタン */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-center gap-2 mb-2">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h3 className="font-semibold text-blue-900">動作確認用サンプルデータ</h3>
          </div>
          <p className="text-xs text-blue-700 mb-3">
            実装が正しく動作しているか確認するために、サンプルデータを自動入力できます。
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={loadSampleDataSimple}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md shadow-sm transition-colors"
            >
              📝 シンプル（100株購入→全売却）
            </button>
            <button
              type="button"
              onClick={loadSampleDataComplex}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-md shadow-sm transition-colors"
            >
              📊 複雑（複数回売買・年度跨ぎ）
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* エラーバナー */}
          {errorMessage && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md"
            >
              {errorMessage}
            </div>
          )}

          {/* 1) Email セクション */}
          <div className="bg-white border border-gray-200 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Email Address</h2>
            <p className="text-xs text-gray-500 mb-2">
              計算結果は以下のメールアドレスに送信されます。
            </p>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
            />
          </div>

          {/* 2) 基本情報 */}
          <div className="bg-white border border-gray-200 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">基本情報</h2>

            {/* 通貨と銘柄 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  通貨/Currency *
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as "USD" | "EUR")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  株式の銘柄/Stock Name *
                </label>
                <input
                  type="text"
                  required
                  value={stockName}
                  onChange={(e) => setStockName(e.target.value)}
                  placeholder="GOOGL"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
                />
              </div>
            </div>

            {/* 対象年度 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                対象年度/Years *
              </label>
              <p className="text-xs text-gray-500 mb-2">
                計算結果を自動集計したい年度を半角数字4桁で入力してください
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {years.map((year, i) => (
                  <input
                    key={i}
                    type="text"
                    value={year}
                    onChange={(e) => updateYear(i, e.target.value)}
                    pattern="[0-9]{4}"
                    title="半角数字4桁で入力してください"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* 3) 取引一覧 */}
          <div className="bg-white border border-gray-200 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">
              取引一覧/Transaction List (最大50行)
            </h2>

            {/* ヘッダー (lg以上のみ表示) */}
            <div
              className="hidden lg:grid gap-2 text-xs text-gray-500 mb-2"
              style={{ gridTemplateColumns: "repeat(5, 1fr) 40px" }}
            >
              <div>
                <div className="font-medium">取引日/Transaction Date *</div>
                <div>証券会社のレポート上の取引日を入力してください。</div>
              </div>
              <div>
                <div className="font-medium">取得or売却/Activity *</div>
                <div>株式の取得（Purchased）または売却（Sold）を選択してください。</div>
              </div>
              <div>
                <div className="font-medium">取得or売却した株式数/Quantity *</div>
                <div>取得または売却した株式の数量を入力してください。</div>
                <div className="text-red-500">Soldの場合はマイナス入力。</div>
              </div>
              <div>
                <div className="font-medium">取得時の株価or売却価額/FMV *</div>
                <div>取得時の株価または売却時の売却価額を入力してください。</div>
              </div>
              <div>
                <div className="font-medium">売却時の手数料/Commission</div>
                <div>売却時に手数料が発生している場合には、手数料の額を入力してください。</div>
              </div>
              <div></div>
            </div>

            {/* 行 */}
            <div className="space-y-2">
              {rows.map((row, index) => {
                const hasError = validationErrors.includes(index);
                const quantityInputClass = hasError && row.activity === "Sold"
                  ? "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm ring-1 ring-red-500"
                  : "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm";

                return (
                  <div
                    key={index}
                    className="grid grid-cols-1 lg:gap-2"
                    style={{ gridTemplateColumns: "repeat(5, 1fr) 40px" }}
                  >
                    {/* 取引日 */}
                    <input
                      type="date"
                      required
                      value={row.date}
                      max="9999-12-31"
                      onChange={(e) => updateRow(index, "date", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm mb-2 lg:mb-0"
                    />

                    {/* Activity */}
                    <select
                      value={row.activity}
                      onChange={(e) =>
                        updateRow(index, "activity", e.target.value as "Purchased" | "Sold")
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm mb-2 lg:mb-0"
                    >
                      <option value="Purchased">Purchased</option>
                      <option value="Sold">Sold</option>
                    </select>

                    {/* Quantity */}
                    <input
                      type="text"
                      required
                      value={row.quantity}
                      onInput={(e) => {
                        const sanitized = sanitizeQuantity(e.currentTarget.value);
                        updateRow(index, "quantity", sanitized);
                      }}
                      className={quantityInputClass + " mb-2 lg:mb-0"}
                    />

                    {/* FMV */}
                    <input
                      type="text"
                      required
                      value={row.fmv}
                      onInput={(e) => {
                        const sanitized = sanitizeNumber(e.currentTarget.value);
                        updateRow(index, "fmv", sanitized);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm mb-2 lg:mb-0"
                    />

                    {/* Commission */}
                    <input
                      type="text"
                      value={row.commission}
                      onInput={(e) => {
                        const sanitized = sanitizeNumber(e.currentTarget.value);
                        updateRow(index, "commission", sanitized);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm mb-2 lg:mb-0"
                    />

                    {/* 削除ボタン */}
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      aria-label="行を削除"
                      className="bg-red-500 hover:bg-red-600 text-white h-8 w-8 rounded-full flex items-center justify-center mx-auto"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* 行追加ボタン */}
            <button
              type="button"
              onClick={addRow}
              className="mt-4 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm bg-white hover:bg-gray-50"
            >
              + 行を追加
            </button>
          </div>

          {/* スプレッドシートで関数位置を開く */}
          <div className="bg-white border border-gray-200 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">スプレッドシートで関数位置を開く</h2>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={openMainSheet}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50"
              >
                テンプレ（メイン）を開く
              </button>
              {hasSubSheet && (
                <button
                  type="button"
                  onClick={openSubSheet}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50"
                >
                  テンプレ（サブ）を開く
                </button>
              )}
            </div>
          </div>

          {/* 4) 保有株式数 */}
          <div className="bg-white border border-gray-200 p-6 rounded-lg">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">保有株式数(残高)/Holdings:</h2>
              <span className="text-2xl font-bold text-blue-600">
                {holdings.toLocaleString()}
              </span>
            </div>
          </div>

          {/* 5) 送信ボタン */}
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white text-lg h-12 w-full rounded-md shadow-sm flex items-center justify-center"
          >
            {loading ? (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              "計算結果を取得する"
            )}
          </button>

          {/* 成功メッセージ */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
              {successMessage}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
