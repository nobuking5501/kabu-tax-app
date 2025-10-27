"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Customer {
  email: string;
  uid?: string;
  displayName?: string;
  createdAt?: string;
  lastSignInTime?: string;
  first_submission?: string;
  last_submission?: string;
  total_submissions: number;
  total_pdfs: number;
  payment_count: number;
  payment_completed?: boolean;
  last_payment_date?: string;
}

interface Stats {
  totalCustomers: number;
  totalSubmissions: number;
  totalPDFs: number;
  recentCustomers: Customer[];
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

            {/* 最近の顧客リスト */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span>👥</span>
                  最近の顧客（最新5件）
                </h2>
                <Link
                  href="/customers"
                  className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm"
                >
                  すべて表示 →
                </Link>
              </div>
              {!stats.recentCustomers || stats.recentCustomers.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  まだ顧客がいません
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          名前
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          メールアドレス
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          初回利用日時
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          最終利用日時
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          決済回数
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          PDF生成数
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {stats.recentCustomers.map((customer) => (
                        <tr
                          key={customer.email}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {customer.displayName || "-"}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-700">
                              {customer.email}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {customer.first_submission
                              ? new Date(customer.first_submission).toLocaleDateString(
                                  "ja-JP",
                                  {
                                    year: "numeric",
                                    month: "2-digit",
                                    day: "2-digit",
                                  }
                                )
                              : "-"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {customer.last_submission
                              ? new Date(customer.last_submission).toLocaleDateString(
                                  "ja-JP",
                                  {
                                    year: "numeric",
                                    month: "2-digit",
                                    day: "2-digit",
                                  }
                                )
                              : "-"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {customer.payment_count}回
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              {customer.total_pdfs}件
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
