# Firebase移行ガイド

このドキュメントは、SupabaseからFirebaseへのバックエンド移行の手順を説明します。

## 移行の概要

### 変更点
- **データベース**: Supabase (PostgreSQL) → Firestore (NoSQL)
- **認証**: Supabase Auth → Firebase Auth (将来実装予定)
- **SDK**: @supabase/supabase-js → firebase-admin

### データ構造の変更

#### Supabase (PostgreSQL)
```sql
submissions (id: number, email, symbol, ...)
transactions (id: number, submission_id: number, ...)
```

#### Firestore (NoSQL)
```
/submissions/{submissionId: string}
  - email, symbol, currency, years, ...

/submissions/{submissionId}/transactions/{transactionId: string}
  - date, activity, quantity, price, ...
```

注意: IDが **数値 → 文字列** に変更されました。

---

## 移行手順

### 1. Firebaseプロジェクトのセットアップ

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. 新規プロジェクトを作成
3. Firestoreデータベースを有効化
   - モード: 本番環境モード（セキュリティルールは後で設定）
   - ロケーション: asia-northeast1 (東京) を推奨

### 2. サービスアカウントキーの取得

1. Firebase Console > プロジェクト設定 > サービスアカウント
2. 「新しい秘密鍵の生成」をクリック
3. JSONファイルをダウンロード（安全な場所に保管）

JSONファイルの内容例:
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com"
}
```

### 3. 環境変数の設定

#### apps/admin/.env.local
```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
```

#### apps/customer/.env.local
```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com

# その他の既存設定（メール、スプレッドシート等）も維持
SEND_MAIL=false
RESEND_API_KEY=...
```

注意:
- `FIREBASE_PRIVATE_KEY` は改行を `\n` でエスケープしてください
- 本番環境では環境変数をVercel等のプラットフォームに設定してください

### 4. Firestoreセキュリティルールの設定

Firebase Console > Firestore Database > ルール

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // submissionsコレクションへのアクセス制御
    match /submissions/{submissionId} {
      // 認証されたユーザーのみ読み取り可能（将来Firebase Auth導入後）
      allow read: if request.auth != null;
      // サーバー側からの書き込みのみ許可
      allow write: if false;

      // transactionsサブコレクション
      match /transactions/{transactionId} {
        allow read: if request.auth != null;
        allow write: if false;
      }
    }
  }
}
```

注意: 現在はサーバー側（Admin SDK）からのみアクセスするため、クライアントからの書き込みは禁止しています。

### 5. Firestoreインデックスの作成（必要に応じて）

以下のクエリで複合インデックスが必要な場合があります:

1. `submissions` コレクション
   - フィールド: `email` (昇順), `created_at` (降順)
   - フィールド: `created_at` (降順)

Firebase Consoleで自動的にインデックス作成のリンクが表示されるので、エラーが出た際にクリックして作成してください。

### 6. 依存関係のインストール

```bash
# ルートディレクトリで
npm install

# または packages/database で
cd packages/database
npm install
```

### 7. ビルドとテスト

```bash
# ビルドテスト
npm run build

# 開発サーバー起動
npm run dev:customer  # 顧客用アプリ
npm run dev:admin     # 管理用アプリ
```

### 8. データ移行（必要な場合）

既存のSupabaseデータをFirestoreに移行する必要がある場合:

1. Supabaseからデータをエクスポート（SQL/CSV）
2. 移行スクリプトを作成（参考コード後述）
3. Firestoreにインポート

#### 移行スクリプト例

```typescript
// scripts/migrate-to-firestore.ts
import { getFirestoreClient } from "@kabu-tax/database";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

const db = getFirestoreClient();

async function migrateSubmissions() {
  // Supabaseからデータ取得
  const { data: submissions } = await supabase
    .from("submissions")
    .select("*");

  for (const sub of submissions || []) {
    // Firestoreに書き込み
    const docRef = await db.collection("submissions").add({
      email: sub.email,
      symbol: sub.symbol,
      currency: sub.currency,
      years: sub.years,
      transaction_count: sub.transaction_count,
      pdf_generated: sub.pdf_generated,
      created_at: sub.created_at,
      updated_at: sub.updated_at,
    });

    // Transactionsも移行
    const { data: transactions } = await supabase
      .from("transactions")
      .select("*")
      .eq("submission_id", sub.id);

    for (const tx of transactions || []) {
      await docRef.collection("transactions").add({
        date: tx.date,
        activity: tx.activity,
        quantity: tx.quantity,
        price: tx.price,
        commission: tx.commission,
        created_at: tx.created_at,
      });
    }
  }
}

migrateSubmissions().then(() => console.log("Migration complete!"));
```

---

## コード変更のまとめ

### packages/database/

| ファイル | 変更内容 |
|---------|---------|
| `package.json` | `@supabase/supabase-js` → `firebase-admin` |
| `src/client.ts` | Firebaseクライアント初期化 |
| `src/queries.ts` | Firestoreクエリに書き換え |
| `src/types.ts` | `id: number` → `id: string` |

### 環境変数

| 削除 | 追加 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `FIREBASE_PROJECT_ID` |
| `SUPABASE_SERVICE_ROLE_KEY` | `FIREBASE_PRIVATE_KEY` |
| `DATABASE_URL` (Postgres) | `FIREBASE_CLIENT_EMAIL` |

---

## トラブルシューティング

### エラー: "Firebase環境変数が設定されていません"

環境変数が正しく設定されているか確認してください。

```bash
# 環境変数の確認
echo $FIREBASE_PROJECT_ID
```

### エラー: "複合インデックスが必要です"

エラーメッセージに含まれるリンクをクリックして、Firebase Consoleでインデックスを作成してください。

### ビルドエラー

```bash
# node_modulesをクリーン
rm -rf node_modules packages/*/node_modules apps/*/node_modules
npm install
```

---

## 注意事項

1. **ID型の変更**: `number` → `string` に変更されているため、既存のコードでIDを数値として扱っている箇所がある場合は修正が必要です。

2. **トランザクション**: Firestoreのトランザクション機能は、Supabaseとは異なります。複数ドキュメントの一括更新が必要な場合は、`batch write` または `transaction` を使用してください。

3. **コスト**: Firestoreは読み取り/書き込み回数に応じて課金されます。無料枠は以下の通り:
   - ドキュメント読み取り: 50,000/日
   - ドキュメント書き込み: 20,000/日
   - ストレージ: 1GB

4. **バックアップ**: Firestoreの自動バックアップはFirebase Blazeプラン（従量課金）でのみ利用可能です。

---

## 次のステップ

1. Firebase Authenticationの導入（現在は未実装）
2. Firebase Cloud Functionsの検討（サーバーレス関数）
3. Firebase Hostingでの静的アセット配信

---

## 参考リンク

- [Firebase Console](https://console.firebase.google.com/)
- [Firestore ドキュメント](https://firebase.google.com/docs/firestore)
- [Firebase Admin SDK (Node.js)](https://firebase.google.com/docs/admin/setup)
- [Firestore セキュリティルール](https://firebase.google.com/docs/firestore/security/get-started)
