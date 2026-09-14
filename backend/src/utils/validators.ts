export function sanitize(input: string, maxLength: number): string {
  return input
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, maxLength);
}

export function isNonEmptyString(val: unknown, maxLen: number): val is string {
  return typeof val === "string" && val.trim().length > 0 && val.length <= maxLen;
}
