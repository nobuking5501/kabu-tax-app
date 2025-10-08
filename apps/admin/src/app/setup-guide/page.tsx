import Link from "next/link";

export default function SetupGuidePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link
            href="/"
            className="text-indigo-100 hover:text-white text-sm mb-2 inline-block"
          >
            ← ダッシュボードに戻る
          </Link>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <span>📖</span>
            データベースセットアップガイド
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="prose max-w-none">
          <div className="bg-white rounded-xl shadow-md p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              📋 セットアップ手順
            </h2>
            <p className="text-gray-700 mb-4">
              管理画面を使用するには、Vercel Postgres データベースのセットアップが必要です。
            </p>

            <div className="space-y-6">
              {/* Step 1 */}
              <div className="border-l-4 border-indigo-500 pl-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  ステップ1: Vercel Postgres データベースを作成
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>Vercel ダッシュボードにログイン</li>
                  <li>プロジェクトを選択</li>
                  <li>「Storage」タブ → 「Create Database」</li>
                  <li>「Postgres」を選択</li>
                  <li>データベース名とリージョンを設定</li>
                </ol>
              </div>

              {/* Step 2 */}
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  ステップ2: 環境変数を取得
                </h3>
                <p className="text-gray-700">
                  データベース作成後、「.env.local」タブから環境変数をコピーします：
                </p>
                <div className="bg-gray-100 rounded p-4 mt-2 font-mono text-sm">
                  <div>POSTGRES_URL=&quot;postgres://...&quot;</div>
                  <div>POSTGRES_PRISMA_URL=&quot;postgres://...&quot;</div>
                  <div>POSTGRES_URL_NON_POOLING=&quot;postgres://...&quot;</div>
                  <div>...</div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  ステップ3: .env.local ファイルを作成
                </h3>
                <p className="text-gray-700">
                  以下の2つのディレクトリに <code>.env.local</code> ファイルを作成し、
                  環境変数を貼り付けます：
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                  <li>apps/customer/.env.local</li>
                  <li>apps/admin/.env.local</li>
                </ul>
              </div>

              {/* Step 4 */}
              <div className="border-l-4 border-yellow-500 pl-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  ステップ4: テーブルを作成
                </h3>
                <p className="text-gray-700 mb-2">
                  Vercel ダッシュボードの「Data」タブで以下の SQL を実行：
                </p>
                <div className="bg-gray-900 text-green-400 rounded p-4 mt-2 font-mono text-xs overflow-x-auto">
                  <pre>{`-- Submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  symbol VARCHAR(50) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  years INTEGER[] NOT NULL,
  transaction_count INTEGER NOT NULL,
  pdf_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  submission_id INTEGER REFERENCES submissions(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  activity VARCHAR(20) NOT NULL,
  quantity NUMERIC(20, 8) NOT NULL,
  price NUMERIC(20, 8) NOT NULL,
  commission NUMERIC(20, 8),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`}</pre>
                </div>
              </div>

              {/* Step 5 */}
              <div className="border-l-4 border-red-500 pl-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  ステップ5: 開発サーバーを再起動
                </h3>
                <p className="text-gray-700">
                  PowerShell で以下を実行：
                </p>
                <div className="bg-gray-100 rounded p-4 mt-2 font-mono text-sm">
                  <div>cd C:\Users\user\Desktop\kabu-tax-app</div>
                  <div>npm run dev</div>
                </div>
              </div>
            </div>
          </div>

          {/* 詳細ガイドへのリンク */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-blue-900 mb-2">
              📚 詳細なセットアップガイド
            </h3>
            <p className="text-blue-800 mb-4">
              より詳しい手順は、プロジェクトルートの <code>DATABASE_SETUP.md</code>{" "}
              ファイルを参照してください。
            </p>
            <Link
              href="/"
              className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              ダッシュボードに戻る →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
