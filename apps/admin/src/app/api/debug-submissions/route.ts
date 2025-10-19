import { NextResponse } from "next/server";
import { getFirestoreClient } from "@kabu-tax/database";

export async function GET() {
  try {
    const db = getFirestoreClient();

    // submissionsコレクションのすべてのドキュメントを取得
    const snapshot = await db.collection("submissions").get();

    const submissions = snapshot.docs.map((doc) => ({
      id: doc.id,
      data: doc.data(),
      exists: doc.exists,
    }));

    return NextResponse.json({
      count: snapshot.size,
      submissions: submissions,
    });
  } catch (error: any) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json(
      {
        error: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}
