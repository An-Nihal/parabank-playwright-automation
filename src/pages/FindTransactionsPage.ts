import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { findTransactionsLocators as L } from '../locators/findTransactions.locators';
import { TransactionRow } from './AccountDetailsPage';

/**
 * Find Transactions. Each search criterion has its own FIND TRANSACTIONS
 * button, so each one gets its own action.
 */
export class FindTransactionsPage extends BasePage {
  readonly formContainer: Locator;
  readonly heading: Locator;
  readonly accountSelect: Locator;

  readonly transactionIdInput: Locator;
  readonly findByIdButton: Locator;
  readonly transactionIdError: Locator;

  readonly dateInput: Locator;
  readonly findByDateButton: Locator;
  readonly dateError: Locator;

  readonly fromDateInput: Locator;
  readonly toDateInput: Locator;
  readonly findByDateRangeButton: Locator;
  readonly dateRangeError: Locator;

  readonly amountInput: Locator;
  readonly findByAmountButton: Locator;
  readonly amountError: Locator;

  readonly resultContainer: Locator;
  readonly resultTitle: Locator;
  readonly resultHeaders: Locator;
  readonly resultRows: Locator;
  readonly errorContainer: Locator;

  constructor(page: Page) {
    super(page);
    this.formContainer = page.locator(L.formContainer);
    this.heading = page.locator(L.pageTitle);
    this.accountSelect = page.locator(L.accountSelect);

    this.transactionIdInput = page.locator(L.transactionIdInput);
    this.findByIdButton = page.locator(L.findByIdButton);
    this.transactionIdError = page.locator(L.transactionIdError);

    this.dateInput = page.locator(L.dateInput);
    this.findByDateButton = page.locator(L.findByDateButton);
    this.dateError = page.locator(L.dateError);

    this.fromDateInput = page.locator(L.fromDateInput);
    this.toDateInput = page.locator(L.toDateInput);
    this.findByDateRangeButton = page.locator(L.findByDateRangeButton);
    this.dateRangeError = page.locator(L.dateRangeError);

    this.amountInput = page.locator(L.amountInput);
    this.findByAmountButton = page.locator(L.findByAmountButton);
    this.amountError = page.locator(L.amountError);

    this.resultContainer = page.locator(L.resultContainer);
    this.resultTitle = page.locator(L.resultTitle);
    this.resultHeaders = page.locator(L.resultHeaders);
    this.resultRows = page.locator(L.resultRows);
    this.errorContainer = page.locator(L.errorContainer);
  }

  async goto(): Promise<void> {
    await this.navigateTo('/parabank/findtrans.htm');
    await this.accountSelect.waitFor({ state: 'visible' });
  }

  async selectAccount(accountId: string): Promise<void> {
    await this.accountSelect.selectOption(accountId);
  }

  async findByTransactionId(transactionId: string): Promise<void> {
    await this.transactionIdInput.fill(transactionId);
    await this.findByIdButton.click();
  }

  async findByDate(date: string): Promise<void> {
    await this.dateInput.fill(date);
    await this.findByDateButton.click();
  }

  async findByDateRange(fromDate: string, toDate: string): Promise<void> {
    await this.fromDateInput.fill(fromDate);
    await this.toDateInput.fill(toDate);
    await this.findByDateRangeButton.click();
  }

  async findByAmount(amount: string): Promise<void> {
    await this.amountInput.fill(amount);
    await this.findByAmountButton.click();
  }

  /** Submits the by-date search with every criterion left blank. */
  async searchWithNoCriteria(): Promise<void> {
    await this.findByDateButton.click();
  }

  /** Waits for the results panel to replace the form. */
  async waitForResults(): Promise<void> {
    await this.resultContainer.waitFor({ state: 'visible' });
  }

  async getResults(): Promise<TransactionRow[]> {
    return this.resultRows.evaluateAll((rows) =>
      rows.map((row) => {
        const cells = row.querySelectorAll('td');
        return {
          date: cells[0]?.textContent?.trim() ?? '',
          description: cells[1]?.textContent?.trim() ?? '',
          debit: cells[2]?.textContent?.trim() ?? '',
          credit: cells[3]?.textContent?.trim() ?? '',
        };
      }),
    );
  }

  async getResultCount(): Promise<number> {
    return this.resultRows.count();
  }
}
