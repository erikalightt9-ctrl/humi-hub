export type ParsedRow = string[];

export function parseClipboardData(text: string): ParsedRow[] {
  if (!text) return [];
  // Normalize line endings, strip a single trailing newline (Excel adds one)
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const trimmed = normalized.endsWith("\n") ? normalized.slice(0, -1) : normalized;
  if (!trimmed) return [];
  return trimmed.split("\n").map((line) => line.split("\t"));
}
