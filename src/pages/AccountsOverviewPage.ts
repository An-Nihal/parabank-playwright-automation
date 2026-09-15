import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { accountsOverviewLocators as L } from '../locators/accountsOverview.locators';
import { parseCurrency, sumCurrency } from '../utils/currency';

export interface AccountRow {
  id: string;
  balance: string;
  available: string;
}

/**
 * Accounts Overview. jQuery fills the table from services_proxy after load, so
 * every getter waits for at least one account row before reading.
 */
export class AccountsOverviewPage extends BasePage {
  readonly heading: Locator;
  readonly accountTable: Locator;
  readonly tableHeaders: Locator;
  readonly accountRows: Locator;
  readonly accountLinks: Locator;
  readonly totalRow: Locator;
  readonly totalBalance: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.locator(L.pageTitle);
    this.accountTable = page.locator(L.accountTable);
    this.tableHeaders = page.locator(L.tableHeaders);
    this.accountRows = page.locator(L.accountRows);
    this.accountLinks = page.locator(L.accountLinks);
    this.totalRow = page.locator(L.totalRow);
    this.totalBalance = page.locator(L.totalBalance);
  }

  async goto(): Promise<void> {
    await this.navigateTo('/parabank/overview.htm');
    await this.waitForAccounts();
  }

  /** Waits until the asynchronous account table has rendered at least one account. */
  async waitForAccounts(): Promise<void> {
    await this.accountLinks.first().waitFor({ state: 'visible' });
  }

  /** Every account id shown, in table order. */
  async getAccountIds(): Promise<string[]> {
    await this.waitForAccounts();
    return (await this.accountLinks.allInnerTexts()).map((t) => t.trim());
  }

  async getAccountCount(): Promise<number> {
    await this.waitForAccounts();
    return this.accountRows.count();
  }

  /** The displayed balance for one account, as a number. */
  async getBalance(accountId: string): Promise<number> {
    const row = this.accountRows.filter({ hasText: accountId }).first();
    const balance = await row.locator(L.cell(2)).innerText();
    return parseCurrency(balance);
  }

  /** The displayed available amount for one account, as a number. */
  async getAvailableAmount(accountId: string): Promise<number> {
    const row = this.accountRows.filter({ hasText: accountId }).first();
    const available = await row.locator(L.cell(3)).innerText();
    return parseCurrency(available);
  }

  /** Every account balance, as numbers, in table order. */
  async getAllBalances(): Promise<number[]> {
    await this.waitForAccounts();
    const cells = await this.accountRows.evaluateAll((rows) =>
      rows.map((row) => row.querySelectorAll('td')[1]?.textContent?.trim() ?? ''),
    );
    return cells.map(parseCurrency);
  }

  /** The arithmetic sum of the individual balances, to 2 decimal places. */
  async getSumOfBalances(): Promise<number> {
    await this.waitForAccounts();
    const cells = await this.accountRows.evaluateAll((rows) =>
      rows.map((row) => row.querySelectorAll('td')[1]?.textContent?.trim() ?? ''),
    );
    return sumCurrency(cells);
  }

  /** The value shown in the Total row. */
  async getTotalBalance(): Promise<number> {
    return parseCurrency(await this.totalBalance.innerText());
  }

  /** Every account row as structured data: id plus the two displayed currency strings. */
  async getAccountRows(): Promise<AccountRow[]> {
    await this.waitForAccounts();
    return this.accountRows.evaluateAll((rows) =>
      rows.map((row) => {
        const cells = row.querySelectorAll('td');
        return {
          id: cells[0]?.querySelector('a')?.textContent?.trim() ?? '',
          balance: cells[1]?.textContent?.trim() ?? '',
          available: cells[2]?.textContent?.trim() ?? '',
        };
      }),
    );
  }

  /** Opens an account and leaves the browser on the Account Details page. */
  async openAccount(accountId: string): Promise<void> {
    await this.page.locator(L.accountLink(accountId)).click();
  }

  async openFirstAccount(): Promise<string> {
    await this.waitForAccounts();
    const id = (await this.accountLinks.first().innerText()).trim();
    await this.accountLinks.first().click();
    return id;
  }
}
