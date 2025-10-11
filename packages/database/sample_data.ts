/**
 * Firestore用サンプルデータ挿入スクリプト
 *
 * 使用方法:
 * 1. 環境変数を設定
 * 2. npx ts-node sample_data.ts
 */

import { getFirestoreClient } from "./src/client";

async function insertSampleData() {
  const db = getFirestoreClient();

  console.log("サンプルデータを挿入中...");

  // サンプル顧客データ（submissions）
  const submissions = [
    {
      email: "yamada@example.com",
      symbol: "AAPL",
      currency: "USD",
      years: [2024],
      transaction_count: 5,
      pdf_generated: true,
    },
    {
      email: "yamada@example.com",
      symbol: "GOOGL",
      currency: "USD",
      years: [2024],
      transaction_count: 3,
      pdf_generated: true,
    },
    {
      email: "suzuki@example.com",
      symbol: "MSFT",
      currency: "USD",
      years: [2024],
      transaction_count: 4,
      pdf_generated: true,
    },
  ];

  for (const sub of submissions) {
    const docRef = await db.collection("submissions").add({
      ...sub,
      created_at: new Date(),
      updated_at: new Date(),
    });

    console.log(`Submission作成: ${docRef.id} (${sub.email} - ${sub.symbol})`);

    // サンプル取引データ（transactions）
    if (sub.symbol === "AAPL") {
      const transactions = [
        {
          date: "2024-01-10",
          activity: "Purchased",
          quantity: 50,
          price: 150.0,
          commission: 5.0,
        },
        {
          date: "2024-06-20",
          activity: "Sold",
          quantity: -40,
          price: 180.0,
          commission: 4.0,
        },
      ];

      for (const tx of transactions) {
        await docRef.collection("transactions").add({
          ...tx,
          created_at: new Date(),
        });
      }
      console.log(`  → ${transactions.length}件のトランザクションを追加`);
    }
  }

  console.log("サンプルデータの挿入が完了しました！");
}

insertSampleData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("エラー:", error);
    process.exit(1);
  });
