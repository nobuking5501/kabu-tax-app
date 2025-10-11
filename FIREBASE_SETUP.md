# Firebase セットアップガイド

このプロジェクトはFirebaseをバックエンドとして使用しています。

## 必要な準備

### 1. Firebaseプロジェクトの作成

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. 新規プロジェクトを作成
3. Firestoreデータベースを有効化
   - モード: 本番環境モード
   - ロケーション: asia-northeast1 (東京) を推奨

### 2. サービスアカウントキーの取得

1. Firebase Console > プロジェクト設定 > サービスアカウント
2. 「新しい秘密鍵の生成」をクリック
3. JSONファイルをダウンロード（安全な場所に保管）

ダウンロードされるJSON例:
```json
{
  "project_id": "your-project-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com"
}
```

### 3. 環境変数の設定

#### ローカル開発環境

`apps/customer/.env.local` と `apps/admin/.env.local` を作成：

```bash
# Firebase設定
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com

# その他の設定
SEND_MAIL=false
RESEND_API_KEY=your_resend_api_key_here
RESEND_FROM=noreply@yourdomain.com
```

**注意**: `FIREBASE_PRIVATE_KEY` は改行を `\n` でエスケープしてください。

#### 本番環境（Vercel等）

Vercel CLIで環境変数を設定：

```bash
echo "your-project-id" | vercel env add FIREBASE_PROJECT_ID production
echo "firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com" | vercel env add FIREBASE_CLIENT_EMAIL production
printf '%s' '-----BEGIN PRIVATE KEY-----
...your private key...
-----END PRIVATE KEY-----' | vercel env add FIREBASE_PRIVATE_KEY production
```

### 4. Firestoreセキュリティルールの設定

Firebase Console > Firestore Database > ルール

プロジェクトルートの `firestore.rules` の内容を適用：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /submissions/{submissionId} {
      allow read: if request.auth != null;
      allow write: if false;

      match /transactions/{transactionId} {
        allow read: if request.auth != null;
        allow write: if false;
      }
    }
  }
}
```

「公開」をクリックして適用してください。

### 5. Firestoreインデックスの作成

Firebase Console > Firestore Database > インデックス

プロジェクトルートの `firestore.indexes.json` の内容を参考に、必要なインデックスを作成してください。

エラーが出た場合、Firebase Consoleが自動的にインデックス作成リンクを提供します。

---

## データ構造

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

---

## トラブルシューティング

### エラー: "Firebase環境変数が設定されていません"

環境変数が正しく設定されているか確認：

```bash
# ローカル環境
cat apps/customer/.env.local

# Vercel環境
vercel env ls
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

## 参考リンク

- [Firebase Console](https://console.firebase.google.com/)
- [Firestore ドキュメント](https://firebase.google.com/docs/firestore)
- [Firebase Admin SDK (Node.js)](https://firebase.google.com/docs/admin/setup)
- [Firestore セキュリティルール](https://firebase.google.com/docs/firestore/security/get-started)
