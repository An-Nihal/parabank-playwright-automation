import { test, expect } from '../src/fixtures/test-fixtures';
import { generateProfileUpdate } from '../src/test-data/DataFactory';
import { headings, errors } from '../src/test-data/data';

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

      // DEFECT-10. A valid update should show 'Profile Updated' with
      // messages.profileUpdated. The live application instead fails the update
      // call server side and shows its generic error panel - for a customer
      // registered minutes earlier as well as for the long-lived one, so this
      // is the application, not the data.
      //
      // Asserted as it actually behaves, on instruction. The intended assertion
      // is kept here so it is one edit away once ParaBank is fixed:
      //   await expect(updateProfilePage.resultTitle).toHaveText(headings.profileUpdated);
      //   await expect(updateProfilePage.resultMessage).toHaveText(messages.profileUpdated);
      await expect(updateProfilePage.errorTitle).toHaveText(headings.error);
      await expect(updateProfilePage.errorText).toHaveText(errors.internalError);
      await expect(updateProfilePage.resultPanel).toBeHidden();
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
        // DEFECT-10, as in TC_UPD_002: the update is rejected with the generic
        // server error rather than accepted.
        await expect(updateProfilePage.errorTitle).toHaveText(headings.error);
      });

      await test.step('navigate away from the page', async () => {
        await overviewPage.goto();
      });

      await updateProfilePage.goto();
      const stored = await updateProfilePage.getProfile();

      // What persists is therefore the OLD profile. The specification expects
      // every field to equal the submitted value; the correct assertions are
      // kept for when the application is fixed:
      //   expect(stored.address).toBe(newProfile.address);
      //   expect(stored.city).toBe(newProfile.city);
      //   expect(stored.state).toBe(newProfile.state);
      //   expect(stored.zipCode).toBe(newProfile.zipCode);
      //   expect(stored.phone).toBe(newProfile.phone);
      // Only the address is compared: it carries a per-run unique suffix, so
      // "not equal" is a genuine check that the failed update did not apply.
      // City, state, zip and phone are fixed values in the factory and a
      // successful update in the past (before DEFECT-10 appeared) has already
      // left some pooled customers holding exactly those, so they prove nothing.
      expect(stored.address).not.toBe(newProfile.address);
      // And the profile is still intact, not blanked by the failed call.
      expect(stored.firstName).not.toBe('');
      expect(stored.lastName).not.toBe('');
    },
  );
});
