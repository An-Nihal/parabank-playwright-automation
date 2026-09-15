/**
 * Bill Pay. Verified against the live DOM.
 *
 * The Phone # input carries a randomly generated id and class on every page
 * load, so it must be addressed by its stable name attribute only.
 */
export const billPayLocators = {
  formPanel: '#billpayForm',
  pageTitle: '#billpayForm h1.title',
  payeeName: 'input[name="payee.name"]',
  address: 'input[name="payee.address.street"]',
  city: 'input[name="payee.address.city"]',
  state: 'input[name="payee.address.state"]',
  zipCode: 'input[name="payee.address.zipCode"]',
  phone: 'input[name="payee.phoneNumber"]',
  accountNumber: 'input[name="payee.accountNumber"]',
  verifyAccount: 'input[name="verifyAccount"]',
  amount: 'input[name="amount"]',
  fromAccountSelect: 'select[name="fromAccountId"]',
  sendPaymentButton: 'input[type="button"][value="Send Payment"]',

  errorPayeeName: '#validationModel-name',
  errorAddress: '#validationModel-address',
  errorCity: '#validationModel-city',
  errorState: '#validationModel-state',
  errorZipCode: '#validationModel-zipCode',
  errorPhone: '#validationModel-phoneNumber',
  errorAccountEmpty: '#validationModel-account-empty',
  errorAccountInvalid: '#validationModel-account-invalid',
  errorVerifyAccountEmpty: '#validationModel-verifyAccount-empty',
  errorVerifyAccountInvalid: '#validationModel-verifyAccount-invalid',
  errorVerifyAccountMismatch: '#validationModel-verifyAccount-mismatch',
  errorAmountEmpty: '#validationModel-amount-empty',
  errorAmountInvalid: '#validationModel-amount-invalid',

  resultPanel: '#billpayResult',
  resultTitle: '#billpayResult h1.title',
  resultPayeeName: '#payeeName',
  resultAmount: '#amount',
  resultFromAccount: '#fromAccountId',
  errorPanel: '#billpayError',
} as const;
