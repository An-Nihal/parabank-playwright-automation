# ParaBank UI Test Automation

Playwright + TypeScript UI automation for [ParaBank](https://parabank.parasoft.com/parabank/index.htm), Parasoft's public demo banking application.

Page Object Model with a **dedicated locators layer**: selectors live in `src/locators/` and nowhere else. All **63 test cases** from `ParaBank_Test_Case_Documentation.pdf` are implemented, each titled with its TC ID.

---

## Install

```bash
npm ci
npx playwright install --with-deps chromium
cp .env.example .env
```

## Run

```bash
npm test                      # the whole suite
npm run test:p1               # critical path only (the PR gate)
npm run test:headed           # watch it drive a real browser
npm run test:ui               # Playwright UI mode
npx playwright test --grep TC_TRF_002       # one test case by TC ID
npx playwright test --grep @billPay         # one module
npx playwright test tests/login.spec.ts     # one spec file
```

### View the report

```bash
npm run report                # opens the HTML report from the last run
```

Traces, screenshots and video are captured on failure and attached to the report.

### Quality gates

```bash
npm run typecheck             # tsc --noEmit, no `any` in src/
npm run lint:locators         # no raw selectors outside src/locators, no waits, no .only
```

---

## Tags

| Tag | Meaning |
|---|---|
| `@P1` | Critical path. 32 tests. Runs on every PR and must pass. |
| `@P2` | Important. 22 tests. Nightly. |
| `@P3` | Low risk / cosmetic. 9 tests. Full regression only. |
| `@register`, `@login`, `@transferFunds`, … | One tag per module. |
| `@e2e`, `@calculation`, `@security`, `@smoke` | Test type, mirroring the specification. |
| `@partial` | The two cases where ParaBank's behaviour differs from the correct banking rule. |

---

## Project layout

```
src/
├── locators/        SELECTOR STRINGS ONLY - no Playwright import, no logic
├── pages/           behaviour: actions and getters, no assertions
├── test-data/
│   ├── data.ts          every fixed value, typed
│   ├── DataFactory.ts   everything unique per run
│   └── UserRegistry.ts  durable pool of customers the suite has created
├── fixtures/
│   ├── test-fixtures.ts page objects + session/account fixtures
│   └── session.ts       login, logout and customer selection
└── utils/
    ├── currency.ts      '$1,234.56' -> 1234.56
    └── dates.ts         MM-DD-YYYY helpers
tests/                one spec per module, plus auth.setup.ts
docs/
├── TRACEABILITY.md      all 63 TC IDs -> spec file -> test title
├── DEFECTS.md           defects and deviations found, with evidence
├── users.example.json   shape of the git-ignored .auth/users.json
└── dom-snapshot.txt     the captured live DOM every selector was written from
```

### The three layers

**`src/locators/` — selectors only.** A locators file exports a frozen object of
selector strings and imports nothing from Playwright. Parameterised selectors are
functions:

```ts
export const accountsOverviewLocators = {
  accountTable: '#accountTable',
  accountLink: (id: string) => `#accountTable tbody tr td a:text-is("${id}")`,
} as const;
```

**`src/pages/` — behaviour.** Page objects turn those strings into `Locator`s and
expose actions and getters. They never assert, so a negative test can reuse them.

**`tests/` — assertions.** Every `expect()` lives here, and every expected message
comes from `errors` / `messages` in `data.ts`, never a string literal typed inline.

`npm run lint:locators` enforces all of this.

---

## How to add a new page

1. **`src/locators/myPage.locators.ts`** — export the selector strings. Verify each
   one against the live DOM first (see *Verifying selectors* below).
2. **`src/pages/MyPage.ts`** — extend `BasePage`, build `Locator`s in the
   constructor from the imported locator constants, add actions and getters.
3. **`src/fixtures/test-fixtures.ts`** — add the page object as a fixture so specs
   receive it by name.
4. **`tests/myPage.spec.ts`** — write the tests, titled `TC_XXX_000 | ...`, tagged
   with a priority and the module.
5. Add the rows to `docs/TRACEABILITY.md`.

### Verifying selectors

Nothing goes into `src/locators/` that has not been seen in the live DOM.
`scripts/inspect.js` logs in and dumps every page's controls and panel markup:

```bash
node scripts/inspect.js > docs/dom-snapshot.txt
```

The committed `docs/dom-snapshot.txt` is the evidence behind the current
selectors. The Playwright MCP server (`claude mcp add playwright -- npx -y
@playwright/mcp@latest`) or `npx playwright codegen` work equally well.

---

## Test data

Two sources, per the specification's data strategy:

- **`data.ts`** — everything fixed: the static customer, invalid login sets, the
  empty-field set, expected messages, account types, transfer amounts, loan
  scenarios, the navigation table.
- **`DataFactory.ts`** — everything that must differ per run, built from a base
  object plus overrides:

```ts
const user     = generateUser();
const mismatch = generateUser({ repeatedPassword: 'Test@9999' }); // TC_REG_003
const noFirst  = generateUser({ firstName: '' });                 // TC_REG_005
```

Factories are called **inside** a test or fixture, never at module scope, so
parallel workers never share a generated value. Values the application creates
during a run and then asserts on - account ids, transaction ids, balances - stay
in memory and travel through fixtures. No Excel, and no JSON file is ever a
source of expected values.

The one thing that *is* persisted is credentials, in the user registry below.
That is a deliberate, narrow exception: it stores who the suite can log in as,
never what a test should expect.

### Sessions: every test logs in and out for itself

There is **no shared `storageState`**. ParaBank ends a session *server side* when
a customer logs out, so one session shared across parallel tests is killed by the
first test that logs out - which is a race, not a theory: it broke `TC_NAV_004`
and `TC_NAV_007` during development.

Instead, the `signedIn` fixture opens a session before the test and closes it
afterwards - logout, then `clearCookies()` - and the teardown runs even when the
test fails:

```ts
test('TC_ACO_001 | ...', async ({ overviewPage, signedIn }) => {
  // already signed in; logged out automatically when the test ends
});
```

Tests that drive the login form themselves (`TC_LGN_*`, `TC_REG_001`,
`TC_REG_007`, `TC_FLI_001`, `TC_NAV_007`) do not take `signedIn` - they log in
and out explicitly, because that flow *is* what they are testing. Either way, no
test finishes with a session still open.

### Test isolation

The suite runs `fullyParallel: true` against a shared demo customer, so any test
asserting a balance change funds its own account first:

| Fixture | Use it for |
|---|---|
| `signedIn` | an authenticated session, closed automatically afterwards |
| `twoAccounts` | the customer's accounts, opening one if fewer than two exist |
| `accountWithTransactions` | read-only tests that need existing history |
| `freshAccount` | a private account, for balance-delta assertions |
| `freshAccountPair` | two private accounts, for transfer assertions |

---

## Customers: the user registry

Registering a customer against the public demo is unreliable - the registration
POST sits behind bot protection and is frequently challenged (ENV-01). So
customers the suite creates are **kept**, in `.auth/users.json`:

```jsonc
[
  {
    "username": "drip_qa_m1x2y3", "password": "Test@1234",
    "firstName": "Aaron", "lastName": "Weber", "ssn": "512-88-1902",
    "address": "742 Evergreen Terrace", "city": "Springfield", /* ... */
    "accounts": ["12345", "12346"],
    "createdAt": "2026-09-16T09:00:00.000Z", "source": "seeded"
  }
]
```

A plain array, and every entry is a **complete, self-contained customer** - so
picking any index at random is always valid. That is the point: spreading work
across the pool stops any single customer accumulating the hundreds of accounts
that make ParaBank stop approving loans (ENV-04).

Add customers to the pool with:

```bash
npm run seed:user                 # generated unique username
npm run seed:user my_user Pass@1  # a specific one
```

`src/test-data/UserRegistry.ts` owns the file. Writes take an exclusive lock and
rename a temp file into place, so two Playwright workers appending at once cannot
corrupt it. `docs/users.example.json` shows the shape.

**Nothing is ever asserted against this file.** It is a credential pool, not a
source of expected values - run-created data that a test asserts on (balances,
transaction ids) still lives only in memory, as the specification requires.

### Run order

The suite always runs in the same pattern, whatever state the demo was left in:

```
setup   registration first - tests/auth.setup.ts registers a brand new customer
        and records it, falling back to a healthy pooled customer, then to the
        .env one
  |
  v
tests   everything else, which can now assume a usable customer exists
```

`dependencies: ['setup']` in `playwright.config.ts` is what enforces it: no test
starts until seeding has finished. That ordering is what stops the suite failing
for reasons that belong to the environment rather than the application - an empty
pool, a stale customer, or a customer whose accounts have been drained to $0 by
other people using the shared demo.

Registration lives inside `setup` rather than in its own project on purpose: a
project that others depend on is **skipped wholesale** when it fails, and the
registration POST is challenged at random (ENV-01). Inside `setup`, a challenged
POST costs the run one customer and nothing more.

Tests that need money do not borrow it: `freshAccount` opens an account funded
from the customer's best funded account, so balance, transfer and loan
assertions do not depend on what the shared customer happens to hold.

Credentials come from `.env` (git-ignored, along with `.auth/`):

```ini
BASE_URL=https://parabank.parasoft.com
STATIC_USERNAME=parabank_qa01
STATIC_PASSWORD=Test@1234
```

---

## Known ParaBank behaviours

The application deviates from the specification in several places. Each is
asserted **as it actually behaves**, with the gap recorded rather than written as
a failing test — see `docs/DEFECTS.md` for the full list and reproduction steps.

| ID | Summary |
|---|---|
| DEFECT-01 | A transfer whose source and destination are the same account is accepted. |
| DEFECT-02 | A transfer larger than the balance is accepted; the account goes negative. |
| DEFECT-03 | An empty transfer amount surfaces a generic server error, not the shipped validation message. |
| DEFECT-04 | A non-numeric transfer amount does the same. |
| DEVIATION-05 | A successful Customer Lookup logs the customer in instead of showing their credentials. |
| DEVIATION-06 | The loan denial message differs from the one quoted in the specification. |
| **DEFECT-07** | **Critical: a failed login is granted another customer's session.** A wrong password, or a username that does not exist, signs you in as an unrelated customer and exposes their accounts. |
| DEFECT-08 | A Find Transactions search that matches nothing renders one corrupt row (`NaN-NaN-NaN` / `undefined`) instead of an empty table. |
| DEFECT-09 | A bill payment is confirmed on screen but never debits the account or appears in its history. |
| DEFECT-10 | Update Contact Info fails with `An internal error has occurred and has been logged.` for valid data. |

## Running against the public demo

The public instance is shared and sits behind Cloudflare. Two consequences:

- **Rate limiting.** Too many concurrent sessions returns HTTP 429
  (*Error 1015 — You are being rate limited*) for a few minutes. Workers default
  to 3 locally and **1 in CI** - a GitHub-hosted runner is a shared datacenter IP
  that Cloudflare already distrusts, and two workers there were enough to turn
  the second half of a run into timeouts. Raise with `PW_WORKERS` against a
  local instance.
- **Bot protection on registration.** `POST /parabank/register.htm` is
  intermittently challenged with a Cloudflare interstitial. The registration
  tests detect the interstitial straight after submitting and **skip with the
  reason `ENV-01`** rather than fail, so a challenged run reports skips, never
  red tests that have nothing to do with ParaBank. The `setup` project retries
  registration with a back-off and falls back to the customer pool.

Both disappear against a local ParaBank:

```bash
docker run -d -p 8080:8080 parasoft/parabank
BASE_URL=http://localhost:8080 PW_WORKERS=8 npm test
```

**Never click Clean / Initialize database on the Admin page** — it wipes data for
everyone using the demo. No test touches those controls.
