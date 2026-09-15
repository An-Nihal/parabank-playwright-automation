#!/usr/bin/env node
/**
 * Creates a ParaBank customer and records it in the user registry
 * (.auth/users.json), so the suite can sign in as it on later runs.
 *
 *   node scripts/seed-user.js                 # generate a unique username
 *   node scripts/seed-user.js my_user Pass@1  # use a specific username/password
 *
 * Why this exists: registering against the public demo is unreliable because the
 * registration POST sits behind Cloudflare bot protection (ENV-01 in
 * docs/DEFECTS.md). This script retries patiently so that creating a customer is
 * a one-off chore rather than something every run has to gamble on.
 *
 * Run it a few times to build a pool. Spreading work across several customers
 * also avoids any single one accumulating the hundreds of accounts that make
 * ParaBank stop approving loans (ENV-04).
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const BASE = process.env.BASE_URL || 'https://parabank.parasoft.com';
const REGISTRY = path.join('.auth', 'users.json');
const ATTEMPTS = Number(process.env.SEED_ATTEMPTS) || 12;

// The TD_USER_01 profile from the test case documentation.
const PROFILE = {
  firstName: 'Aaron',
  lastName: 'Weber',
  address: '742 Evergreen Terrace',
  city: 'Springfield',
  state: 'Oregon',
  zipCode: '97477',
  phone: '5035550147',
  ssn: '512-88-1902',
};

const unique = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const username = process.argv[2] || `drip_qa_${unique()}`;
const password = process.argv[3] || 'Test@1234';

/** Appends to the registry, merging if the username is already present. */
function record(user, accounts) {
  fs.mkdirSync('.auth', { recursive: true });
  let users = [];
  try {
    const parsed = JSON.parse(fs.readFileSync(REGISTRY, 'utf8'));
    if (Array.isArray(parsed)) users = parsed;
  } catch {
    /* first run: no registry yet */
  }
  const entry = { ...user, accounts, createdAt: new Date().toISOString(), source: 'seeded' };
  const at = users.findIndex((u) => u.username === user.username);
  if (at >= 0) users[at] = { ...users[at], ...entry };
  else users.push(entry);
  fs.writeFileSync(REGISTRY, `${JSON.stringify(users, null, 2)}\n`, 'utf8');
  return users.length;
}

(async () => {
  const user = { ...PROFILE, username, password, repeatedPassword: password };
  const browser = await chromium.launch();

  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await page.goto(`${BASE}/parabank/register.htm`);
      const fields = {
        'customer.firstName': user.firstName,
        'customer.lastName': user.lastName,
        'customer.address.street': user.address,
        'customer.address.city': user.city,
        'customer.address.state': user.state,
        'customer.address.zipCode': user.zipCode,
        'customer.phoneNumber': user.phone,
        'customer.ssn': user.ssn,
        'customer.username': user.username,
        'customer.password': user.password,
        repeatedPassword: user.repeatedPassword,
      };
      for (const [name, value] of Object.entries(fields)) {
        await page.fill(`input[name="${name}"]`, value);
      }
      await page.click('input[type="submit"][value="Register"]');
      await page.waitForLoadState('load');
      await page.waitForTimeout(6000);

      const title = await page.title();
      const usernameError = await page
        .locator('span[id="customer.username.errors"]')
        .innerText()
        .catch(() => '');

      if (/Customer Created/i.test(title)) {
        // Registration signs the customer in, so the accounts are readable now.
        await page.goto(`${BASE}/parabank/overview.htm`);
        await page.waitForSelector('#accountTable tbody tr td a', { timeout: 30000 });
        const accounts = (
          await page.locator('#accountTable tbody tr td a').allInnerTexts()
        ).map((t) => t.trim());
        const total = record(user, accounts);
        console.log(`Registered ${user.username} on attempt ${attempt}.`);
        console.log(`  accounts : ${accounts.join(', ')}`);
        console.log(`  registry : ${REGISTRY} now holds ${total} customer(s)`);
        await page.goto(`${BASE}/parabank/logout.htm`).catch(() => {});
        await browser.close();
        process.exit(0);
      }

      if (/already exists/i.test(usernameError)) {
        console.log(`${user.username} already exists - not registering it again.`);
        await browser.close();
        process.exit(0);
      }

      console.log(`attempt ${attempt}/${ATTEMPTS}: blocked by bot protection, retrying`);
    } catch (error) {
      console.log(`attempt ${attempt}/${ATTEMPTS}: ${String(error).split('\n')[0]}`);
    } finally {
      await context.close();
    }
    // Back off between attempts: hammering makes the challenge more likely, and
    // risks the rate limiter (ENV-02) on top of it.
    await new Promise((resolve) => setTimeout(resolve, 20000));
  }

  console.error(
    `Could not register ${username}: the registration POST was challenged every time.\n` +
      'Try again later, or run against a local ParaBank (docker run -d -p 8080:8080 parasoft/parabank).',
  );
  await browser.close();
  process.exit(1);
})();
