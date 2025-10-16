"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "@/lib/firebase/config";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Firebase設定が有効な場合のみ認証状態を監視
    if (!auth) {
      setLoading(false);
      return;
    }

    // 認証状態の監視
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("🔐 認証状態変更: ログイン中", user.email);
      } else {
        console.log("🔓 認証状態変更: ログアウト");
      }
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Googleログイン（ポップアップ方式）
  const signInWithGoogle = async () => {
    if (!auth) {
      throw new Error("Firebase認証が設定されていません。環境変数を確認してください。");
    }

    try {
      const provider = new GoogleAuthProvider();

      // 毎回アカウント選択画面を表示する設定
      provider.setCustomParameters({
        prompt: 'select_account' // Googleアカウント選択画面を強制表示
      });

      // ポップアップを使用してGoogle認証
      const result = await signInWithPopup(auth, provider);
      console.log("🎉 Google認証成功:", result.user.email);
      return result;
    } catch (error: any) {
      console.error("❌ Google認証エラー:", error);

      // ポップアップがブロックされた場合のエラーメッセージ
      if (error.code === 'auth/popup-blocked') {
        throw new Error('ポップアップがブロックされました。ブラウザのポップアップブロッカーを無効にしてください。');
      }

      throw error;
    }
  };

  // ログアウト
  const logout = async () => {
    if (!auth) {
      throw new Error("Firebase認証が設定されていません。");
    }

    try {
      await signOut(auth);
    } catch (error) {
      console.error("ログアウトエラー:", error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signInWithGoogle,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// カスタムフック
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
