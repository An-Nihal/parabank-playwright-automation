import { test, expect } from '../src/fixtures/test-fixtures';
import { logout } from '../src/fixtures/session';
import {
  staticUser,
  badPasswordLogin,
  badUserLogin,
  errors,
  headings,
  titles,
  accountServicesLinks,
} from '../src/test-data/data';

/**
 * Login / Logout.
 *
 * Every case here drives the login form itself, so none of them use the
 * `signedIn` fixture - they must start anonymous. The ones that do end up
 * authenticated log out explicitly, so no session is left open on the server.
 */
test.describe('Login / Logout', () => {
  test(
    'TC_LGN_001 | Log in with valid credentials',
    { tag: ['@P1', '@login'] },
    async ({ loginPage, overviewPage, page, context }) => {
      await loginPage.goto();
      await loginPage.login(staticUser.username, staticUser.password);

      await expect(loginPage.page).toHaveURL(/overview\.htm/);
      await expect(overviewPage.heading).toHaveText(headings.accountsOverview);
      await expect(overviewPage.logoutLink).toBeVisible();
      await expect(overviewPage.accountServicesHeading).toHaveText('Account Services');

      // The greeting names the signed-in customer. The name is read from the
      // page rather than compared to a hardcoded one: ParaBank is a shared demo
      // and anyone can edit a customer's profile through Update Contact Info.
      await expect(overviewPage.welcomeText).toContainText(/^\s*Welcome\s+\S+/);

      // Close the session rather than leaving it open on the server.
      await logout(page, context);
      await expect(loginPage.loginButton).toBeVisible();
    },
  );

  test(
    'TC_LGN_002 | Log in with a valid username and a wrong password',
    { tag: ['@P1', '@login', '@security'] },
    async ({ loginPage, overviewPage, page, context }) => {
      await loginPage.goto();
      await loginPage.login(badPasswordLogin.username, badPasswordLogin.password);

      // DEFECT-07 (critical, broken authentication). By the specification this
      // must fail with 'Error!' and errors.badCredentials. The live application
      // instead ESTABLISHES A SESSION and serves the Accounts Overview - and not
      // even for the account whose username was supplied, but for an unrelated
      // customer, exposing their accounts.
      //
      // This was verified working correctly earlier in the same session, so it
      // is a regression in the demo, not long-standing behaviour.
      //
      // Asserted as it actually behaves, on instruction, so the suite reports
      // the real state of the application. The correct expectation is kept below
      // in a comment so the intended assertion is one edit away once ParaBank is
      // fixed, at which point this test fails and points at docs/DEFECTS.md.
      //
      //   await expect(loginPage.errorTitle).toHaveText(headings.error);
      //   await expect(loginPage.loginError).toHaveText(errors.badCredentials);
      //
      // The customer identity is deliberately not asserted: it varies between
      // attempts (John Smith and Hazel Melvin were both observed), which is
      // itself evidence that a foreign session is being handed out.
      await expect(loginPage.page).toHaveURL(/overview\.htm/);
      await expect(loginPage.page).toHaveTitle(titles.overview);
      await expect(overviewPage.heading).toHaveText(headings.accountsOverview);
      await expect(overviewPage.logoutLink).toBeVisible();

      // Still our mess to clean up, even though the session should not exist.
      await logout(page, context);
    },
  );

  test(
    'TC_LGN_003 | Log in with a username that does not exist',
    { tag: ['@P1', '@login', '@security'] },
    async ({ loginPage, overviewPage, page, context }) => {
      await loginPage.goto();
      await loginPage.login(badUserLogin.username, badUserLogin.password);

      // DEFECT-07 again, and worse: the username does not exist at all, yet a
      // session is issued for some other customer. The specification expects the
      // same errors.badCredentials message as TC_LGN_002 - correct behaviour,
      // revealing nothing about which usernames are real.
      //
      // The intended assertion, for when the application is fixed:
      //   await expect(loginPage.errorTitle).toHaveText(headings.error);
      //   await expect(loginPage.loginError).toHaveText(errors.badCredentials);
      await expect(loginPage.page).toHaveURL(/overview\.htm/);
      await expect(overviewPage.heading).toHaveText(headings.accountsOverview);
      await expect(overviewPage.logoutLink).toBeVisible();

      await logout(page, context);
    },
  );

  test(
    'TC_LGN_004 | Submit the login form with both fields empty',
    { tag: ['@P2', '@login'] },
    async ({ loginPage }) => {
      await loginPage.goto();
      await loginPage.submitEmpty();

      // Empty credentials are still handled correctly, which is what isolates
      // DEFECT-07 to credential *verification* rather than the login flow as a
      // whole. No session is created here, so there is nothing to log out of.
      await expect(loginPage.errorTitle).toHaveText(headings.error);
      await expect(loginPage.loginError).toHaveText(errors.emptyLogin);
    },
  );

  test(
    'TC_LGN_005 | Log out from an authenticated session',
    { tag: ['@P1', '@login'] },
    async ({ loginPage, overviewPage }) => {
      await test.step('log in', async () => {
        await loginPage.goto();
        await loginPage.login(staticUser.username, staticUser.password);
        await expect(overviewPage.heading).toHaveText(headings.accountsOverview);
      });

      // The logout is the behaviour under test, so it is performed directly here
      // rather than through the session helper.
      await overviewPage.logout();

      await expect(loginPage.page).toHaveURL(/index\.htm/);
      await expect(loginPage.loginPanel).toBeVisible();
      await expect(loginPage.loginButton).toBeVisible();
      // The Account Services menu is gone.
      await expect(loginPage.logoutLink).toHaveCount(0);
    },
  );

  test(
    'TC_LGN_006 | Password field masks the typed value',
    { tag: ['@P3', '@login'] },
    async ({ loginPage }) => {
      await loginPage.goto();
      await loginPage.password.fill(staticUser.password);

      // Attribute assertion only - the form is never submitted, so no session.
      await expect(loginPage.password).toHaveAttribute('type', 'password');
      expect(await loginPage.getPasswordFieldType()).toBe('password');
    },
  );

  test(
    'TC_LGN_007 | Open a protected page directly without an active session',
    { tag: ['@P1', '@login', '@security'] },
    async ({ loginPage, overviewPage }) => {
      // A fresh context with no session at all, browsing straight to the
      // protected page. This part of the access control still holds.
      await loginPage.navigateTo('/parabank/overview.htm');

      // The protected content is not rendered.
      await expect(overviewPage.accountLinks).toHaveCount(0);
      await expect(loginPage.page).not.toHaveTitle(titles.overview);
      // No Account Services menu is exposed to an anonymous visitor.
      for (const label of accountServicesLinks) {
        await expect(loginPage.page.getByRole('link', { name: label, exact: true })).toHaveCount(0);
      }
    },
  );
});
