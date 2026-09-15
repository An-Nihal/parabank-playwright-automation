import { test, expect } from '../src/fixtures/test-fixtures';
import {
  accountTypes,
  checkingAccount,
  headings,
  tableHeaders,
  transactionTypes,
  MINIMUM_DEPOSIT,
} from '../src/test-data/data';
import { formatCurrency } from '../src/utils/currency';

test.describe('Account Details', () => {
  test(
    'TC_ACD_001 | Account Details page shows the account summary',
    { tag: ['@P1', '@accountDetails'] },
    async ({ overviewPage, accountDetailsPage, signedIn }) => {
      expect(signedIn.username).not.toBe('');
      await overviewPage.goto();
      const accountId = await overviewPage.openFirstAccount();

      await accountDetailsPage.waitForDetails();

      await expect(accountDetailsPage.heading).toHaveText(headings.accountDetails);
      // The account number matches the one clicked.
      await expect(accountDetailsPage.accountNumber).toHaveText(accountId);
      await expect(accountDetailsPage.accountType).toHaveText(/CHECKING|SAVINGS|LOAN/);
      await expect(accountDetailsPage.balance).toHaveText(/^-?\$[\d,]+\.\d{2}$/);
      await expect(accountDetailsPage.availableBalance).toHaveText(/^-?\$[\d,]+\.\d{2}$/);
    },
  );

  test(
    'TC_ACD_002 | Transaction table columns on the Account Details page',
    { tag: ['@P2', '@accountDetails'] },
    async ({ accountDetailsPage, accountWithTransactions }) => {
      await accountDetailsPage.goto(accountWithTransactions);

      await expect(accountDetailsPage.activityTitle).toHaveText(headings.accountActivity);
      await expect(accountDetailsPage.transactionHeaders).toHaveText([
        ...tableHeaders.transactions,
      ]);

      // Each row carries a clickable transaction description.
      const transactions = await accountDetailsPage.waitForTransactions();
      expect(transactions.length).toBeGreaterThan(0);
      await expect(accountDetailsPage.transactionLinks).toHaveCount(transactions.length);
    },
  );

  test(
    'TC_ACD_003 | Opening transaction is recorded on a newly opened account',
    { tag: ['@P2', '@accountDetails', '@e2e'] },
    async ({ openAccountPage, accountDetailsPage, twoAccounts }) => {
      const newAccountId = await test.step('open a new CHECKING account', async () => {
        await openAccountPage.goto();
        return openAccountPage.openNewAccount(
          accountTypes.CHECKING,
          twoAccounts[checkingAccount.fromAccountIndex],
        );
      });

      await accountDetailsPage.goto(newAccountId);
      const transactions = await accountDetailsPage.waitForTransactions();

      const openingCredit = transactions.find(
        (row) => row.description === transactionTypes.fundsTransferReceived,
      );
      expect(openingCredit).toBeDefined();
      expect(openingCredit?.credit).toBe(formatCurrency(MINIMUM_DEPOSIT));
      // It is a credit, not a debit.
      expect(openingCredit?.debit).toBe('');
    },
  );

  test(
    'TC_ACD_004 | Open a single transaction from the account activity list',
    { tag: ['@P3', '@accountDetails'] },
    async ({ accountDetailsPage, accountWithTransactions }) => {
      await accountDetailsPage.goto(accountWithTransactions);
      await accountDetailsPage.waitForTransactions();
      await accountDetailsPage.openFirstTransaction();

      await expect(accountDetailsPage.page).toHaveURL(/transaction\.htm\?id=\d+/);
      await expect(accountDetailsPage.transactionDetailsTitle).toHaveText(
        headings.transactionDetails,
      );

      for (const label of ['Transaction ID:', 'Date:', 'Description:', 'Type:', 'Amount:']) {
        await expect(accountDetailsPage.transactionDetail(label)).not.toBeEmpty();
      }
    },
  );
});
