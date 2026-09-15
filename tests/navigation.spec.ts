import { test, expect } from '../src/fixtures/test-fixtures';
import {
  staticUser,
  contactMessage,
  topMenuLinks,
  accountServicesLinks,
  titles,
  headings,
  messages,
} from '../src/test-data/data';

test.describe('Global / Navigation', () => {
  // These cases are public pages, so they never sign in at all.
  test.describe('Anonymous visitor', () => {
    test(
      'TC_NAV_001 | Home page title and landing URL',
      { tag: ['@P1', '@navigation', '@smoke'] },
      async ({ loginPage }) => {
        await loginPage.goto();

        await expect(loginPage.page).toHaveTitle(titles.home);
        await expect(loginPage.page).toHaveURL(/index\.htm/);
        await expect(loginPage.loginPanel).toBeVisible();
        await expect(loginPage.username).toBeVisible();
        await expect(loginPage.password).toBeVisible();
        await expect(loginPage.loginButton).toBeVisible();
      },
    );

    test(
      'TC_NAV_002 | Top menu items open the correct pages',
      { tag: ['@P2', '@navigation'] },
      async ({ loginPage }) => {
        for (const link of topMenuLinks) {
          await test.step(`${link.label} opens its own page`, async () => {
            await loginPage.goto();
            await loginPage.clickTopMenuLink(link.label);

            await expect(loginPage.page).toHaveURL(new RegExp(link.urlFragment));
            if (link.heading !== undefined) {
              // Matched against the whole right panel: About Us and Admin Page
              // render their heading in an <h1>, Services in a <span>.
              await expect(loginPage.rightPanel).toContainText(link.heading);
            }
            // No HTTP error page.
            await expect(loginPage.page).not.toHaveTitle(/404|error/i);
          });
        }
      },
    );

    test(
      'TC_NAV_003 | ParaBank logo returns to the Home page',
      { tag: ['@P3', '@navigation'] },
      async ({ loginPage }) => {
        await loginPage.navigateTo('/parabank/about.htm');
        await expect(loginPage.page).toHaveURL(/about\.htm/);

        await loginPage.clickLogo();

        await expect(loginPage.page).toHaveURL(/index\.htm/);
        await expect(loginPage.page).toHaveTitle(titles.home);
      },
    );

    test(
      'TC_NAV_005 | Submit the Contact Us form',
      { tag: ['@P3', '@navigation'] },
      async ({ loginPage, contactUsPage }) => {
        await loginPage.goto();
        await loginPage.contactUsLink.click();

        await expect(contactUsPage.heading).toHaveText(headings.customerCare);

        await contactUsPage.sendMessage(contactMessage);

        await expect(contactUsPage.thankYouMessage).toHaveText(
          messages.contactThankYou(contactMessage.name),
        );
        await expect(contactUsPage.followUpMessage).toHaveText(messages.contactFollowUp);
      },
    );

    test(
      'TC_NAV_006 | Footer links are reachable',
      { tag: ['@P3', '@navigation'] },
      async ({ loginPage, request }) => {
        await loginPage.goto();
        const hrefs = await loginPage.getFooterHrefs();
        expect(hrefs.length).toBeGreaterThan(0);

        // Only ParaBank's own pages are in scope; third-party sites are not.
        const internal = hrefs.filter((href) => href.includes('/parabank/'));
        expect(internal.length).toBeGreaterThan(0);

        for (const href of internal) {
          await test.step(`${href} responds 200`, async () => {
            const response = await request.get(href);
            expect(response.status()).toBe(200);
          });
        }
      },
    );
  });

  test.describe('Authenticated customer', () => {
    test(
      'TC_NAV_004 | Account Services menu is complete after login',
      { tag: ['@P1', '@navigation'] },
      // `signedIn` logs in before the test and logs out after it.
      async ({ overviewPage, signedIn }) => {
        expect(signedIn.username).not.toBe('');
        await overviewPage.goto();

        // All eight links are present, in order.
        expect(await overviewPage.getAccountServicesLabels()).toEqual([
          ...accountServicesLinks,
        ]);
      },
    );

    // Logging out is the behaviour under test here, so this case drives the
    // login and logout itself instead of using the `signedIn` fixture.
    test.describe('Owns its session', () => {
      test(
      'TC_NAV_007 | Session is invalidated after logout',
      { tag: ['@P1', '@navigation', '@security'] },
      async ({ loginPage, overviewPage }) => {
        await test.step('log out', async () => {
          await loginPage.goto();
          await loginPage.login(staticUser.username, staticUser.password);
          // Only that *someone* is signed in. The name is not asserted: this is
          // a shared demo and any visitor can edit a customer profile.
          await expect(overviewPage.welcomeText).toContainText(/^\s*Welcome\s+\S+/);
          await overviewPage.logout();
          await expect(loginPage.loginButton).toBeVisible();
        });

        await test.step('navigate directly back to the protected page', async () => {
          await loginPage.navigateTo('/parabank/overview.htm');
        });

        // The Accounts Overview is not shown.
        await expect(overviewPage.accountLinks).toHaveCount(0);
        await expect(loginPage.page).not.toHaveTitle(titles.overview);
      },
      );
    });
  });
});
