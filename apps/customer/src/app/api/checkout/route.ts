import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// 環境変数の確認
if (!process.env.STRIPE_SECRET_KEY) {
  console.error("STRIPE_SECRET_KEY is not set");
}

// Stripe SDKの初期化（Vercel環境用の設定を追加）
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-09-30.clover",
  maxNetworkRetries: 3,
  timeout: 60000, // 60秒
  httpClient: Stripe.createFetchHttpClient(),
});

export async function POST(req: NextRequest) {
  try {
    const { priceId } = await req.json();

    // APP_URLの取得（デフォルト値を設定）
    // 環境変数から改行やスペースを除去
    const rawAppUrl = process.env.APP_URL?.trim();
    const rawVercelUrl = process.env.VERCEL_URL?.trim();

    const appUrl = rawAppUrl ||
      (rawVercelUrl ? `https://${rawVercelUrl}` : "https://kabu-tax-app.vercel.app");

    // Price IDも改行やスペースを除去
    const stripePriceId = (priceId || process.env.STRIPE_PRICE_ID)?.trim();

    console.log("========================================");
    console.log("📋 [Stripe Checkout] 環境変数チェック");
    console.log("========================================");
    console.log("APP_URL (raw):", process.env.APP_URL);
    console.log("VERCEL_URL:", process.env.VERCEL_URL);
    console.log("APP_URL (resolved):", appUrl);
    console.log("STRIPE_PRICE_ID (raw):", process.env.STRIPE_PRICE_ID);
    console.log("STRIPE_PRICE_ID (trimmed):", stripePriceId);
    console.log("STRIPE_SECRET_KEY:", process.env.STRIPE_SECRET_KEY ? "✅ 設定済み" : "❌ 未設定");
    console.log("========================================");

    // URLバリデーション
    if (!appUrl || !appUrl.startsWith("http")) {
      throw new Error(`Invalid APP_URL: ${appUrl}`);
    }

    // Price IDバリデーション
    if (!stripePriceId) {
      throw new Error("STRIPE_PRICE_ID is not set");
    }

    const successUrl = `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${appUrl}/payment`;

    console.log("Success URL:", successUrl);
    console.log("Cancel URL:", cancelUrl);

    // Checkout Sessionを作成
    const session = await stripe.checkout.sessions.create({
      mode: "payment", // 一回限りの支払い
      payment_method_types: ["card"],
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      // メタデータとして追加情報を保存可能
      metadata: {
        // 将来的にユーザーIDなどを保存
      },
    });

    console.log("Checkout Session created successfully:", session.id);
    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: unknown) {
    console.error("Stripe Checkout Session作成エラー:", error);

    // より詳細なエラーメッセージを返す
    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: "決済セッションの作成に失敗しました",
          details: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "決済セッションの作成に失敗しました" },
      { status: 500 }
    );
  }
}
