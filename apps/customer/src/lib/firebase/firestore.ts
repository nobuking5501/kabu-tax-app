import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";
import app from "./config";

// Firestoreインスタンス
const db = app ? getFirestore(app) : null;

export interface UserPaymentData {
  paymentCompleted: boolean;
  stripeSessionId?: string;
  paymentDate?: Date;
  paymentCount: number;
  retrievalCount: number;
  availableRetrievals: number;
  lastUpdated?: Date;
}

/**
 * ユーザーの決済情報を取得
 */
export async function getUserPaymentData(uid: string): Promise<UserPaymentData | null> {
  if (!db) {
    console.error("Firestore is not initialized");
    return null;
  }

  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      return {
        paymentCompleted: data.paymentCompleted || false,
        stripeSessionId: data.stripeSessionId,
        paymentDate: data.paymentDate?.toDate(),
        paymentCount: data.paymentCount || 0,
        retrievalCount: data.retrievalCount || 0,
        availableRetrievals: data.availableRetrievals || 0,
        lastUpdated: data.lastUpdated?.toDate(),
      };
    }

    // ユーザーデータが存在しない場合は初期値を返す
    return {
      paymentCompleted: false,
      paymentCount: 0,
      retrievalCount: 0,
      availableRetrievals: 0,
    };
  } catch (error) {
    console.error("Error fetching user payment data:", error);
    return null;
  }
}

/**
 * 決済完了時にユーザー情報を保存
 */
export async function savePaymentData(
  uid: string,
  sessionId: string,
  availableRetrievals: number = 3
): Promise<boolean> {
  if (!db) {
    console.error("Firestore is not initialized");
    return false;
  }

  try {
    const userRef = doc(db, "users", uid);

    // 既存のpaymentCountを取得
    const userSnap = await getDoc(userRef);
    const currentPaymentCount = userSnap.exists() ? (userSnap.data().paymentCount || 0) : 0;

    await setDoc(userRef, {
      paymentCompleted: true,
      stripeSessionId: sessionId,
      paymentDate: serverTimestamp(),
      paymentCount: currentPaymentCount + 1,
      retrievalCount: 0,
      availableRetrievals,
      lastUpdated: serverTimestamp(),
    }, { merge: true });

    return true;
  } catch (error) {
    console.error("Error saving payment data:", error);
    return false;
  }
}

/**
 * 取得回数を更新
 */
export async function incrementRetrievalCount(uid: string): Promise<boolean> {
  if (!db) {
    console.error("Firestore is not initialized");
    return false;
  }

  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const currentCount = userSnap.data().retrievalCount || 0;
      await updateDoc(userRef, {
        retrievalCount: currentCount + 1,
        lastUpdated: serverTimestamp(),
      });
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error incrementing retrieval count:", error);
    return false;
  }
}

/**
 * 決済状態をリセット（取得回数を使い切った場合）
 */
export async function resetPaymentData(uid: string): Promise<boolean> {
  if (!db) {
    console.error("Firestore is not initialized");
    return false;
  }

  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      paymentCompleted: false,
      retrievalCount: 0,
      availableRetrievals: 0,
      lastUpdated: serverTimestamp(),
      // paymentCountは累積カウントなのでリセットしない
    });

    return true;
  } catch (error) {
    console.error("Error resetting payment data:", error);
    return false;
  }
}

export { db };
