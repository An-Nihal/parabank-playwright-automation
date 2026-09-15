import { Page, Locator } from '@playwright/test';
import { commonLocators as C } from '../locators/common.locators';

/**
 * Shared behaviour for every page: navigation, the header, the left menu and
 * the footer. Page objects expose actions and getters only - assertions live
 * in the specs, so a page object stays reusable by a negative test.
 */
export abstract class BasePage {
  readonly page: Page;

  // Header
  readonly header: Locator;
  readonly logo: Locator;
  readonly topMenu: Locator;

  // Left panel
  readonly leftPanel: Locator;
  readonly loginPanel: Locator;
  readonly accountServicesHeading: Locator;
  readonly accountServicesLinks: Locator;
  readonly welcomeText: Locator;
  readonly logoutLink: Locator;

  // Right panel
  readonly rightPanel: Locator;
  readonly pageTitle: Locator;
  readonly errorMessage: Locator;

  // Footer
  readonly footer: Locator;
  readonly footerLinks: Locator;
  readonly contactUsLink: Locator;

  constructor(page: Page) {
    this.page = page;

    this.header = page.locator(C.headerPanel);
    this.logo = page.locator(C.logo);
    this.topMenu = page.locator(C.topMenu);

    this.leftPanel = page.locator(C.leftPanel);
    this.loginPanel = page.locator(C.loginPanel);
    this.accountServicesHeading = page.locator(C.accountServicesHeading);
    this.accountServicesLinks = page.locator(C.accountServicesLinks);
    this.welcomeText = page.locator(C.welcomeText);
    this.logoutLink = page.locator(C.logoutLink);

    this.rightPanel = page.locator(C.rightPanel);
    this.pageTitle = page.locator(C.pageTitle);
    this.errorMessage = page.locator(C.errorMessage);

    this.footer = page.locator(C.footerPanel);
    this.footerLinks = page.locator(C.footerLinks);
    this.contactUsLink = page.locator(C.contactUsLink);
  }

  /** Navigates to a ParaBank path, e.g. '/parabank/overview.htm'. */
  async navigateTo(path: string): Promise<void> {
    await this.page.goto(path);
  }

  /** Clicks an item in the top menu by its visible label. */
  async clickTopMenuLink(label: string): Promise<void> {
    await this.page.locator(C.topMenuLink(label)).click();
  }

  /** Clicks an Account Services link in the left panel by its visible label. */
  async clickMenuLink(label: string): Promise<void> {
    await this.page.locator(C.menuLink(label)).click();
  }

  async clickLogo(): Promise<void> {
    await this.logo.click();
  }

  async logout(): Promise<void> {
    await this.logoutLink.click();
  }

  /** The labels of every Account Services link, in document order. */
  async getAccountServicesLabels(): Promise<string[]> {
    return (await this.accountServicesLinks.allInnerTexts()).map((t) => t.trim());
  }

  /** Every href in the footer, resolved to an absolute URL. */
  async getFooterHrefs(): Promise<string[]> {
    return this.footerLinks.evaluateAll((links) =>
      links.map((link) => (link as HTMLAnchorElement).href),
    );
  }

  async getTitle(): Promise<string> {
    return this.page.title();
  }
}
