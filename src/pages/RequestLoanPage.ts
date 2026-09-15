import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { requestLoanLocators as L } from '../locators/requestLoan.locators';

/** Apply for a Loan. */
export class RequestLoanPage extends BasePage {
  readonly formPanel: Locator;
  readonly heading: Locator;
  readonly loanAmount: Locator;
  readonly downPayment: Locator;
  readonly fromAccountSelect: Locator;
  readonly fromAccountOptions: Locator;
  readonly applyNowButton: Locator;

  readonly resultPanel: Locator;
  readonly resultTitle: Locator;
  readonly loanProviderName: Locator;
  readonly responseDate: Locator;
  readonly loanStatus: Locator;
  readonly approvedPanel: Locator;
  readonly deniedPanel: Locator;
  readonly deniedMessage: Locator;
  readonly newAccountLink: Locator;
  readonly errorPanel: Locator;

  constructor(page: Page) {
    super(page);
    this.formPanel = page.locator(L.formPanel);
    this.heading = page.locator(L.pageTitle);
    this.loanAmount = page.locator(L.loanAmount);
    this.downPayment = page.locator(L.downPayment);
    this.fromAccountSelect = page.locator(L.fromAccountSelect);
    this.fromAccountOptions = page.locator(L.fromAccountOptions);
    this.applyNowButton = page.locator(L.applyNowButton);

    this.resultPanel = page.locator(L.resultPanel);
    this.resultTitle = page.locator(L.resultTitle);
    this.loanProviderName = page.locator(L.loanProviderName);
    this.responseDate = page.locator(L.responseDate);
    this.loanStatus = page.locator(L.loanStatus);
    this.approvedPanel = page.locator(L.approvedPanel);
    this.deniedPanel = page.locator(L.deniedPanel);
    this.deniedMessage = page.locator(L.deniedMessage);
    this.newAccountLink = page.locator(L.newAccountLink);
    this.errorPanel = page.locator(L.errorPanel);
  }

  async goto(): Promise<void> {
    await this.navigateTo('/parabank/requestloan.htm');
    await this.waitForAccounts();
  }

  /** Waits for the funding dropdown to be filled from services_proxy. */
  async waitForAccounts(): Promise<void> {
    await this.fromAccountOptions.first().waitFor({ state: 'attached' });
  }

  async applyForLoan(
    loanAmount: string,
    downPayment: string,
    fromAccountId?: string,
  ): Promise<void> {
    await this.waitForAccounts();
    await this.loanAmount.fill(loanAmount);
    await this.downPayment.fill(downPayment);
    if (fromAccountId !== undefined) {
      await this.fromAccountSelect.selectOption(fromAccountId);
    }
    await this.applyNowButton.click();
  }

  /** Applies and waits for the decision panel. */
  async applyAndWait(
    loanAmount: string,
    downPayment: string,
    fromAccountId?: string,
  ): Promise<void> {
    await this.applyForLoan(loanAmount, downPayment, fromAccountId);
    await this.resultPanel.waitFor({ state: 'visible' });
  }

  async submitEmpty(): Promise<void> {
    await this.waitForAccounts();
    await this.applyNowButton.click();
  }

  async getLoanStatus(): Promise<string> {
    return (await this.loanStatus.innerText()).trim();
  }

  async getNewAccountId(): Promise<string> {
    return (await this.newAccountLink.innerText()).trim();
  }
}
