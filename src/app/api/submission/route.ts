import { NextRequest, NextResponse } from "next/server";
import { calcMovingAverage } from "@/lib/engine/movingAverage";
import { renderReportToBuffer } from "@/lib/pdf/render";
import { sendMailWithAttachment } from "@/lib/mail/resend";
import type { SubmissionInput } from "@/lib/engine/types";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SubmissionInput;

    // バリデーション
    if (!body.email || !body.email.includes("@")) {
      return NextResponse.json(
        { error: "有効なメールアドレスを入力してください" },
        { status: 422 }
      );
    }

    if (!body.symbol || body.symbol.trim() === "") {
      return NextResponse.json({ error: "銘柄コードを入力してください" }, { status: 422 });
    }

    if (!body.years || body.years.length === 0) {
      return NextResponse.json({ error: "対象年度を選択してください" }, { status: 422 });
    }

    if (!body.transactions || body.transactions.length === 0) {
      return NextResponse.json({ error: "取引データを入力してください" }, { status: 422 });
    }

    if (body.transactions.length > 50) {
      return NextResponse.json(
        { error: "取引は最大50行までです" },
        { status: 422 }
      );
    }

    // 各取引のバリデーション
    for (let i = 0; i < body.transactions.length; i++) {
      const tx = body.transactions[i];

      if (!/^\d{4}-\d{2}-\d{2}$/.test(tx.date)) {
        return NextResponse.json(
          { error: `取引${i + 1}: 日付はYYYY-MM-DD形式で入力してください` },
          { status: 422 }
        );
      }

      if (!["Purchased", "Sold"].includes(tx.activity)) {
        return NextResponse.json(
          { error: `取引${i + 1}: activityはPurchasedまたはSoldである必要があります` },
          { status: 422 }
        );
      }

      if (!isFinite(tx.quantity) || tx.quantity === 0) {
        return NextResponse.json(
          { error: `取引${i + 1}: 数量は有限の非ゼロ値である必要があります` },
          { status: 422 }
        );
      }

      if (!isFinite(tx.price) || tx.price <= 0) {
        return NextResponse.json(
          { error: `取引${i + 1}: 価格は正の有限値である必要があります` },
          { status: 422 }
        );
      }

      if (tx.commission !== undefined && (!isFinite(tx.commission) || tx.commission < 0)) {
        return NextResponse.json(
          { error: `取引${i + 1}: 手数料は0以上の有限値である必要があります` },
          { status: 422 }
        );
      }

      // 売却は負の数に正規化
      if (tx.activity === "Sold" && tx.quantity > 0) {
        tx.quantity = -tx.quantity;
      }
    }

    // 計算実行
    const result = await calcMovingAverage(body);

    // PDF生成
    const pdfBytes = await renderReportToBuffer(result, body.email);

    const filename = `kabu-tax-${body.symbol}-${Date.now()}.pdf`;
    const sendMail = process.env.SEND_MAIL === "true";

    // メール送信モード
    if (sendMail) {
      await sendMailWithAttachment({
        to: body.email,
        subject: `【kabu-tax-app】${body.symbol} 譲渡益計算レポート`,
        text: `
${body.email} 様

株式譲渡益計算レポート（移動平均法）を添付いたします。

銘柄: ${body.symbol}
通貨: ${result.currency}
対象年度: ${result.years.join(", ")}

ご確認のほどよろしくお願いいたします。

---
榧野国際税務会計事務所
        `.trim(),
        filename,
        bytes: pdfBytes,
      });

      return NextResponse.json({ ok: true, message: "メール送信が完了しました" });
    }

    // PDFダウンロードモード
    return new NextResponse(new Uint8Array(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("API エラー:", error);

    // バリデーションエラー
    if (
      error.message?.includes("入力") ||
      error.message?.includes("選択") ||
      error.message?.includes("取引") ||
      error.message?.includes("保有") ||
      error.message?.includes("必要")
    ) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    // その他のエラー
    return NextResponse.json(
      { error: error.message || "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
