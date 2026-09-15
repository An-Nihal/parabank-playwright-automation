import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { registerLocators as L } from '../locators/register.locators';
import { User } from '../test-data/data';

/** Registration form (register.htm). */
export class RegisterPage extends BasePage {
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly address: Locator;
  readonly city: Locator;
  readonly state: Locator;
  readonly zipCode: Locator;
  readonly phone: Locator;
  readonly ssn: Locator;
  readonly username: Locator;
  readonly password: Locator;
  readonly confirmPassword: Locator;
  readonly registerButton: Locator;
  readonly heading: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.firstName = page.locator(L.firstName);
    this.lastName = page.locator(L.lastName);
    this.address = page.locator(L.address);
    this.city = page.locator(L.city);
    this.state = page.locator(L.state);
    this.zipCode = page.locator(L.zipCode);
    this.phone = page.locator(L.phone);
    this.ssn = page.locator(L.ssn);
    this.username = page.locator(L.username);
    this.password = page.locator(L.password);
    this.confirmPassword = page.locator(L.confirmPassword);
    this.registerButton = page.locator(L.registerButton);
    this.heading = page.locator(L.pageHeading);
    this.successMessage = page.locator(L.successMessage).first();
  }

  async goto(): Promise<void> {
    await this.navigateTo('/parabank/register.htm');
  }

  /** Fills every field. Empty strings are written as empty, which is what the negative cases need. */
  async fillForm(user: User): Promise<void> {
    await this.firstName.fill(user.firstName);
    await this.lastName.fill(user.lastName);
    await this.address.fill(user.address);
    await this.city.fill(user.city);
    await this.state.fill(user.state);
    await this.zipCode.fill(user.zipCode);
    await this.phone.fill(user.phone);
    await this.ssn.fill(user.ssn);
    await this.username.fill(user.username);
    await this.password.fill(user.password);
    await this.confirmPassword.fill(user.repeatedPassword);
  }

  async submit(): Promise<void> {
    await this.registerButton.click();
  }

  async register(user: User): Promise<void> {
    await this.fillForm(user);
    await this.submit();
  }

  /** The validation message rendered next to a single field, e.g. 'customer.firstName'. */
  fieldError(fieldName: string): Locator {
    return this.page.locator(L.fieldError(fieldName));
  }
}
