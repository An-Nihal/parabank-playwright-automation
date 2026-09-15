/**
 * Find Transactions. Four independent search criteria, each with its own FIND
 * TRANSACTIONS button and its own error span. Verified against the live DOM.
 */
export const findTransactionsLocators = {
  formContainer: '#formContainer',
  pageTitle: '#formContainer h1.title',
  accountSelect: '#accountId',
  accountSelectError: '#accountIdError',

  transactionIdInput: '#transactionId',
  transactionIdError: '#transactionIdError',
  findByIdButton: '#findById',

  dateInput: '#transactionDate',
  dateError: '#transactionDateError',
  findByDateButton: '#findByDate',

  fromDateInput: '#fromDate',
  toDateInput: '#toDate',
  dateRangeError: '#dateRangeError',
  findByDateRangeButton: '#findByDateRange',

  amountInput: '#amount',
  amountError: '#amountError',
  findByAmountButton: '#findByAmount',

  resultContainer: '#resultContainer',
  resultTitle: '#resultContainer h1.title',
  resultTable: '#transactionTable',
  resultHeaders: '#transactionTable thead th',
  resultRows: '#transactionBody tr',
  resultLinks: '#transactionBody tr td a',
  errorContainer: '#errorContainer',
} as const;
