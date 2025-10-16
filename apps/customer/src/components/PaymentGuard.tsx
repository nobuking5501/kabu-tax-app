"use client";

import { usePaymentAuth } from "@/hooks/usePaymentAuth";
import { ReactNode } from "react";

interface PaymentGuardProps {
  children: ReactNode;
}

export default function PaymentGuard({ children }: PaymentGuardProps) {
  const { isAuthorized, isLoading } = usePaymentAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">認証状態を確認中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // リダイレクト中
  }

  return <>{children}</>;
}
