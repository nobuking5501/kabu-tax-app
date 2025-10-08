import { NextResponse } from "next/server";
import { getAllCustomers } from "@kabu-tax/database";

export async function GET() {
  try {
    const customers = await getAllCustomers();
    return NextResponse.json(customers);
  } catch (error: any) {
    console.error("顧客リスト取得エラー:", error);
    return NextResponse.json(
      { error: "顧客リストの取得に失敗しました" },
      { status: 500 }
    );
  }
}
