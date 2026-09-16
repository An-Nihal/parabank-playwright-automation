/**
 * Every FIXED value the suite uses. Anything that must differ per run lives in
 * DataFactory.ts; anything the application creates during a run stays in memory.
 *
 * Every expected message string below was read from the live application, not
 * copied from the specification. Where the two disagree, the deviation is noted.
 */

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface User {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  ssn: string;
  username: string;
  password: string;
  repeatedPassword: string;
}

export interface Payee {
  payeeName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  accountNumber: string;
  verifyAccount: string;
  amount: string;
}

export interface Profile {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
}

export interface LoanRequest {
  loanAmount: string;
  downPayment: string;
  fromAccountIndex: number;
}

export interface TransferData {
  amount: string;
  fromAccountIndex: number;
  toAccountIndex: number;
}

export interface ContactMessage {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export interface NavLink {
  label: string;
  urlFragment: string;
  heading?: string;
  external: boolean;
}

// ---------------------------------------------------------------------------
// TD_USER_01 - the single shared static customer
// ---------------------------------------------------------------------------

/**
 * TD_USER_01 - the fallback customer, used when the registry pool is empty.
 *
 * The suite normally signs in as a customer from `.auth/users.json` (see
 * src/test-data/UserRegistry.ts); this is only the backstop for a first run on a
 * clean checkout, and the username TC_REG_004 registers against to prove
 * duplicates are rejected.
 *
 * The profile below is the one really stored against this username. It differs
 * from the suggested TD_USER_01 values in the specification (Aaron Weber, 742
 * Evergreen Terrace) because the account already existed with these details on
 * the shared demo, and nothing is gained by describing it inaccurately. Customers
 * the suite creates itself do use the documented profile - see
 * `scripts/seed-user.js` and `baseUser` below.
 *
 * Override through .env to point at your own customer.
 */
export const staticUser: User = {
  firstName: 'John',
  lastName: 'Smith',
  address: '1431 Main St',
  city: 'Beverly Hills',
  state: 'CA',
  zipCode: '90210',
  phone: '310-447-4121',
  ssn: '622-11-9999',
  // `john` / `demo` is the customer ParaBank seeds itself. Parasoft resets the
  // public demo database without notice and every registered customer vanishes
  // with it (ENV-05 in docs/DEFECTS.md) - this one is recreated by the reset, so
  // it is the only fallback that survives. Override through .env / CI secrets.
  username: process.env.STATIC_USERNAME || 'john',
  password: process.env.STATIC_PASSWORD || 'demo',
  repeatedPassword: process.env.STATIC_PASSWORD || 'demo',
};

/** TD_USER_NEW - the fixed half. DataFactory adds the unique username and SSN. */
export const baseUser: User = {
  firstName: 'Aaron',
  lastName: 'Weber',
  address: '742 Evergreen Terrace',
  city: 'Springfield',
  state: 'Oregon',
  zipCode: '97477',
  phone: '5035550147',
  ssn: '512-88-1902',
  username: '',
  password: 'Test@1234',
  repeatedPassword: 'Test@1234',
};

/** TD_EMPTY - every field blank. */
export const emptyUser: User = {
  firstName: '',
  lastName: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  phone: '',
  ssn: '',
  username: '',
  password: '',
  repeatedPassword: '',
};

/** TD_LOGIN_BAD_PWD */
export const badPasswordLogin = {
  username: process.env.STATIC_USERNAME || 'parabank_qa01',
  password: 'WrongPass!99',
} as const;

/** TD_LOGIN_BAD_USER */
export const badUserLogin = {
  username: 'no_such_user_9812',
  password: 'Test@1234',
} as const;

/** TD_LOOKUP_UNKNOWN */
// TD_LOOKUP_UNKNOWN lives in DataFactory.generateUnknownLookup(): a fixed
// "impossible" identity was matched by a real customer on the shared demo.

// ---------------------------------------------------------------------------
// Accounts, transfers, loans
// ---------------------------------------------------------------------------

export const accountTypes = { CHECKING: 'CHECKING', SAVINGS: 'SAVINGS' } as const;
export type AccountType = keyof typeof accountTypes;

/** The fixed minimum opening deposit ParaBank applies to every new account. */
export const MINIMUM_DEPOSIT = 100.0;

/** TD_ACCOUNT_CHECKING */
export const checkingAccount = {
  accountType: accountTypes.CHECKING,
  fromAccountIndex: 0,
  minimumDeposit: MINIMUM_DEPOSIT,
} as const;

/** TD_ACCOUNT_SAVINGS */
export const savingsAccount = {
  accountType: accountTypes.SAVINGS,
  fromAccountIndex: 0,
  minimumDeposit: MINIMUM_DEPOSIT,
} as const;

/** TD_TRANSFER_01 */
export const validTransfer: TransferData = {
  amount: '25.00',
  fromAccountIndex: 0,
  toAccountIndex: 1,
};

/** TD_TRANSFER_INVALID */
export const invalidTransfer: TransferData = {
  amount: 'abc',
  fromAccountIndex: 0,
  toAccountIndex: 1,
};

/** TD_TRANSFER_SAME */
export const sameAccountTransfer: TransferData = {
  amount: '10.00',
  fromAccountIndex: 0,
  toAccountIndex: 0,
};

/** TD_TRANSFER_OVERDRAFT */
export const overdraftTransfer: TransferData = {
  amount: '9999999.00',
  fromAccountIndex: 0,
  toAccountIndex: 1,
};

/** TD_PAYEE_MISMATCH - only the two account fields differ from a valid payee. */
export const payeeMismatch = { accountNumber: '54321', verifyAccount: '12345' } as const;

/** TD_PAYEE_INVALID_AMT */
export const payeeInvalidAmount = 'abc';

/** TD_FIND_BY_AMOUNT - matches the TD_TRANSFER_01 amount. */
export const findByAmount = '25.00';

/** TD_FIND_NO_RESULT */
export const findNoResultDate = '01-01-2000';


/** TD_LOAN_APPROVED */
export const approvedLoan: LoanRequest = {
  loanAmount: '1000',
  downPayment: '50',
  fromAccountIndex: 0,
};

/** TD_LOAN_DENIED */
export const deniedLoan: LoanRequest = {
  loanAmount: '900000',
  downPayment: '800000',
  fromAccountIndex: 0,
};

/** TD_CONTACT_01 */
export const contactMessage: ContactMessage = {
  name: 'Aaron Weber',
  email: 'aaron.weber@example.com',
  phone: '5035550147',
  message: 'Please confirm my latest transfer.',
};

// ---------------------------------------------------------------------------
// TD_NAV_LINKS
// ---------------------------------------------------------------------------

export const topMenuLinks: NavLink[] = [
  { label: 'About Us', urlFragment: 'about.htm', heading: 'ParaSoft Demo Website', external: false },
  // The Services page renders its heading inside a <span class="heading">, not
  // an <h1>, so the assertion matches the right panel text rather than the title.
  { label: 'Services', urlFragment: 'services.htm', heading: 'Available Bookstore SOAP services', external: false },
  { label: 'Products', urlFragment: 'parasoft.com', external: true },
  { label: 'Locations', urlFragment: 'parasoft.com', external: true },
  { label: 'Admin Page', urlFragment: 'admin.htm', heading: 'Administration', external: false },
];

/** The eight Account Services links shown to an authenticated customer. */
export const accountServicesLinks = [
  'Open New Account',
  'Accounts Overview',
  'Transfer Funds',
  'Bill Pay',
  'Find Transactions',
  'Update Contact Info',
  'Request Loan',
  'Log Out',
] as const;

// ---------------------------------------------------------------------------
// Expected page titles and headings
// ---------------------------------------------------------------------------

export const titles = {
  home: 'ParaBank | Welcome | Online Banking',
  register: 'ParaBank | Register for Free Online Account Access',
  customerCreated: 'ParaBank | Customer Created',
  overview: 'ParaBank | Accounts Overview',
  openAccount: 'ParaBank | Open Account',
  accountActivity: 'ParaBank | Account Activity',
  transactionDetails: 'ParaBank | Transaction Details',
  transfer: 'ParaBank | Transfer Funds',
  billPay: 'ParaBank | Bill Pay',
  findTransactions: 'ParaBank | Find Transactions',
  updateProfile: 'ParaBank | Update Profile',
  requestLoan: 'ParaBank | Loan Request',
  lookup: 'ParaBank | Customer Lookup',
  contact: 'ParaBank | Customer Care',
} as const;

export const headings = {
  registerForm: 'Signing up is easy!',
  accountsOverview: 'Accounts Overview',
  openNewAccount: 'Open New Account',
  accountOpened: 'Account Opened!',
  accountDetails: 'Account Details',
  accountActivity: 'Account Activity',
  transactionDetails: 'Transaction Details',
  transferFunds: 'Transfer Funds',
  transferComplete: 'Transfer Complete!',
  billPayService: 'Bill Payment Service',
  billPaymentComplete: 'Bill Payment Complete',
  findTransactions: 'Find Transactions',
  transactionResults: 'Transaction Results',
  updateProfile: 'Update Profile',
  profileUpdated: 'Profile Updated',
  applyForLoan: 'Apply for a Loan',
  loanRequestProcessed: 'Loan Request Processed',
  customerLookup: 'Customer Lookup',
  customerCare: 'Customer Care',
  error: 'Error!',
} as const;

// ---------------------------------------------------------------------------
// Expected messages - every string verified against the live application
// ---------------------------------------------------------------------------

export const errors = {
  // Login
  badCredentials: 'The username and password could not be verified.',
  emptyLogin: 'Please enter a username and password.',

  // Registration
  passwordMismatch: 'Passwords did not match.',
  usernameTaken: 'This username already exists.',

  // Required-field validation, shared by Registration and Update Profile
  firstNameRequired: 'First name is required.',
  lastNameRequired: 'Last name is required.',
  addressRequired: 'Address is required.',
  cityRequired: 'City is required.',
  stateRequired: 'State is required.',
  zipCodeRequired: 'Zip Code is required.',
  ssnRequired: 'Social Security Number is required.',
  usernameRequired: 'Username is required.',
  passwordRequired: 'Password is required.',
  passwordConfirmationRequired: 'Password confirmation is required.',

  // Customer lookup
  customerNotFound: 'The customer information provided could not be found.',

  // Bill Pay
  payeeNameRequired: 'Payee name is required.',
  phoneNumberRequired: 'Phone number is required.',
  accountNumberRequired: 'Account number is required.',
  accountMismatch: 'The account numbers do not match.',
  validNumberRequired: 'Please enter a valid number.',
  amountCannotBeEmpty: 'The amount cannot be empty.',
  validAmountRequired: 'Please enter a valid amount.',

  /**
   * Rendered by the generic error panel whenever a services_proxy call fails.
   * On Transfer Funds this is what an empty or non-numeric amount actually
   * produces - see DEFECT-03 and DEFECT-04 in transferFunds.spec.ts.
   */
  internalError: 'An internal error has occurred and has been logged.',

  /**
   * DEVIATION: the specification quotes
   * 'You do not have enough funds available for the down payment.'
   * The application renders the string below instead.
   */
  insufficientDownPayment: 'You do not have sufficient funds for the given down payment.',
} as const;

export const messages = {
  registrationSuccess: 'Your account was created successfully.  You are now logged in.',
  accountOpened: 'Congratulations, your account is now open.',
  profileUpdated: 'Your updated address and phone number have been added to the system.',
  loanApproved: 'Congratulations, your loan has been approved.',
  /**
   * DEVIATION: the specification expects a successful Customer Lookup to print
   * 'Your username is <username> and password is <password>.' The application
   * no longer discloses the credentials - it logs the customer straight in and
   * renders the message below.
   */
  lookupSuccess: 'Your login information was located successfully. You are now logged in.',
  contactThankYou: (name: string) => `Thank you ${name}`,
  contactFollowUp: 'A Customer Care Representative will be contacting you.',
  noTransactions: 'No transactions found.',
} as const;

/** Column headings verified on the live tables. */
export const tableHeaders = {
  accountsOverview: ['Account', 'Balance*', 'Available Amount'],
  transactions: ['Date', 'Transaction', 'Debit (-)', 'Credit (+)'],
} as const;

/** Transaction descriptions ParaBank writes into the activity tables. */
export const transactionTypes = {
  fundsTransferSent: 'Funds Transfer Sent',
  fundsTransferReceived: 'Funds Transfer Received',
  billPayment: (payeeName: string) => `Bill Payment to ${payeeName}`,
} as const;
