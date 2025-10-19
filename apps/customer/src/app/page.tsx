"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { getUserPaymentData } from "@/lib/firebase/firestore";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasCheckedRef = useRef(false); // useRefで管理（再レンダリングを引き起こさない）

  // ユーザーがログイン済みの場合、決済状態に応じてリダイレクト
  useEffect(() => {
    // 既にチェック済みの場合は何もしない（無限ループ防止）
    if (hasCheckedRef.current) {
      console.log("⏭️ 既にチェック済み。処理をスキップ");
      return;
    }

    const checkPaymentStatus = async () => {
      if (user && !authLoading) {
        console.log("✅ ログイン済みユーザー検出:", user.email);
        hasCheckedRef.current = true; // 最初にフラグを立てる

        try {
          // Firestoreから決済状態を取得
          const paymentData = await getUserPaymentData(user.uid);
          console.log("📊 決済データ:", paymentData);

          if (paymentData) {
            // LocalStorageにキャッシュとして保存
            localStorage.setItem(`payment_${user.uid}`, paymentData.paymentCompleted ? "true" : "false");
            localStorage.setItem(`retrievalCount_${user.uid}`, paymentData.retrievalCount.toString());
            localStorage.setItem(`availableRetrievals_${user.uid}`, paymentData.availableRetrievals.toString());

            // 決済済みで取得回数が残っている場合はフォームページへ
            if (paymentData.paymentCompleted && paymentData.retrievalCount < paymentData.availableRetrievals) {
              console.log("➡️ /form1 にリダイレクト");
              router.push("/form1");
            } else {
              // 未決済または取得回数を使い切った場合は決済ページへ
              console.log("➡️ /payment にリダイレクト");
              router.push("/payment");
            }
          } else {
            // Firestoreにデータがない場合は決済ページへ
            console.log("➡️ /payment にリダイレクト（データなし）");
            router.push("/payment");
          }
        } catch (error) {
          console.error("❌ 決済状態チェックエラー:", error);
          // エラーが発生しても決済ページへ
          router.push("/payment");
        }
      }
    };

    checkPaymentStatus();
  }, [user, authLoading, router]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      await signInWithGoogle();
      // 認証成功後、useEffectでリダイレクトされる
    } catch (error: any) {
      console.error("ログインエラー:", error);

      // Firebase未設定エラーの場合
      if (error?.message?.includes("Firebase認証が設定されていません")) {
        setError("Firebase認証が設定されていません。FIREBASE_AUTH_SETUP.md を参照して環境変数を設定してください。");
      } else {
        setError("ログインに失敗しました。もう一度お試しください。");
      }
      setLoading(false);
    }
  };

  // 認証状態チェック中
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* ロゴ・タイトル */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo-200.png"
              alt="株式譲渡益自動計算ツール ロゴ"
              width={200}
              height={200}
              priority
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">株式譲渡益自動計算ツール</h1>
        </div>

        {/* ログインカード */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-semibold text-center mb-6 text-gray-800">
            ログイン
          </h2>

          <p className="text-sm text-gray-600 text-center mb-8">
            サービスを利用するにはログインしてください
          </p>

          {/* エラーメッセージ */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm text-red-700 mb-2">{error}</p>
                  {error.includes("Firebase認証が設定されていません") && (
                    <div className="text-xs text-red-600 bg-red-100 rounded p-2">
                      <p className="font-medium mb-1">セットアップ手順:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>プロジェクトルートの <code className="bg-red-200 px-1 rounded">FIREBASE_AUTH_SETUP.md</code> を確認</li>
                        <li>Firebaseプロジェクトを作成してGoogle認証を有効化</li>
                        <li><code className="bg-red-200 px-1 rounded">.env.local</code> に環境変数を設定</li>
                        <li>開発サーバーを再起動</li>
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Google ログインボタン */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 hover:border-gray-400 hover:shadow-md transition-all duration-200 rounded-lg px-6 py-3 font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <svg
                className="animate-spin h-5 w-5 text-gray-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Googleでログイン</span>
              </>
            )}
          </button>

          <div className="mt-6 text-center text-xs text-gray-500">
            ログインすることで、利用規約とプライバシーポリシーに同意したものとみなされます
          </div>
        </div>

        {/* フッター */}
        <div className="mt-8 text-center text-sm text-gray-600">
          © 2025 榧野国際税務会計事務所
        </div>
      </div>
    </div>
  );
}
