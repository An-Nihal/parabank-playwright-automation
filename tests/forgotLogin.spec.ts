import { test, expect } from '../src/fixtures/test-fixtures';
import { generateUnknownLookup } from '../src/test-data/DataFactory';
import {
  staticUser,
  emptyUser,
  headings,
  errors,
  messages,
} from '../src/test-data/data';

test.describe('Forgot Login Info', () => {
  // TC_FLI_001 reads the stored profile while signed in, then logs out before
  // using Customer Lookup as an anonymous visitor would - so it drives both
  // halves of the session itself.
  test.describe('Owns its session', () => {
    test(
    'TC_FLI_001 | Retrieve login details with matching customer information',
    { tag: ['@P2', '@forgotLogin'] },
    async ({ updateProfilePage, loginPage, forgotLoginPage }) => {
      await test.step('log in as the static customer', async () => {
        await loginPage.goto();
        await loginPage.login(staticUser.username, staticUser.password);
      });

      // The profile is read from the application rather than hardcoded, because
      // the Update Contact Info tests rewrite the same customer's address. The
      // SSN is not editable and is not shown on any form, so it comes from
      // TD_USER_01 - it is the value the customer was registered with.
      const profile = await test.step('read the stored profile', async () => {
        await updateProfilePage.goto();
        return updateProfilePage.getProfile();
      });

      await test.step('log out and open Customer Lookup', async () => {
        await updateProfilePage.logout();
        await loginPage.goToForgotLogin();
        await expect(forgotLoginPage.heading).toHaveText(headings.customerLookup);
      });

      await forgotLoginPage.findLogin(profile, staticUser.ssn);

      // DEVIATION: the specification expects the page to print
      // 'Your username is <username> and password is <password>.' ParaBank no
      // longer discloses the credentials; it logs the customer in instead.
      await expect(forgotLoginPage.resultText).toHaveText(messages.lookupSuccess);
      await expect(forgotLoginPage.lookupError).toHaveCount(0);
    },
    );
  });

  // Customer Lookup is reached by someone who cannot log in, so: no session.
  test.describe('Anonymous visitor', () => {
    test(
      'TC_FLI_002 | Retrieve login details with information that matches no customer',
      { tag: ['@P2', '@forgotLogin'] },
      async ({ forgotLoginPage }) => {
        // A fresh identity every run: a fixed one was matched by a customer
        // somebody else registered on the shared demo (see the factory).
        const unknown = generateUnknownLookup();

        await forgotLoginPage.goto();
        await forgotLoginPage.findLogin(unknown.profile, unknown.ssn);

        await expect(forgotLoginPage.lookupError).toHaveText(errors.customerNotFound);
      },
    );

    test(
      'TC_FLI_003 | Submit the lookup form with empty fields',
      { tag: ['@P3', '@forgotLogin'] },
      async ({ forgotLoginPage }) => {
        await forgotLoginPage.goto();
        await forgotLoginPage.findLogin(
          {
            firstName: emptyUser.firstName,
            lastName: emptyUser.lastName,
            address: emptyUser.address,
            city: emptyUser.city,
            state: emptyUser.state,
            zipCode: emptyUser.zipCode,
            phone: emptyUser.phone,
          },
          emptyUser.ssn,
        );

        const requiredFields: ReadonlyArray<[string, string]> = [
          ['firstName', errors.firstNameRequired],
          ['lastName', errors.lastNameRequired],
          ['address.street', errors.addressRequired],
          ['address.city', errors.cityRequired],
          ['address.state', errors.stateRequired],
          ['address.zipCode', errors.zipCodeRequired],
          ['ssn', errors.ssnRequired],
        ];

        for (const [field, message] of requiredFields) {
          await test.step(`${field} shows "${message}"`, async () => {
            await expect(forgotLoginPage.fieldError(field)).toHaveText(message);
          });
        }
      },
    );
  });
});
