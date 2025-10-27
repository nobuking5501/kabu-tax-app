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
    padding: 15,
    fontSize: 7,
    fontFamily: "NotoSansJP",
  },
  // Top info section (Currency, Stock Name) - smaller and left-aligned
  infoSection: {
    marginBottom: 10,
    width: "35%",
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 0,
  },
  infoLabel: {
    width: "40%",
    padding: 3,
    border: "1 solid #000",
    backgroundColor: "#333",
    color: "#fff",
    fontSize: 7,
  },
  infoValue: {
    width: "60%",
    padding: 3,
    border: "1 solid #000",
    fontSize: 7,
  },
  // Year summary section - narrower and left-aligned
  section: {
    marginBottom: 10,
  },
  summaryContainer: {
    width: "35%",
  },
  sectionTitle: {
    fontSize: 8,
    fontWeight: "bold",
    marginBottom: 0,
    padding: 3,
    backgroundColor: "#333",
    color: "#fff",
    border: "1 solid #000",
  },
  // Year summary table (3 columns: Year, Capital Gain, Total)
  summaryRow: {
    flexDirection: "row",
  },
  summaryRowAlt: {
    flexDirection: "row",
    backgroundColor: "#FFF9E6",
  },
  summaryHeader: {
    flexDirection: "row",
    backgroundColor: "#ffeb3b",
  },
  summaryCell: {
    padding: 3,
    border: "1 solid #000",
    fontSize: 7,
  },
  summaryCol1: { width: "33.33%", textAlign: "left" },   // Year
  summaryCol2: { width: "33.33%", textAlign: "right" },  // Capital Gain
  summaryCol3: { width: "33.34%", textAlign: "right" },  // Total
  // Transaction detail table (16 columns)
  detailHeader: {
    flexDirection: "row",
    backgroundColor: "#333",
  },
  detailHeaderCell: {
    padding: 2,
    border: "1 solid #000",
    fontSize: 5.5,
    color: "#fff",
  },
  detailRow: {
    flexDirection: "row",
  },
  detailRowAlt: {
    flexDirection: "row",
    backgroundColor: "#FFF9E6",
  },
  detailCell: {
    padding: 1.5,
    border: "1 solid #000",
    fontSize: 6,
  },
  // Column widths for 16 columns - adjusted to match reference PDF
  dcol1: { width: "5.5%", textAlign: "left" },    // Transaction Date
  dcol2: { width: "4.5%", textAlign: "center" },  // Activity
  dcol3: { width: "5%", textAlign: "right" },     // Quantity
  dcol4: { width: "4.5%", textAlign: "right" },   // FMV
  dcol5: { width: "6.5%", textAlign: "right" },   // Gross Amount
  dcol6: { width: "5.5%", textAlign: "right" },   // Commission
  dcol7: { width: "6%", textAlign: "right" },     // Net Amount
  dcol8: { width: "4%", textAlign: "right" },     // TTS
  dcol9: { width: "4%", textAlign: "right" },     // TTB
  dcol10: { width: "7.5%", textAlign: "right" },  // Gross Proceeds (JPY)
  dcol11: { width: "8%", textAlign: "right" },    // Acquisition Cost (JPY)
  dcol12: { width: "6%", textAlign: "right" },    // Commission (JPY)
  dcol13: { width: "8.5%", textAlign: "right" },  // Realized Profit/Loss (JPY)
  dcol14: { width: "5.5%", textAlign: "right" },  // Holdings
  dcol15: { width: "7%", textAlign: "right" },    // Cost Basis
  dcol16: { width: "8%", textAlign: "right" },    // Cost Basis per Holdings (JPY)
  footer: {
    position: "absolute",
    bottom: 10,
    left: 15,
    right: 15,
    textAlign: "center",
    fontSize: 6,
    color: "#666",
  },
});

interface ReportPDFProps {
  result: CalcResult;
  email: string;
}

export const ReportPDF: React.FC<ReportPDFProps> = ({ result, email }) => {
  const fmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
  const fmtDecimal = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Calculate totals for year summary
  const totalCapitalGain = result.summaries.reduce((sum, s) => sum + s.realizedGainJPY, 0);

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Top Info Section: Currency and Stock Name */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <View style={[styles.infoLabel]}>
              <Text>Currency</Text>
            </View>
            <View style={[styles.infoValue]}>
              <Text>{result.currency}</Text>
            </View>
            <View style={[styles.infoLabel, { marginLeft: 20 }]}>
              <Text>Stock Name</Text>
            </View>
            <View style={[styles.infoValue]}>
              <Text>{result.symbol}</Text>
            </View>
          </View>
        </View>

        {/* Year Summary Section */}
        <View style={styles.section}>
          <View style={styles.summaryContainer}>
            <View style={styles.summaryHeader}>
              <View style={[styles.summaryCell, styles.summaryCol1]}>
                <Text>Year</Text>
              </View>
              <View style={[styles.summaryCell, styles.summaryCol2]}>
                <Text>Capital Gain</Text>
              </View>
              <View style={[styles.summaryCell, styles.summaryCol3]}>
                <Text>Total</Text>
              </View>
            </View>
            {result.summaries.map((s, idx) => (
              <View key={s.year} style={idx % 2 === 0 ? styles.summaryRow : styles.summaryRowAlt}>
                <View style={[styles.summaryCell, styles.summaryCol1]}>
                  <Text>{s.year}</Text>
                </View>
                <View style={[styles.summaryCell, styles.summaryCol2]}>
                  <Text>{fmt.format(s.realizedGainJPY)}</Text>
                </View>
                <View style={[styles.summaryCell, styles.summaryCol3]}>
                  <Text>{fmt.format(s.realizedGainJPY)}</Text>
                </View>
              </View>
            ))}
            {/* Total row */}
            <View style={[styles.summaryRow, { backgroundColor: "#ffeb3b" }]}>
              <View style={[styles.summaryCell, styles.summaryCol1]}>
                <Text>Total</Text>
              </View>
              <View style={[styles.summaryCell, styles.summaryCol2]}>
                <Text>{fmt.format(totalCapitalGain)}</Text>
              </View>
              <View style={[styles.summaryCell, styles.summaryCol3]}>
                <Text>{fmt.format(totalCapitalGain)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Capital Gain Detail Section */}
        <View style={styles.section}>
          <View style={styles.sectionTitle}>
            <Text>Capital Gain</Text>
          </View>
          {/* Header Row */}
          <View style={styles.detailHeader}>
            <View style={[styles.detailHeaderCell, styles.dcol1]}>
              <Text>Transaction Date</Text>
            </View>
            <View style={[styles.detailHeaderCell, styles.dcol2]}>
              <Text>Activity</Text>
            </View>
            <View style={[styles.detailHeaderCell, styles.dcol3]}>
              <Text>Quantity</Text>
            </View>
            <View style={[styles.detailHeaderCell, styles.dcol4]}>
              <Text>FMV</Text>
            </View>
            <View style={[styles.detailHeaderCell, styles.dcol5]}>
              <Text>Gross Amount</Text>
            </View>
            <View style={[styles.detailHeaderCell, styles.dcol6]}>
              <Text>Commission</Text>
            </View>
            <View style={[styles.detailHeaderCell, styles.dcol7]}>
              <Text>Net Amount</Text>
            </View>
            <View style={[styles.detailHeaderCell, styles.dcol8]}>
              <Text>TTS</Text>
            </View>
            <View style={[styles.detailHeaderCell, styles.dcol9]}>
              <Text>TTB</Text>
            </View>
            <View style={[styles.detailHeaderCell, styles.dcol10]}>
              <Text>Gross Proceeds (JPY)</Text>
            </View>
            <View style={[styles.detailHeaderCell, styles.dcol11]}>
              <Text>Acquisition Cost (JPY)</Text>
            </View>
            <View style={[styles.detailHeaderCell, styles.dcol12]}>
              <Text>Commission (JPY)</Text>
            </View>
            <View style={[styles.detailHeaderCell, styles.dcol13]}>
              <Text>Realized Profit/Loss (JPY)</Text>
            </View>
            <View style={[styles.detailHeaderCell, styles.dcol14]}>
              <Text>Holdings</Text>
            </View>
            <View style={[styles.detailHeaderCell, styles.dcol15]}>
              <Text>Cost Basis</Text>
            </View>
            <View style={[styles.detailHeaderCell, styles.dcol16]}>
              <Text>Cost Basis per Holdings (JPY)</Text>
            </View>
          </View>
          {/* Data Rows */}
          {result.transactionDetails.map((tx, i) => (
            <View key={i} style={i % 2 === 0 ? styles.detailRow : styles.detailRowAlt}>
              <View style={[styles.detailCell, styles.dcol1]}>
                <Text>{tx.date}</Text>
              </View>
              <View style={[styles.detailCell, styles.dcol2]}>
                <Text>{tx.activity === "Purchased" ? "Buy" : "Sell"}</Text>
              </View>
              <View style={[styles.detailCell, styles.dcol3]}>
                <Text>{fmtDecimal.format(tx.quantity)}</Text>
              </View>
              <View style={[styles.detailCell, styles.dcol4]}>
                <Text>{fmtDecimal.format(tx.fmv)}</Text>
              </View>
              <View style={[styles.detailCell, styles.dcol5]}>
                <Text>{fmtDecimal.format(tx.grossAmount)}</Text>
              </View>
              <View style={[styles.detailCell, styles.dcol6]}>
                <Text>{fmtDecimal.format(tx.commission)}</Text>
              </View>
              <View style={[styles.detailCell, styles.dcol7]}>
                <Text>{fmtDecimal.format(tx.netAmount)}</Text>
              </View>
              <View style={[styles.detailCell, styles.dcol8]}>
                <Text>{fmtDecimal.format(tx.tts)}</Text>
              </View>
              <View style={[styles.detailCell, styles.dcol9]}>
                <Text>{fmtDecimal.format(tx.ttb)}</Text>
              </View>
              <View style={[styles.detailCell, styles.dcol10]}>
                <Text>{fmt.format(tx.grossProceedsJPY)}</Text>
              </View>
              <View style={[styles.detailCell, styles.dcol11]}>
                <Text>{fmt.format(tx.acquisitionCostJPY)}</Text>
              </View>
              <View style={[styles.detailCell, styles.dcol12]}>
                <Text>{fmt.format(tx.commissionJPY)}</Text>
              </View>
              <View style={[styles.detailCell, styles.dcol13]}>
                <Text>{fmt.format(tx.realizedGainJPY)}</Text>
              </View>
              <View style={[styles.detailCell, styles.dcol14]}>
                <Text>{fmtDecimal.format(tx.holdings)}</Text>
              </View>
              <View style={[styles.detailCell, styles.dcol15]}>
                <Text>{fmt.format(tx.costBasis)}</Text>
              </View>
              <View style={[styles.detailCell, styles.dcol16]}>
                <Text>{fmt.format(tx.costBasisPerHolding)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          This report was automatically generated by kabu-tax-app (Moving Average Method)
        </Text>
      </Page>
    </Document>
  );
};
