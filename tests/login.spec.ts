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

      // DEFECT-07 history. For part of 2026-09-15 the demo ESTABLISHED A SESSION
      // here - for an unrelated customer - and this test asserted that broken
      // behaviour on instruction. The behaviour vanished when Parasoft reset the
      // demo database on 2026-09-16 (it was corrupted state, not code), so the
      // specification's expectation is back in force. docs/DEFECTS.md keeps the
      // full record and evidence.
      await expect(loginPage.errorTitle).toHaveText(headings.error);
      await expect(loginPage.loginError).toHaveText(errors.badCredentials);
      // No session was created: the protected menu is absent.
      await expect(overviewPage.logoutLink).toHaveCount(0);
      await expect(loginPage.page).not.toHaveTitle(titles.overview);

      // Nothing to log out of, but the helper is tolerant and it keeps the
      // "every login is followed by a logout" invariant trivially true.
      await logout(page, context);
    },
  );

  test(
    'TC_LGN_003 | Log in with a username that does not exist',
    { tag: ['@P1', '@login', '@security'] },
    async ({ loginPage, overviewPage, page, context }) => {
      await loginPage.goto();
      await loginPage.login(badUserLogin.username, badUserLogin.password);

      // The same message as TC_LGN_002, deliberately: a distinct "no such user"
      // message would reveal which usernames exist. (See TC_LGN_002 for the
      // DEFECT-07 history - this case was affected identically.)
      await expect(loginPage.errorTitle).toHaveText(headings.error);
      await expect(loginPage.loginError).toHaveText(errors.badCredentials);
      await expect(overviewPage.logoutLink).toHaveCount(0);

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
