/** Update Contact Info. Verified against the live DOM. */
export const updateProfileLocators = {
  formPanel: '#updateProfileForm',
  pageTitle: '#updateProfileForm h1.title',
  firstName: 'input[name="customer.firstName"]',
  lastName: 'input[name="customer.lastName"]',
  address: 'input[name="customer.address.street"]',
  city: 'input[name="customer.address.city"]',
  state: 'input[name="customer.address.state"]',
  zipCode: 'input[name="customer.address.zipCode"]',
  phone: 'input[name="customer.phoneNumber"]',
  updateButton: 'input[type="button"][value="Update Profile"]',

  errorFirstName: '#firstName-error',
  errorLastName: '#lastName-error',
  errorAddress: '#street-error',
  errorCity: '#city-error',
  errorState: '#state-error',
  errorZipCode: '#zipCode-error',

  resultPanel: '#updateProfileResult',
  resultTitle: '#updateProfileResult h1.title',
  resultMessage: '#updateProfileResult p',
  errorPanel: '#updateProfileError',
  errorTitle: '#updateProfileError h1.title',
  errorText: '#updateProfileError p.error',
} as const;
