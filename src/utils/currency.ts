/**
 * ParaBank renders every monetary value through the same client-side helper:
 * "$1,234.56", and negatives as "-$1,234.56".
 */

/** Parses a displayed currency string into a number. Throws if it is not currency. */
export function parseCurrency(displayed: string): number {
  const cleaned = displayed.replace(/[\s,$]/g, '');
  const value = Number(cleaned);
  if (Number.isNaN(value)) {
    throw new Error(`Cannot parse "${displayed}" as a currency value.`);
  }
  return value;
}

/** Rounds to 2 decimal places, the precision every balance assertion uses. */
export function toMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Formats a number the way ParaBank displays it, e.g. 1234.5 -> "$1234.50". */
export function formatCurrency(value: number): string {
  const negative = value < 0;
  return `${negative ? '-$' : '$'}${Math.abs(value).toFixed(2)}`;
}

/** Sums a list of displayed currency strings, rounded to 2 decimal places. */
export function sumCurrency(displayed: string[]): number {
  return toMoney(displayed.reduce((total, value) => total + parseCurrency(value), 0));
}
