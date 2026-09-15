import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import {
  openAccountLocators as L,
  accountTypeValues,
} from '../locators/openAccount.locators';
import { AccountType } from '../test-data/data';

/**
 * Open New Account. The funding dropdown is populated asynchronously and the
 * result replaces the form in place, so both are waited for explicitly.
 */
export class OpenAccountPage extends BasePage {
  readonly form: Locator;
  readonly heading: Locator;
  readonly accountTypeSelect: Locator;
  readonly fundingAccountSelect: Locator;
  readonly fundingAccountOptions: Locator;
  readonly openAccountButton: Locator;
  readonly resultPanel: Locator;
  readonly resultTitle: Locator;
  readonly resultMessage: Locator;
  readonly newAccountLink: Locator;

  constructor(page: Page) {
    super(page);
    this.form = page.locator(L.form);
    this.heading = page.locator(L.pageTitle);
    this.accountTypeSelect = page.locator(L.accountTypeSelect);
    this.fundingAccountSelect = page.locator(L.fundingAccountSelect);
    this.fundingAccountOptions = page.locator(L.fundingAccountOptions);
    this.openAccountButton = page.locator(L.openAccountButton);
    this.resultPanel = page.locator(L.resultPanel);
    this.resultTitle = page.locator(L.resultTitle);
    this.resultMessage = page.locator(L.resultMessage).first();
    this.newAccountLink = page.locator(L.newAccountLink);
  }

  async goto(): Promise<void> {
    await this.navigateTo('/parabank/openaccount.htm');
    await this.waitForFundingAccounts();
  }

  /** Waits for the funding dropdown to be filled from services_proxy. */
  async waitForFundingAccounts(): Promise<void> {
    await this.fundingAccountOptions.first().waitFor({ state: 'attached' });
  }

  async selectAccountType(type: AccountType): Promise<void> {
    await this.accountTypeSelect.selectOption(accountTypeValues[type]);
  }

  async selectFundingAccount(accountId: string): Promise<void> {
    await this.fundingAccountSelect.selectOption(accountId);
  }

  /** The account ids offered in the funding dropdown. */
  async getFundingAccountIds(): Promise<string[]> {
    await this.waitForFundingAccounts();
    return (await this.fundingAccountOptions.allInnerTexts()).map((t) => t.trim());
  }

  async submit(): Promise<void> {
    await this.openAccountButton.click();
  }

  /**
   * Opens an account and returns the new account id. When no funding account is
   * named, ParaBank's own default selection (the first account) is used.
   */
  async openNewAccount(type: AccountType, fundingAccountId?: string): Promise<string> {
    await this.waitForFundingAccounts();
    await this.selectAccountType(type);
    if (fundingAccountId !== undefined) {
      await this.selectFundingAccount(fundingAccountId);
    }
    await this.submit();
    await this.resultPanel.waitFor({ state: 'visible' });
    return (await this.newAccountLink.innerText()).trim();
  }

  async getNewAccountId(): Promise<string> {
    return (await this.newAccountLink.innerText()).trim();
  }

  async openNewAccountDetails(): Promise<void> {
    await this.newAccountLink.click();
  }
}
