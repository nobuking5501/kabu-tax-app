import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// 環境変数の確認
if (!process.env.STRIPE_SECRET_KEY) {
  console.error("STRIPE_SECRET_KEY is not set");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { priceId } = await req.json();

    console.log("Creating Checkout Session with:");
    console.log("- Price ID:", priceId || process.env.STRIPE_PRICE_ID);
    console.log("- APP_URL:", process.env.APP_URL);

    // Checkout Sessionを作成
    const session = await stripe.checkout.sessions.create({
      mode: "payment", // 一回限りの支払い
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId || process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${process.env.APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/payment`,
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
