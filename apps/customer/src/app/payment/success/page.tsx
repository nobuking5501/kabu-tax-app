"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { savePaymentData } from "@/lib/firebase/firestore";

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [countdown, setCountdown] = useState(5);
  const { user } = useAuth();

  useEffect(() => {
    // 決済完了状態をFirestoreに保存
    const savePayment = async () => {
      if (sessionId && user) {
        // Firestoreに保存（サーバーサイド）
        const success = await savePaymentData(user.uid, sessionId, 3);

        if (success) {
          console.log("決済情報をFirestoreに保存しました");
        } else {
          console.error("Firestoreへの保存に失敗しました");
        }

        // LocalStorageにもキャッシュとして保存（パフォーマンス向上のため）
        const userPaymentKey = `payment_${user.uid}`;
        localStorage.setItem(userPaymentKey, "true");
        localStorage.setItem(`stripe_session_id_${user.uid}`, sessionId);
        localStorage.setItem(`payment_date_${user.uid}`, new Date().toISOString());
        localStorage.setItem(`retrievalCount_${user.uid}`, "0");
        localStorage.setItem(`availableRetrievals_${user.uid}`, "3");
      }
    };

    savePayment();

    // カウントダウンタイマー
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/form1");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router, sessionId, user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* 成功アイコン */}
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          {/* タイトル */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            決済が完了しました
          </h1>
          <p className="text-gray-600 mb-8">
            kabu-tax-app プレミアムプランへようこそ
          </p>

          {/* セッションID（デバッグ用） */}
          {sessionId && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-xs text-gray-500 mb-1">セッションID:</p>
              <p className="text-xs text-gray-700 font-mono break-all">
                {sessionId}
              </p>
            </div>
          )}

          {/* 機能案内 */}
          <div className="bg-emerald-50 rounded-lg p-6 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-3">
              ご利用いただける機能:
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>移動平均法による自動計算</span>
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>為替レート自動換算</span>
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>PDF形式でのレポート出力</span>
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>メールでの自動送信</span>
              </li>
            </ul>
          </div>

          {/* カウントダウン */}
          <div className="text-gray-600 mb-6">
            {countdown > 0 ? (
              <p>
                {countdown}秒後にフォーム画面へ自動的に移動します...
              </p>
            ) : (
              <p>画面を移動しています...</p>
            )}
          </div>

          {/* 手動移動ボタン */}
          <button
            onClick={() => router.push("/form1")}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-lg shadow-sm transition-colors"
          >
            今すぐフォームへ進む
          </button>

          {/* サポート情報 */}
          <p className="mt-6 text-xs text-gray-500">
            ご不明な点がございましたら、サポートまでお問い合わせください
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600 mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
