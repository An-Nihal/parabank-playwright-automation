import { Page, BrowserContext } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { AccountsOverviewPage } from '../pages/AccountsOverviewPage';
import { User, staticUser } from '../test-data/data';
import { RegisteredUser, pickUser, recordAccounts } from '../test-data/UserRegistry';

/**
 * Session handling, kept in one place so every authenticated test opens and
 * closes its session the same way.
 *
 * WHY EVERY TEST OWNS ITS SESSION
 * -------------------------------
 * ParaBank invalidates a session server side when a customer logs out. A single
 * shared storageState is therefore unsafe here: the first test to log out kills
 * the session every parallel test is still using. That is not theoretical - it
 * broke TC_NAV_004 and TC_NAV_007 during development.
 *
 * So each test logs in for itself and logs out afterwards, leaving nothing
 * behind on the server. Playwright already gives every test a fresh browser
 * context, so cookies cannot leak between tests; clearing them on the way out is
 * belt and braces for the case where a test switches identity mid-run.
 */

/** Logs in through the UI and waits for the Accounts Overview to load. */
export async function login(page: Page, user: User): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(user.username, user.password);
  await page.waitForURL(/overview\.htm/);
}

/**
 * Logs out and clears client-side cookies.
 *
 * Deliberately tolerant: this runs in fixture teardown, where the test may
 * already have logged out (TC_LGN_005, TC_NAV_007) or may have been left on an
 * error page. Teardown must not turn a green test red or mask the real failure
 * of a red one, so a missing Log Out link is simply nothing to do.
 */
export async function logout(page: Page, context: BrowserContext): Promise<void> {
  try {
    const loginPage = new LoginPage(page);
    if (await loginPage.logoutLink.count()) {
      await loginPage.logout();
      // Wait for the Customer Login panel, which only renders once the session
      // is gone. No fixed delay: the assertion of being logged out is the wait.
      await loginPage.loginButton.waitFor({ state: 'visible' });
    } else {
      // Not on a page that offers the menu (an error page, say). Hit the logout
      // endpoint directly so the server-side session still goes away.
      await page.goto('/parabank/logout.htm');
    }
  } catch {
    // The page may already be closed, or the site may be mid-outage. Either way
    // the context is about to be discarded, so there is nothing left to clean.
  } finally {
    await context.clearCookies().catch(() => {
      /* context already closed */
    });
  }
}

/**
 * Chooses which customer a test should log in as.
 *
 * Prefers a customer from the registry, so the workload spreads across the pool
 * instead of degrading one customer (ENV-04). Falls back to the configured
 * static customer when the pool is empty, which is the first-run case.
 */
export function chooseUser(index?: number): User {
  return pickUser(index) ?? staticUser;
}

/**
 * Reads the customer's account ids, using the registry cache when it is still
 * accurate and refreshing it when it is not.
 *
 * The cache only ever saves a page load; it is never trusted blindly, because
 * accounts the suite opens during a run would otherwise go unnoticed.
 */
export async function getAccountIds(page: Page, user: User): Promise<string[]> {
  const overview = new AccountsOverviewPage(page);
  await overview.goto();
  const ids = await overview.getAccountIds();
  recordAccounts(user.username, ids);
  return ids;
}

/**
 * True when the last navigation landed on the Cloudflare interstitial rather
 * than on ParaBank.
 *
 * The public demo sits behind bot protection that challenges the registration
 * POST at random (ENV-01 in docs/DEFECTS.md). Every ParaBank page titles itself
 * "ParaBank | ..."; the challenge page does not, so the title is a reliable
 * tell that costs no extra selector. Used by the registration specs to skip -
 * not fail - when the environment, rather than the application, blocked them.
 */
export async function isChallenged(page: Page): Promise<boolean> {
  await page.waitForLoadState('load');
  return !(await page.title()).startsWith('ParaBank');
}

/**
 * The customer's best funded account id.
 *
 * Opening a new account moves the minimum deposit out of a source account, so
 * the source has to have money in it. On the public demo it often does not:
 * ParaBank is shared, anyone can drain a customer, and this suite has itself
 * seen a customer whose accounts were all at $0.00 with one at -$1,000. Picking
 * the richest account instead of "the first one" keeps the funding fixtures
 * working on a customer in that state.
 */
export async function bestFundedAccount(page: Page): Promise<string> {
  const overview = new AccountsOverviewPage(page);
  await overview.goto();
  const ids = await overview.getAccountIds();
  const balances = await overview.getAllBalances();
  let best = 0;
  for (let index = 1; index < ids.length; index++) {
    if ((balances[index] ?? 0) > (balances[best] ?? 0)) {
      best = index;
    }
  }
  return ids[best];
}

/**
 * True when the page is showing a genuinely authenticated Accounts Overview.
 *
 * Used to validate a pooled customer before a test relies on it. It checks for
 * rendered accounts rather than merely reaching overview.htm, because the demo
 * currently lets a failed login through to that page (DEFECT-07) - so landing
 * there proves nothing on its own.
 */
export async function hasWorkingSession(page: Page): Promise<boolean> {
  const overview = new AccountsOverviewPage(page);
  try {
    await overview.waitForAccounts();
    return true;
  } catch {
    return false;
  }
}

export type { RegisteredUser };
