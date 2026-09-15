/** ParaBank's Find Transactions screen reads and writes dates as MM-DD-YYYY. */

const pad = (n: number): string => String(n).padStart(2, '0');

/** Formats a Date as MM-DD-YYYY. */
export function formatDate(date: Date): string {
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${date.getFullYear()}`;
}

/** Today as MM-DD-YYYY. */
export function today(): string {
  return formatDate(new Date());
}

/** A date offset from today by whole days, as MM-DD-YYYY. Negative goes back. */
export function dateOffset(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

/** Parses an MM-DD-YYYY string back into a Date, for range comparisons. */
export function parseDate(value: string): Date {
  const [month, day, year] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** True when date falls within [from, to] inclusive. All args are MM-DD-YYYY. */
export function isWithinRange(date: string, from: string, to: string): boolean {
  const target = parseDate(date).getTime();
  return target >= parseDate(from).getTime() && target <= parseDate(to).getTime();
}
