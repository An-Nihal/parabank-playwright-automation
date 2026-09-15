# Traceability Matrix

Every test case from `ParaBank_Test_Case_Documentation.pdf` mapped to the spec file and test title that implements it.

Each test is titled with its TC ID, so a report line and a documentation row always line up. Run one case with:

```bash
npx playwright test --grep TC_TRF_002
```

**63 of 63 test cases implemented.** Priority split: 32 P1 / 22 P2 / 9 P3.

## Registration  (7)

| TC ID | Test title | Priority | Spec file | Tags |
|---|---|---|---|---|
| `TC_REG_001` | Register a new customer with valid unique data | P1 | [`register.spec.ts`](../tests/register.spec.ts) | @register |
| `TC_REG_002` | Submit the registration form with all fields empty | P1 | [`register.spec.ts`](../tests/register.spec.ts) | @register |
| `TC_REG_003` | Register with Password and Confirm that do not match | P1 | [`register.spec.ts`](../tests/register.spec.ts) | @register |
| `TC_REG_004` | Register with a username that already exists | P1 | [`register.spec.ts`](../tests/register.spec.ts) | @register |
| `TC_REG_005` | Register with only the First Name missing | P2 | [`register.spec.ts`](../tests/register.spec.ts) | @register |
| `TC_REG_006` | Navigate to the Register page from the Home page | P2 | [`register.spec.ts`](../tests/register.spec.ts) | @register @navigation |
| `TC_REG_007` | Newly registered customer can log out and log back in | P1 | [`register.spec.ts`](../tests/register.spec.ts) | @register @e2e |

## Login / Logout  (7)

| TC ID | Test title | Priority | Spec file | Tags |
|---|---|---|---|---|
| `TC_LGN_001` | Log in with valid credentials | P1 | [`login.spec.ts`](../tests/login.spec.ts) | @login |
| `TC_LGN_002` | Log in with a valid username and a wrong password | P1 | [`login.spec.ts`](../tests/login.spec.ts) | @login |
| `TC_LGN_003` | Log in with a username that does not exist | P1 | [`login.spec.ts`](../tests/login.spec.ts) | @login |
| `TC_LGN_004` | Submit the login form with both fields empty | P2 | [`login.spec.ts`](../tests/login.spec.ts) | @login |
| `TC_LGN_005` | Log out from an authenticated session | P1 | [`login.spec.ts`](../tests/login.spec.ts) | @login |
| `TC_LGN_006` | Password field masks the typed value | P3 | [`login.spec.ts`](../tests/login.spec.ts) | @login |
| `TC_LGN_007` | Open a protected page directly without an active session | P1 | [`login.spec.ts`](../tests/login.spec.ts) | @login @security |

## Forgot Login Info  (3)

| TC ID | Test title | Priority | Spec file | Tags |
|---|---|---|---|---|
| `TC_FLI_001` | Retrieve login details with matching customer information | P2 | [`forgotLogin.spec.ts`](../tests/forgotLogin.spec.ts) | @forgotLogin |
| `TC_FLI_002` | Retrieve login details with information that matches no customer | P2 | [`forgotLogin.spec.ts`](../tests/forgotLogin.spec.ts) | @forgotLogin |
| `TC_FLI_003` | Submit the lookup form with empty fields | P3 | [`forgotLogin.spec.ts`](../tests/forgotLogin.spec.ts) | @forgotLogin |

## Accounts Overview  (3)

| TC ID | Test title | Priority | Spec file | Tags |
|---|---|---|---|---|
| `TC_ACO_001` | Accounts Overview table structure and content | P1 | [`accountsOverview.spec.ts`](../tests/accountsOverview.spec.ts) | @accountsOverview |
| `TC_ACO_002` | Total row equals the sum of the individual account balances | P1 | [`accountsOverview.spec.ts`](../tests/accountsOverview.spec.ts) | @accountsOverview @calculation |
| `TC_ACO_003` | Open an account from the overview table | P1 | [`accountsOverview.spec.ts`](../tests/accountsOverview.spec.ts) | @accountsOverview |

## Open New Account  (5)

| TC ID | Test title | Priority | Spec file | Tags |
|---|---|---|---|---|
| `TC_ONA_001` | Open a new CHECKING account | P1 | [`openAccount.spec.ts`](../tests/openAccount.spec.ts) | @openAccount |
| `TC_ONA_002` | Open a new SAVINGS account | P1 | [`openAccount.spec.ts`](../tests/openAccount.spec.ts) | @openAccount |
| `TC_ONA_003` | Newly opened account appears in Accounts Overview | P1 | [`openAccount.spec.ts`](../tests/openAccount.spec.ts) | @openAccount @e2e |
| `TC_ONA_004` | Funding account is debited by the minimum deposit | P2 | [`openAccount.spec.ts`](../tests/openAccount.spec.ts) | @openAccount @calculation |
| `TC_ONA_005` | Funding dropdown lists all of the customer accounts | P3 | [`openAccount.spec.ts`](../tests/openAccount.spec.ts) | @openAccount |

## Account Details  (4)

| TC ID | Test title | Priority | Spec file | Tags |
|---|---|---|---|---|
| `TC_ACD_001` | Account Details page shows the account summary | P1 | [`accountDetails.spec.ts`](../tests/accountDetails.spec.ts) | @accountDetails |
| `TC_ACD_002` | Transaction table columns on the Account Details page | P2 | [`accountDetails.spec.ts`](../tests/accountDetails.spec.ts) | @accountDetails |
| `TC_ACD_003` | Opening transaction is recorded on a newly opened account | P2 | [`accountDetails.spec.ts`](../tests/accountDetails.spec.ts) | @accountDetails @e2e |
| `TC_ACD_004` | Open a single transaction from the account activity list | P3 | [`accountDetails.spec.ts`](../tests/accountDetails.spec.ts) | @accountDetails |

## Transfer Funds  (7)

| TC ID | Test title | Priority | Spec file | Tags |
|---|---|---|---|---|
| `TC_TRF_001` | Transfer a valid amount between two of the customer accounts | P1 | [`transferFunds.spec.ts`](../tests/transferFunds.spec.ts) | @transferFunds |
| `TC_TRF_002` | Both account balances update correctly after a transfer | P1 | [`transferFunds.spec.ts`](../tests/transferFunds.spec.ts) | @transferFunds @calculation |
| `TC_TRF_003` | Transfer with an empty amount | P1 | [`transferFunds.spec.ts`](../tests/transferFunds.spec.ts) | @transferFunds |
| `TC_TRF_004` | Transfer with a non numeric amount | P2 | [`transferFunds.spec.ts`](../tests/transferFunds.spec.ts) | @transferFunds |
| `TC_TRF_005` | Transfer to the same account as the source | P2 | [`transferFunds.spec.ts`](../tests/transferFunds.spec.ts) | @transferFunds @partial |
| `TC_TRF_006` | Transfer an amount larger than the source balance | P2 | [`transferFunds.spec.ts`](../tests/transferFunds.spec.ts) | @transferFunds @partial |
| `TC_TRF_007` | Transfer is recorded in both accounts transaction history | P2 | [`transferFunds.spec.ts`](../tests/transferFunds.spec.ts) | @transferFunds @e2e |

## Bill Pay  (6)

| TC ID | Test title | Priority | Spec file | Tags |
|---|---|---|---|---|
| `TC_BIL_001` | Pay a bill with valid payee details | P1 | [`billPay.spec.ts`](../tests/billPay.spec.ts) | @billPay |
| `TC_BIL_002` | Source account is debited by the paid amount | P1 | [`billPay.spec.ts`](../tests/billPay.spec.ts) | @billPay @calculation |
| `TC_BIL_003` | Submit the Bill Pay form with all fields empty | P1 | [`billPay.spec.ts`](../tests/billPay.spec.ts) | @billPay |
| `TC_BIL_004` | Account # and Verify Account # do not match | P1 | [`billPay.spec.ts`](../tests/billPay.spec.ts) | @billPay |
| `TC_BIL_005` | Bill Pay with a non numeric amount | P2 | [`billPay.spec.ts`](../tests/billPay.spec.ts) | @billPay |
| `TC_BIL_006` | Bill payment appears in the account transaction history | P2 | [`billPay.spec.ts`](../tests/billPay.spec.ts) | @billPay @e2e |

## Find Transactions  (6)

| TC ID | Test title | Priority | Spec file | Tags |
|---|---|---|---|---|
| `TC_FND_001` | Find a transaction by transaction ID | P1 | [`findTransactions.spec.ts`](../tests/findTransactions.spec.ts) | @findTransactions |
| `TC_FND_002` | Find transactions by a single date | P1 | [`findTransactions.spec.ts`](../tests/findTransactions.spec.ts) | @findTransactions |
| `TC_FND_003` | Find transactions by a date range | P2 | [`findTransactions.spec.ts`](../tests/findTransactions.spec.ts) | @findTransactions |
| `TC_FND_004` | Find transactions by amount | P2 | [`findTransactions.spec.ts`](../tests/findTransactions.spec.ts) | @findTransactions |
| `TC_FND_005` | Search with no criteria entered | P2 | [`findTransactions.spec.ts`](../tests/findTransactions.spec.ts) | @findTransactions |
| `TC_FND_006` | Search a date on which no transaction exists | P3 | [`findTransactions.spec.ts`](../tests/findTransactions.spec.ts) | @findTransactions |

## Update Contact Info  (4)

| TC ID | Test title | Priority | Spec file | Tags |
|---|---|---|---|---|
| `TC_UPD_001` | Profile form is pre-populated with the current customer details | P2 | [`updateProfile.spec.ts`](../tests/updateProfile.spec.ts) | @updateProfile |
| `TC_UPD_002` | Update the profile with valid new data | P1 | [`updateProfile.spec.ts`](../tests/updateProfile.spec.ts) | @updateProfile |
| `TC_UPD_003` | Clear a required field and submit | P2 | [`updateProfile.spec.ts`](../tests/updateProfile.spec.ts) | @updateProfile |
| `TC_UPD_004` | Updated values persist after reload | P2 | [`updateProfile.spec.ts`](../tests/updateProfile.spec.ts) | @updateProfile @e2e |

## Request Loan  (4)

| TC ID | Test title | Priority | Spec file | Tags |
|---|---|---|---|---|
| `TC_LON_001` | Request a loan that qualifies for approval | P1 | [`requestLoan.spec.ts`](../tests/requestLoan.spec.ts) | @requestLoan |
| `TC_LON_002` | Request a loan that is denied | P1 | [`requestLoan.spec.ts`](../tests/requestLoan.spec.ts) | @requestLoan |
| `TC_LON_003` | Approved loan creates a new account | P2 | [`requestLoan.spec.ts`](../tests/requestLoan.spec.ts) | @requestLoan @e2e |
| `TC_LON_004` | Submit the loan form with an empty amount | P3 | [`requestLoan.spec.ts`](../tests/requestLoan.spec.ts) | @requestLoan |

## Global / Navigation  (7)

| TC ID | Test title | Priority | Spec file | Tags |
|---|---|---|---|---|
| `TC_NAV_001` | Home page title and landing URL | P1 | [`navigation.spec.ts`](../tests/navigation.spec.ts) | @navigation @smoke |
| `TC_NAV_002` | Top menu items open the correct pages | P2 | [`navigation.spec.ts`](../tests/navigation.spec.ts) | @navigation |
| `TC_NAV_003` | ParaBank logo returns to the Home page | P3 | [`navigation.spec.ts`](../tests/navigation.spec.ts) | @navigation |
| `TC_NAV_004` | Account Services menu is complete after login | P1 | [`navigation.spec.ts`](../tests/navigation.spec.ts) | @navigation |
| `TC_NAV_005` | Submit the Contact Us form | P3 | [`navigation.spec.ts`](../tests/navigation.spec.ts) | @navigation |
| `TC_NAV_006` | Footer links are reachable | P3 | [`navigation.spec.ts`](../tests/navigation.spec.ts) | @navigation |
| `TC_NAV_007` | Session is invalidated after logout | P1 | [`navigation.spec.ts`](../tests/navigation.spec.ts) | @navigation @security |

