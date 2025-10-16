import { NextRequest, NextResponse } from "next/server";
import { deleteCustomer } from "@kabu-tax/database";

export async function POST(request: NextRequest) {
  try {
    const { email, uid } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "メールアドレスは必須です" },
        { status: 400 }
      );
    }

    await deleteCustomer(email, uid);

    return NextResponse.json({
      success: true,
      message: "顧客を削除しました"
    });
  } catch (error: any) {
    console.error("顧客削除エラー:", error);
    return NextResponse.json(
      { error: "顧客の削除に失敗しました" },
      { status: 500 }
    );
  }
}
