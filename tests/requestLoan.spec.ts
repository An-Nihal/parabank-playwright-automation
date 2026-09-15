import { test, expect } from '../src/fixtures/test-fixtures';
import { approvedLoan, deniedLoan, headings, errors, messages } from '../src/test-data/data';

test.describe('Request Loan', () => {
  test(
    'TC_LON_001 | Request a loan that qualifies for approval',
    { tag: ['@P1', '@requestLoan'] },
    async ({ requestLoanPage, freshAccount }) => {
      // Funded deliberately, not borrowed from whatever the customer happens to
      // own. ParaBank approves a loan when the source account covers the down
      // payment and denies it otherwise, so a customer whose accounts have been
      // drained by other people using the shared demo makes this test fail for
      // reasons that have nothing to do with the loan flow (ENV-04 in
      // docs/DEFECTS.md). `freshAccount` opens an account holding the minimum
      // deposit, which comfortably covers the $50 down payment.
      await requestLoanPage.goto();
      await requestLoanPage.applyAndWait(
        approvedLoan.loanAmount,
        approvedLoan.downPayment,
        freshAccount,
      );

      await expect(requestLoanPage.resultTitle).toHaveText(headings.loanRequestProcessed);
      await expect(requestLoanPage.loanProviderName).not.toBeEmpty();
      await expect(requestLoanPage.loanStatus).toHaveText('Approved');
      await expect(requestLoanPage.approvedPanel).toBeVisible();
      await expect(requestLoanPage.newAccountLink).toHaveText(/^\d+$/);
    },
  );

  test(
    'TC_LON_002 | Request a loan that is denied',
    { tag: ['@P1', '@requestLoan'] },
    async ({ requestLoanPage, freshAccount }) => {
      // freshAccount holds only the minimum deposit, far below the down payment.
      await requestLoanPage.goto();
      await requestLoanPage.applyAndWait(
        deniedLoan.loanAmount,
        deniedLoan.downPayment,
        freshAccount,
      );

      await expect(requestLoanPage.loanStatus).toHaveText('Denied');
      await expect(requestLoanPage.deniedPanel).toBeVisible();
      // DEVIATION: the specification quotes 'You do not have enough funds
      // available for the down payment.' The application renders the string
      // asserted here - see errors.insufficientDownPayment in data.ts.
      await expect(requestLoanPage.deniedMessage).toHaveText(errors.insufficientDownPayment);
      await expect(requestLoanPage.approvedPanel).toBeHidden();
    },
  );

  test(
    'TC_LON_003 | Approved loan creates a new account',
    { tag: ['@P2', '@requestLoan', '@e2e'] },
    async ({ requestLoanPage, overviewPage, freshAccount }) => {
      // Same reasoning as TC_LON_001: the source account is funded by this test
      // so approval depends only on the loan rules.
      const loanAccountId = await test.step('request a loan that is approved', async () => {
        await requestLoanPage.goto();
        await requestLoanPage.applyAndWait(
          approvedLoan.loanAmount,
          approvedLoan.downPayment,
          freshAccount,
        );
        await expect(requestLoanPage.loanStatus).toHaveText('Approved');
        await expect(requestLoanPage.approvedPanel).toContainText(messages.loanApproved);
        return requestLoanPage.getNewAccountId();
      });

      await overviewPage.goto();
      expect(await overviewPage.getAccountIds()).toContain(loanAccountId);
    },
  );

  test(
    'TC_LON_004 | Submit the loan form with an empty amount',
    { tag: ['@P3', '@requestLoan'] },
    async ({ requestLoanPage, overviewPage, signedIn }) => {
      expect(signedIn.username).not.toBe('');
      const accountsBefore = await test.step('record the account list', async () => {
        await overviewPage.goto();
        return overviewPage.getAccountIds();
      });

      await requestLoanPage.goto();
      await requestLoanPage.submitEmpty();

      // The request is rejected: no decision panel and no loan account created.
      await expect(requestLoanPage.resultPanel).toBeHidden();
      await expect(requestLoanPage.errorPanel).toBeVisible();

      await overviewPage.goto();
      expect(await overviewPage.getAccountIds()).toEqual(accountsBefore);
    },
  );
});
