"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Customer {
  email: string;
  first_submission: string;
  last_submission: string;
  total_submissions: number;
  total_pdfs: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"email" | "last" | "total">("last");

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    filterAndSort();
  }, [customers, searchQuery, sortBy]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/customers");
      if (!response.ok) throw new Error("顧客リストの取得に失敗しました");
      const data = await response.json();
      setCustomers(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSort = () => {
    let filtered = customers;

    // 検索フィルター
    if (searchQuery) {
      filtered = filtered.filter((customer) =>
        customer.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // ソート
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "email":
          return a.email.localeCompare(b.email);
        case "last":
          return new Date(b.last_submission).getTime() - new Date(a.last_submission).getTime();
        case "total":
          return b.total_submissions - a.total_submissions;
        default:
          return 0;
      }
    });

    setFilteredCustomers(filtered);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/"
                className="text-indigo-100 hover:text-white text-sm mb-2 inline-block"
              >
                ← ダッシュボードに戻る
              </Link>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <span>👥</span>
                顧客リスト
              </h1>
              <p className="text-indigo-100 mt-1">
                全ての顧客と利用履歴を管理
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

        {/* 検索・フィルター */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 検索 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🔍 メールアドレスで検索
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="例: user@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* ソート */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📊 並び替え
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="last">最終利用日時（新しい順）</option>
                <option value="total">利用回数（多い順）</option>
                <option value="email">メールアドレス（昇順）</option>
              </select>
            </div>
          </div>

          {/* 統計 */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              <strong>表示件数:</strong> {filteredCustomers.length} 件 / 全{" "}
              {customers.length} 件
            </p>
          </div>
        </div>

        {/* ローディング */}
        {loading && (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">顧客リストを読み込み中...</p>
          </div>
        )}

        {/* 顧客リスト */}
        {!loading && filteredCustomers.length === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {searchQuery ? "検索結果がありません" : "まだ顧客がいません"}
            </h3>
            <p className="text-gray-600">
              {searchQuery
                ? "別のキーワードで検索してみてください"
                : "お客様向けアプリからPDFが生成されると、ここに顧客が表示されます"}
            </p>
          </div>
        )}

        {!loading && filteredCustomers.length > 0 && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      メールアドレス
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      初回利用日時
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      最終利用日時
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      利用回数
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      PDF生成数
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCustomers.map((customer) => (
                    <tr
                      key={customer.email}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">
                            {customer.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {formatDate(customer.first_submission)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {formatDate(customer.last_submission)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {customer.total_submissions}回
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {customer.total_pdfs}件
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/customers/${encodeURIComponent(
                            customer.email
                          )}`}
                          className="text-indigo-600 hover:text-indigo-900 font-semibold"
                        >
                          詳細 →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
