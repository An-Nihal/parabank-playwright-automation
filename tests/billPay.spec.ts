import { test, expect } from '../src/fixtures/test-fixtures';
import { generatePayee } from '../src/test-data/DataFactory';
import {
  payeeMismatch,
  payeeInvalidAmount,
  headings,
  errors,
  transactionTypes,
} from '../src/test-data/data';
import { formatCurrency, parseCurrency, toMoney } from '../src/utils/currency';

test.describe('Bill Pay', () => {
  test(
    'TC_BIL_001 | Pay a bill with valid payee details',
    { tag: ['@P1', '@billPay'] },
    async ({ billPayPage, accountWithTransactions }) => {
      const payee = generatePayee();

      await billPayPage.goto();
      await billPayPage.payBillAndWait(payee, accountWithTransactions);

      await expect(billPayPage.resultTitle).toHaveText(headings.billPaymentComplete);
      await expect(billPayPage.resultPayeeName).toHaveText(payee.payeeName);
      await expect(billPayPage.resultAmount).toHaveText(
        formatCurrency(parseCurrency(payee.amount)),
      );
      await expect(billPayPage.resultFromAccount).toHaveText(accountWithTransactions);
    },
  );

  test(
    'TC_BIL_002 | Source account is debited by the paid amount',
    { tag: ['@P1', '@billPay', '@calculation'] },
    async ({ billPayPage, overviewPage, freshAccount }) => {
      const payee = generatePayee();
      const amount = parseCurrency(payee.amount);

      const balanceBefore = await test.step('record the source balance', async () => {
        await overviewPage.goto();
        return overviewPage.getBalance(freshAccount);
      });

      await test.step('complete a bill payment', async () => {
        await billPayPage.goto();
        await billPayPage.payBillAndWait(payee, freshAccount);
      });

      await overviewPage.goto();
      const balanceAfter = await overviewPage.getBalance(freshAccount);

      // DEFECT-09 history: for a period on 2026-09-15 the confirmation page
      // reported the payment complete while nothing was debited. That state was
      // wiped by the demo database reset of 2026-09-16 (ENV-05) and the intended
      // rule holds again. If this assertion starts failing with a delta of 0,
      // see DEFECT-09 in docs/DEFECTS.md before touching the test.
      expect(toMoney(balanceBefore - balanceAfter)).toBe(amount);
    },
  );

  test(
    'TC_BIL_003 | Submit the Bill Pay form with all fields empty',
    { tag: ['@P1', '@billPay'] },
    async ({ billPayPage, signedIn }) => {
      expect(signedIn.username).not.toBe('');
      await billPayPage.goto();
      await billPayPage.submit();

      const requiredFields: ReadonlyArray<[string, () => Promise<void>]> = [
        ['Payee name', async () => expect(billPayPage.errorPayeeName).toHaveText(errors.payeeNameRequired)],
        ['Address', async () => expect(billPayPage.errorAddress).toHaveText(errors.addressRequired)],
        ['City', async () => expect(billPayPage.errorCity).toHaveText(errors.cityRequired)],
        ['State', async () => expect(billPayPage.errorState).toHaveText(errors.stateRequired)],
        ['Zip Code', async () => expect(billPayPage.errorZipCode).toHaveText(errors.zipCodeRequired)],
        ['Phone number', async () => expect(billPayPage.errorPhone).toHaveText(errors.phoneNumberRequired)],
        ['Account number', async () => expect(billPayPage.errorAccountEmpty).toHaveText(errors.accountNumberRequired)],
        ['Amount', async () => expect(billPayPage.errorAmountEmpty).toHaveText(errors.amountCannotBeEmpty)],
      ];

      for (const [label, assertion] of requiredFields) {
        await test.step(`${label} is reported as required`, assertion);
      }

      // The payment was rejected: the form is still on screen.
      await expect(billPayPage.formPanel).toBeVisible();
      await expect(billPayPage.resultPanel).toBeHidden();
    },
  );

  test(
    'TC_BIL_004 | Account # and Verify Account # do not match',
    { tag: ['@P1', '@billPay'] },
    async ({ billPayPage, accountWithTransactions }) => {
      const payee = generatePayee({
        accountNumber: payeeMismatch.accountNumber,
        verifyAccount: payeeMismatch.verifyAccount,
      });

      await billPayPage.goto();
      await billPayPage.payBill(payee, accountWithTransactions);

      await expect(billPayPage.errorVerifyAccountMismatch).toHaveText(errors.accountMismatch);
      await expect(billPayPage.resultPanel).toBeHidden();
    },
  );

  test(
    'TC_BIL_005 | Bill Pay with a non numeric amount',
    { tag: ['@P2', '@billPay'] },
    async ({ billPayPage, accountWithTransactions }) => {
      const payee = generatePayee({ amount: payeeInvalidAmount });

      await billPayPage.goto();
      await billPayPage.payBill(payee, accountWithTransactions);

      await expect(billPayPage.errorAmountInvalid).toHaveText(errors.validAmountRequired);
      await expect(billPayPage.resultPanel).toBeHidden();
    },
  );

  test(
    'TC_BIL_006 | Bill payment appears in the account transaction history',
    { tag: ['@P2', '@billPay', '@e2e'] },
    async ({ billPayPage, accountDetailsPage, accountWithTransactions }) => {
      // The payee name is unique per run, so the payment is found unambiguously
      // even on an account that already carries history.
      const payee = generatePayee();
      const expectedAmount = formatCurrency(parseCurrency(payee.amount));

      await test.step('complete a bill payment', async () => {
        await billPayPage.goto();
        await billPayPage.payBillAndWait(payee, accountWithTransactions);
      });

      await accountDetailsPage.goto(accountWithTransactions);
      const transactions = await accountDetailsPage.waitForTransactions();

      const payment = transactions.find(
        (row) =>
          row.description === transactionTypes.billPayment(payee.payeeName) &&
          row.debit === expectedAmount,
      );

      // See TC_BIL_002 for the DEFECT-09 history; the ledger entry is expected
      // again since the 2026-09-16 reset.
      expect(payment).toBeDefined();
    },
  );
});
