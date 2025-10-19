import { NextRequest, NextResponse } from "next/server";
import { deleteCustomer } from "@kabu-tax/database";

export async function POST(request: NextRequest) {
  try {
    console.log("=== 顧客削除API開始 ===");
    const { email, uid } = await request.json();
    console.log("削除リクエスト - Email:", email, "UID:", uid);

    if (!email) {
      console.error("エラー: メールアドレスが指定されていません");
      return NextResponse.json(
        { error: "メールアドレスは必須です" },
        { status: 400 }
      );
    }

    console.log("deleteCustomer関数を呼び出します...");
    await deleteCustomer(email, uid);
    console.log("✅ 顧客削除成功:", email);

    return NextResponse.json({
      success: true,
      message: "顧客を削除しました"
    });
  } catch (error: any) {
    console.error("=== 顧客削除エラー ===");
    console.error("Error:", error);
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      {
        error: "顧客の削除に失敗しました",
        details: error.message,
        code: error.code
      },
      { status: 500 }
    );
  }
}
