# Firebase Google認証 セットアップガイド

## 概要

このアプリケーションでは、トップページ（ログインページ）でFirebase Google認証を使用しています。

## 前提条件

- Firebaseプロジェクトが作成済みであること
- Firebaseコンソールへのアクセス権があること

## セットアップ手順

### 1. Firebaseコンソールでの設定

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. プロジェクトを選択（または新規作成）
3. 左サイドバーから「Authentication」を選択
4. 「Sign-in method」タブを選択
5. 「Google」を有効化
   - プロジェクトのサポートメールを設定
   - 保存

### 2. Web アプリの設定を取得

1. プロジェクト設定（歯車アイコン）を開く
2. 「全般」タブを選択
3. 「マイアプリ」セクションで「ウェブアプリを追加」（または既存のウェブアプリを選択）
4. 以下の設定情報をコピー：
   - API Key
   - Auth Domain
   - Project ID
   - Storage Bucket
   - Messaging Sender ID
   - App ID

### 3. 環境変数の設定

`.env.local.example` ファイルを `.env.local` としてコピーし、以下の変数を設定してください：

```bash
# Firebase Client SDK設定（クライアントサイド用）
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### 4. OAuth認証情報の設定（本番環境用）

本番環境にデプロイする場合、以下の設定も必要です：

1. Firebaseコンソール > Authentication > Settings > Authorized domains
2. 本番環境のドメインを追加（例：`yourdomain.com`）

## アーキテクチャ

### 実装ファイル

- `apps/customer/src/lib/firebase/config.ts` - Firebase初期化設定
- `apps/customer/src/contexts/AuthContext.tsx` - 認証状態管理（Context API）
- `apps/customer/src/app/layout.tsx` - AuthProviderをアプリ全体に適用
- `apps/customer/src/app/page.tsx` - Google認証ボタンを配置

### 認証フロー

1. ユーザーがトップページ（`/`）にアクセス
2. 「Googleでログイン」ボタンをクリック
3. Firebase Google認証ポップアップが表示
4. 認証成功後、`/payment` ページにリダイレクト
5. 既存の決済システム（LocalStorage ベース）と併用

### 重要な設計決定事項

- **既存の決済システムとの分離**:
  - Google認証はトップページのログインのみに使用
  - フォームページへのアクセス制御は従来通り `PaymentGuard` と `usePaymentAuth` を使用
  - LocalStorageベースの決済状態管理は変更なし

- **ビルド時の環境変数チェック**:
  - Firebase環境変数が未設定でもビルドエラーにならないよう対応
  - クライアントサイドでのみFirebaseを初期化

## トラブルシューティング

### ビルドエラー: "Firebase: Error (auth/invalid-api-key)"

環境変数が正しく設定されているか確認してください：
```bash
# 環境変数の確認
npm run build
```

### ログインできない

1. Firebaseコンソールで「Authentication」が有効になっているか確認
2. Google認証が有効化されているか確認
3. ブラウザのコンソールログを確認してエラーメッセージを確認

### リダイレクトされない

1. `apps/customer/src/app/page.tsx` の `router.push("/payment")` が正しく実行されているか確認
2. ネットワークタブでリクエストを確認

## セキュリティに関する注意事項

- **API Keyの管理**:
  - `NEXT_PUBLIC_*` で始まる環境変数はクライアントサイドに露出します
  - Firebase API Keyは公開されても問題ありませんが、Firebaseセキュリティルールで適切に保護してください

- **Firebaseセキュリティルール**:
  ```javascript
  // 例: Firestore セキュリティルール
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /{document=**} {
        allow read, write: if request.auth != null;
      }
    }
  }
  ```

## 参考リンク

- [Firebase Authentication ドキュメント](https://firebase.google.com/docs/auth)
- [Firebase Google Sign-In](https://firebase.google.com/docs/auth/web/google-signin)
- [Next.js 環境変数](https://nextjs.org/docs/basic-features/environment-variables)
