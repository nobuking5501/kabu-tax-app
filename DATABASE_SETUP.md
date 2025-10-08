# 🗄️ データベースセットアップガイド

このガイドでは、Vercel Postgresデータベースのセットアップ手順を説明します。

## 📋 前提条件

- Vercelアカウント（https://vercel.com）
- プロジェクトがVercelにデプロイされていること（またはこれから行う）

---

## ステップ1: Vercel Postgresデータベースを作成

### 1-1. Vercelダッシュボードにログイン

https://vercel.com/dashboard にアクセスしてログインします。

### 1-2. Storageタブを開く

1. プロジェクトを選択（kabu-tax-appなど）
2. 上部メニューの「**Storage**」タブをクリック
3. 「**Create Database**」ボタンをクリック

### 1-3. Postgresを選択

1. データベースタイプで「**Postgres**」を選択
2. データベース名を入力（例: `kabu-tax-db`）
3. リージョンを選択（例: `us-east-1`）
4. 「**Create**」ボタンをクリック

⏳ データベースの作成には1〜2分かかります。

---

## ステップ2: 環境変数を取得

### 2-1. .env.local タブを開く

データベース作成後、以下のタブが表示されます：
- Quickstart
- **.env.local** ← これを選択
- Data
- Settings

### 2-2. 環境変数をコピー

「**.env.local**」タブに表示される環境変数をすべてコピーします：

```bash
POSTGRES_URL="postgres://default:..."
POSTGRES_PRISMA_URL="postgres://default:..."
POSTGRES_URL_NON_POOLING="postgres://default:..."
POSTGRES_USER="default"
POSTGRES_HOST="..."
POSTGRES_PASSWORD="..."
POSTGRES_DATABASE="verceldb"
```

---

## ステップ3: ローカル環境に設定

### 3-1. .env.local ファイルを作成

以下の2つのディレクトリに `.env.local` ファイルを作成します：

**apps/customer/.env.local**
```bash
# メール送信モード（"true"でメール送信、未設定またはfalseでPDFダウンロード）
SEND_MAIL=false

# Vercel Postgres データベース接続
POSTGRES_URL="postgres://default:..."
POSTGRES_PRISMA_URL="postgres://default:..."
POSTGRES_URL_NON_POOLING="postgres://default:..."
POSTGRES_USER="default"
POSTGRES_HOST="..."
POSTGRES_PASSWORD="..."
POSTGRES_DATABASE="verceldb"
```

**apps/admin/.env.local**
```bash
# Vercel Postgres データベース接続
POSTGRES_URL="postgres://default:..."
POSTGRES_PRISMA_URL="postgres://default:..."
POSTGRES_URL_NON_POOLING="postgres://default:..."
POSTGRES_USER="default"
POSTGRES_HOST="..."
POSTGRES_PASSWORD="..."
POSTGRES_DATABASE="verceldb"
```

---

## ステップ4: テーブルを作成

### 4-1. Vercelダッシュボードでクエリを実行

1. Vercelダッシュボードの「**Storage**」→ 作成したデータベースを選択
2. 「**Data**」タブを開く
3. 「**Query**」ボタンをクリック

### 4-2. スキーマを実行

以下のSQLを実行します（`packages/database/schema.sql` の内容）：

```sql
-- Submissions table
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
  activity VARCHAR(20) NOT NULL CHECK (activity IN ('Purchased', 'Sold')),
  quantity NUMERIC(20, 8) NOT NULL,
  price NUMERIC(20, 8) NOT NULL,
  commission NUMERIC(20, 8),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_submissions_email ON submissions(email);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_submission_id ON transactions(submission_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
```

### 4-3. 実行確認

「**Execute**」ボタンをクリックしてSQLを実行します。

成功すると、以下のテーブルが作成されます：
- ✅ `submissions`
- ✅ `transactions`

---

## ステップ5: 接続テスト

### 5-1. 開発サーバーを再起動

PowerShellで以下を実行：

```powershell
# 既存のサーバーを停止 (Ctrl+C)

# 再起動
cd C:\Users\user\Desktop\kabu-tax-app
npm run dev
```

### 5-2. 動作確認

1. **お客様向けアプリ**: http://localhost:3001
   - フォームからPDF生成を実行
   - データがDBに保存されるか確認

2. **管理画面**: http://localhost:3002
   - ダッシュボードに統計が表示されるか確認
   - 顧客リストが表示されるか確認

---

## ✅ セットアップ完了

データベースが正常に動作していれば、以下が可能になります：
- 📊 お客様のPDF生成履歴を管理画面で確認
- 📈 統計情報の可視化
- 🔍 顧客検索・フィルター

---

## 🐛 トラブルシューティング

### エラー: "Connection refused"
- `.env.local` ファイルが正しく配置されているか確認
- 環境変数がVercelダッシュボードからコピーした値と一致しているか確認
- 開発サーバーを再起動

### エラー: "relation does not exist"
- `schema.sql` が正しく実行されたか確認
- Vercelダッシュボードの「Data」タブでテーブルの存在を確認

### その他の問題
- Vercelダッシュボードの「Settings」→「Environment Variables」で環境変数が設定されているか確認
- プロジェクトを再デプロイしてみる
