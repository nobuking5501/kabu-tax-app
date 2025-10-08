"use client";

import FormNavigation from "@/components/FormNavigation";
import Link from "next/link";

export default function HowToUsePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <FormNavigation />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">🖥️</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            このアプリの使い方
          </h1>
          <p className="text-lg text-gray-600">
            シンプルな3ステップで、譲渡損益計算レポートを生成できます
          </p>
        </div>

        {/* コンテンツ */}
        <div className="space-y-8">
          {/* STEP 1 */}
          <section className="bg-white rounded-2xl p-8 shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold text-xl">
                1
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                取引データを準備
              </h2>
            </div>
            <div className="ml-15">
              <p className="text-gray-700 mb-4">
                証券会社から取引履歴をダウンロードし、以下の情報を確認してください：
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <ul className="space-y-2 text-sm text-blue-900">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">✓</span>
                    <span><strong>取引日：</strong> 売買が成立した日付（Settlement Date）</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">✓</span>
                    <span><strong>銘柄コード：</strong> ティッカーシンボル（例: AAPL, GOOGL）</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">✓</span>
                    <span><strong>数量：</strong> 購入・売却した株式数</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">✓</span>
                    <span><strong>単価：</strong> 1株あたりの価格（外貨建て）</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">✓</span>
                    <span><strong>手数料：</strong> 取引手数料（任意）</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* STEP 2 */}
          <section className="bg-white rounded-2xl p-8 shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold text-xl">
                2
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                フォームに入力
              </h2>
            </div>
            <div className="ml-15 space-y-4">
              <p className="text-gray-700">
                計算フォームで以下の情報を入力してください：
              </p>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2">基本情報</h3>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li><strong>メールアドレス：</strong> レポート送付先（必須）</li>
                    <li><strong>通貨：</strong> USD（米ドル）または EUR（ユーロ）</li>
                    <li><strong>銘柄コード：</strong> 例: AAPL, GOOGL, TSLA</li>
                    <li><strong>対象年度：</strong> 申告する年度を入力（最大5年分）</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2">取引データ</h3>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600">✓</span>
                      <span><strong>取引日：</strong> YYYY-MM-DD形式で入力</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600">✓</span>
                      <span><strong>活動：</strong> 「購入」または「売却」を選択</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600">⚠️</span>
                      <span><strong>数量：</strong> 購入は正の数、売却は<strong className="text-red-600">マイナス</strong>で入力</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600">✓</span>
                      <span><strong>価格：</strong> 1株あたりの価格（外貨）</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600">✓</span>
                      <span><strong>手数料：</strong> 取引手数料（空欄可）</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-3 bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded-r-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>重要：</strong> 売却時の数量は必ず<strong>マイナス</strong>で入力してください。
                    例: 100株売却の場合 → -100
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2">サンプルデータ機能</h3>
                <p className="text-sm text-gray-600">
                  各フォームには「サンプルデータを読み込む」ボタンがあります。
                  入力方法がわからない場合は、まずサンプルデータを試してみてください。
                </p>
              </div>
            </div>
          </section>

          {/* STEP 3 */}
          <section className="bg-white rounded-2xl p-8 shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold text-xl">
                3
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                PDFをダウンロード
              </h2>
            </div>
            <div className="ml-15 space-y-4">
              <p className="text-gray-700">
                「計算結果を取得する」ボタンをクリックすると、譲渡損益の計算結果がPDF形式でダウンロードされます。
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="font-semibold text-green-800 mb-2">PDFの内容</p>
                <ul className="space-y-1 text-sm text-green-700">
                  <li>• 年度別の譲渡損益</li>
                  <li>• 移動平均法による取得単価</li>
                  <li>• 取引ごとの詳細計算</li>
                  <li>• 為替レート（TTS/TTB）の適用</li>
                  <li>• 円換算後の金額</li>
                </ul>
              </div>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                <p className="text-sm text-blue-800">
                  💡 このPDFは確定申告時の計算根拠として使用できます。
                  税理士に依頼する場合も、このPDFを渡すことでスムーズに進められます。
                </p>
              </div>
            </div>
          </section>

          {/* 注意事項 */}
          <section className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-8 border-l-4 border-yellow-500">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>⚠️</span> よくある入力ミス
            </h2>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-start gap-2">
                <span className="text-red-600 font-bold">✗</span>
                <span><strong>売却数量が正の数：</strong> 売却は必ずマイナスで入力</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-600 font-bold">✗</span>
                <span><strong>日付形式が不正：</strong> YYYY-MM-DD形式で入力（例: 2024-03-15）</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-600 font-bold">✗</span>
                <span><strong>通貨の選択ミス：</strong> 取引通貨（USD/EUR）を正しく選択</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-600 font-bold">✗</span>
                <span><strong>年度の未入力：</strong> 対象年度を最低1つ入力</span>
              </div>
            </div>
          </section>

          {/* CTA */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-2xl">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-3">
                今すぐ計算を始める
              </h2>
              <p className="text-white/90 mb-6">
                シンプルなフォームで、すぐに譲渡損益計算が完了します
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/form"
                  className="bg-white text-indigo-600 px-8 py-3 rounded-xl font-semibold shadow-lg hover:bg-gray-100 transition-all transform hover:scale-105"
                >
                  計算フォームを開く →
                </Link>
                <Link
                  href="/guide"
                  className="bg-indigo-800 hover:bg-indigo-900 text-white px-8 py-3 rounded-xl font-semibold transition-all"
                >
                  ← 確定申告ガイドに戻る
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
