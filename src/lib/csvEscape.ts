/** RFC 4180-style CSV field escaping. */
export function escapeCsvField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function rowToCsvLine(cells: string[]): string {
  return cells.map(escapeCsvField).join(",");
}
