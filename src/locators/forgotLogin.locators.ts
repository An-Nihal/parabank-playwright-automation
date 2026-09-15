/** Customer Lookup (Forgot login info). Verified against the live DOM. */
export const forgotLoginLocators = {
  form: '#lookupForm',
  firstName: 'input[name="firstName"]',
  lastName: 'input[name="lastName"]',
  address: 'input[name="address.street"]',
  city: 'input[name="address.city"]',
  state: 'input[name="address.state"]',
  zipCode: 'input[name="address.zipCode"]',
  ssn: 'input[name="ssn"]',
  findLoginButton: 'input[type="submit"][value="Find My Login Info"]',

  pageHeading: '#rightPanel h1.title',
  resultText: '#rightPanel p',
  errorMessage: '#rightPanel p.error',

  /** Same ".errors" id convention as the registration form - see register.locators.ts. */
  fieldError: (fieldName: string) => `span[id="${fieldName}.errors"]`,
} as const;
