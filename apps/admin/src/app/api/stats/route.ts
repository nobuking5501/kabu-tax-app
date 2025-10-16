import { NextResponse } from "next/server";
import { getStats, getAllCustomers } from "@kabu-tax/database";

export async function GET() {
  try {
    const [stats, customers] = await Promise.all([
      getStats(),
      getAllCustomers(),
    ]);

    // 最新5件の顧客のみをダッシュボードに表示
    const recentCustomers = customers.slice(0, 5);

    return NextResponse.json({
      ...stats,
      recentCustomers,
    });
  } catch (error: any) {
    console.error("統計取得エラー:", error);
    return NextResponse.json(
      { error: "統計情報の取得に失敗しました" },
      { status: 500 }
    );
  }
}
