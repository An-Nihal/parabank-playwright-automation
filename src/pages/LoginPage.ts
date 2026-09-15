import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { loginLocators as L } from '../locators/login.locators';

/** Home page and its Customer Login panel. */
export class LoginPage extends BasePage {
  readonly username: Locator;
  readonly password: Locator;
  readonly loginButton: Locator;
  readonly registerLink: Locator;
  readonly forgotLoginLink: Locator;
  readonly errorTitle: Locator;
  readonly loginError: Locator;

  constructor(page: Page) {
    super(page);
    this.username = page.locator(L.usernameInput).first();
    this.password = page.locator(L.passwordInput).first();
    this.loginButton = page.locator(L.loginButton).first();
    this.registerLink = page.locator(L.registerLink);
    this.forgotLoginLink = page.locator(L.forgotLoginLink);
    this.errorTitle = page.locator(L.errorTitle);
    this.loginError = page.locator(L.errorMessage);
  }

  async goto(): Promise<void> {
    await this.navigateTo('/parabank/index.htm');
  }

  async login(username: string, password: string): Promise<void> {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.loginButton.click();
  }

  /** Submits the login form without touching either field. */
  async submitEmpty(): Promise<void> {
    await this.loginButton.click();
  }

  async goToRegister(): Promise<void> {
    await this.registerLink.click();
  }

  async goToForgotLogin(): Promise<void> {
    await this.forgotLoginLink.click();
  }

  /** The type attribute of the password field, for the masking check. */
  async getPasswordFieldType(): Promise<string | null> {
    return this.password.getAttribute('type');
  }
}
