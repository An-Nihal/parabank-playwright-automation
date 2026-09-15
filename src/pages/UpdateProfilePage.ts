import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { updateProfileLocators as L } from '../locators/updateProfile.locators';
import { Profile } from '../test-data/data';

/** Update Contact Info. The form is pre-filled from services_proxy after load. */
export class UpdateProfilePage extends BasePage {
  readonly formPanel: Locator;
  readonly heading: Locator;
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly address: Locator;
  readonly city: Locator;
  readonly state: Locator;
  readonly zipCode: Locator;
  readonly phone: Locator;
  readonly updateButton: Locator;

  readonly errorFirstName: Locator;
  readonly errorLastName: Locator;
  readonly errorAddress: Locator;
  readonly errorCity: Locator;
  readonly errorState: Locator;
  readonly errorZipCode: Locator;

  readonly resultPanel: Locator;
  readonly resultTitle: Locator;
  readonly resultMessage: Locator;

  /** The generic failure panel ParaBank shows when the update call errors server side. */
  readonly errorPanel: Locator;
  readonly errorTitle: Locator;
  readonly errorText: Locator;

  constructor(page: Page) {
    super(page);
    this.formPanel = page.locator(L.formPanel);
    this.heading = page.locator(L.pageTitle);
    this.firstName = page.locator(L.firstName);
    this.lastName = page.locator(L.lastName);
    this.address = page.locator(L.address);
    this.city = page.locator(L.city);
    this.state = page.locator(L.state);
    this.zipCode = page.locator(L.zipCode);
    this.phone = page.locator(L.phone);
    this.updateButton = page.locator(L.updateButton);

    this.errorFirstName = page.locator(L.errorFirstName);
    this.errorLastName = page.locator(L.errorLastName);
    this.errorAddress = page.locator(L.errorAddress);
    this.errorCity = page.locator(L.errorCity);
    this.errorState = page.locator(L.errorState);
    this.errorZipCode = page.locator(L.errorZipCode);

    this.resultPanel = page.locator(L.resultPanel);
    this.resultTitle = page.locator(L.resultTitle);
    this.resultMessage = page.locator(L.resultMessage).first();

    this.errorPanel = page.locator(L.errorPanel);
    this.errorTitle = page.locator(L.errorTitle);
    this.errorText = page.locator(L.errorText);
  }

  async goto(): Promise<void> {
    await this.navigateTo('/parabank/updateprofile.htm');
    await this.waitForPrefill();
  }

  /** Waits until the stored customer details have been written into the form. */
  async waitForPrefill(): Promise<void> {
    await this.firstName.waitFor({ state: 'visible' });
    await this.page.waitForFunction(
      (selector) => {
        const input = document.querySelector(selector) as HTMLInputElement | null;
        return !!input && input.value.trim().length > 0;
      },
      L.firstName,
    );
  }

  /** The values currently shown in the form. */
  async getProfile(): Promise<Profile> {
    return {
      firstName: await this.firstName.inputValue(),
      lastName: await this.lastName.inputValue(),
      address: await this.address.inputValue(),
      city: await this.city.inputValue(),
      state: await this.state.inputValue(),
      zipCode: await this.zipCode.inputValue(),
      phone: await this.phone.inputValue(),
    };
  }

  /** Replaces the contact details that TC_UPD_002 updates. */
  async updateContactDetails(profile: Profile): Promise<void> {
    await this.address.fill(profile.address);
    await this.city.fill(profile.city);
    await this.state.fill(profile.state);
    await this.zipCode.fill(profile.zipCode);
    await this.phone.fill(profile.phone);
  }

  async clearField(field: keyof Profile): Promise<void> {
    const locators: Record<keyof Profile, Locator> = {
      firstName: this.firstName,
      lastName: this.lastName,
      address: this.address,
      city: this.city,
      state: this.state,
      zipCode: this.zipCode,
      phone: this.phone,
    };
    await locators[field].fill('');
  }

  async submit(): Promise<void> {
    await this.updateButton.click();
  }

  async updateProfile(profile: Profile): Promise<void> {
    await this.updateContactDetails(profile);
    await this.submit();
  }

  /**
   * Submits the update and waits for the server to answer.
   *
   * The page hides the form and shows exactly one of two panels: the success
   * panel or the error panel. Waiting for whichever appears keeps this method
   * free of any opinion about the outcome - the spec asserts which one it was.
   */
  async updateProfileAndWait(profile: Profile): Promise<void> {
    await this.updateProfile(profile);
    // The update call currently fails by timing out on the server (DEFECT-10),
    // and the page only shows its error panel once that timeout fires - which
    // is longer than the default action timeout. This is still a wait for a
    // condition, just a patient one; it returns the moment either panel shows.
    //
    // Both panels are always in the DOM (hidden), so the `or` alone would match
    // two elements; filtering to the visible one keeps it strict.
    await this.resultPanel
      .or(this.errorPanel)
      .filter({ visible: true })
      .waitFor({ state: 'visible', timeout: 45_000 });
  }
}
