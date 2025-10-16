"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import FormNavigation from "@/components/FormNavigation";

type Row = {
  date: string;
  activity: "Purchased" | "Sold";
  quantity: string;
  fmv: string;
  commission: string;
};

export default function Form2Page() {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];

  // このページは廃止されました。form1にリダイレクトします。
  useEffect(() => {
    router.replace("/form1");
  }, [router]);

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

  const holdings = rows.reduce((sum, row) => sum + (parseFloat(row.quantity) || 0), 0);

  const loadSampleData = () => {
    setEmail("test@example.com");
    setCurrency("USD");
    setStockName("AAPL");
    setYears(["2024", "2025", "", "", ""]);
    setRows([
      { date: "2024-01-10", activity: "Purchased", quantity: "50", fmv: "100", commission: "5" },
      { date: "2024-03-15", activity: "Purchased", quantity: "50", fmv: "120", commission: "5" },
      { date: "2024-06-20", activity: "Sold", quantity: "-75", fmv: "150", commission: "10" },
    ]);
  };

  const addRow = () => {
    if (rows.length >= 50) {
      alert("最大50行までです");
      return;
    }
    setRows([...rows, { date: today, activity: "Purchased", quantity: "", fmv: "", commission: "" }]);
  };

  const removeRow = (index: number) => {
    if (rows.length === 1) {
      alert("最低1行は必要です");
      return;
    }
    setRows(rows.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: keyof Row, value: string) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setRows(newRows);
  };

  const updateYear = (index: number, value: string) => {
    const newYears = [...years];
    newYears[index] = value;
    setYears(newYears);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");
    setValidationErrors([]);

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
      const validYears = years.filter((y) => y.trim() !== "").map((y) => parseInt(y, 10)).filter((y) => !isNaN(y));

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

      const payload = { email, currency, symbol: stockName, years: validYears, transactions };

      const response = await fetch("/api/submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-100">
      <FormNavigation />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            株式譲渡益計算アプリ
          </h1>
          <p className="text-gray-600">モダンなUIで、スマートに計算</p>
        </div>

        {/* サンプルデータ読み込み */}
        <div className="mb-6">
          <button
            type="button"
            onClick={loadSampleData}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-6 py-4 rounded-xl shadow-lg font-semibold transition-all transform hover:scale-105"
          >
            ✨ サンプルデータを読み込む
          </button>
        </div>

        {/* エラー・成功メッセージ */}
        {errorMessage && (
          <div className="mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-r-lg shadow">
            <p className="font-semibold">エラー</p>
            <p>{errorMessage}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-r-lg shadow">
            <p className="font-semibold">成功</p>
            <p>{successMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* カード1: 基本情報 */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 transform transition-all hover:shadow-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
                1
              </div>
              <h2 className="text-2xl font-bold text-gray-800">基本情報</h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📧 メールアドレス
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    💰 通貨
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as "USD" | "EUR")}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                  >
                    <option value="USD">🇺🇸 USD</option>
                    <option value="EUR">🇪🇺 EUR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📈 銘柄
                  </label>
                  <input
                    type="text"
                    required
                    value={stockName}
                    onChange={(e) => setStockName(e.target.value)}
                    placeholder="AAPL, GOOGL..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📅 対象年度
                </label>
                <div className="grid grid-cols-5 gap-3">
                  {years.map((year, i) => (
                    <input
                      key={i}
                      type="text"
                      value={year}
                      onChange={(e) => updateYear(i, e.target.value)}
                      pattern="[0-9]{4}"
                      placeholder="2024"
                      className="px-3 py-3 border-2 border-gray-200 rounded-xl text-center focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* カード2: 取引データ */}
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
                2
              </div>
              <h2 className="text-2xl font-bold text-gray-800">取引データ</h2>
            </div>

            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 p-4 rounded-r-xl mb-6">
              <p className="text-sm text-yellow-800">
                💡 <strong>ヒント:</strong> 売却時は数量を<strong className="text-red-600">マイナス</strong>で入力してください
              </p>
            </div>

            <div className="space-y-4">
              {rows.map((row, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-6 gap-3 p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200 hover:border-purple-300 transition-all"
                >
                  <input
                    type="date"
                    required
                    value={row.date}
                    onChange={(e) => updateRow(index, "date", e.target.value)}
                    className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                  <select
                    value={row.activity}
                    onChange={(e) =>
                      updateRow(index, "activity", e.target.value as "Purchased" | "Sold")
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
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
                    className={`px-3 py-2 border rounded-lg focus:ring-2 ${
                      validationErrors.includes(index)
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:ring-purple-500"
                    }`}
                  />
                  <input
                    type="text"
                    required
                    value={row.fmv}
                    onChange={(e) => updateRow(index, "fmv", e.target.value)}
                    placeholder="価格"
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={row.commission}
                      onChange={(e) => updateRow(index, "commission", e.target.value)}
                      placeholder="手数料"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      className="px-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-lg transition-all transform hover:scale-105"
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
              className="w-full mt-4 px-4 py-3 border-2 border-dashed border-purple-300 hover:border-purple-500 text-purple-600 hover:text-purple-700 rounded-xl font-semibold transition-all"
            >
              + 取引を追加
            </button>
          </div>

          {/* カード3: 保有状況と送信 */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-2xl p-8 text-white">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold opacity-90">現在の保有株式数</h3>
                <p className="text-5xl font-bold mt-2">{holdings.toLocaleString()}</p>
              </div>
              <div className="text-6xl">📊</div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-purple-600 px-6 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-6 w-6 mr-2" viewBox="0 0 24 24">
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
                "🚀 計算結果をダウンロード"
              )}
            </button>
          </div>
        </form>

        {/* 税理士相談CTA */}
        <div className="mt-8 bg-white rounded-2xl shadow-2xl p-8 border-t-4 border-indigo-600">
          <div className="flex items-center gap-4">
            <div className="text-5xl">🎓</div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                確定申告のご相談は専門家へ
              </h3>
              <p className="text-gray-600 mb-4">
                外国株式の税務処理は複雑です。〇〇国際税務会計事務所が丁寧にサポートいたします。
              </p>
              <button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg transition-all transform hover:scale-105">
                無料相談を予約する →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
