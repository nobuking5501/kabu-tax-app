"use client";

import { useState, FormEvent, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import FormNavigation from "@/components/FormNavigation";

type Row = {
  date: string;
  activity: "Purchased" | "Sold";
  quantity: string;
  fmv: string;
  commission: string;
};

export default function Form3Page() {
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

  // リアルタイム統計計算
  const stats = useMemo(() => {
    const holdings = rows.reduce((sum, row) => sum + (parseFloat(row.quantity) || 0), 0);
    const purchases = rows.filter((r) => r.activity === "Purchased").length;
    const sales = rows.filter((r) => r.activity === "Sold").length;
    const totalValue = rows.reduce((sum, row) => {
      const qty = parseFloat(row.quantity) || 0;
      const price = parseFloat(row.fmv) || 0;
      return sum + Math.abs(qty * price);
    }, 0);

    return { holdings, purchases, sales, totalValue };
  }, [rows]);

  const loadSampleData = () => {
    setEmail("test@example.com");
    setCurrency("USD");
    setStockName("TSLA");
    setYears(["2024", "2025", "", "", ""]);
    setRows([
      { date: "2024-01-10", activity: "Purchased", quantity: "50", fmv: "100", commission: "5" },
      { date: "2024-03-15", activity: "Purchased", quantity: "50", fmv: "120", commission: "5" },
      { date: "2024-06-20", activity: "Sold", quantity: "-75", fmv: "150", commission: "10" },
      { date: "2024-12-10", activity: "Purchased", quantity: "30", fmv: "140", commission: "3" },
    ]);
  };

  const addRow = () => {
    if (rows.length >= 50) return alert("最大50行までです");
    setRows([...rows, { date: today, activity: "Purchased", quantity: "", fmv: "", commission: "" }]);
  };

  const removeRow = (index: number) => {
    if (rows.length === 1) return alert("最低1行は必要です");
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
        if (isNaN(qty) || qty >= 0) errors.push(index);
      }
    });

    if (errors.length > 0) {
      setValidationErrors(errors);
      setErrorMessage("売却時は数量をマイナスで入力してください。");
      return;
    }

    setLoading(true);

    try {
      const validYears = years.filter((y) => y.trim()).map((y) => parseInt(y, 10)).filter((y) => !isNaN(y));
      if (validYears.length === 0) throw new Error("対象年度を入力してください");

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
        throw new Error(error.error || "サーバーエラー");
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

      setSuccessMessage("計算結果をダウンロードしました！");
    } catch (error: any) {
      setErrorMessage(error.message || "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <FormNavigation />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* 左サイドバー: 統計ダッシュボード */}
          <div className="lg:col-span-1 space-y-6">
            {/* ヘッダーカード */}
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-2xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="text-4xl">👑</div>
                <div>
                  <h1 className="text-2xl font-bold">Premium</h1>
                  <p className="text-sm opacity-90">高級感のある計算体験</p>
                </div>
              </div>
            </div>

            {/* 統計カード */}
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl">
              <h3 className="text-slate-300 text-sm font-semibold mb-4 flex items-center gap-2">
                <span>📊</span> リアルタイム統計
              </h3>
              <div className="space-y-4">
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <p className="text-slate-400 text-xs mb-1">保有株式数</p>
                  <p className="text-3xl font-bold text-white">{stats.holdings.toLocaleString()}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3">
                    <p className="text-green-400 text-xs mb-1">購入回数</p>
                    <p className="text-2xl font-bold text-green-300">{stats.purchases}</p>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                    <p className="text-red-400 text-xs mb-1">売却回数</p>
                    <p className="text-2xl font-bold text-red-300">{stats.sales}</p>
                  </div>
                </div>
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <p className="text-slate-400 text-xs mb-1">取引総額</p>
                  <p className="text-xl font-bold text-amber-400">
                    {currency} {stats.totalValue.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* アクションカード */}
            <button
              type="button"
              onClick={loadSampleData}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-4 rounded-xl font-semibold shadow-xl transition-all transform hover:scale-105"
            >
              ✨ サンプルデータ読み込み
            </button>

            {/* 税理士相談CTA */}
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-2xl">
              <div className="text-4xl mb-3">🎓</div>
              <h3 className="font-bold text-lg mb-2">専門家に相談</h3>
              <p className="text-sm opacity-90 mb-4">
                確定申告は榧野国際税務会計事務所にお任せください
              </p>
              <button className="w-full bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                無料相談予約 →
              </button>
            </div>
          </div>

          {/* メインコンテンツ */}
          <div className="lg:col-span-2 space-y-6">
            {/* メッセージ */}
            {errorMessage && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-300 px-4 py-3 rounded-xl">
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div className="bg-green-500/10 border border-green-500/50 text-green-300 px-4 py-3 rounded-xl">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 基本情報 */}
              <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <span className="text-2xl">📝</span> 基本情報
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-300 text-sm font-semibold mb-2">
                      メールアドレス
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                      placeholder="example@email.com"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 text-sm font-semibold mb-2">
                        通貨
                      </label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value as "USD" | "EUR")}
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-300 text-sm font-semibold mb-2">
                        銘柄
                      </label>
                      <input
                        type="text"
                        required
                        value={stockName}
                        onChange={(e) => setStockName(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                        placeholder="TSLA"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 text-sm font-semibold mb-2">
                      対象年度
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {years.map((year, i) => (
                        <input
                          key={i}
                          type="text"
                          value={year}
                          onChange={(e) => updateYear(i, e.target.value)}
                          pattern="[0-9]{4}"
                          className="px-3 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white text-center placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                          placeholder="2024"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 取引データ */}
              <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <span className="text-2xl">💼</span> 取引データ
                </h2>

                <div className="space-y-3">
                  {rows.map((row, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-6 gap-2 p-4 bg-slate-700/50 rounded-xl border border-slate-600/50"
                    >
                      <input
                        type="date"
                        required
                        value={row.date}
                        onChange={(e) => updateRow(index, "date", e.target.value)}
                        className="col-span-2 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                      />
                      <select
                        value={row.activity}
                        onChange={(e) =>
                          updateRow(index, "activity", e.target.value as "Purchased" | "Sold")
                        }
                        className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                      >
                        <option value="Purchased">購入</option>
                        <option value="Sold">売却</option>
                      </select>
                      <input
                        type="text"
                        required
                        value={row.quantity}
                        onChange={(e) => updateRow(index, "quantity", e.target.value)}
                        className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                        placeholder="数量"
                      />
                      <input
                        type="text"
                        required
                        value={row.fmv}
                        onChange={(e) => updateRow(index, "fmv", e.target.value)}
                        className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                        placeholder="価格"
                      />
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={row.commission}
                          onChange={(e) => updateRow(index, "commission", e.target.value)}
                          className="flex-1 px-2 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                          placeholder="手数料"
                        />
                        <button
                          type="button"
                          onClick={() => removeRow(index)}
                          className="px-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
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
                  className="w-full mt-4 px-4 py-3 border-2 border-dashed border-slate-600 hover:border-amber-500 text-slate-400 hover:text-amber-400 rounded-xl font-semibold transition-all"
                >
                  + 取引を追加
                </button>
              </div>

              {/* 送信ボタン */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-6 py-5 rounded-2xl font-bold text-lg shadow-2xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
                  "🎯 計算結果をダウンロード"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
