import nodemailer from "nodemailer";

export interface SendMailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  filename: string;
  bytes: Buffer;
}

export async function sendMailWithAttachment(options: SendMailOptions) {
  const { to, subject, text, html, filename, bytes } = options;

  console.log("========================================");
  console.log("📧 [Gmail SMTP] メール送信開始");
  console.log("========================================");
  console.log("送信先:", to);
  console.log("件名:", subject);
  console.log("ファイル名:", filename);
  console.log("PDFサイズ:", bytes.length, "bytes");
  console.log("GMAIL_USER:", process.env.GMAIL_USER || "❌ 未設定");
  console.log("GMAIL_APP_PASSWORD:", process.env.GMAIL_APP_PASSWORD ? "✅ 設定済み" : "❌ 未設定");
  console.log("========================================");

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error("GMAIL_USER または GMAIL_APP_PASSWORD が設定されていません");
  }

  try {
    // Gmail SMTP設定
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    // メール送信
    const result = await transporter.sendMail({
      from: `榧野国際税務会計事務所 <${process.env.GMAIL_USER}>`,
      to,
      subject,
      text,
      html,
      attachments: [
        {
          filename,
          content: bytes,
        },
      ],
    });

    console.log("✅ [Gmail SMTP] メール送信成功:", result);
    console.log("========================================");

    return result;
  } catch (error: any) {
    console.error("========================================");
    console.error("❌ [Gmail SMTP] メール送信エラー:");
    console.error("エラー詳細:", error);
    console.error("エラーメッセージ:", error.message);
    console.error("========================================");
    throw error;
  }
}
