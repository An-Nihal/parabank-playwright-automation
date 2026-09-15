import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { transferFundsLocators as L } from '../locators/transferFunds.locators';

/**
 * Transfer Funds. The account dropdowns fill asynchronously and the result
 * replaces the form in place.
 */
export class TransferFundsPage extends BasePage {
  readonly formPanel: Locator;
  readonly heading: Locator;
  readonly amount: Locator;
  readonly fromAccountSelect: Locator;
  readonly toAccountSelect: Locator;
  readonly fromAccountOptions: Locator;
  readonly transferButton: Locator;
  readonly resultPanel: Locator;
  readonly resultTitle: Locator;
  readonly resultAmount: Locator;
  readonly resultFromAccount: Locator;
  readonly resultToAccount: Locator;
  readonly errorPanel: Locator;
  readonly errorTitle: Locator;
  readonly transferError: Locator;

  constructor(page: Page) {
    super(page);
    this.formPanel = page.locator(L.formPanel);
    this.heading = page.locator(L.pageTitle);
    this.amount = page.locator(L.amountInput);
    this.fromAccountSelect = page.locator(L.fromAccountSelect);
    this.toAccountSelect = page.locator(L.toAccountSelect);
    this.fromAccountOptions = page.locator(L.fromAccountOptions);
    this.transferButton = page.locator(L.transferButton);
    this.resultPanel = page.locator(L.resultPanel);
    this.resultTitle = page.locator(L.resultTitle);
    this.resultAmount = page.locator(L.resultAmount);
    this.resultFromAccount = page.locator(L.resultFromAccount);
    this.resultToAccount = page.locator(L.resultToAccount);
    this.errorPanel = page.locator(L.errorPanel);
    this.errorTitle = page.locator(L.errorTitle);
    this.transferError = page.locator(L.errorMessage);
  }

  async goto(): Promise<void> {
    await this.navigateTo('/parabank/transfer.htm');
    await this.waitForAccounts();
  }

  /** Waits for the two account dropdowns to be filled from services_proxy. */
  async waitForAccounts(): Promise<void> {
    await this.fromAccountOptions.first().waitFor({ state: 'attached' });
  }

  async getAccountIds(): Promise<string[]> {
    await this.waitForAccounts();
    return (await this.fromAccountOptions.allInnerTexts()).map((t) => t.trim());
  }

  /** Fills the form without submitting it. */
  async fillTransfer(amount: string, fromAccountId?: string, toAccountId?: string): Promise<void> {
    await this.waitForAccounts();
    await this.amount.fill(amount);
    if (fromAccountId !== undefined) {
      await this.fromAccountSelect.selectOption(fromAccountId);
    }
    if (toAccountId !== undefined) {
      await this.toAccountSelect.selectOption(toAccountId);
    }
  }

  async submit(): Promise<void> {
    await this.transferButton.click();
  }

  async transfer(amount: string, fromAccountId?: string, toAccountId?: string): Promise<void> {
    await this.fillTransfer(amount, fromAccountId, toAccountId);
    await this.submit();
  }

  /** Transfers and waits for the confirmation panel. */
  async transferAndWait(amount: string, fromAccountId: string, toAccountId: string): Promise<void> {
    await this.transfer(amount, fromAccountId, toAccountId);
    await this.resultPanel.waitFor({ state: 'visible' });
  }

  async getResultAmount(): Promise<string> {
    return (await this.resultAmount.innerText()).trim();
  }

  async getResultFromAccount(): Promise<string> {
    return (await this.resultFromAccount.innerText()).trim();
  }

  async getResultToAccount(): Promise<string> {
    return (await this.resultToAccount.innerText()).trim();
  }
}
