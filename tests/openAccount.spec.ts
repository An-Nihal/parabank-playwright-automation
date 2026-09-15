import { test, expect } from '../src/fixtures/test-fixtures';
import {
  accountTypes,
  checkingAccount,
  savingsAccount,
  headings,
  messages,
  MINIMUM_DEPOSIT,
} from '../src/test-data/data';
import { toMoney } from '../src/utils/currency';

test.describe('Open New Account', () => {
  test(
    'TC_ONA_001 | Open a new CHECKING account',
    { tag: ['@P1', '@openAccount'] },
    async ({ openAccountPage, twoAccounts }) => {
      const fundingAccount = twoAccounts[checkingAccount.fromAccountIndex];

      await openAccountPage.goto();
      await openAccountPage.selectAccountType(accountTypes.CHECKING);
      await openAccountPage.selectFundingAccount(fundingAccount);
      await openAccountPage.submit();

      await expect(openAccountPage.resultTitle).toHaveText(headings.accountOpened);
      await expect(openAccountPage.resultMessage).toHaveText(messages.accountOpened);
      await expect(openAccountPage.newAccountLink).toHaveText(/^\d+$/);
    },
  );

  test(
    'TC_ONA_002 | Open a new SAVINGS account',
    { tag: ['@P1', '@openAccount'] },
    async ({ openAccountPage, accountDetailsPage, twoAccounts }) => {
      const fundingAccount = twoAccounts[savingsAccount.fromAccountIndex];

      await openAccountPage.goto();
      const newAccountId = await openAccountPage.openNewAccount(
        accountTypes.SAVINGS,
        fundingAccount,
      );

      await expect(openAccountPage.resultTitle).toHaveText(headings.accountOpened);
      expect(newAccountId).toMatch(/^\d+$/);

      await test.step('the new account is a SAVINGS account', async () => {
        await accountDetailsPage.goto(newAccountId);
        await expect(accountDetailsPage.accountType).toHaveText(accountTypes.SAVINGS);
      });
    },
  );

  test(
    'TC_ONA_003 | Newly opened account appears in Accounts Overview',
    { tag: ['@P1', '@openAccount', '@e2e'] },
    async ({ openAccountPage, overviewPage, twoAccounts }) => {
      const fundingAccount = twoAccounts[checkingAccount.fromAccountIndex];

      const newAccountId = await test.step('open a new CHECKING account', async () => {
        await openAccountPage.goto();
        return openAccountPage.openNewAccount(accountTypes.CHECKING, fundingAccount);
      });

      await overviewPage.goto();

      expect(await overviewPage.getAccountIds()).toContain(newAccountId);
      // 100.00 is ParaBank's fixed minimum opening deposit.
      expect(await overviewPage.getBalance(newAccountId)).toBe(MINIMUM_DEPOSIT);
    },
  );

  test(
    'TC_ONA_004 | Funding account is debited by the minimum deposit',
    { tag: ['@P2', '@openAccount', '@calculation'] },
    async ({ openAccountPage, overviewPage, freshAccount }) => {
      // freshAccount is private to this test, so no parallel worker can move
      // its balance between the two readings.
      const fundingAccount = freshAccount;

      const balanceBefore = await test.step('record the funding account balance', async () => {
        await overviewPage.goto();
        return overviewPage.getBalance(fundingAccount);
      });

      await test.step('open a new account funded from it', async () => {
        await openAccountPage.goto();
        await openAccountPage.openNewAccount(accountTypes.CHECKING, fundingAccount);
      });

      await overviewPage.goto();
      const balanceAfter = await overviewPage.getBalance(fundingAccount);

      expect(toMoney(balanceBefore - balanceAfter)).toBe(MINIMUM_DEPOSIT);
    },
  );

  test(
    'TC_ONA_005 | Funding dropdown lists all of the customer accounts',
    { tag: ['@P3', '@openAccount'] },
    async ({ openAccountPage, overviewPage, twoAccounts }) => {
      expect(twoAccounts).toHaveLength(2);

      await openAccountPage.goto();
      const offeredAccounts = await openAccountPage.getFundingAccountIds();

      await overviewPage.goto();
      const ownedAccounts = await overviewPage.getAccountIds();

      // Every option belongs to the logged in customer, and none belongs to
      // another. The overview is read second because a parallel worker can add
      // an account in between, never remove one.
      expect(offeredAccounts.length).toBeGreaterThanOrEqual(2);
      for (const offered of offeredAccounts) {
        expect(ownedAccounts).toContain(offered);
      }
    },
  );
});
