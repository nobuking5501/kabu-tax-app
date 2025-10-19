import { NextRequest, NextResponse } from "next/server";
import { calcMovingAverage } from "@/lib/engine/movingAverage";
import { renderReportToBuffer } from "@/lib/pdf/render";
import { sendMailWithAttachment as sendMailWithResend } from "@/lib/mail/resend";
import { sendMailWithAttachment as sendMailWithGmail } from "@/lib/mail/gmail";
import type { SubmissionInput } from "@/lib/engine/types";
import { createSubmission, createTransaction } from "@kabu-tax/database";

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

    if (body.years.length > 5) {
      return NextResponse.json({ error: "対象年度は最大5件までです" }, { status: 422 });
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

    // データベースに保存
    try {
      console.log("=== データベース保存開始 ===");
      console.log("FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID);
      console.log("FIREBASE_CLIENT_EMAIL:", process.env.FIREBASE_CLIENT_EMAIL);
      console.log("FIREBASE_PRIVATE_KEY exists:", !!process.env.FIREBASE_PRIVATE_KEY);

      const submissionId = await createSubmission({
        email: body.email,
        symbol: body.symbol,
        currency: body.currency,
        years: body.years,
        transaction_count: body.transactions.length,
      });

      console.log("✅ Submission作成成功:", submissionId);

      // 各取引をデータベースに保存
      for (const tx of body.transactions) {
        await createTransaction({
          submission_id: submissionId,
          date: tx.date,
          activity: tx.activity,
          quantity: tx.quantity,
          price: tx.price,
          commission: tx.commission,
        });
      }

      console.log("✅ Transactions保存成功");
      console.log("=== データベース保存完了 ===");
    } catch (dbError: any) {
      console.error("=== データベース保存エラー ===");
      console.error("Error:", dbError);
      console.error("Error message:", dbError.message);
      console.error("Error stack:", dbError.stack);
      console.error("==========================");
      // データベース保存に失敗してもPDF生成は継続
    }

    // メール送信判定
    const mailProvider = process.env.MAIL_PROVIDER || "none";

    console.log("========================================");
    console.log("📋 [API] 環境変数チェック");
    console.log("========================================");
    console.log("MAIL_PROVIDER:", mailProvider);
    console.log("RESEND_API_KEY:", process.env.RESEND_API_KEY ? `✅ 設定済み (${process.env.RESEND_API_KEY.substring(0, 10)}...)` : "❌ 未設定");
    console.log("RESEND_FROM_EMAIL:", process.env.RESEND_FROM_EMAIL || "未設定");
    console.log("GMAIL_USER:", process.env.GMAIL_USER || "未設定");
    console.log("GMAIL_APP_PASSWORD:", process.env.GMAIL_APP_PASSWORD ? "✅ 設定済み" : "❌ 未設定");
    console.log("========================================");

    // テストモード
    if (mailProvider === "test") {
      console.log("========================================");
      console.log("📧 [TEST MODE] メール送信シミュレーション");
      console.log("========================================");
      console.log("送信先:", body.email);
      console.log("件名: 【計算結果のご連絡】株式譲渡所得自動計算ツール");
      console.log("銘柄:", body.symbol);
      console.log("通貨:", result.currency);
      console.log("対象年度:", result.years.join(", "));
      console.log("PDF ファイル名:", filename);
      console.log("PDF サイズ:", pdfBytes.length, "bytes");
      console.log("========================================");
      console.log("✅ テストモードなので実際のメールは送信されません");
      console.log("========================================");

      return NextResponse.json({
        ok: true,
        message: "メール送信シミュレーション成功（テストモード）\nサーバーログを確認してください"
      });
    }

    const hasResendConfig =
      mailProvider === "resend" &&
      process.env.RESEND_API_KEY &&
      process.env.RESEND_FROM_EMAIL;

    // Resend メール送信モード
    if (hasResendConfig) {
      try {
        console.log("📧 Resend でメール送信中...", body.email);

        // ベースURL取得（環境変数またはリクエストから）
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : "https://kabu-tax-app.vercel.app";
        const logoUrl = `${baseUrl}/logo-40.png`;

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .content { margin-bottom: 30px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 12px; }
    .logo { width: 40px; height: 40px; margin-bottom: 10px; }
    .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    p { margin: 10px 0; }
    .environmental-note { color: #888; font-size: 11px; font-style: italic; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${logoUrl}" alt="榧野国際税務会計事務所" class="logo">
    </div>
    <div class="content">
      <p>榧野国際税務会計事務所です。</p>

      <p>このたびは、"株式譲渡所得自動計算ツール"をご利用いただきありがとうございました。<br>
      ご入力内容に基づく計算結果を添付のとおりお送りさせていただきます。</p>

      <p>計算結果はそのまま確定申告等にご利用いただくことができますが、<br>
      内容のご説明や確定申告の方法等について、有償サポートをご希望される場合には下記よりお申込みください。</p>

      <p style="text-align: center;">
        <a href="https://calendar.app.google/vDJjeXbFnjQtrjrZ9" class="button">【個別税務相談】</a>
      </p>

      <p>どうぞよろしくお願いいたします。</p>
    </div>
    <div class="footer">
      <img src="${logoUrl}" alt="榧野国際税務会計事務所" class="logo">
      <p><strong>榧野国際税務会計事務所</strong></p>
      <p>Website: <a href="http://www.kyno-office.com" style="color: #4F46E5; text-decoration: none;">http://www.kyno-office.com</a></p>
      <p class="environmental-note">Thank you for considering the environmental impact of printing this email.</p>
    </div>
  </div>
</body>
</html>
        `;

        const textContent = `榧野国際税務会計事務所です。

このたびは、"株式譲渡所得自動計算ツール"をご利用いただきありがとうございました。
ご入力内容に基づく計算結果を添付のとおりお送りさせていただきます。

計算結果はそのまま確定申告等にご利用いただくことができますが、
内容のご説明や確定申告の方法等について、有償サポートをご希望される場合には下記よりお申込みください。

【個別税務相談】
https://calendar.app.google/vDJjeXbFnjQtrjrZ9

どうぞよろしくお願いいたします。

---
榧野国際税務会計事務所
Website: http://www.kyno-office.com
Thank you for considering the environmental impact of printing this email.`;

        await sendMailWithResend({
          to: body.email,
          subject: "【計算結果のご連絡】株式譲渡所得自動計算ツール",
          text: textContent,
          html: htmlContent,
          filename,
          bytes: pdfBytes,
        });

        console.log("✅ メール送信成功:", body.email);
        return NextResponse.json({ ok: true, message: "メール送信が完了しました" });
      } catch (mailError: any) {
        console.error("❌ メール送信エラー:", mailError);
        // メール送信に失敗した場合はPDFダウンロードにフォールバック
        return new NextResponse(new Uint8Array(pdfBytes), {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${filename}"`,
          },
        });
      }
    }

    // Gmail SMTP メール送信モード
    const hasGmailConfig =
      mailProvider === "gmail" &&
      process.env.GMAIL_USER &&
      process.env.GMAIL_APP_PASSWORD;

    if (hasGmailConfig) {
      try {
        console.log("📧 Gmail SMTP でメール送信中...", body.email);

        // ベースURL取得（環境変数またはリクエストから）
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : "https://kabu-tax-app.vercel.app";
        const logoUrl = `${baseUrl}/logo-40.png`;

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .content { margin-bottom: 30px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 12px; }
    .logo { width: 40px; height: 40px; margin-bottom: 10px; }
    .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    p { margin: 10px 0; }
    .environmental-note { color: #888; font-size: 11px; font-style: italic; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${logoUrl}" alt="榧野国際税務会計事務所" class="logo">
    </div>
    <div class="content">
      <p>榧野国際税務会計事務所です。</p>

      <p>このたびは、"株式譲渡所得自動計算ツール"をご利用いただきありがとうございました。<br>
      ご入力内容に基づく計算結果を添付のとおりお送りさせていただきます。</p>

      <p>計算結果はそのまま確定申告等にご利用いただくことができますが、<br>
      内容のご説明や確定申告の方法等について、有償サポートをご希望される場合には下記よりお申込みください。</p>

      <p style="text-align: center;">
        <a href="https://calendar.app.google/vDJjeXbFnjQtrjrZ9" class="button">【個別税務相談】</a>
      </p>

      <p>どうぞよろしくお願いいたします。</p>
    </div>
    <div class="footer">
      <img src="${logoUrl}" alt="榧野国際税務会計事務所" class="logo">
      <p><strong>榧野国際税務会計事務所</strong></p>
      <p>Website: <a href="http://www.kyno-office.com" style="color: #4F46E5; text-decoration: none;">http://www.kyno-office.com</a></p>
      <p class="environmental-note">Thank you for considering the environmental impact of printing this email.</p>
    </div>
  </div>
</body>
</html>
        `;

        const textContent = `榧野国際税務会計事務所です。

このたびは、"株式譲渡所得自動計算ツール"をご利用いただきありがとうございました。
ご入力内容に基づく計算結果を添付のとおりお送りさせていただきます。

計算結果はそのまま確定申告等にご利用いただくことができますが、
内容のご説明や確定申告の方法等について、有償サポートをご希望される場合には下記よりお申込みください。

【個別税務相談】
https://calendar.app.google/vDJjeXbFnjQtrjrZ9

どうぞよろしくお願いいたします。

---
榧野国際税務会計事務所
Website: http://www.kyno-office.com
Thank you for considering the environmental impact of printing this email.`;

        await sendMailWithGmail({
          to: body.email,
          subject: "【計算結果のご連絡】株式譲渡所得自動計算ツール",
          text: textContent,
          html: htmlContent,
          filename,
          bytes: pdfBytes,
        });

        console.log("✅ メール送信成功:", body.email);
        return NextResponse.json({ ok: true, message: "メール送信が完了しました" });
      } catch (mailError: any) {
        console.error("❌ メール送信エラー:", mailError);
        // メール送信に失敗した場合はPDFダウンロードにフォールバック
        return new NextResponse(new Uint8Array(pdfBytes), {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${filename}"`,
          },
        });
      }
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
