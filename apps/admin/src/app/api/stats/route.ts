import { NextResponse } from "next/server";
import { getStats, getAllCustomers } from "@kabu-tax/database";

export async function GET() {
  try {
    console.log("=== 統計API開始 ===");
    console.log("FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID);
    console.log("FIREBASE_CLIENT_EMAIL:", process.env.FIREBASE_CLIENT_EMAIL);
    console.log("FIREBASE_PRIVATE_KEY exists:", !!process.env.FIREBASE_PRIVATE_KEY);

    const [stats, customers] = await Promise.all([
      getStats(),
      getAllCustomers(),
    ]);

    console.log("Stats:", stats);
    console.log("Customers count:", customers.length);

    // 最新5件の顧客のみをダッシュボードに表示
    const recentCustomers = customers.slice(0, 5);

    return NextResponse.json({
      ...stats,
      recentCustomers,
    });
  } catch (error: any) {
    console.error("=== 統計取得エラー ===");
    console.error("Error:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      { error: "統計情報の取得に失敗しました", details: error.message },
      { status: 500 }
    );
  }
}
