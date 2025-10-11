import * as admin from "firebase-admin";
import { getFirestore, Firestore } from "firebase-admin/firestore";

// グローバルなFirebaseアプリインスタンス
let firebaseApp: admin.app.App | null = null;
let firestoreInstance: Firestore | null = null;

export function getFirebaseApp(): admin.app.App {
  if (!firebaseApp) {
    // 既に初期化されている場合は既存のアプリを使用
    if (admin.apps.length > 0) {
      firebaseApp = admin.apps[0] as admin.app.App;
    } else {
      // 環境変数からFirebase設定を取得
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

      if (!projectId || !privateKey || !clientEmail) {
        throw new Error(
          "Firebase環境変数が設定されていません。FIREBASE_PROJECT_ID、FIREBASE_PRIVATE_KEY、FIREBASE_CLIENT_EMAILを設定してください。"
        );
      }

      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          privateKey,
          clientEmail,
        }),
      });
    }
  }
  return firebaseApp;
}

export function getFirestoreClient(): Firestore {
  if (!firestoreInstance) {
    const app = getFirebaseApp();
    firestoreInstance = getFirestore(app);
  }
  return firestoreInstance;
}

// 後方互換性のため（非推奨）
export const sql = {
  query: async () => {
    throw new Error("Use Firestore client directly via getFirestoreClient()");
  },
};
