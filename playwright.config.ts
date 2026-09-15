import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  /**
   * DEVIATION from the build specification, which asked for 4 in CI and
   * unbounded locally. The public ParaBank demo sits behind Cloudflare and
   * starts returning HTTP 429 (Error 1015, "You are being rate limited") when a
   * machine opens too many sessions at once - unbounded local workers trip it
   * reliably. Override with PW_WORKERS when running against a local instance.
   */
  workers: Number(process.env.PW_WORKERS) || (process.env.CI ? 2 : 3),
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: process.env.BASE_URL ?? 'https://parabank.parasoft.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  /**
   * RUN ORDER
   * ---------
   * The suite always runs in the same pattern, whatever state the environment
   * was left in by a previous run:
   *
   *   setup  ->  registration happens first. tests/auth.setup.ts registers a
   *              brand new customer and writes it to .auth/users.json, falling
   *              back to a healthy pooled customer and then to the .env one.
   *   tests  ->  everything else, which can now assume a customer exists and
   *              picks the freshest one through the `signedIn` fixture.
   *
   * `dependencies` is what enforces it: no test in the `chromium` project starts
   * until `setup` has finished. That ordering is the fix for the whole class of
   * context failures - a stale customer, an empty pool, or a customer so worn
   * out that ParaBank stops approving its loans (ENV-04).
   *
   * Registration is deliberately done inside `setup` rather than as its own
   * project: a project the suite depends on is SKIPPED wholesale when it fails,
   * and the registration POST is challenged at random by the bot protection in
   * front of the public demo (ENV-01). `setup` absorbs that with fallbacks, so a
   * challenged POST never costs the run more than one customer.
   */
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      dependencies: ['setup'],
      testIgnore: /.*\.setup\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        // Deliberately NO shared storageState. ParaBank ends a session server
        // side on logout, so a session shared across parallel tests is killed by
        // the first test that logs out. Every authenticated test opens and closes
        // its own session through the `signedIn` fixture instead.
      },
    },
  ],
});
