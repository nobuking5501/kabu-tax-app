import { NextRequest, NextResponse } from "next/server";
import { getSubmissionsByEmail } from "@kabu-tax/database";

export async function GET(
  request: NextRequest,
  { params }: { params: { email: string } }
) {
  try {
    const email = decodeURIComponent(params.email);
    const submissions = await getSubmissionsByEmail(email);
    return NextResponse.json(submissions);
  } catch (error: any) {
    console.error("顧客詳細取得エラー:", error);
    return NextResponse.json(
      { error: "顧客詳細の取得に失敗しました" },
      { status: 500 }
    );
  }
}
