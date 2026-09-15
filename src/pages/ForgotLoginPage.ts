import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { forgotLoginLocators as L } from '../locators/forgotLogin.locators';
import { Profile } from '../test-data/data';

/** Customer Lookup (lookup.htm), reached from the Forgot login info link. */
export class ForgotLoginPage extends BasePage {
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly address: Locator;
  readonly city: Locator;
  readonly state: Locator;
  readonly zipCode: Locator;
  readonly ssn: Locator;
  readonly findLoginButton: Locator;
  readonly heading: Locator;
  readonly resultText: Locator;
  readonly lookupError: Locator;

  constructor(page: Page) {
    super(page);
    this.firstName = page.locator(L.firstName);
    this.lastName = page.locator(L.lastName);
    this.address = page.locator(L.address);
    this.city = page.locator(L.city);
    this.state = page.locator(L.state);
    this.zipCode = page.locator(L.zipCode);
    this.ssn = page.locator(L.ssn);
    this.findLoginButton = page.locator(L.findLoginButton);
    this.heading = page.locator(L.pageHeading);
    this.resultText = page.locator(L.resultText).first();
    this.lookupError = page.locator(L.errorMessage);
  }

  async goto(): Promise<void> {
    await this.navigateTo('/parabank/lookup.htm');
  }

  async fillForm(profile: Profile, ssn: string): Promise<void> {
    await this.firstName.fill(profile.firstName);
    await this.lastName.fill(profile.lastName);
    await this.address.fill(profile.address);
    await this.city.fill(profile.city);
    await this.state.fill(profile.state);
    await this.zipCode.fill(profile.zipCode);
    await this.ssn.fill(ssn);
  }

  async submit(): Promise<void> {
    await this.findLoginButton.click();
  }

  async findLogin(profile: Profile, ssn: string): Promise<void> {
    await this.fillForm(profile, ssn);
    await this.submit();
  }

  /** The validation message rendered next to a single field, e.g. 'address.city'. */
  fieldError(fieldName: string): Locator {
    return this.page.locator(L.fieldError(fieldName));
  }
}
