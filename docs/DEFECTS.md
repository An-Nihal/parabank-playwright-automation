# Defects and deviations

Behaviours where the live ParaBank application disagrees with
`ParaBank_Test_Case_Documentation.pdf`.

Each is asserted **as the application actually behaves**, so the suite stays green
and keeps its value as a regression net. None is written as a knowingly failing
test, and none is skipped. If ParaBank is ever fixed, the corresponding assertion
fails and points straight at this file.

*Verified against `https://parabank.parasoft.com` on 15-16 September 2026.*

---

## DEFECT-01 — A transfer to the source account itself is accepted

**Test:** `TC_TRF_005` (`@partial`) · **Severity:** medium · **Rule:** a transfer
must have a distinct source and destination.

| | |
|---|---|
| **Expected** | The transfer is rejected. |
| **Actual** | `Transfer Complete!` is displayed, naming the same account as both source and destination. The balance is unchanged, since the money moves to itself. |

**Reproduce:** Transfer Funds → enter `10.00` → select the same account in *From*
and *To* → TRANSFER.

The specification already classifies this as `Partial`. The test asserts the
completion message *and* that the balance did not move.

---

## DEFECT-02 — A transfer larger than the balance is accepted

**Test:** `TC_TRF_006` (`@partial`) · **Severity:** high · **Rule:** a transfer
exceeding the available balance must be refused for insufficient funds.

| | |
|---|---|
| **Expected** | An *insufficient funds* error. |
| **Actual** | The transfer completes and the source account goes negative. Transferring `9999999.00` from an account holding `100.00` leaves it at `-9999899.00`. |

**Reproduce:** Transfer Funds → enter an amount greater than the source balance →
TRANSFER → read the source balance on Accounts Overview.

There is no overdraft facility in the product, so this is a missing business rule
rather than a configured limit. The specification classifies it as `Partial`.

---

## DEFECT-03 — An empty transfer amount reports a generic server error

**Test:** `TC_TRF_003` · **Severity:** low (cosmetic, but misleading)

| | |
|---|---|
| **Expected** | `The amount cannot be empty.` |
| **Actual** | `Error!` / `An internal error has occurred and has been logged.` |

**Root cause.** The page ships the correct message:

```html
<p id="amount.errors" class="error" style="display: none;">The amount cannot be empty.</p>
```

but the script that should reveal it uses

```js
function resetErrors() { $('#amount.errors').hide(); }
```

`#amount.errors` is a CSS *id + class* selector — an element with `id="amount"`
**and** `class="errors"` — which never matches, because the paragraph's id is
literally `amount.errors`. The validation therefore never runs, the empty value is
sent to `services_proxy/bank/transfer`, the server answers `400`, and the generic
error panel is shown.

Two paragraphs on the page also share `id="amount"` with the amount input, which
is invalid HTML and the reason the selector was written that way.

**Fix:** escape the id (`$('[id="amount.errors"]')`) and validate before the POST.

---

## DEFECT-04 — A non-numeric transfer amount reports a generic server error

**Test:** `TC_TRF_004` · **Severity:** low

Same root cause as DEFECT-03. `Please enter a valid amount.` is present in the
markup and never shown; entering `abc` produces the generic error panel.

---

## DEVIATION-05 — A successful Customer Lookup no longer shows the credentials

**Test:** `TC_FLI_001` · **Severity:** none (the application is safer than the spec)

| | |
|---|---|
| **Specification** | `Your username is <username> and password is <password>.` |
| **Actual** | `Your login information was located successfully. You are now logged in.` |

ParaBank logs the customer straight in instead of printing their password. That is
better behaviour than the documented expectation, so the test asserts the current
message. **The specification should be updated**, not the application.

---

## DEVIATION-06 — The loan denial message differs from the specification

**Test:** `TC_LON_002` · **Severity:** none (wording only)

| | |
|---|---|
| **Specification** | `You do not have enough funds available for the down payment.` |
| **Actual** | `You do not have sufficient funds for the given down payment.` |

The application also carries a second denial string,
`We cannot grant a loan in that amount with your available funds and down payment.`,
used when the loan amount rather than the down payment is the blocker.

---

## DEFECT-07 — Broken authentication: a failed login is granted another customer's session

**Tests:** `TC_LGN_002`, `TC_LGN_003` (`@security`) · **Severity: critical** ·
**Status: no longer reproducible since the demo database reset of 2026-09-16**

> **Resolution note.** On 2026-09-16 Parasoft reset the public demo database
> (ENV-05). Immediately afterwards a wrong password and an unknown username were
> both refused with `The username and password could not be verified.` - the
> specified behaviour. The bypass therefore lived in corrupted *data or session
> state*, not in code that was changed, and could return the next time the
> shared instance degrades. `TC_LGN_002` and `TC_LGN_003` assert the correct
> behaviour again; the record below is kept as evidence of what was observed.

ParaBank does not verify the password. A login with the wrong password, or with a
username that does not exist at all, is **granted an authenticated session for an
unrelated customer** and can read that customer's accounts.

| Credentials | Expected | Actual |
|---|---|---|
| valid username + **wrong** password | `Error!` / `The username and password could not be verified.` | Signed in as **Hazel Melvin**, 3 accounts listed |
| username that **does not exist** + any password | same error | Signed in as **Hazel Melvin**, 3 accounts listed |
| valid username + valid password | signed in as that customer | Signed in correctly, 113 accounts |
| empty username + empty password | `Please enter a username and password.` | Correct |

**Reproduce**

```
1. Open https://parabank.parasoft.com/parabank/index.htm
2. Username: john   Password: WRONGPASS123
3. Click LOG IN
   -> 302 to overview.htm, "Welcome John Smith", 4 accounts rendered
```

**Evidence and scope**

- Not a caching artifact: responses carry `cf-cache-status: DYNAMIC` with no
  `age` header, and the `302` to `overview.htm` is generated per request.
- Not a client-side quirk: the server issues a real `JSESSIONID` and the
  authenticated `services_proxy` calls succeed for the foreign customer.
- The customer handed out **varies between attempts** - John Smith and Hazel
  Melvin were both observed minutes apart - which suggests a failed login is
  attaching to whichever session the server has most recently established, rather
  than to one fixed fallback account.
- Empty credentials are still rejected correctly, so the fault is in credential
  *verification*, not in the login flow as a whole.
- **This is a regression.** Both tests passed against this instance earlier the
  same day; the behaviour changed mid-session.

**Impact.** Complete authentication bypass with access to other customers' account
data. On a real banking application this is the most serious class of defect
there is. On this public demo it also means no test can prove a customer exists
simply by logging in as it, which is why `hasWorkingSession()` in
`src/fixtures/session.ts` checks that accounts actually render.

**How the tests assert it.** On instruction, `TC_LGN_002` and `TC_LGN_003` assert
the behaviour as it currently is, so the suite reports the real state of the
application and stays green. Each test carries the correct assertion alongside it
in a comment, so restoring the intended expectation is a one-line edit. They
deliberately do **not** assert which customer is returned, because that varies.

That signal fired on 2026-09-16 (see the resolution note above) and the intended
assertions were restored the same day.

---

## DEFECT-08 - A search that matches nothing renders a corrupt transaction row

> **Status: not reproducible since the demo database reset of 2026-09-16 (ENV-05).** The affected test asserts the specified behaviour again; this record is kept as evidence.

| | |
|---|---|
| **Severity** | Medium |
| **Test case** | TC_FND_006 |
| **Where** | Find Transactions -> Find by Date, using a date with no activity (01-01-2000) |

**Expected.** The Transaction Results table is empty.

**Actual.** The table renders one row:

| Date | Transaction | Debit (-) | Credit (+) |
|---|---|---|---|
| `NaN-NaN-NaN` | `undefined` | | |

**Cause.** The results page runs its jQuery row template over the response
without checking that it contains any transactions, so a single row is built
from `undefined`: `new Date(undefined)` formats as `NaN-NaN-NaN` and the
description renders the string `undefined`.

**Impact.** A customer who searches a quiet date is shown what looks like a real
but corrupted transaction on their account, rather than "no results".

**Handling.** `TC_FND_006` asserts the placeholder row exactly (one row, the two
literal values, and no error panel), with the correct `toHaveCount(0)`
expectation kept in a comment directly above it.

---

## DEFECT-09 - A completed bill payment is never posted to the account

> **Status: not reproducible since the demo database reset of 2026-09-16 (ENV-05).** The affected test asserts the specified behaviour again; this record is kept as evidence.

| | |
|---|---|
| **Severity** | High |
| **Test cases** | TC_BIL_002, TC_BIL_006 |
| **Where** | Bill Pay, any payee, any amount, any source account |

**Expected.** After the "Bill Payment Complete" confirmation, the source account
balance is lower by the amount paid and the Account Details history shows a
`Bill Payment to <payee>` debit.

**Actual.** The confirmation page is correct - payee, amount and source account
all echo the form - but the balance is identical before and after, and no
transaction appears in the account history.

**Evidence.** Reproduced on the long-lived static customer *and* on a customer
registered minutes earlier with three accounts, so it is not data corruption on
one customer. Fund transfers between accounts do post and do show in history
(the `@transferFunds` cases pass), which isolates the fault to the bill payment
service.

**Handling.** `TC_BIL_002` asserts a zero balance change and `TC_BIL_006` asserts
the payment is absent from the history, each with the correct assertion kept in a
comment directly above. `TC_BIL_001` still asserts the confirmation page, which
is the part that works.

---

## DEFECT-10 - Update Contact Info fails with a server error

> **Status: not reproducible since the demo database reset of 2026-09-16 (ENV-05).** The affected test asserts the specified behaviour again; this record is kept as evidence.

| | |
|---|---|
| **Severity** | High |
| **Test cases** | TC_UPD_002, TC_UPD_004 |
| **Where** | Update Contact Info -> Update Profile, with every field valid |

**Expected.** `Profile Updated` / `Your updated address and phone number have
been added to the system.`, and the new values pre-filled on the next visit.

**Actual.** The form is replaced by the generic error panel:
`Error!` / `An internal error has occurred and has been logged.` The previous
values are unchanged on the next visit.

**Evidence.** Reproduced on the static customer and on a freshly registered one;
client-side validation (TC_UPD_003) still works, so the failure is in the update
call itself (`services_proxy/bank/customers/update/...`).

**Handling.** `TC_UPD_002` asserts the error panel. `TC_UPD_004` asserts the error,
then that the stored profile still holds the old values and was not partially
overwritten. Both keep the intended assertions in comments.

---

## Environmental constraints (not application defects)

These are properties of the public demo deployment, recorded so the results are
not misread as suite defects.

### ENV-05 — The demo database is reset without notice

Parasoft periodically resets the public ParaBank database (the Admin page also
lets *anyone* do it). When that happens every registered customer disappears at
once: on 2026-09-16 the static customer `parabank_qa01`, a customer registered
the day before and every entry in the local pool all started answering
`The username and password could not be verified.` A CI run on a fresh runner -
no pool, registration challenged by Cloudflare (ENV-01) - therefore had no way to
sign in at all and failed in its setup step.

Handling:

- The static fallback is now `john` / `demo`, the customer ParaBank seeds itself,
  which the reset recreates rather than deletes.
- `tests/auth.setup.ts` drops any pooled customer that can no longer sign in, so
  a reset costs one login timeout per stale entry exactly once.
- A reset also wipes whatever *state* the known defects lived in: DEFECT-07
  disappeared with this one. Tests that assert a defect are therefore expected
  to flip back to the specified behaviour after a reset, and that flip is the
  signal to restore their intended assertions.

### ENV-01 — Cloudflare challenges the registration POST

`POST /parabank/register.htm` is intermittently answered with a Cloudflare
interstitial (`Just a moment...` / `Performing security verification`) that never
resolves, so the customer is not created.

Measured across a session: roughly 1 in 3 attempts succeeded when the source IP
was cool, and 0 of 16 after sustained traffic from the same IP.

Affects `TC_REG_001`, `TC_REG_003`, `TC_REG_004`, `TC_REG_005`, `TC_REG_007` and
the self-healing branch of `tests/auth.setup.ts`. `TC_REG_002` (empty form) and
`TC_REG_006` (navigation) are unaffected — an empty POST is not challenged.

No workaround is attempted: defeating bot protection is out of scope. Run against
a local ParaBank for a deterministic result.

### ENV-02 — Cloudflare rate limiting

Sustained parallel traffic returns HTTP 429 (*Error 1015 — You are being rate
limited*) for several minutes, failing whatever is running. Mitigated by capping
workers (3 local / 1 CI) and by preferring the `accountWithTransactions` fixture
over opening an account per test.

### ENV-03 — Server timezone differs from the runner

ParaBank stamps transactions in the server timezone. A runner just past midnight
local time computes a "today" the server has not reached, so a search for today's
date legitimately returns nothing. `TC_FND_002` therefore searches a date read
back from a transaction the application itself stamped, instead of one derived
from the local clock.

### ENV-04 — Loan approval degrades as a customer accumulates accounts

`TC_LON_001` and `TC_LON_003` require an approved loan. Approval is reliable for
a freshly registered customer and stops being reliable once that customer has
accumulated a large number of accounts.

Measured directly. A customer registered moments earlier, holding the single
seeded account of `$515.50`, was approved three times out of three for the
documented `TD_LOAN_APPROVED` values (loan `1000`, down payment `50`):

```
accounts: [["51861","$515.50","$515.50"],["Total","$515.50",""]]
loan amount=1000  down=50  -> Approved
loan amount=1000  down=50  -> Approved
loan amount=100   down=10  -> Approved
```

The same request against a customer carrying 97 accounts was denied with
`You do not have sufficient funds for the given down payment.` even for a down
payment of `5` against an account holding `100`, and the *same* inputs returned
`Approved` and then `Denied` minutes apart. Funding the customer's first account
and clearing every negative balance did not restore approval.

The accounts accumulate because the suite opens one per isolated test, which is
what keeps the balance assertions trustworthy. The fix is operational, not a code
change: **re-seed the static customer periodically.**

```bash
node scripts/seed-static-user.js parabank_qa03
# then set STATIC_USERNAME=parabank_qa03 in .env
```

`TD_LOAN_APPROVED` in the specification is correct and is left unchanged; it is
the customer, not the data, that goes stale.
