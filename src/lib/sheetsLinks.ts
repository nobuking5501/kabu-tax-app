export function getMainLink(): string {
  const id = process.env.NEXT_PUBLIC_TEMPLATE_SPREADSHEET_ID;
  const gid = process.env.NEXT_PUBLIC_MAIN_SHEET_GID;
  const range = process.env.NEXT_PUBLIC_MAIN_FUNCTION_RANGE;

  if (!id || !gid || !range) {
    throw new Error("メインシートの環境変数が設定されていません");
  }

  return `https://docs.google.com/spreadsheets/d/${id}/edit#gid=${gid}&range=${range}`;
}

export function getSubLink(): string | null {
  const id = process.env.NEXT_PUBLIC_TEMPLATE_SPREADSHEET_ID;
  const gid = process.env.NEXT_PUBLIC_SUB_SHEET_GID;
  const range = process.env.NEXT_PUBLIC_SUB_FUNCTION_RANGE;

  if (!id || !gid || !range) {
    return null;
  }

  return `https://docs.google.com/spreadsheets/d/${id}/edit#gid=${gid}&range=${range}`;
}
