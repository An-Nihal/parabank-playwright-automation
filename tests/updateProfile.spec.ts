import { test, expect } from '../src/fixtures/test-fixtures';
import { generateProfileUpdate } from '../src/test-data/DataFactory';
import { headings, messages, errors } from '../src/test-data/data';

// The static customer is shared, and these tests rewrite its contact details.
// Running them serially keeps one test from overwriting another's expectation.
test.describe.configure({ mode: 'serial' });

test.describe('Update Contact Info', () => {
  test(
    'TC_UPD_001 | Profile form is pre-populated with the current customer details',
    { tag: ['@P2', '@updateProfile'] },
    async ({ updateProfilePage, signedIn }) => {
      expect(signedIn.username).not.toBe('');
      await updateProfilePage.goto();

      await expect(updateProfilePage.heading).toHaveText(headings.updateProfile);

      // Every stored value is present, not blank.
      const profile = await updateProfilePage.getProfile();
      expect(profile.firstName).not.toBe('');
      expect(profile.lastName).not.toBe('');
      expect(profile.address).not.toBe('');
      expect(profile.city).not.toBe('');
      expect(profile.state).not.toBe('');
      expect(profile.zipCode).not.toBe('');
      expect(profile.phone).not.toBe('');
    },
  );

  test(
    'TC_UPD_002 | Update the profile with valid new data',
    { tag: ['@P1', '@updateProfile'] },
    async ({ updateProfilePage, signedIn }) => {
      expect(signedIn.username).not.toBe('');
      const newProfile = generateProfileUpdate();

      await updateProfilePage.goto();
      await updateProfilePage.updateProfileAndWait(newProfile);

      // DEFECT-10 history: on 2026-09-15 this call failed server side with the
      // generic error panel for every customer; the 2026-09-16 database reset
      // (ENV-05) cleared it. If the error panel shows here again, see DEFECT-10.
      await expect(updateProfilePage.resultTitle).toHaveText(headings.profileUpdated);
      await expect(updateProfilePage.resultMessage).toHaveText(messages.profileUpdated);
      await expect(updateProfilePage.errorPanel).toBeHidden();
    },
  );

  test(
    'TC_UPD_003 | Clear a required field and submit',
    { tag: ['@P2', '@updateProfile'] },
    async ({ updateProfilePage, signedIn }) => {
      expect(signedIn.username).not.toBe('');
      await updateProfilePage.goto();
      await updateProfilePage.clearField('lastName');
      await updateProfilePage.submit();

      await expect(updateProfilePage.errorLastName).toHaveText(errors.lastNameRequired);
      // The profile was not updated.
      await expect(updateProfilePage.resultPanel).toBeHidden();
      await expect(updateProfilePage.formPanel).toBeVisible();
    },
  );

  test(
    'TC_UPD_004 | Updated values persist after reload',
    { tag: ['@P2', '@updateProfile', '@e2e'] },
    async ({ updateProfilePage, overviewPage, signedIn }) => {
      expect(signedIn.username).not.toBe('');
      const newProfile = generateProfileUpdate();

      await test.step('update the profile', async () => {
        await updateProfilePage.goto();
        await updateProfilePage.updateProfileAndWait(newProfile);
        await expect(updateProfilePage.resultTitle).toHaveText(headings.profileUpdated);
      });

      await test.step('navigate away from the page', async () => {
        await overviewPage.goto();
      });

      await updateProfilePage.goto();
      const stored = await updateProfilePage.getProfile();

      // Every submitted value survived the round trip. The address carries a
      // per-run unique suffix, so this cannot pass on stale data.
      expect(stored.address).toBe(newProfile.address);
      expect(stored.city).toBe(newProfile.city);
      expect(stored.state).toBe(newProfile.state);
      expect(stored.zipCode).toBe(newProfile.zipCode);
      expect(stored.phone).toBe(newProfile.phone);
    },
  );
});
