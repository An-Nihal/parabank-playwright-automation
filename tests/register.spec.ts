import { test, expect } from '../src/fixtures/test-fixtures';
import { logout, getAccountIds, isChallenged } from '../src/fixtures/session';
import { generateUser } from '../src/test-data/DataFactory';
import { addUser } from '../src/test-data/UserRegistry';
import {
  emptyUser,
  staticUser,
  errors,
  headings,
  messages,
  titles,
  accountServicesLinks,
} from '../src/test-data/data';

// Registration is always performed by an anonymous visitor, so nothing in this
// spec uses the `signedIn` fixture. TC_REG_001 and TC_REG_007 end up logged in
// as the customer they create, and log out again before finishing.
//
// ENV-01: the registration POST sits behind Cloudflare bot protection, which
// challenges it at random. That is the environment refusing the request, not
// the application misbehaving, so every test that submits the form checks for
// the interstitial straight after submitting and SKIPS - with the reason in the
// report - instead of failing on an assertion that could never have been
// reached. `test.skip(condition, reason)` is Playwright's annotation for exactly
// this; it is the only conditional in the suite and it never chooses between
// two expectations.
const ENV_01 = 'ENV-01: registration POST challenged by Cloudflare bot protection';

test.describe('Registration', () => {
  test(
    'TC_REG_001 | Register a new customer with valid unique data',
    { tag: ['@P1', '@register'] },
    async ({ registerPage, page, context }) => {
      const user = generateUser();

      await registerPage.goto();
      await registerPage.register(user);
      test.skip(await isChallenged(registerPage.page), ENV_01);

      await expect(registerPage.heading).toHaveText(`Welcome ${user.username}`);
      await expect(registerPage.successMessage).toHaveText(messages.registrationSuccess);
      await expect(registerPage.accountServicesHeading).toHaveText('Account Services');

      // Registering against the public demo is unreliable (ENV-01), so a
      // customer that was successfully created is worth keeping: it is written
      // to the registry and later runs can simply sign in as it instead of
      // gambling on the registration POST getting through again.
      const accounts = await getAccountIds(page, user);
      addUser(user, { accounts, source: 'registered-by-test' });

      // Registration signs the new customer in, so close that session.
      await logout(page, context);
    },
  );

  test(
    'TC_REG_002 | Submit the registration form with all fields empty',
    { tag: ['@P1', '@register'] },
    async ({ registerPage }) => {
      await registerPage.goto();
      await registerPage.register(emptyUser);
      test.skip(await isChallenged(registerPage.page), ENV_01);

      // One validation message per required field.
      const requiredFields: ReadonlyArray<[string, string]> = [
        ['customer.firstName', errors.firstNameRequired],
        ['customer.lastName', errors.lastNameRequired],
        ['customer.address.street', errors.addressRequired],
        ['customer.address.city', errors.cityRequired],
        ['customer.address.state', errors.stateRequired],
        ['customer.address.zipCode', errors.zipCodeRequired],
        ['customer.ssn', errors.ssnRequired],
        ['customer.username', errors.usernameRequired],
        ['customer.password', errors.passwordRequired],
        ['repeatedPassword', errors.passwordConfirmationRequired],
      ];

      for (const [field, message] of requiredFields) {
        await test.step(`${field} shows "${message}"`, async () => {
          await expect(registerPage.fieldError(field)).toHaveText(message);
        });
      }

      // The form was not submitted: the account was not created.
      await expect(registerPage.heading).toHaveText(headings.registerForm);
    },
  );

  test(
    'TC_REG_003 | Register with Password and Confirm that do not match',
    { tag: ['@P1', '@register'] },
    async ({ registerPage }) => {
      const user = generateUser({ repeatedPassword: 'Test@9999' });

      await registerPage.goto();
      await registerPage.register(user);
      test.skip(await isChallenged(registerPage.page), ENV_01);

      await expect(registerPage.fieldError('repeatedPassword')).toHaveText(
        errors.passwordMismatch,
      );
      await expect(registerPage.heading).toHaveText(headings.registerForm);
    },
  );

  test(
    'TC_REG_004 | Register with a username that already exists',
    { tag: ['@P1', '@register'] },
    async ({ registerPage }) => {
      const user = generateUser({ username: staticUser.username });

      await registerPage.goto();
      await registerPage.register(user);
      test.skip(await isChallenged(registerPage.page), ENV_01);

      await expect(registerPage.fieldError('customer.username')).toHaveText(
        errors.usernameTaken,
      );
      await expect(registerPage.heading).toHaveText(headings.registerForm);
    },
  );

  test(
    'TC_REG_005 | Register with only the First Name missing',
    { tag: ['@P2', '@register'] },
    async ({ registerPage }) => {
      const user = generateUser({ firstName: '' });

      await registerPage.goto();
      await registerPage.register(user);
      test.skip(await isChallenged(registerPage.page), ENV_01);

      await expect(registerPage.fieldError('customer.firstName')).toHaveText(
        errors.firstNameRequired,
      );
      // No other required field complains.
      await expect(registerPage.fieldError('customer.lastName')).toHaveCount(0);
      await expect(registerPage.fieldError('customer.address.street')).toHaveCount(0);
    },
  );

  test(
    'TC_REG_006 | Navigate to the Register page from the Home page',
    { tag: ['@P2', '@register', '@navigation'] },
    async ({ loginPage, registerPage }) => {
      await loginPage.goto();
      await loginPage.goToRegister();

      await expect(loginPage.page).toHaveURL(/register\.htm/);
      await expect(registerPage.heading).toHaveText(headings.registerForm);
      await expect(await registerPage.getTitle()).toBe(titles.register);

      // The 11-field registration form is present.
      const fields = [
        registerPage.firstName,
        registerPage.lastName,
        registerPage.address,
        registerPage.city,
        registerPage.state,
        registerPage.zipCode,
        registerPage.phone,
        registerPage.ssn,
        registerPage.username,
        registerPage.password,
        registerPage.confirmPassword,
      ];
      for (const field of fields) {
        await expect(field).toBeVisible();
      }
    },
  );

  test(
    'TC_REG_007 | Newly registered customer can log out and log back in',
    { tag: ['@P1', '@register', '@e2e'] },
    async ({ registerPage, loginPage, overviewPage, page, context }) => {
      const user = generateUser();

      await test.step('register a new customer', async () => {
        await registerPage.goto();
        await registerPage.register(user);
        test.skip(await isChallenged(registerPage.page), ENV_01);
        await expect(registerPage.heading).toHaveText(`Welcome ${user.username}`);
      });

      await test.step('log out', async () => {
        await registerPage.logout();
        await expect(loginPage.loginButton).toBeVisible();
      });

      await test.step('log back in with the same credentials', async () => {
        await loginPage.login(user.username, user.password);
        await expect(overviewPage.heading).toHaveText(headings.accountsOverview);
        await expect(overviewPage.welcomeText).toContainText(
          `${user.firstName} ${user.lastName}`,
        );
      });

      // The registration persisted: the full Account Services menu is available.
      expect(await overviewPage.getAccountServicesLabels()).toEqual([...accountServicesLinks]);

      // Keep the customer for later runs, then close the session.
      const accounts = await getAccountIds(page, user);
      addUser(user, { accounts, source: 'registered-by-test' });
      await logout(page, context);
    },
  );
});
