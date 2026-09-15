import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { contactUsLocators as L } from '../locators/contactUs.locators';
import { ContactMessage } from '../test-data/data';

/** Customer Care / Contact Us, reached from the footer. */
export class ContactUsPage extends BasePage {
  readonly form: Locator;
  readonly heading: Locator;
  readonly name: Locator;
  readonly email: Locator;
  readonly phone: Locator;
  readonly message: Locator;
  readonly sendButton: Locator;
  readonly confirmationHeading: Locator;
  readonly thankYouMessage: Locator;
  readonly followUpMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.form = page.locator(L.form);
    this.heading = page.locator(L.pageTitle);
    this.name = page.locator(L.name);
    this.email = page.locator(L.email);
    this.phone = page.locator(L.phone);
    this.message = page.locator(L.message);
    this.sendButton = page.locator(L.sendButton);
    this.confirmationHeading = page.locator(L.confirmationHeading);
    this.thankYouMessage = page.locator(L.thankYouMessage);
    this.followUpMessage = page.locator(L.followUpMessage);
  }

  async goto(): Promise<void> {
    await this.navigateTo('/parabank/contact.htm');
  }

  async sendMessage(contact: ContactMessage): Promise<void> {
    await this.name.fill(contact.name);
    await this.email.fill(contact.email);
    await this.phone.fill(contact.phone);
    await this.message.fill(contact.message);
    await this.sendButton.click();
  }
}
