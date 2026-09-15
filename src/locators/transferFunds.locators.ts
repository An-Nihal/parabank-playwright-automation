/**
 * Transfer Funds. jQuery POSTs to services_proxy/bank/transfer and then swaps
 * #showForm for #showResult (or #showError). Verified against the live DOM.
 *
 * Note: the two pre-rendered validation paragraphs both carry id="amount" and
 * class="errors". ParaBank hides them with a selector that never matches, so a
 * rejected transfer surfaces as #showError instead. See DEFECT notes in the spec.
 */
export const transferFundsLocators = {
  formPanel: '#showForm',
  pageTitle: '#showForm h1.title',
  amountInput: '#amount',
  fromAccountSelect: '#fromAccountId',
  toAccountSelect: '#toAccountId',
  fromAccountOptions: '#fromAccountId option',
  toAccountOptions: '#toAccountId option',
  transferButton: 'input[type="submit"][value="Transfer"]',

  resultPanel: '#showResult',
  resultTitle: '#showResult h1.title',
  resultAmount: '#amountResult',
  resultFromAccount: '#fromAccountIdResult',
  resultToAccount: '#toAccountIdResult',

  errorPanel: '#showError',
  errorTitle: '#showError h1.title',
  errorMessage: '#showError p.error',
} as const;
