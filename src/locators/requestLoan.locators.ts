/** Request Loan. Verified against the live DOM. */
export const requestLoanLocators = {
  formPanel: '#requestLoanForm',
  pageTitle: '#requestLoanForm h1.title',
  loanAmount: '#amount',
  downPayment: '#downPayment',
  fromAccountSelect: '#fromAccountId',
  fromAccountOptions: '#fromAccountId option',
  applyNowButton: 'input[type="button"][value="Apply Now"]',

  resultPanel: '#requestLoanResult',
  resultTitle: '#requestLoanResult h1.title',
  loanProviderName: '#loanProviderName',
  responseDate: '#responseDate',
  loanStatus: '#loanStatus',
  approvedPanel: '#loanRequestApproved',
  deniedPanel: '#loanRequestDenied',
  deniedMessage: '#loanRequestDenied p.error',
  newAccountLink: '#newAccountId',
  errorPanel: '#requestLoanError',
} as const;
