"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getUserPaymentData } from "@/lib/firebase/firestore";

export function usePaymentAuth() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 認証状態の読み込み中は待機
    if (authLoading) {
      return;
    }

    // 未ログインの場合はログインページへ
    if (!user) {
      router.push("/");
      return;
    }

    // Firestoreから決済状態と取得回数をチェック
    const checkAccessPermission = async () => {
      // Firestoreから最新の決済情報を取得
      const paymentData = await getUserPaymentData(user.uid);

      if (paymentData) {
        // LocalStorageにキャッシュとして保存（パフォーマンス向上のため）
        localStorage.setItem(`payment_${user.uid}`, paymentData.paymentCompleted ? "true" : "false");
        localStorage.setItem(`retrievalCount_${user.uid}`, paymentData.retrievalCount.toString());
        localStorage.setItem(`availableRetrievals_${user.uid}`, paymentData.availableRetrievals.toString());

        // 決済完了済みで取得可能回数が残っている場合のみアクセス許可
        if (paymentData.paymentCompleted && paymentData.retrievalCount < paymentData.availableRetrievals) {
          setIsAuthorized(true);
          setIsLoading(false);
        } else {
          // 未決済、または取得回数を使い切った場合は決済ページにリダイレクト
          router.push("/payment");
        }
      } else {
        // Firestoreにデータがない場合は決済ページへ
        router.push("/payment");
      }
    };

    checkAccessPermission();
  }, [router, user, authLoading]);

  return { isAuthorized, isLoading };
}
