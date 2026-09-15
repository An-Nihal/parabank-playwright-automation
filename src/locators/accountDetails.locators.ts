/**
 * Account Details / Account Activity (activity.htm?id=...) and the single
 * Transaction Details page (transaction.htm?id=...).
 * Both are rendered by jQuery from services_proxy. Verified against the live DOM.
 */
export const accountDetailsLocators = {
  detailsPanel: '#accountDetails',
  pageTitle: '#accountDetails h1.title',
  accountNumber: '#accountId',
  /** Matches only once jQuery has written the account id into the cell. */
  accountNumberPopulated: '#accountId:not(:empty)',
  accountType: '#accountType',
  balance: '#balance',
  availableBalance: '#availableBalance',

  activityPanel: '#accountActivity',
  activityTitle: '#accountActivity h1.title',
  monthSelect: '#month',
  transactionTypeSelect: '#transactionType',
  goButton: 'input[type="submit"][value="Go"]',

  transactionTable: '#transactionTable',
  transactionHeaders: '#transactionTable thead th',
  transactionRows: '#transactionTable tbody tr',
  transactionLinks: '#transactionTable tbody tr td a',
  transactionLink: (description: string) =>
    `#transactionTable tbody tr td a:text-is("${description}")`,
  noTransactionsMessage: '#noTransactions',
  errorPanel: '#error',

  transactionDetailsTitle: '#rightPanel h1.title',
  transactionDetailsTable: '#rightPanel table',
  /** Value cell of a labelled row. The label sits inside a <b> in the first cell. */
  transactionDetailRow: (label: string) =>
    `#rightPanel table tr:has(b:text-is("${label}")) td:nth-child(2)`,
} as const;
