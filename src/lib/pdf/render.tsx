import { renderToBuffer } from "@react-pdf/renderer";
import { ReportPDF } from "./Report";
import type { CalcResult } from "../engine/types";

export async function renderReportToBuffer(
  result: CalcResult,
  email: string
): Promise<Buffer> {
  const bytes = await renderToBuffer(<ReportPDF result={result} email={email} />);
  return Buffer.from(bytes);
}
