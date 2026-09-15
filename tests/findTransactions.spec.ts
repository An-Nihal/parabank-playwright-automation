import { test, expect } from '../src/fixtures/test-fixtures';
import { generateDateRange } from '../src/test-data/DataFactory';
import {
  validTransfer,
  findNoResultDate,
  emptyResultPlaceholder,
  headings,
  tableHeaders,
} from '../src/test-data/data';
import { formatCurrency, parseCurrency } from '../src/utils/currency';
import { isWithinRange } from '../src/utils/dates';

test.describe('Find Transactions', () => {
  test(
    'TC_FND_001 | Find a transaction by transaction ID',
    { tag: ['@P1', '@findTransactions'] },
    async ({ accountDetailsPage, findTransactionsPage, accountWithTransactions }) => {
      // The transaction id is captured from the application, never hardcoded.
      const transactionId = await test.step('capture a transaction id', async () => {
        await accountDetailsPage.goto(accountWithTransactions);
        await accountDetailsPage.waitForTransactions();
        await accountDetailsPage.openFirstTransaction();
        return (await accountDetailsPage.transactionDetail('Transaction ID:').innerText()).trim();
      });

      await findTransactionsPage.goto();
      await findTransactionsPage.selectAccount(accountWithTransactions);
      await findTransactionsPage.findByTransactionId(transactionId);
      await findTransactionsPage.waitForResults();

      await expect(findTransactionsPage.resultTitle).toHaveText(headings.transactionResults);
      await expect(findTransactionsPage.resultRows).toHaveCount(1);
    },
  );

  test(
    'TC_FND_002 | Find transactions by a single date',
    { tag: ['@P1', '@findTransactions'] },
    async ({ accountDetailsPage, findTransactionsPage, accountWithTransactions }) => {
      // The search date is taken from a transaction the application itself
      // dated. Deriving it from the local clock is wrong: ParaBank stamps
      // transactions in the server timezone, which can already be the previous
      // day while it is the next day here.
      const searchDate = await test.step('read a date the application stamped', async () => {
        await accountDetailsPage.goto(accountWithTransactions);
        const transactions = await accountDetailsPage.waitForTransactions();
        return transactions[transactions.length - 1].date;
      });

      await findTransactionsPage.goto();
      await findTransactionsPage.selectAccount(accountWithTransactions);
      await findTransactionsPage.findByDate(searchDate);
      await findTransactionsPage.waitForResults();

      await expect(findTransactionsPage.resultHeaders).toHaveText([
        ...tableHeaders.transactions,
      ]);

      const results = await findTransactionsPage.getResults();
      expect(results.length).toBeGreaterThan(0);
      for (const row of results) {
        expect(row.date).toBe(searchDate);
      }
    },
  );

  test(
    'TC_FND_003 | Find transactions by a date range',
    { tag: ['@P2', '@findTransactions'] },
    async ({ findTransactionsPage, accountWithTransactions }) => {
      // A range wide enough to bracket the server date whichever side of
      // midnight the local clock is on.
      const { fromDate, toDate } = generateDateRange();

      await findTransactionsPage.goto();
      await findTransactionsPage.selectAccount(accountWithTransactions);
      await findTransactionsPage.findByDateRange(fromDate, toDate);
      await findTransactionsPage.waitForResults();

      const results = await findTransactionsPage.getResults();
      expect(results.length).toBeGreaterThan(0);
      for (const row of results) {
        expect(isWithinRange(row.date, fromDate, toDate)).toBe(true);
      }
    },
  );

  test(
    'TC_FND_004 | Find transactions by amount',
    { tag: ['@P2', '@findTransactions'] },
    async ({ transferPage, findTransactionsPage, freshAccountPair }) => {
      const [from, to] = freshAccountPair;
      const amount = validTransfer.amount;

      await test.step('create a transaction of the searched amount', async () => {
        await transferPage.goto();
        await transferPage.transferAndWait(amount, from, to);
      });

      await findTransactionsPage.goto();
      await findTransactionsPage.selectAccount(from);
      await findTransactionsPage.findByAmount(amount);
      await findTransactionsPage.waitForResults();

      const expected = formatCurrency(parseCurrency(amount));
      const results = await findTransactionsPage.getResults();
      expect(results.length).toBeGreaterThan(0);
      for (const row of results) {
        expect([row.debit, row.credit]).toContain(expected);
      }
    },
  );

  test(
    'TC_FND_005 | Search with no criteria entered',
    { tag: ['@P2', '@findTransactions'] },
    async ({ findTransactionsPage, accountWithTransactions }) => {
      await findTransactionsPage.goto();
      await findTransactionsPage.selectAccount(accountWithTransactions);
      await findTransactionsPage.searchWithNoCriteria();

      // No search is performed: a validation error is shown and the form stays put.
      await expect(findTransactionsPage.dateError).not.toBeEmpty();
      await expect(findTransactionsPage.formContainer).toBeVisible();
      await expect(findTransactionsPage.resultContainer).toBeHidden();
    },
  );

  test(
    'TC_FND_006 | Search a date on which no transaction exists',
    { tag: ['@P3', '@findTransactions'] },
    async ({ findTransactionsPage, accountWithTransactions }) => {
      await findTransactionsPage.goto();
      await findTransactionsPage.selectAccount(accountWithTransactions);
      await findTransactionsPage.findByDate(findNoResultDate);
      await findTransactionsPage.waitForResults();

      // DEFECT-08. The result table should be empty. ParaBank renders its row
      // template once against an undefined result instead, so a search that
      // matched nothing reports a transaction dated NaN-NaN-NaN with no
      // description - which a customer would read as a real, corrupt entry.
      //
      // Asserted as it actually behaves, on instruction, with the correct
      // expectation kept here so it is one edit away once ParaBank is fixed:
      //   await expect(findTransactionsPage.resultRows).toHaveCount(0);
      await expect(findTransactionsPage.resultRows).toHaveCount(1);
      await expect(findTransactionsPage.resultRows.first()).toContainText(
        emptyResultPlaceholder.date,
      );
      await expect(findTransactionsPage.resultRows.first()).toContainText(
        emptyResultPlaceholder.transaction,
      );
      // The application does not error out, at least.
      await expect(findTransactionsPage.errorContainer).toBeHidden();
    },
  );
});
