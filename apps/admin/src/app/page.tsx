"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  totalCustomers: number;
  totalSubmissions: number;
  totalPDFs: number;
  popularSymbols: Array<{ symbol: string; count: number }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/stats");
      if (!response.ok) throw new Error("統計の取得に失敗しました");
      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <span>📊</span>
                Kabu Tax 管理画面
              </h1>
              <p className="text-indigo-100 mt-1">
                顧客管理・利用統計・PDF生成履歴
              </p>
            </div>
            <Link
              href="/customers"
              className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-colors shadow-md"
            >
              顧客リスト →
            </Link>
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
            <p className="text-sm text-red-600 mt-2">
              データベースが正しくセットアップされているか確認してください。
              <Link href="/setup-guide" className="underline ml-2">
                セットアップガイドを見る
              </Link>
            </p>
          </div>
        )}

        {/* ローディング */}
        {loading && (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">統計情報を読み込み中...</p>
          </div>
        )}

        {/* ダッシュボード */}
        {!loading && stats && (
          <div className="space-y-6">
            {/* 統計カード */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 総顧客数 */}
              <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 uppercase">
                      総顧客数
                    </p>
                    <p className="text-4xl font-bold text-gray-900 mt-2">
                      {stats.totalCustomers.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-5xl">👥</div>
                </div>
              </div>

              {/* PDF生成数 */}
              <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 uppercase">
                      PDF生成数
                    </p>
                    <p className="text-4xl font-bold text-gray-900 mt-2">
                      {stats.totalPDFs.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-5xl">📄</div>
                </div>
              </div>

              {/* 総リクエスト数 */}
              <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 uppercase">
                      総リクエスト数
                    </p>
                    <p className="text-4xl font-bold text-gray-900 mt-2">
                      {stats.totalSubmissions.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-5xl">📊</div>
                </div>
              </div>
            </div>

            {/* 人気銘柄ランキング */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>🏆</span>
                人気銘柄トップ5
              </h2>
              {stats.popularSymbols.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  まだデータがありません
                </p>
              ) : (
                <div className="space-y-3">
                  {stats.popularSymbols.map((item, index) => (
                    <div
                      key={item.symbol}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl font-bold text-gray-400">
                          #{index + 1}
                        </span>
                        <div>
                          <p className="text-lg font-semibold text-gray-900">
                            {item.symbol}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-indigo-600">
                          {item.count}
                        </p>
                        <p className="text-sm text-gray-500">リクエスト</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* クイックアクション */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                🚀 クイックアクション
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  href="/customers"
                  className="bg-white hover:bg-gray-50 p-4 rounded-lg border border-gray-200 transition-colors"
                >
                  <p className="font-semibold text-gray-900">👥 顧客リスト</p>
                  <p className="text-sm text-gray-600 mt-1">
                    全ての顧客を確認・検索
                  </p>
                </Link>
                <button
                  onClick={fetchStats}
                  className="bg-white hover:bg-gray-50 p-4 rounded-lg border border-gray-200 transition-colors text-left"
                >
                  <p className="font-semibold text-gray-900">🔄 統計を更新</p>
                  <p className="text-sm text-gray-600 mt-1">
                    最新の統計情報を取得
                  </p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* データがない場合 */}
        {!loading && !error && stats && stats.totalSubmissions === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center mt-6">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              まだデータがありません
            </h3>
            <p className="text-gray-600 mb-4">
              お客様向けアプリからPDFが生成されると、ここに統計が表示されます。
            </p>
            <Link
              href="http://localhost:3001/form"
              target="_blank"
              className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              お客様向けアプリを開く →
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
