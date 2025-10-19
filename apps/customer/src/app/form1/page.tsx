"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import FormNavigation from "@/components/FormNavigation";
import PaymentGuard from "@/components/PaymentGuard";
import { useAuth } from "@/contexts/AuthContext";
import { incrementRetrievalCount, getUserPaymentData } from "@/lib/firebase/firestore";

type Row = {
  date: string;
  activity: "Purchased" | "Sold";
  quantity: string;
  fmv: string;
  commission: string;
};

export default function Form1Page() {
  const router = useRouter();
  const { user } = useAuth();
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

  // 取得回数制限（LocalStorageから読み込み）
  const [retrievalCount, setRetrievalCount] = useState(0);
  const [availableRetrievals, setAvailableRetrievals] = useState(0);
  const [isPaymentCompleted, setIsPaymentCompleted] = useState(false);

  // 初期化時にFirestoreから取得回数を読み込む（Firebase UID対応）
  useEffect(() => {
    if (!user) return;

    const loadPaymentData = async () => {
      // Firestoreから最新の決済情報を取得
      const paymentData = await getUserPaymentData(user.uid);

      if (paymentData) {
        setRetrievalCount(paymentData.retrievalCount);
        setAvailableRetrievals(paymentData.availableRetrievals);
        setIsPaymentCompleted(paymentData.paymentCompleted);

        // LocalStorageにキャッシュとして保存（パフォーマンス向上のため）
        localStorage.setItem(`retrievalCount_${user.uid}`, paymentData.retrievalCount.toString());
        localStorage.setItem(`availableRetrievals_${user.uid}`, paymentData.availableRetrievals.toString());
        localStorage.setItem(`payment_${user.uid}`, paymentData.paymentCompleted ? "true" : "false");
      }
    };

    loadPaymentData();
  }, [user]);

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

    // validationErrorsも更新: 削除した行のエラーを除去し、それ以降のインデックスを-1
    setValidationErrors(
      validationErrors
        .filter(i => i !== index) // 削除する行のエラーを除去
        .map(i => i > index ? i - 1 : i) // それ以降のインデックスを調整
    );
  };

  // 入力変更
  const updateRow = (index: number, field: keyof Row, value: string) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setRows(newRows);

    // リアルタイムバリデーション: 売却で数量がマイナスでない場合に警告
    if (field === "activity" || field === "quantity") {
      const updatedRow = newRows[index];
      const qty = parseFloat(updatedRow.quantity);

      if (updatedRow.activity === "Sold" && (!isNaN(qty) && qty >= 0)) {
        // エラーリストに追加
        if (!validationErrors.includes(index)) {
          setValidationErrors([...validationErrors, index]);
        }
      } else {
        // エラーリストから削除
        if (validationErrors.includes(index)) {
          setValidationErrors(validationErrors.filter(i => i !== index));
        }
      }
    }
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

    // 決済完了状態を確認（Firebase UID対応）
    if (!user) {
      setErrorMessage("ログインが必要です");
      setLoading(false);
      return;
    }

    const paymentCompleted = localStorage.getItem(`payment_${user.uid}`);
    const available = parseInt(localStorage.getItem(`availableRetrievals_${user.uid}`) || "0", 10);
    const currentCount = parseInt(localStorage.getItem(`retrievalCount_${user.uid}`) || "0", 10);

    // 取得回数制限チェック
    if (paymentCompleted !== "true" || currentCount >= available) {
      alert("取得回数を超えました。決済ページに移動します。");
      router.push("/payment");
      return;
    }

    // 取得回数に応じた警告表示
    const remaining = available - currentCount;
    if (remaining === 3) {
      alert("今回の決済で3回取得できます。残り2回です。");
    } else if (remaining === 2) {
      alert("残り1回取得できます。");
    } else if (remaining === 1) {
      alert("これが最後の取得です。次回は再度決済が必要です。");
    }

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

      // レスポンスタイプで分岐
      const contentType = response.headers.get("Content-Type");

      if (contentType?.includes("application/json")) {
        // メール送信成功
        const result = await response.json();
        setSuccessMessage(`✅ メール送信に成功しました！\n${email} 宛にPDF付きメールを送信しました。\nメールボックスをご確認ください。`);
      } else {
        // PDFダウンロード
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `kabu-tax-${stockName}-${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        setSuccessMessage("✅ 計算結果の取得に成功しました！PDFがダウンロードされました。");
      }

      // 取得回数をインクリメント（Firestoreに保存・Firebase UID対応）
      if (!user) return;

      // Firestoreの取得回数を更新
      const incrementSuccess = await incrementRetrievalCount(user.uid);

      if (incrementSuccess) {
        const newCount = retrievalCount + 1;
        setRetrievalCount(newCount);

        // LocalStorageにキャッシュとして保存
        localStorage.setItem(`retrievalCount_${user.uid}`, newCount.toString());
        // 後方互換性のため古いキーも更新
        localStorage.setItem("retrievalCount", newCount.toString());

        // 取得可能回数を確認（Firebase UID対応）
        const available = parseInt(localStorage.getItem(`availableRetrievals_${user.uid}`) || "0", 10);

        // 取得可能回数に達した場合、決済ページにリダイレクト
        if (newCount >= available) {
          // 決済完了フラグをクリア（再度決済が必要）
          localStorage.removeItem(`payment_${user.uid}`);
          localStorage.removeItem(`stripe_session_id_${user.uid}`);
          // 後方互換性のため古いキーも削除
          localStorage.removeItem("stripe_payment_completed");
          localStorage.removeItem("stripe_session_id");

          setTimeout(() => {
            router.push("/payment");
          }, 2000); // 2秒後にリダイレクト（成功メッセージを表示するため）
        }
      } else {
        console.error("Firestoreの取得回数更新に失敗しました");
      }
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

    if (step === 2) {
      // ステップ2のバリデーション: 売却のマイナスチェック
      if (validationErrors.length > 0) {
        setErrorMessage("売却取引の数量をマイナスで入力してください。警告を解消してから次に進んでください。");
        return;
      }
    }

    setErrorMessage("");
    setValidationErrors([]);
    setStep(step + 1);
  };

  // ステップ戻る
  const prevStep = () => {
    setErrorMessage("");
    setValidationErrors([]);
    setStep(step - 1);
  };

  return (
    <PaymentGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <FormNavigation />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 取得回数表示 */}
        {isPaymentCompleted && availableRetrievals > 0 && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm font-medium text-blue-900">
                  利用回数: {retrievalCount}/{availableRetrievals}回 使用済み
                </span>
              </div>
              {retrievalCount < availableRetrievals && (
                <span className="text-xs text-blue-700">
                  あと{availableRetrievals - retrievalCount}回利用できます
                </span>
              )}
            </div>
          </div>
        )}

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
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg whitespace-pre-line">
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
                <p className="text-xs text-gray-500 mb-2">
                  計算結果のPDFを以下のメールアドレスに送信します。
                </p>
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
                    通貨/Currency *
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
                    銘柄/Stock Name *
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
                  対象年度/Years *
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  計算結果を自動集計したい年度を半角数字4桁で入力してください。
                </p>
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
              <div className="space-y-3 overflow-x-auto">
                {rows.map((row, index) => {
                  const hasError = validationErrors.includes(index);
                  return (
                    <div key={index}>
                      <div
                        className={`flex flex-col sm:grid sm:grid-cols-12 gap-2 p-3 sm:p-4 rounded-lg border ${
                          hasError
                            ? "bg-red-50 border-red-300"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        {/* 日付 */}
                        <input
                          type="date"
                          required
                          value={row.date}
                          onChange={(e) => updateRow(index, "date", e.target.value)}
                          className="sm:col-span-3 px-2 py-2 border border-gray-300 rounded-md text-sm w-full"
                        />
                        {/* 購入/売却 */}
                        <select
                          value={row.activity}
                          onChange={(e) =>
                            updateRow(index, "activity", e.target.value as "Purchased" | "Sold")
                          }
                          className="sm:col-span-2 px-2 py-2 border border-gray-300 rounded-md text-sm w-full"
                        >
                          <option value="Purchased">購入</option>
                          <option value="Sold">売却</option>
                        </select>
                        {/* 数量 */}
                        <input
                          type="text"
                          required
                          value={row.quantity}
                          onChange={(e) => updateRow(index, "quantity", e.target.value)}
                          placeholder="数量"
                          className={`sm:col-span-2 px-2 py-2 border rounded-md text-sm w-full ${
                            hasError
                              ? "border-red-500 bg-white"
                              : "border-gray-300"
                          }`}
                        />
                        {/* 価格 */}
                        <input
                          type="text"
                          required
                          value={row.fmv}
                          onChange={(e) => updateRow(index, "fmv", e.target.value)}
                          placeholder="価格"
                          className="sm:col-span-2 px-2 py-2 border border-gray-300 rounded-md text-sm w-full"
                        />
                        {/* 手数料 + 削除ボタン */}
                        <div className="sm:col-span-3 flex gap-2 w-full">
                          <input
                            type="text"
                            value={row.commission}
                            onChange={(e) => updateRow(index, "commission", e.target.value)}
                            placeholder="手数料"
                            className="flex-1 px-2 py-2 border border-gray-300 rounded-md text-sm min-w-0"
                          />
                          <button
                            type="button"
                            onClick={() => removeRow(index)}
                            className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm flex-shrink-0"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                      {hasError && (
                        <div className="mt-1 px-4 py-2 bg-red-100 border border-red-300 rounded text-xs text-red-700 flex items-start gap-2">
                          <svg
                            className="w-4 h-4 flex-shrink-0 mt-0.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                          </svg>
                          <span>
                            <strong>警告:</strong> 売却の場合、数量はマイナスの値で入力してください（例: -100）
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
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
                  disabled={validationErrors.length > 0}
                  className={`flex-1 py-4 rounded-lg font-semibold shadow-lg transition-colors ${
                    validationErrors.length > 0
                      ? "bg-gray-400 cursor-not-allowed text-gray-200"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white"
                  }`}
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
                📄 送信ボタンを押すと、メール設定がある場合はPDF付きメールが送信され、ない場合はPDFがダウンロードされます。
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
                    "📨 計算結果を送信・取得する"
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
            榧野国際税務会計事務所に相談する →
          </button>
        </div>
      </div>
      </div>
    </PaymentGuard>
  );
}
