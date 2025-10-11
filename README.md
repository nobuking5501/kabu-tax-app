# 📊 Kabu Tax App - 株式譲渡益計算アプリ

外国株式の譲渡益を移動平均法で計算し、PDF レポートを生成するアプリケーションです。

## 🏗️ プロジェクト構成（モノレポ）

このプロジェクトは Turborepo を使用したモノレポ構成です：

```
kabu-tax-app/
├── apps/
│   ├── customer/          # お客様向けアプリ (port 3001)
│   │   ├── src/
│   │   │   ├── app/       # Next.js App Router
│   │   │   └── lib/       # ビジネスロジック（PDF生成、計算エンジンなど）
│   │   ├── public/        # 静的ファイル（FXデータ、フォントなど）
│   │   └── package.json
│   │
│   └── admin/             # 管理画面 (port 3003)
│       ├── src/
│       │   └── app/       # ダッシュボード、顧客リスト
│       └── package.json
│
├── packages/
│   └── database/          # 共通データベースパッケージ
│       ├── src/
│       │   ├── client.ts  # Firebase接続
│       │   ├── queries.ts # クエリ関数
│       │   └── types.ts   # 型定義
│       └── sample_data.ts # サンプルデータ挿入スクリプト
│
├── package.json           # ルート（Turborepo設定）
├── turbo.json             # Turborepo設定
├── firestore.rules        # Firestoreセキュリティルール
└── firestore.indexes.json # Firestoreインデックス定義
```

## 🚀 クイックスタート

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Firebase プロジェクトのセットアップ

詳しくは [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) を参照してください。

1. Firebase Console でプロジェクトを作成
2. Firestore データベースを有効化
3. サービスアカウントキーを取得

### 3. 環境変数の設定

各アプリに `.env.local` ファイルを作成：

**apps/customer/.env.local**
```bash
SEND_MAIL=false
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
# 他の環境変数は .env.local.example を参照
```

**apps/admin/.env.local**
```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
```

### 4. 開発サーバーの起動

#### 両方同時に起動（推奨）
```bash
npm run dev
```

#### 個別に起動
```bash
# お客様向けアプリのみ
npm run dev:customer

# 管理画面のみ
npm run dev:admin
```

### 5. アプリにアクセス

- **お客様向けアプリ**: http://localhost:3001
- **管理画面**: http://localhost:3003

## 📱 アプリケーション機能

### お客様向けアプリ (apps/customer)

#### 4つのUIバリエーション

1. **デフォルト** (`/form`) - シンプル・実用的
2. **ウィザード** (`/form1`) - 3ステップのガイド付き
3. **モダン** (`/form2`) - カード型デザイン
4. **プレミアム** (`/form3`) - ダークモード・統計表示

詳細は [UI_VARIANTS.md](./UI_VARIANTS.md) を参照してください。

#### 主な機能

- 📝 取引データ入力（購入・売却）
- 🧮 移動平均法による譲渡益計算
- 💱 TTS/TTB 為替レート自動適用
- 📄 PDF レポート生成（日本語対応）
- 📧 メール送信機能（オプション）
- 💾 Firestoreへの自動保存

#### ガイドページ

- `/guide` - 確定申告ガイド
- `/guide/how-to-use` - アプリの使い方

### 管理画面 (apps/admin)

#### 主な機能

- 📊 **ダッシュボード** (`/`)
  - 総顧客数
  - PDF生成数
  - 総リクエスト数
  - 人気銘柄ランキング

- 👥 **顧客リスト** (`/customers`)
  - 全顧客の一覧表示
  - メールアドレスで検索
  - 並び替え（最終利用日時、利用回数など）
  - 顧客詳細ページへのリンク

- 👤 **顧客詳細** (`/customers/[email]`)
  - 顧客の統計情報
  - 過去の全利用履歴
  - PDF生成履歴

## 🗄️ データベース

### Firestore Collections

```
/submissions/{submissionId: string}
  - email: string
  - symbol: string
  - currency: string
  - years: number[]
  - transaction_count: number
  - pdf_generated: boolean
  - created_at: Timestamp
  - updated_at: Timestamp

/submissions/{submissionId}/transactions/{transactionId: string}
  - date: string
  - activity: "Purchased" | "Sold"
  - quantity: number
  - price: number
  - commission: number | null
  - created_at: Timestamp
```

### データベース操作

共通パッケージ `@kabu-tax/database` を使用：

```typescript
import {
  createSubmission,
  getAllCustomers,
  getStats
} from "@kabu-tax/database";

// 統計取得
const stats = await getStats();

// 顧客リスト取得
const customers = await getAllCustomers();
```

## 🛠️ 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **PDF生成**: @react-pdf/renderer
- **データベース**: Firebase Firestore
- **認証**: Firebase Admin SDK
- **モノレポ**: Turborepo
- **Excel処理**: ExcelJS
- **メール送信**: Resend
- **テスト**: Vitest

## 📦 ビルド・デプロイ

### ビルド

```bash
# 全アプリをビルド
npm run build

# 個別ビルド
npm run build --workspace=apps/customer
npm run build --workspace=apps/admin
```

### Vercelへのデプロイ

#### 環境変数の設定

Vercel CLIで環境変数を設定：

```bash
# Firebase環境変数を追加
echo "your-project-id" | vercel env add FIREBASE_PROJECT_ID production
echo "firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com" | vercel env add FIREBASE_CLIENT_EMAIL production
printf '%s' '-----BEGIN PRIVATE KEY-----
...
-----END PRIVATE KEY-----' | vercel env add FIREBASE_PRIVATE_KEY production
```

#### デプロイ

```bash
# 本番環境にデプロイ
vercel --prod
```

詳細は [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) を参照してください。

## 🧪 テスト

```bash
# テスト実行
npm run test

# テストUI
npm run test:ui --workspace=apps/customer
```

## 📚 ドキュメント

- [UI_VARIANTS.md](./UI_VARIANTS.md) - UIバリエーションの詳細
- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) - Firebaseセットアップガイド
- [TESTING.md](./TESTING.md) - テスト実行方法

## 🤝 開発フロー

1. 機能開発
2. 両方のアプリで動作確認
3. テスト実行
4. ビルド確認
5. デプロイ

## 📄 ライセンス

Private - 〇〇国際税務会計事務所

---

**開発者向けメモ**: このアプリは税理士クライアント様向けのデモ版です。UIの最終決定後、本格的な実装（Stripe決済、認証など）を追加予定。
