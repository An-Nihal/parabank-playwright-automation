import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { billPayLocators as L } from '../locators/billPay.locators';
import { Payee } from '../test-data/data';

/** Bill Payment Service. */
export class BillPayPage extends BasePage {
  readonly formPanel: Locator;
  readonly heading: Locator;
  readonly payeeName: Locator;
  readonly address: Locator;
  readonly city: Locator;
  readonly state: Locator;
  readonly zipCode: Locator;
  readonly phone: Locator;
  readonly accountNumber: Locator;
  readonly verifyAccount: Locator;
  readonly amount: Locator;
  readonly fromAccountSelect: Locator;
  readonly sendPaymentButton: Locator;

  readonly errorPayeeName: Locator;
  readonly errorAddress: Locator;
  readonly errorCity: Locator;
  readonly errorState: Locator;
  readonly errorZipCode: Locator;
  readonly errorPhone: Locator;
  readonly errorAccountEmpty: Locator;
  readonly errorVerifyAccountMismatch: Locator;
  readonly errorAmountEmpty: Locator;
  readonly errorAmountInvalid: Locator;

  readonly resultPanel: Locator;
  readonly resultTitle: Locator;
  readonly resultPayeeName: Locator;
  readonly resultAmount: Locator;
  readonly resultFromAccount: Locator;

  constructor(page: Page) {
    super(page);
    this.formPanel = page.locator(L.formPanel);
    this.heading = page.locator(L.pageTitle);
    this.payeeName = page.locator(L.payeeName);
    this.address = page.locator(L.address);
    this.city = page.locator(L.city);
    this.state = page.locator(L.state);
    this.zipCode = page.locator(L.zipCode);
    this.phone = page.locator(L.phone);
    this.accountNumber = page.locator(L.accountNumber);
    this.verifyAccount = page.locator(L.verifyAccount);
    this.amount = page.locator(L.amount);
    this.fromAccountSelect = page.locator(L.fromAccountSelect);
    this.sendPaymentButton = page.locator(L.sendPaymentButton);

    this.errorPayeeName = page.locator(L.errorPayeeName);
    this.errorAddress = page.locator(L.errorAddress);
    this.errorCity = page.locator(L.errorCity);
    this.errorState = page.locator(L.errorState);
    this.errorZipCode = page.locator(L.errorZipCode);
    this.errorPhone = page.locator(L.errorPhone);
    this.errorAccountEmpty = page.locator(L.errorAccountEmpty);
    this.errorVerifyAccountMismatch = page.locator(L.errorVerifyAccountMismatch);
    this.errorAmountEmpty = page.locator(L.errorAmountEmpty);
    this.errorAmountInvalid = page.locator(L.errorAmountInvalid);

    this.resultPanel = page.locator(L.resultPanel);
    this.resultTitle = page.locator(L.resultTitle);
    this.resultPayeeName = page.locator(L.resultPayeeName);
    this.resultAmount = page.locator(L.resultAmount);
    this.resultFromAccount = page.locator(L.resultFromAccount);
  }

  async goto(): Promise<void> {
    await this.navigateTo('/parabank/billpay.htm');
    await this.payeeName.waitFor({ state: 'visible' });
  }

  async fillPayee(payee: Payee): Promise<void> {
    await this.payeeName.fill(payee.payeeName);
    await this.address.fill(payee.address);
    await this.city.fill(payee.city);
    await this.state.fill(payee.state);
    await this.zipCode.fill(payee.zipCode);
    await this.phone.fill(payee.phone);
    await this.accountNumber.fill(payee.accountNumber);
    await this.verifyAccount.fill(payee.verifyAccount);
    await this.amount.fill(payee.amount);
  }

  async selectFromAccount(accountId: string): Promise<void> {
    await this.fromAccountSelect.selectOption(accountId);
  }

  async submit(): Promise<void> {
    await this.sendPaymentButton.click();
  }

  async payBill(payee: Payee, fromAccountId?: string): Promise<void> {
    await this.fillPayee(payee);
    if (fromAccountId !== undefined) {
      await this.selectFromAccount(fromAccountId);
    }
    await this.submit();
  }

  /** Pays a bill and waits for the confirmation panel. */
  async payBillAndWait(payee: Payee, fromAccountId?: string): Promise<void> {
    await this.payBill(payee, fromAccountId);
    await this.resultPanel.waitFor({ state: 'visible' });
  }

  async getResultPayeeName(): Promise<string> {
    return (await this.resultPayeeName.innerText()).trim();
  }

  async getResultAmount(): Promise<string> {
    return (await this.resultAmount.innerText()).trim();
  }

  async getResultFromAccount(): Promise<string> {
    return (await this.resultFromAccount.innerText()).trim();
  }
}
