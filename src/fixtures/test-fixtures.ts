import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ForgotLoginPage } from '../pages/ForgotLoginPage';
import { AccountsOverviewPage } from '../pages/AccountsOverviewPage';
import { OpenAccountPage } from '../pages/OpenAccountPage';
import { AccountDetailsPage } from '../pages/AccountDetailsPage';
import { TransferFundsPage } from '../pages/TransferFundsPage';
import { BillPayPage } from '../pages/BillPayPage';
import { FindTransactionsPage } from '../pages/FindTransactionsPage';
import { UpdateProfilePage } from '../pages/UpdateProfilePage';
import { RequestLoanPage } from '../pages/RequestLoanPage';
import { ContactUsPage } from '../pages/ContactUsPage';
import { User, accountTypes } from '../test-data/data';
import { login, logout, chooseUser, getAccountIds, bestFundedAccount } from './session';

/**
 * Custom fixtures for the ParaBank suite.
 *
 * Two groups:
 *
 *  - Page objects, one per screen, so a spec reads
 *    `async ({ loginPage, overviewPage }) => ...` and never constructs anything.
 *
 *  - Session and account fixtures. `signedIn` opens a session for the test and
 *    closes it again afterwards; the account fixtures build on it to hand a test
 *    accounts no other test can disturb.
 *
 * A spec that must stay anonymous (registration, login, customer lookup, the
 * public navigation cases) simply does not request `signedIn`.
 */
export interface ParaBankFixtures {
  loginPage: LoginPage;
  registerPage: RegisterPage;
  forgotLoginPage: ForgotLoginPage;
  overviewPage: AccountsOverviewPage;
  openAccountPage: OpenAccountPage;
  accountDetailsPage: AccountDetailsPage;
  transferPage: TransferFundsPage;
  billPayPage: BillPayPage;
  findTransactionsPage: FindTransactionsPage;
  updateProfilePage: UpdateProfilePage;
  requestLoanPage: RequestLoanPage;
  contactUsPage: ContactUsPage;

  /**
   * Opens an authenticated session for this test and returns the customer it
   * signed in as. The session is closed - logged out server side and cookies
   * cleared - as soon as the test finishes, pass or fail.
   */
  signedIn: User;

  /**
   * Ids of the signed-in customer's accounts, guaranteeing at least two exist so
   * a transfer has a distinct source and destination.
   */
  twoAccounts: [string, string];

  /**
   * A long-lived account that already carries transaction history. Read-only
   * tests use this instead of opening an account, which keeps the suite well
   * inside the demo rate limit (ENV-02).
   */
  accountWithTransactions: string;

  /**
   * A brand new account opened for this test alone, holding the minimum deposit.
   * Balance assertions need an account no parallel worker can touch.
   */
  freshAccount: string;

  /** Two brand new accounts opened for this test alone, each holding the minimum deposit. */
  freshAccountPair: [string, string];
}

export const test = base.extend<ParaBankFixtures>({
  // --- Page objects ------------------------------------------------------
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  registerPage: async ({ page }, use) => {
    await use(new RegisterPage(page));
  },
  forgotLoginPage: async ({ page }, use) => {
    await use(new ForgotLoginPage(page));
  },
  overviewPage: async ({ page }, use) => {
    await use(new AccountsOverviewPage(page));
  },
  openAccountPage: async ({ page }, use) => {
    await use(new OpenAccountPage(page));
  },
  accountDetailsPage: async ({ page }, use) => {
    await use(new AccountDetailsPage(page));
  },
  transferPage: async ({ page }, use) => {
    await use(new TransferFundsPage(page));
  },
  billPayPage: async ({ page }, use) => {
    await use(new BillPayPage(page));
  },
  findTransactionsPage: async ({ page }, use) => {
    await use(new FindTransactionsPage(page));
  },
  updateProfilePage: async ({ page }, use) => {
    await use(new UpdateProfilePage(page));
  },
  requestLoanPage: async ({ page }, use) => {
    await use(new RequestLoanPage(page));
  },
  contactUsPage: async ({ page }, use) => {
    await use(new ContactUsPage(page));
  },

  // --- Session -----------------------------------------------------------

  /**
   * Log in before the test, log out after it.
   *
   * The teardown half is the important one. ParaBank ends a session server side
   * on logout, so leaving sessions open would both leak state between tests and
   * pile sessions up on a shared demo. Everything after `use()` runs even when
   * the test fails, so the logout is not skipped on a red test.
   */
  signedIn: async ({ page, context }, use) => {
    const user = chooseUser();
    await login(page, user);

    await use(user);

    await logout(page, context);
  },

  // --- Accounts ----------------------------------------------------------

  /**
   * Guarantees the signed-in customer owns at least two accounts, opening one if
   * it does not, and hands back the first two ids.
   *
   * The ids are cached into the user registry on the way through, so a later run
   * can see what this customer owns without another round trip.
   */
  twoAccounts: async ({ page, signedIn }, use) => {
    let ids = await getAccountIds(page, signedIn);

    if (ids.length < 2) {
      const openAccount = new OpenAccountPage(page);
      await openAccount.goto();
      await openAccount.openNewAccount(accountTypes.CHECKING);
      ids = await getAccountIds(page, signedIn);
    }

    await use([ids[0], ids[1]]);
  },

  accountWithTransactions: async ({ twoAccounts }, use) => {
    // The customer's first account: long-lived, so it has history to read.
    await use(twoAccounts[0]);
  },

  /**
   * A private account, funded from the customer's own.
   *
   * Balance-delta tests need this. The customer's accounts move under a running
   * test - other tests open accounts against them, and on a shared demo other
   * people do too - so measuring a delta on them is not trustworthy.
   */
  freshAccount: async ({ page, twoAccounts }, use) => {
    // twoAccounts is depended on so the customer is known to own accounts; the
    // deposit is then taken from the best funded of them (see bestFundedAccount).
    expect(twoAccounts.length).toBe(2);
    const source = await bestFundedAccount(page);
    const openAccount = new OpenAccountPage(page);
    await openAccount.goto();
    const id = await openAccount.openNewAccount(accountTypes.CHECKING, source);
    await use(id);
  },

  freshAccountPair: async ({ page, twoAccounts }, use) => {
    expect(twoAccounts.length).toBe(2);
    const source = await bestFundedAccount(page);
    const openAccount = new OpenAccountPage(page);
    await openAccount.goto();
    const first = await openAccount.openNewAccount(accountTypes.CHECKING, source);
    await openAccount.goto();
    const second = await openAccount.openNewAccount(accountTypes.CHECKING, source);
    await use([first, second]);
  },
});

export { expect };
