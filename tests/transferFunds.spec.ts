import { test, expect } from '../src/fixtures/test-fixtures';
import {
  validTransfer,
  invalidTransfer,
  sameAccountTransfer,
  overdraftTransfer,
  headings,
  errors,
  transactionTypes,
} from '../src/test-data/data';
import { formatCurrency, parseCurrency, toMoney } from '../src/utils/currency';

test.describe('Transfer Funds', () => {
  test(
    'TC_TRF_001 | Transfer a valid amount between two of the customer accounts',
    { tag: ['@P1', '@transferFunds'] },
    async ({ transferPage, freshAccountPair }) => {
      const [from, to] = freshAccountPair;

      await transferPage.goto();
      await transferPage.transferAndWait(validTransfer.amount, from, to);

      await expect(transferPage.resultTitle).toHaveText(headings.transferComplete);
      await expect(transferPage.resultAmount).toHaveText(
        formatCurrency(parseCurrency(validTransfer.amount)),
      );
      await expect(transferPage.resultFromAccount).toHaveText(from);
      await expect(transferPage.resultToAccount).toHaveText(to);
    },
  );

  test(
    'TC_TRF_002 | Both account balances update correctly after a transfer',
    { tag: ['@P1', '@transferFunds', '@calculation'] },
    async ({ transferPage, overviewPage, freshAccountPair }) => {
      // Both accounts are private to this test, so the only balance movement
      // between the two readings is the transfer under test.
      const [from, to] = freshAccountPair;
      const amount = parseCurrency(validTransfer.amount);

      const [fromBefore, toBefore] = await test.step('record both balances', async () => {
        await overviewPage.goto();
        return [await overviewPage.getBalance(from), await overviewPage.getBalance(to)];
      });

      await test.step('transfer a known amount', async () => {
        await transferPage.goto();
        await transferPage.transferAndWait(validTransfer.amount, from, to);
      });

      await overviewPage.goto();
      const fromAfter = await overviewPage.getBalance(from);
      const toAfter = await overviewPage.getBalance(to);

      expect(toMoney(fromBefore - fromAfter)).toBe(amount);
      expect(toMoney(toAfter - toBefore)).toBe(amount);
    },
  );

  test(
    'TC_TRF_003 | Transfer with an empty amount',
    { tag: ['@P1', '@transferFunds'] },
    async ({ transferPage, overviewPage, freshAccountPair }) => {
      const [from, to] = freshAccountPair;

      const balanceBefore = await test.step('record the source balance', async () => {
        await overviewPage.goto();
        return overviewPage.getBalance(from);
      });

      await transferPage.goto();
      await transferPage.transfer('', from, to);

      // DEFECT-03: the specification expects the rejection to read
      // 'The amount cannot be empty.' ParaBank ships that message in the page
      // but hides it behind a selector that never matches ($('#amount.errors')
      // targets an element with id "amount" AND class "errors", which does not
      // exist), so the empty amount reaches the server, comes back 400, and the
      // generic error panel is shown instead. Asserted as it actually behaves.
      await expect(transferPage.errorPanel).toBeVisible();
      await expect(transferPage.errorTitle).toHaveText(headings.error);
      await expect(transferPage.transferError).toHaveText(errors.internalError);
      await expect(transferPage.resultPanel).toBeHidden();

      // The transfer was rejected: no balance changed.
      await overviewPage.goto();
      expect(await overviewPage.getBalance(from)).toBe(balanceBefore);
    },
  );

  test(
    'TC_TRF_004 | Transfer with a non numeric amount',
    { tag: ['@P2', '@transferFunds'] },
    async ({ transferPage, overviewPage, freshAccountPair }) => {
      const [from, to] = freshAccountPair;

      const balanceBefore = await test.step('record the source balance', async () => {
        await overviewPage.goto();
        return overviewPage.getBalance(from);
      });

      await transferPage.goto();
      await transferPage.transfer(invalidTransfer.amount, from, to);

      // DEFECT-04: same root cause as DEFECT-03. The specification expects a
      // validation error ('Please enter a valid amount.'); the application
      // surfaces the generic error panel instead.
      await expect(transferPage.errorPanel).toBeVisible();
      await expect(transferPage.transferError).toHaveText(errors.internalError);
      await expect(transferPage.resultPanel).toBeHidden();

      await overviewPage.goto();
      expect(await overviewPage.getBalance(from)).toBe(balanceBefore);
    },
  );

  test(
    'TC_TRF_005 | Transfer to the same account as the source',
    { tag: ['@P2', '@transferFunds', '@partial'] },
    async ({ transferPage, overviewPage, freshAccount }) => {
      const account = freshAccount;

      const balanceBefore = await test.step('record the balance', async () => {
        await overviewPage.goto();
        return overviewPage.getBalance(account);
      });

      await transferPage.goto();
      await transferPage.transferAndWait(sameAccountTransfer.amount, account, account);

      // DEFECT-01: expected by business rule, a transfer whose source and
      // destination are the same account is rejected. ParaBank accepts it.
      // The actual behaviour is asserted so CI stays green; the missing rule is
      // the defect.
      await expect(transferPage.resultTitle).toHaveText(headings.transferComplete);
      await expect(transferPage.resultFromAccount).toHaveText(account);
      await expect(transferPage.resultToAccount).toHaveText(account);

      // Money moved from the account to itself, so the balance is unchanged.
      await overviewPage.goto();
      expect(await overviewPage.getBalance(account)).toBe(balanceBefore);
    },
  );

  test(
    'TC_TRF_006 | Transfer an amount larger than the source balance',
    { tag: ['@P2', '@transferFunds', '@partial'] },
    async ({ transferPage, overviewPage, freshAccountPair }) => {
      const [from, to] = freshAccountPair;
      const amount = parseCurrency(overdraftTransfer.amount);

      const balanceBefore = await test.step('record the source balance', async () => {
        await overviewPage.goto();
        return overviewPage.getBalance(from);
      });
      expect(balanceBefore).toBeLessThan(amount);

      await transferPage.goto();
      await transferPage.transferAndWait(overdraftTransfer.amount, from, to);

      // DEFECT-02: expected by business rule, an overdraft is rejected with an
      // 'insufficient funds' error. ParaBank completes the transfer and lets the
      // source account go negative. Asserted as it actually behaves.
      await expect(transferPage.resultTitle).toHaveText(headings.transferComplete);

      await overviewPage.goto();
      const balanceAfter = await overviewPage.getBalance(from);
      expect(toMoney(balanceBefore - balanceAfter)).toBe(amount);
      expect(balanceAfter).toBeLessThan(0);

      // Put the money back. ParaBank is a shared instance and it will not
      // refuse this, so leaving an account millions overdrawn would degrade the
      // demo for everyone - and for the later loan tests, which depend on the
      // customer's funds. The defect above is already asserted.
      await test.step('restore the overdrawn balance', async () => {
        await transferPage.goto();
        await transferPage.transferAndWait(overdraftTransfer.amount, to, from);
      });
    },
  );

  test(
    'TC_TRF_007 | Transfer is recorded in both accounts transaction history',
    { tag: ['@P2', '@transferFunds', '@e2e'] },
    async ({ transferPage, accountDetailsPage, freshAccountPair }) => {
      const [from, to] = freshAccountPair;
      const expectedAmount = formatCurrency(parseCurrency(validTransfer.amount));

      await test.step('complete a transfer', async () => {
        await transferPage.goto();
        await transferPage.transferAndWait(validTransfer.amount, from, to);
      });

      await test.step('the source account shows a Funds Transfer Sent debit', async () => {
        await accountDetailsPage.goto(from);
        const transactions = await accountDetailsPage.waitForTransactions();
        const sent = transactions.find(
          (row) =>
            row.description === transactionTypes.fundsTransferSent &&
            row.debit === expectedAmount,
        );
        expect(sent).toBeDefined();
      });

      await test.step('the destination account shows a Funds Transfer Received credit', async () => {
        await accountDetailsPage.goto(to);
        const transactions = await accountDetailsPage.waitForTransactions();
        const received = transactions.find(
          (row) =>
            row.description === transactionTypes.fundsTransferReceived &&
            row.credit === expectedAmount,
        );
        expect(received).toBeDefined();
      });
    },
  );
});
