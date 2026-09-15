import { test, expect } from '../src/fixtures/test-fixtures';
import { headings, tableHeaders } from '../src/test-data/data';
import { toMoney } from '../src/utils/currency';

test.describe('Accounts Overview', () => {
  test(
    'TC_ACO_001 | Accounts Overview table structure and content',
    { tag: ['@P1', '@accountsOverview'] },
    // `signedIn` opens the session and closes it again after the test.
    async ({ overviewPage, signedIn }) => {
      expect(signedIn.username).not.toBe('');
      await overviewPage.goto();

      await expect(overviewPage.heading).toHaveText(headings.accountsOverview);
      await expect(overviewPage.tableHeaders).toHaveText([...tableHeaders.accountsOverview]);

      // Every account row holds a clickable account number and two currency values.
      const rows = await overviewPage.getAccountRows();
      expect(rows.length).toBeGreaterThan(0);

      const currency = /^-?\$[\d,]+\.\d{2}$/;
      for (const row of rows) {
        expect(row.id).toMatch(/^\d+$/);
        expect(row.balance).toMatch(currency);
        expect(row.available).toMatch(currency);
      }

      // A Total row is shown at the bottom.
      await expect(overviewPage.totalRow).toHaveCount(1);
      await expect(overviewPage.totalRow).toContainText('Total');
    },
  );

  test(
    'TC_ACO_002 | Total row equals the sum of the individual account balances',
    { tag: ['@P1', '@accountsOverview', '@calculation'] },
    async ({ overviewPage, twoAccounts }) => {
      // twoAccounts guarantees the customer owns two or more accounts.
      expect(twoAccounts).toHaveLength(2);

      await overviewPage.goto();

      const sumOfBalances = await overviewPage.getSumOfBalances();
      const total = await overviewPage.getTotalBalance();

      expect(toMoney(total)).toBe(toMoney(sumOfBalances));
    },
  );

  test(
    'TC_ACO_003 | Open an account from the overview table',
    { tag: ['@P1', '@accountsOverview'] },
    async ({ overviewPage, accountDetailsPage, signedIn }) => {
      expect(signedIn.username).not.toBe('');
      await overviewPage.goto();
      const accountId = await overviewPage.openFirstAccount();

      await expect(overviewPage.page).toHaveURL(
        new RegExp(`activity\\.htm\\?id=${accountId}`),
      );
      await accountDetailsPage.waitForDetails();
      await expect(accountDetailsPage.accountNumber).toHaveText(accountId);
    },
  );
});
