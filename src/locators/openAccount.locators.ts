/**
 * Open New Account. Submits through jQuery to
 * services_proxy/bank/createAccount, then swaps the form for a result panel.
 * Verified against the live DOM.
 */
export const openAccountLocators = {
  form: '#openAccountForm',
  pageTitle: '#openAccountForm h1.title',
  accountTypeSelect: '#type',
  fundingAccountSelect: '#fromAccountId',
  fundingAccountOptions: '#fromAccountId option',
  openAccountButton: 'input[type="button"][value="Open New Account"]',

  resultPanel: '#openAccountResult',
  resultTitle: '#openAccountResult h1.title',
  resultMessage: '#openAccountResult p',
  newAccountLink: '#newAccountId',
  errorPanel: '#openAccountError',
} as const;

/** The account-type dropdown is indexed by option value, not keyed by label. */
export const accountTypeValues = { CHECKING: '0', SAVINGS: '1' } as const;
