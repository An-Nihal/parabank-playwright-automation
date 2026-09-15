import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { accountDetailsLocators as L } from '../locators/accountDetails.locators';
import { parseCurrency } from '../utils/currency';

export interface TransactionRow {
  date: string;
  description: string;
  debit: string;
  credit: string;
}

/**
 * Account Details / Account Activity (activity.htm?id=...) and the single
 * Transaction Details page. Both are rendered asynchronously from services_proxy.
 */
export class AccountDetailsPage extends BasePage {
  readonly heading: Locator;
  readonly accountNumber: Locator;
  readonly accountType: Locator;
  readonly balance: Locator;
  readonly availableBalance: Locator;
  readonly activityTitle: Locator;
  readonly monthSelect: Locator;
  readonly transactionTypeSelect: Locator;
  readonly goButton: Locator;
  readonly transactionTable: Locator;
  readonly transactionHeaders: Locator;
  readonly transactionRows: Locator;
  readonly transactionLinks: Locator;
  readonly noTransactionsMessage: Locator;
  readonly transactionDetailsTitle: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.locator(L.pageTitle);
    this.accountNumber = page.locator(L.accountNumber);
    this.accountType = page.locator(L.accountType);
    this.balance = page.locator(L.balance);
    this.availableBalance = page.locator(L.availableBalance);
    this.activityTitle = page.locator(L.activityTitle);
    this.monthSelect = page.locator(L.monthSelect);
    this.transactionTypeSelect = page.locator(L.transactionTypeSelect);
    this.goButton = page.locator(L.goButton);
    this.transactionTable = page.locator(L.transactionTable);
    this.transactionHeaders = page.locator(L.transactionHeaders);
    this.transactionRows = page.locator(L.transactionRows);
    this.transactionLinks = page.locator(L.transactionLinks);
    this.noTransactionsMessage = page.locator(L.noTransactionsMessage);
    this.transactionDetailsTitle = page.locator(L.transactionDetailsTitle);
  }

  async goto(accountId: string): Promise<void> {
    await this.navigateTo(`/parabank/activity.htm?id=${accountId}`);
    await this.waitForDetails();
  }

  /** Waits until the summary has been filled in from services_proxy. */
  async waitForDetails(): Promise<void> {
    await this.page.locator(L.accountNumberPopulated).waitFor({ state: 'visible' });
  }

  async getAccountNumber(): Promise<string> {
    return (await this.accountNumber.innerText()).trim();
  }

  async getAccountType(): Promise<string> {
    return (await this.accountType.innerText()).trim();
  }

  async getBalance(): Promise<number> {
    return parseCurrency(await this.balance.innerText());
  }

  async getAvailableBalance(): Promise<number> {
    return parseCurrency(await this.availableBalance.innerText());
  }

  /** Filters the activity list by period and transaction type. */
  async filterActivity(month: string, transactionType: string): Promise<void> {
    await this.monthSelect.selectOption(month);
    await this.transactionTypeSelect.selectOption(transactionType);
    await this.goButton.click();
  }

  /** Every transaction row currently listed. */
  async getTransactions(): Promise<TransactionRow[]> {
    return this.transactionRows.evaluateAll((rows) =>
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

  /** Waits for at least one transaction row to render, then returns them all. */
  async waitForTransactions(): Promise<TransactionRow[]> {
    await this.transactionRows.first().waitFor({ state: 'visible' });
    return this.getTransactions();
  }

  async openTransaction(description: string): Promise<void> {
    await this.page.locator(L.transactionLink(description)).first().click();
  }

  async openFirstTransaction(): Promise<void> {
    await this.transactionLinks.first().click();
  }

  /** Reads one labelled cell from the Transaction Details table, e.g. 'Amount:'. */
  transactionDetail(label: string): Locator {
    return this.page.locator(L.transactionDetailRow(label));
  }
}
