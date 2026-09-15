/**
 * Accounts Overview. The table body is populated by jQuery from
 * services_proxy/bank/customers/<id>/accounts, so rows appear asynchronously.
 * Verified against the live DOM.
 */
export const accountsOverviewLocators = {
  pageTitle: '#showOverview h1.title',
  accountTable: '#accountTable',
  tableHeaders: '#accountTable thead th',
  rows: '#accountTable tbody tr',
  /** Account rows only - excludes the trailing Total row, which has no link. */
  accountRows: '#accountTable tbody tr:has(td a)',
  accountLinks: '#accountTable tbody tr td a',
  accountLink: (id: string) => `#accountTable tbody tr td a:text-is("${id}")`,
  /** The Total row is the one row that has no anchor. */
  totalRow: '#accountTable tbody tr:not(:has(td a))',
  totalLabel: '#accountTable tbody tr:not(:has(td a)) td:nth-child(1)',
  totalBalance: '#accountTable tbody tr:not(:has(td a)) td:nth-child(2)',
  /** Nth cell within a row: 1=Account, 2=Balance, 3=Available Amount. */
  cell: (n: number) => `td:nth-child(${n})`,
  errorPanel: '#showError',
} as const;
