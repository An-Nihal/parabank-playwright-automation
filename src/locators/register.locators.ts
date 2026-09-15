/** Registration form. Verified against the live DOM. */
export const registerLocators = {
  form: '#customerForm',
  firstName: 'input[name="customer.firstName"]',
  lastName: 'input[name="customer.lastName"]',
  address: 'input[name="customer.address.street"]',
  city: 'input[name="customer.address.city"]',
  state: 'input[name="customer.address.state"]',
  zipCode: 'input[name="customer.address.zipCode"]',
  phone: 'input[name="customer.phoneNumber"]',
  ssn: 'input[name="customer.ssn"]',
  username: 'input[name="customer.username"]',
  password: 'input[name="customer.password"]',
  confirmPassword: 'input[name="repeatedPassword"]',
  registerButton: 'input[type="submit"][value="Register"]',

  pageHeading: '#rightPanel h1.title',
  successMessage: '#rightPanel p',

  /**
   * ParaBank renders per-field validation in a span whose id is the field name
   * suffixed with ".errors", e.g. id="customer.firstName.errors". Those dots are
   * part of the id, so the span is addressed by attribute rather than by a CSS
   * id selector, which would otherwise need every dot escaped.
   */
  fieldError: (fieldName: string) => `span[id="${fieldName}.errors"]`,
} as const;
