"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Submission {
  id: number;
  email: string;
  symbol: string;
  currency: string;
  years: number[];
  transaction_count: number;
  pdf_generated: boolean;
  created_at: string;
  updated_at: string;
}

export default function CustomerDetailPage() {
  const params = useParams();
  const email = decodeURIComponent(params.email as string);

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, [email]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/customers/${encodeURIComponent(email)}`);
      if (!response.ok) throw new Error("顧客情報の取得に失敗しました");
      const data = await response.json();
      setSubmissions(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const stats = {
    totalSubmissions: submissions.length,
    totalPDFs: submissions.filter((s) => s.pdf_generated).length,
    uniqueSymbols: [...new Set(submissions.map((s) => s.symbol))].length,
    currencies: [...new Set(submissions.map((s) => s.currency))],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/customers"
                className="text-indigo-100 hover:text-white text-sm mb-2 inline-block"
              >
                ← 顧客リストに戻る
              </Link>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <span>👤</span>
                顧客詳細
              </h1>
              <p className="text-indigo-100 mt-1 text-lg font-semibold">
                {email}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* エラー表示 */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
            <p className="text-red-700">
              <strong>エラー:</strong> {error}
            </p>
          </div>
        )}

        {/* ローディング */}
        {loading && (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">顧客情報を読み込み中...</p>
          </div>
        )}

        {/* 統計カード */}
        {!loading && !error && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-blue-500">
                <p className="text-sm font-semibold text-gray-600 uppercase">
                  総利用回数
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalSubmissions}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-green-500">
                <p className="text-sm font-semibold text-gray-600 uppercase">
                  PDF生成数
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalPDFs}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-purple-500">
                <p className="text-sm font-semibold text-gray-600 uppercase">
                  取引銘柄数
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.uniqueSymbols}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-yellow-500">
                <p className="text-sm font-semibold text-gray-600 uppercase">
                  取引通貨
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {stats.currencies.join(", ")}
                </p>
              </div>
            </div>

            {/* 利用履歴 */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>📋</span>
                利用履歴
              </h2>

              {submissions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  利用履歴がありません
                </p>
              ) : (
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="border border-gray-200 rounded-lg p-5 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl font-bold text-indigo-600">
                              {submission.symbol}
                            </span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded">
                              {submission.currency}
                            </span>
                            {submission.pdf_generated && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                                ✓ PDF生成済
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600">
                            <div>
                              <span className="font-semibold">対象年度:</span>{" "}
                              {submission.years.join(", ")}
                            </div>
                            <div>
                              <span className="font-semibold">取引件数:</span>{" "}
                              {submission.transaction_count}件
                            </div>
                            <div>
                              <span className="font-semibold">生成日時:</span>{" "}
                              {formatDate(submission.created_at)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* アクション */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                🚀 クイックアクション
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  href="/customers"
                  className="bg-white hover:bg-gray-50 p-4 rounded-lg border border-gray-200 transition-colors"
                >
                  <p className="font-semibold text-gray-900">
                    ← 顧客リストに戻る
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    他の顧客を確認
                  </p>
                </Link>
                <Link
                  href="/"
                  className="bg-white hover:bg-gray-50 p-4 rounded-lg border border-gray-200 transition-colors"
                >
                  <p className="font-semibold text-gray-900">
                    📊 ダッシュボード
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    全体統計を確認
                  </p>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
