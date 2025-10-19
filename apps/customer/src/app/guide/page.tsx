"use client";

import FormNavigation from "@/components/FormNavigation";
import Link from "next/link";

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <FormNavigation />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">📚</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            外国株式の確定申告ガイド
          </h1>
          <p className="text-lg text-gray-600">
            このアプリを使った申告の流れと、必要な知識をわかりやすく解説します
          </p>
        </div>

        {/* 目次 */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-8 border border-blue-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>📖</span> 目次
          </h2>
          <ul className="space-y-2 text-gray-700">
            <li>
              <a href="#overview" className="hover:text-indigo-600 transition-colors">
                1. 外国株式の確定申告とは
              </a>
            </li>
            <li>
              <a href="#when" className="hover:text-indigo-600 transition-colors">
                2. 申告が必要なケース
              </a>
            </li>
            <li>
              <a href="#calculation" className="hover:text-indigo-600 transition-colors">
                3. 譲渡損益の計算方法
              </a>
            </li>
            <li>
              <a href="#documents" className="hover:text-indigo-600 transition-colors">
                4. 必要な書類
              </a>
            </li>
            <li>
              <a href="#flow" className="hover:text-indigo-600 transition-colors">
                5. 申告の流れ
              </a>
            </li>
            <li>
              <a href="#faq" className="hover:text-indigo-600 transition-colors">
                6. よくある質問
              </a>
            </li>
          </ul>
          <div className="mt-4 pt-4 border-t border-indigo-200">
            <Link
              href="/guide/how-to-use"
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
            >
              <span>🖥️</span>
              <span>このアプリの使い方 →</span>
            </Link>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="space-y-8">
          {/* セクション1 */}
          <section id="overview" className="bg-white rounded-2xl p-8 shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>🌍</span> 1. 外国株式の確定申告とは
            </h2>
            <div className="prose max-w-none text-gray-700 space-y-4">
              <p>
                海外の証券会社や国内の証券会社を通じて外国株式（米国株、欧州株など）を売買した場合、
                その譲渡損益は原則として<strong className="text-indigo-600">確定申告が必要</strong>です。
              </p>
              <p>
                特に海外の証券会社（Interactive Brokers、Charles Schwab、Firstrade等）を利用している場合は、
                日本の「特定口座（源泉徴収あり）」制度が使えないため、
                <strong className="text-red-600">必ず確定申告が必要</strong>となります。
              </p>
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
                <p className="font-semibold text-yellow-800">⚠️ 注意</p>
                <p className="text-sm text-yellow-700">
                  国内の証券会社でも「特定口座（源泉徴収なし）」や「一般口座」を利用している場合は申告が必要です。
                </p>
              </div>
            </div>
          </section>

          {/* セクション2 */}
          <section id="when" className="bg-white rounded-2xl p-8 shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>✅</span> 2. 申告が必要なケース
            </h2>
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="font-semibold text-green-800 mb-2">申告が必要な場合</p>
                <ul className="list-disc list-inside text-sm text-green-700 space-y-1">
                  <li>海外の証券会社で株式を売却した</li>
                  <li>国内証券会社の「一般口座」「特定口座（源泉徴収なし）」で売却した</li>
                  <li>給与所得者で、給与以外の所得が年間20万円を超える</li>
                  <li>譲渡損失を繰り越したい（損失の繰越控除）</li>
                </ul>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="font-semibold text-blue-800 mb-2">申告不要な場合</p>
                <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                  <li>国内証券会社の「特定口座（源泉徴収あり）」のみを利用</li>
                  <li>年間の譲渡所得が20万円以下（給与所得者の場合）</li>
                  <li>NISA口座での取引（非課税制度）</li>
                </ul>
              </div>
            </div>
          </section>

          {/* セクション3 */}
          <section id="calculation" className="bg-white rounded-2xl p-8 shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>🧮</span> 3. 譲渡損益の計算方法
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">基本の計算式</h3>
                <div className="bg-indigo-50 border-2 border-indigo-300 rounded-lg p-4">
                  <p className="text-center text-lg font-mono text-indigo-900">
                    譲渡損益 = 売却代金 - 取得費 - 手数料
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">移動平均法</h3>
                <p className="text-gray-700 mb-3">
                  同じ銘柄を複数回購入した場合、<strong className="text-indigo-600">移動平均法</strong>で
                  取得単価を計算します。
                </p>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="font-semibold text-gray-800 mb-2">計算例</p>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p>① 2024/01/10: 50株を@100ドルで購入 → 平均取得単価 100ドル</p>
                    <p>② 2024/03/15: 50株を@120ドルで購入 → 平均取得単価 110ドル</p>
                    <p>③ 2024/06/20: 75株を@150ドルで売却</p>
                    <p className="pt-2 border-t border-gray-300">
                      <strong>取得費：</strong> 75株 × 110ドル = 8,250ドル<br />
                      <strong>売却代金：</strong> 75株 × 150ドル = 11,250ドル<br />
                      <strong className="text-green-600">譲渡益：</strong> 11,250ドル - 8,250ドル = 3,000ドル
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">為替換算</h3>
                <p className="text-gray-700 mb-3">
                  外貨建ての取引は、円換算して申告します。
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="font-semibold text-green-800 mb-2">🛒 購入時（取得費）</p>
                    <p className="text-sm text-green-700">
                      <strong>TTS（対顧客電信売相場）</strong>を使用<br />
                      ※銀行が外貨を売る際のレート
                    </p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="font-semibold text-red-800 mb-2">💰 売却時（売却代金）</p>
                    <p className="text-sm text-red-700">
                      <strong>TTB（対顧客電信買相場）</strong>を使用<br />
                      ※銀行が外貨を買う際のレート
                    </p>
                  </div>
                </div>
                <div className="mt-3 bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded-r-lg">
                  <p className="text-sm text-yellow-800">
                    💡 このアプリは、取引日の為替レートを自動で適用し、正確に計算します。
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* セクション4 */}
          <section id="documents" className="bg-white rounded-2xl p-8 shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>📄</span> 4. 必要な書類
            </h2>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="font-semibold text-blue-800 mb-3">証券会社から入手する書類</p>
                <ul className="list-disc list-inside text-sm text-blue-700 space-y-2">
                  <li>
                    <strong>年間取引報告書（Trade Confirmation）</strong>
                    <p className="ml-6 text-xs">全ての売買履歴が記載された書類</p>
                  </li>
                  <li>
                    <strong>口座明細書（Account Statement）</strong>
                    <p className="ml-6 text-xs">年末時点の保有状況</p>
                  </li>
                  <li>
                    <strong>配当金の支払調書（1042-S等）</strong>
                    <p className="ml-6 text-xs">配当所得がある場合</p>
                  </li>
                </ul>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="font-semibold text-green-800 mb-3">申告に使用する書類</p>
                <ul className="list-disc list-inside text-sm text-green-700 space-y-2">
                  <li>
                    <strong>確定申告書 第一表・第二表</strong>
                  </li>
                  <li>
                    <strong>申告書第三表（分離課税用）</strong>
                    <p className="ml-6 text-xs">株式等の譲渡所得を記載</p>
                  </li>
                  <li>
                    <strong>株式等に係る譲渡所得等の金額の計算明細書</strong>
                    <p className="ml-6 text-xs">取引の詳細を記載</p>
                  </li>
                  <li>
                    <strong>このアプリで生成したPDF</strong>
                    <p className="ml-6 text-xs">計算根拠として保管・提出</p>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* セクション5 */}
          <section id="flow" className="bg-white rounded-2xl p-8 shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>📋</span> 5. 申告の流れ
            </h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 mb-1">取引履歴の収集</h3>
                  <p className="text-sm text-gray-600">
                    証券会社から年間取引報告書をダウンロード
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 mb-1">このアプリで計算</h3>
                  <p className="text-sm text-gray-600">
                    取引データを入力し、譲渡損益を自動計算してPDFをダウンロード
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 mb-1">申告書の作成</h3>
                  <p className="text-sm text-gray-600">
                    e-Taxまたは書面で確定申告書を作成
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                  4
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 mb-1">提出・納税</h3>
                  <p className="text-sm text-gray-600">
                    2月16日〜3月15日の期間に税務署へ提出
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-800">
                💡 <strong>専門家に依頼する場合</strong><br />
                このアプリで生成したPDFを税理士に渡せば、スムーズに申告を進められます。
              </p>
            </div>
          </section>

          {/* セクション6 */}
          <section id="faq" className="bg-white rounded-2xl p-8 shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>❓</span> 6. よくある質問
            </h2>
            <div className="space-y-4">
              <details className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <summary className="font-semibold text-gray-800 cursor-pointer">
                  Q1. 取引回数が多い場合はどうすればいいですか？
                </summary>
                <p className="mt-3 text-sm text-gray-700">
                  このアプリは最大50行まで入力可能です。それ以上の場合は、
                  銘柄ごとに分けて計算するか、専門家にご相談ください。
                </p>
              </details>

              <details className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <summary className="font-semibold text-gray-800 cursor-pointer">
                  Q2. 複数の銘柄がある場合は？
                </summary>
                <p className="mt-3 text-sm text-gray-700">
                  銘柄ごとに別々に計算してください。それぞれPDFを生成し、
                  確定申告時にまとめて提出します。
                </p>
              </details>

              <details className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <summary className="font-semibold text-gray-800 cursor-pointer">
                  Q3. 損失が出た場合も申告が必要ですか？
                </summary>
                <p className="mt-3 text-sm text-gray-700">
                  損失を翌年以降に繰り越したい場合は、申告が必要です。
                  繰越控除により、翌年以降の利益と相殺できます（最大3年間）。
                </p>
              </details>

              <details className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <summary className="font-semibold text-gray-800 cursor-pointer">
                  Q4. 配当金も申告が必要ですか？
                </summary>
                <p className="mt-3 text-sm text-gray-700">
                  外国株式の配当金は、源泉徴収されていても確定申告することで
                  外国税額控除を受けられる場合があります。詳しくは税理士にご相談ください。
                </p>
              </details>

              <details className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <summary className="font-semibold text-gray-800 cursor-pointer">
                  Q5. このアプリで計算した結果は正確ですか？
                </summary>
                <p className="mt-3 text-sm text-gray-700">
                  このアプリは移動平均法と為替レート（TTS/TTB）を使用し、
                  税法に準拠した計算を行います。ただし、複雑なケースや特殊な取引については、
                  税理士の確認をお勧めします。
                </p>
              </details>
            </div>
          </section>

          {/* CTA */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-2xl">
            <div className="text-center">
              <div className="text-5xl mb-4">🎓</div>
              <h2 className="text-2xl font-bold mb-3">
                確定申告のご相談は専門家へ
              </h2>
              <p className="text-white/90 mb-6">
                複雑な外国株式の税務処理は、榧野国際税務会計事務所にお任せください。<br />
                このアプリで生成したPDFをお持ちいただければ、スムーズに対応いたします。
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-white text-indigo-600 px-8 py-3 rounded-xl font-semibold shadow-lg hover:bg-gray-100 transition-all transform hover:scale-105">
                  無料相談を予約する
                </button>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/guide/how-to-use"
                    className="bg-indigo-800 hover:bg-indigo-900 text-white px-6 py-3 rounded-xl font-semibold transition-all"
                  >
                    使い方を見る
                  </Link>
                  <Link
                    href="/form"
                    className="bg-indigo-800 hover:bg-indigo-900 text-white px-6 py-3 rounded-xl font-semibold transition-all"
                  >
                    今すぐ計算を始める →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
