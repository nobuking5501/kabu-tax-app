import React from "react";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import type { CalcResult } from "../engine/types";
import fs from "fs";
import path from "path";

// 日本語フォントの登録（サーバーサイド用にBufferとして読み込み）
if (typeof window === 'undefined') {
  // サーバーサイド: ファイルをBase64に変換して登録
  const fontPath = path.join(process.cwd(), 'public', 'fonts', 'NotoSansJP-Regular.ttf');
  const fontBuffer = fs.readFileSync(fontPath);
  const fontBase64 = fontBuffer.toString('base64');

  Font.register({
    family: "NotoSansJP",
    src: `data:font/ttf;base64,${fontBase64}`,
  });
} else {
  // クライアントサイド（ブラウザ）: URLで指定
  Font.register({
    family: "NotoSansJP",
    src: '/fonts/NotoSansJP-Regular.ttf',
  });
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "NotoSansJP",
  },
  header: {
    marginBottom: 20,
    textAlign: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 5,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
    borderBottom: "1 solid #000",
    paddingBottom: 5,
  },
  table: {
    width: "100%",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1 solid #e0e0e0",
    paddingVertical: 6,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    paddingVertical: 8,
    borderBottom: "2 solid #000",
    fontWeight: "bold",
  },
  col1: { width: "25%", paddingHorizontal: 5 },
  col2: { width: "25%", paddingHorizontal: 5, textAlign: "right" },
  col3: { width: "25%", paddingHorizontal: 5, textAlign: "right" },
  col4: { width: "25%", paddingHorizontal: 5, textAlign: "right" },
  colLot1: { width: "33%", paddingHorizontal: 5 },
  colLot2: { width: "33%", paddingHorizontal: 5, textAlign: "right" },
  colLot3: { width: "34%", paddingHorizontal: 5, textAlign: "right" },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#666",
  },
});

interface ReportPDFProps {
  result: CalcResult;
  email: string;
}

export const ReportPDF: React.FC<ReportPDFProps> = ({ result, email }) => {
  const fmt = new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 0 });

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <Text style={styles.title}>株式譲渡所得 計算結果</Text>
          <Text style={styles.subtitle}>
            銘柄: {result.symbol} | 通貨: {result.currency}
          </Text>
          <Text style={styles.subtitle}>対象年度: {result.years.join(", ")}</Text>
          <Text style={styles.subtitle}>メール: {email}</Text>
        </View>

        {/* 年別集計テーブル */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>年別譲渡損益サマリー</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.col1}>年度</Text>
              <Text style={styles.col2}>売却数量</Text>
              <Text style={styles.col3}>売却価額(JPY)</Text>
              <Text style={styles.col4}>実現損益(JPY)</Text>
            </View>
            {result.summaries.map((s) => (
              <View key={s.year} style={styles.tableRow}>
                <Text style={styles.col1}>{s.year}</Text>
                <Text style={styles.col2}>{fmt.format(s.sellQuantity)}</Text>
                <Text style={styles.col3}>{fmt.format(s.proceedsJPY)}</Text>
                <Text style={styles.col4}>{fmt.format(s.realizedGainJPY)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 残ロット一覧 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>期末保有ロット一覧</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.colLot1}>購入日</Text>
              <Text style={styles.colLot2}>残数量</Text>
              <Text style={styles.colLot3}>1株あたり原価(JPY)</Text>
            </View>
            {result.finalHoldings.length === 0 ? (
              <View style={styles.tableRow}>
                <Text style={styles.colLot1}>保有なし</Text>
                <Text style={styles.colLot2}>-</Text>
                <Text style={styles.colLot3}>-</Text>
              </View>
            ) : (
              result.finalHoldings.map((lot, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={styles.colLot1}>{lot.purchaseDate}</Text>
                  <Text style={styles.colLot2}>{fmt.format(lot.quantity)}</Text>
                  <Text style={styles.colLot3}>{fmt.format(lot.unitCostJPY)}</Text>
                </View>
              ))
            )}
          </View>
        </View>

        {/* フッター */}
        <Text style={styles.footer}>
          本レポートは kabu-tax-app により自動生成されました（移動平均法）
        </Text>
      </Page>
    </Document>
  );
};
