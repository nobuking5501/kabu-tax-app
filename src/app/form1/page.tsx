"use client";

import { useState, FormEvent } from "react";
import FormNavigation from "@/components/FormNavigation";

type Row = {
  date: string;
  activity: "Purchased" | "Sold";
  quantity: string;
  fmv: string;
  commission: string;
};

export default function Form1Page() {
  const today = new Date().toISOString().split("T")[0];

  // フォームステート
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [currency, setCurrency] = useState<"USD" | "EUR">("USD");
  const [stockName, setStockName] = useState("");
  const [years, setYears] = useState<string[]>(["", "", "", "", ""]);
  const [rows, setRows] = useState<Row[]>([
    { date: today, activity: "Purchased", quantity: "1", fmv: "1", commission: "" },
  ]);

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState<number[]>([]);

  // 保有株式数計算
  const holdings = rows.reduce((sum, row) => {
    return sum + (parseFloat(row.quantity) || 0);
  }, 0);

  // サンプルデータ読み込み
  const loadSampleData = () => {
    setEmail("test@example.com");
    setCurrency("USD");
    setStockName("GOOGL");
    setYears(["2024", "", "", "", ""]);
    setRows([
      { date: "2024-01-10", activity: "Purchased", quantity: "100", fmv: "150", commission: "10" },
      { date: "2024-06-15", activity: "Sold", quantity: "-100", fmv: "180", commission: "5" },
    ]);
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
  };

  // 入力変更
  const updateRow = (index: number, field: keyof Row, value: string) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setRows(newRows);
  };

  // 年度変更
  const updateYear = (index: number, value: string) => {
    const newYears = [...years];
    newYears[index] = value;
    setYears(newYears);
  };

  // 送信処理
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");
    setValidationErrors([]);

    // バリデーション
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

    setLoading(true);

    try {
      const validYears = years
        .filter((y) => y.trim() !== "")
        .map((y) => parseInt(y, 10))
        .filter((y) => !isNaN(y));

      if (validYears.length === 0) {
        setErrorMessage("対象年度を少なくとも1つ入力してください。");
        setLoading(false);
        return;
      }

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

  // ステップ進む
  const nextStep = () => {
    if (step === 1) {
      // ステップ1のバリデーション
      if (!email || !stockName || years.filter((y) => y.trim()).length === 0) {
        setErrorMessage("必須項目を入力してください");
        return;
      }
    }
    setErrorMessage("");
    setStep(step + 1);
  };

  // ステップ戻る
  const prevStep = () => {
    setErrorMessage("");
    setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <FormNavigation />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 進捗バー */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-bold
                    ${
                      s === step
                        ? "bg-indigo-600 text-white shadow-lg"
                        : s < step
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-500"
                    }
                  `}
                >
                  {s < step ? "✓" : s}
                </div>
                {s < 3 && (
                  <div
                    className={`h-1 w-20 sm:w-32 mx-2 ${
                      s < step ? "bg-green-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>基本情報</span>
            <span>取引データ</span>
            <span>確認・送信</span>
          </div>
        </div>

        {/* エラーメッセージ */}
        {errorMessage && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {errorMessage}
          </div>
        )}

        {/* 成功メッセージ */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* ステップ1: 基本情報 */}
          {step === 1 && (
            <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                📝 基本情報を入力してください
              </h2>

              {/* サンプルデータボタン */}
              <button
                type="button"
                onClick={loadSampleData}
                className="w-full px-4 py-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium transition-colors"
              >
                🎯 サンプルデータを読み込む
              </button>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メールアドレス *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* 通貨と銘柄 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    通貨 *
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as "USD" | "EUR")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    銘柄 *
                  </label>
                  <input
                    type="text"
                    required
                    value={stockName}
                    onChange={(e) => setStockName(e.target.value)}
                    placeholder="GOOGL"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* 対象年度 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  対象年度（半角数字4桁）*
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {years.map((year, i) => (
                    <input
                      key={i}
                      type="text"
                      value={year}
                      onChange={(e) => updateYear(i, e.target.value)}
                      pattern="[0-9]{4}"
                      placeholder="2024"
                      className="px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-indigo-500"
                    />
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={nextStep}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-lg font-semibold text-lg shadow-lg transition-colors"
              >
                次へ →
              </button>
            </div>
          )}

          {/* ステップ2: 取引データ */}
          {step === 2 && (
            <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                📊 取引データを入力してください
              </h2>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                💡 売却（Sold）の場合は、数量を<strong>マイナス</strong>で入力してください
              </div>

              {/* 取引一覧 */}
              <div className="space-y-3">
                {rows.map((row, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-6 gap-2 p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <input
                      type="date"
                      required
                      value={row.date}
                      onChange={(e) => updateRow(index, "date", e.target.value)}
                      className="col-span-2 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <select
                      value={row.activity}
                      onChange={(e) =>
                        updateRow(index, "activity", e.target.value as "Purchased" | "Sold")
                      }
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="Purchased">購入</option>
                      <option value="Sold">売却</option>
                    </select>
                    <input
                      type="text"
                      required
                      value={row.quantity}
                      onChange={(e) => updateRow(index, "quantity", e.target.value)}
                      placeholder="数量"
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <input
                      type="text"
                      required
                      value={row.fmv}
                      onChange={(e) => updateRow(index, "fmv", e.target.value)}
                      placeholder="価格"
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={row.commission}
                        onChange={(e) => updateRow(index, "commission", e.target.value)}
                        placeholder="手数料"
                        className="flex-1 px-2 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeRow(index)}
                        className="px-2 bg-red-500 hover:bg-red-600 text-white rounded-md"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addRow}
                className="w-full px-4 py-2 border-2 border-dashed border-gray-300 hover:border-indigo-500 text-gray-600 hover:text-indigo-600 rounded-lg transition-colors"
              >
                + 取引を追加
              </button>

              {/* 保有株式数 */}
              <div className="bg-indigo-50 rounded-lg p-4 flex justify-between items-center">
                <span className="text-gray-700 font-medium">保有株式数</span>
                <span className="text-2xl font-bold text-indigo-600">
                  {holdings.toLocaleString()}
                </span>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-4 rounded-lg font-semibold transition-colors"
                >
                  ← 戻る
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-lg font-semibold shadow-lg transition-colors"
                >
                  次へ →
                </button>
              </div>
            </div>
          )}

          {/* ステップ3: 確認・送信 */}
          {step === 3 && (
            <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                ✅ 入力内容を確認してください
              </h2>

              {/* 確認情報 */}
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-700 mb-2">基本情報</h3>
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">メール:</dt>
                      <dd className="font-medium">{email}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">通貨:</dt>
                      <dd className="font-medium">{currency}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">銘柄:</dt>
                      <dd className="font-medium">{stockName}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">年度:</dt>
                      <dd className="font-medium">
                        {years.filter((y) => y.trim()).join(", ")}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-700 mb-2">取引データ</h3>
                  <p className="text-sm text-gray-600">
                    取引数: <strong>{rows.length}件</strong>
                  </p>
                  <p className="text-sm text-gray-600">
                    保有株式数: <strong>{holdings.toLocaleString()}</strong>
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                📄 送信ボタンを押すと、計算結果がPDFでダウンロードされます。
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={loading}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-4 rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  ← 戻る
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 rounded-lg font-semibold shadow-lg transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      処理中...
                    </>
                  ) : (
                    "📥 計算結果を取得する"
                  )}
                </button>
              </div>
            </div>
          )}
        </form>

        {/* 税理士への相談CTA */}
        <div className="mt-8 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-xl p-6 text-white">
          <h3 className="text-xl font-bold mb-2">確定申告のご相談はこちら</h3>
          <p className="text-sm mb-4 opacity-90">
            複雑な外国株式の税務処理は、専門家にお任せください。
          </p>
          <button className="bg-white text-indigo-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            〇〇国際税務会計事務所に相談する →
          </button>
        </div>
      </div>
    </div>
  );
}
