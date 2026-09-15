import { test as setup, expect, Browser, Page } from '@playwright/test';
import { RegisterPage } from '../src/pages/RegisterPage';
import { staticUser, titles } from '../src/test-data/data';
import { generateUser } from '../src/test-data/DataFactory';
import { User } from '../src/test-data/data';
import { addUser, readUsers, healthyUsers, REGISTRY_PATH } from '../src/test-data/UserRegistry';
import { login, logout, getAccountIds, hasWorkingSession } from '../src/fixtures/session';

/**
 * The first thing the suite does, every run: REGISTRATION.
 *
 * This project is a dependency of the test project (see playwright.config.ts),
 * so nothing else starts until it has finished. It exists to guarantee the one
 * precondition every other spec shares - a healthy customer to sign in as - so
 * that no test can fail merely because of the state the environment was left in.
 *
 * ORDER OF WORK
 * -------------
 *   1. Register a brand new customer and record it in .auth/users.json.
 *      This runs first deliberately. A customer created seconds ago has no
 *      history, which is what the balance, transfer and loan cases want: a
 *      customer that has accumulated hundreds of accounts makes ParaBank stop
 *      approving loans outright (ENV-04 in docs/DEFECTS.md), so leaning on an
 *      old customer is how TC_LON_001 / TC_LON_003 silently start failing.
 *   2. If registration was challenged by the bot protection (ENV-01), reuse a
 *      healthy customer already in the pool.
 *   3. If the pool has none, fall back to the static customer from .env.
 *
 * Only if all three fail does this project fail - and at that point there is
 * genuinely no way to sign in, so failing fast beats 60 confusing red tests.
 *
 * Registration is best effort by design: steps 2 and 3 mean a challenged POST
 * costs the run nothing. That is why this seeding lives here rather than in a
 * project that the rest of the suite would be skipped behind.
 */

/** How many times the registration POST may be challenged before we give up. */
const ATTEMPTS = Number(process.env.SEED_REGISTER_ATTEMPTS) || 4;

/**
 * Pause between registration attempts.
 *
 * Not an arbitrary wait in a test - there is nothing on the page to wait for.
 * The Cloudflare challenge in front of the registration POST is rate shaped:
 * retrying immediately is challenged again, while backing off usually gets
 * through. Set SEED_REGISTER_BACKOFF_MS=0 against a local ParaBank.
 */
const BACKOFF_MS = Number(process.env.SEED_REGISTER_BACKOFF_MS ?? 8_000);

const backOff = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, BACKOFF_MS));

/** A pooled customer above this many accounts is treated as worn out (ENV-04). */
const HEALTHY_ACCOUNT_LIMIT = Number(process.env.HEALTHY_ACCOUNT_LIMIT) || 100;

setup('register a customer and seed the registry', async ({ browser }) => {
  const annotate = (description: string): void => {
    setup.info().annotations.push({ type: 'registry', description });
  };

  // ---------------------------------------------------------------- 1. register
  const registered = await registerFreshCustomer(browser, annotate);
  if (registered) {
    annotate(`Registered ${registered} - pool now holds ${readUsers().length} customer(s)`);
    return;
  }

  // ------------------------------------------------------------ 2. reuse a pool
  // Preferring the healthiest entries means a worn-out customer is only used
  // when it is the only one left, rather than at random.
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    const candidates = [...healthyUsers(HEALTHY_ACCOUNT_LIMIT), ...readUsers()];
    for (const pooled of candidates) {
      if (await signInWorks(page, pooled)) {
        await getAccountIds(page, pooled); // refresh the cached account ids
        await logout(page, context);
        annotate(`Reusing pooled customer ${pooled.username} (${REGISTRY_PATH})`);
        return;
      }
      await logout(page, context);
    }

    // ------------------------------------------------------ 3. the .env customer
    const usable = await signInWorks(page, staticUser);
    if (usable) {
      const accounts = await getAccountIds(page, staticUser);
      addUser(staticUser, { accounts, source: 'seeded' });
      annotate(`Falling back to the static customer ${staticUser.username}`);
    }
    await logout(page, context);

    expect(
      usable,
      'No usable ParaBank customer. Registering a new one was blocked by the bot ' +
        'protection in front of the public demo, no pooled customer in ' +
        `${REGISTRY_PATH} could sign in, and the static customer ` +
        `"${staticUser.username}" could not either. Either set STATIC_USERNAME / ` +
        'STATIC_PASSWORD in .env to a customer that exists, run `npm run seed:user` ' +
        'until it succeeds, or point BASE_URL at a local ParaBank instance ' +
        '(docker run -d -p 8080:8080 parasoft/parabank).',
    ).toBe(true);
  } finally {
    await context.close();
  }
});

/**
 * Registers a new customer, retrying in a clean browser context each time.
 *
 * A fresh context per attempt matters: the Cloudflare challenge sets cookies,
 * and retrying inside the same context simply replays the challenge.
 *
 * @returns the username on success, or undefined when every attempt was blocked.
 */
async function registerFreshCustomer(
  browser: Browser,
  annotate: (description: string) => void,
): Promise<string | undefined> {
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const user = generateUser();
    try {
      const registerPage = new RegisterPage(page);
      await registerPage.goto();
      await registerPage.register(user);

      // ParaBank keeps the same URL and swaps the panel, so the title is the
      // signal. A challenged POST never reaches it.
      const created = (await page.title()) === titles.customerCreated;
      if (created && (await hasWorkingSession(page))) {
        // Registration signs the customer straight in, so its accounts are
        // readable now - and recorded so later runs can skip this entirely.
        const accounts = await getAccountIds(page, user);
        addUser(user, { accounts, source: 'seeded' });
        await logout(page, context);
        return user.username;
      }
      annotate(`Registration attempt ${attempt}/${ATTEMPTS} was challenged (ENV-01)`);
    } catch (error) {
      annotate(`Registration attempt ${attempt}/${ATTEMPTS} failed: ${String(error).split('\n')[0]}`);
    } finally {
      await context.close();
    }
    if (attempt < ATTEMPTS) {
      await backOff();
    }
  }
  return undefined;
}

/**
 * True when these credentials produce a genuinely authenticated session.
 *
 * Checks that accounts actually render rather than that the browser reached
 * overview.htm: the demo currently lets a failed login through to that page
 * (DEFECT-07), so the URL alone proves nothing.
 */
async function signInWorks(page: Page, user: User): Promise<boolean> {
  try {
    await login(page, user);
  } catch {
    return false;
  }
  return hasWorkingSession(page);
}
