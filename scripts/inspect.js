// Throwaway DOM inspection. node scripts/inspect.js > docs/dom-snapshot.txt
const { chromium } = require('@playwright/test');
const BASE = 'https://parabank.parasoft.com';

async function dump(page, label) {
  console.log(`\n${'='.repeat(90)}\n### ${label}  ::  ${page.url().replace(BASE,'')}\n${'='.repeat(90)}`);
  console.log('--- TITLE: ' + (await page.title()));
  const controls = await page.locator('input, select, button, textarea').evaluateAll((els) =>
    els.map((e) => ({
      tag: e.tagName, type: e.getAttribute('type'), name: e.getAttribute('name'),
      id: e.id || null, cls: e.className || null, value: e.getAttribute('value'),
      opts: e.tagName === 'SELECT' ? [...e.querySelectorAll('option')].map((o) => o.textContent.trim()).slice(0, 4) : undefined,
    })),
  );
  console.log('--- CONTROLS:\n' + JSON.stringify(controls));
  const panels = await page.locator('#rightPanel, #leftPanel').evaluateAll((els) =>
    els.map((e) => `[${e.id}] ${e.innerHTML.replace(/\s+/g, ' ').slice(0, 3200)}`),
  );
  console.log('--- PANELS:\n' + panels.join('\n\n'));
}

(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext()).newPage();

  await page.goto(`${BASE}/parabank/index.htm`);
  await dump(page, 'HOME / LOGIN');
  await page.goto(`${BASE}/parabank/register.htm`);
  await dump(page, 'REGISTER');
  await page.goto(`${BASE}/parabank/lookup.htm`);
  await dump(page, 'FORGOT LOGIN / CUSTOMER LOOKUP');
  await page.goto(`${BASE}/parabank/contact.htm`);
  await dump(page, 'CONTACT US');

  // Log in with the standard ParaBank demo customer to reach the authenticated pages.
  await page.goto(`${BASE}/parabank/index.htm`);
  await page.fill('input[name="username"]', 'john');
  await page.fill('input[name="password"]', 'demo');
  await page.click('input[value="Log In"]');
  await page.waitForURL('**/overview.htm', { timeout: 30000 });
  await dump(page, 'ACCOUNTS OVERVIEW (authenticated)');

  const acctId = (await page.locator('#accountTable tbody tr td a').first().textContent()).trim();
  console.log(`\n>>> FIRST ACCOUNT ID: ${acctId}`);
  const accountCount = await page.locator('#accountTable tbody tr td a').count();
  console.log(`>>> ACCOUNT LINK COUNT: ${accountCount}`);

  await page.goto(`${BASE}/parabank/openaccount.htm`);
  await dump(page, 'OPEN NEW ACCOUNT');
  await page.goto(`${BASE}/parabank/activity.htm?id=${acctId}`);
  await dump(page, 'ACCOUNT DETAILS / ACTIVITY');
  await page.goto(`${BASE}/parabank/transfer.htm`);
  await dump(page, 'TRANSFER FUNDS');
  await page.goto(`${BASE}/parabank/billpay.htm`);
  await dump(page, 'BILL PAY');
  await page.goto(`${BASE}/parabank/findtrans.htm`);
  await dump(page, 'FIND TRANSACTIONS');
  await page.goto(`${BASE}/parabank/updateprofile.htm`);
  await dump(page, 'UPDATE CONTACT INFO');
  await page.goto(`${BASE}/parabank/requestloan.htm`);
  await dump(page, 'REQUEST LOAN');

  await browser.close();
})().catch((e) => { console.error('INSPECT FAILED:', e.message); process.exit(1); });
