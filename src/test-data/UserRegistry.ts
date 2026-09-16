/**
 * A durable registry of ParaBank customers the suite has created.
 *
 * WHY THIS EXISTS
 * ---------------
 * The specification says run-created values stay in memory and are never written
 * to a file. That holds for *assertion* data - account ids, balances, transaction
 * ids - and this module deliberately does not store any of that.
 *
 * What it does store is credentials. Registering a customer against the public
 * demo is unreliable: the registration POST sits behind Cloudflare bot protection
 * and is frequently challenged (see ENV-01 in docs/DEFECTS.md). Re-registering on
 * every run is therefore a coin flip. Keeping the customers the suite has already
 * created turns that into a one-off cost, and lets the suite spread its work over
 * several customers instead of degrading a single one (see ENV-04).
 *
 * Nothing is ever asserted against the contents of this file. It is a credential
 * pool, not a source of expected values.
 *
 * SHAPE
 * -----
 * The file is a plain JSON array. Every entry is a complete, self-contained
 * customer, so any index can be picked at random and stays valid on its own:
 *
 *   [
 *     {
 *       "username": "drip_qa_m1x2",  "password": "Test@1234",
 *       "firstName": "Aaron",        "lastName": "Weber",
 *       "address": "742 Evergreen Terrace", ... ,
 *       "ssn": "512-88-1902",
 *       "accounts": ["12345", "12346"],
 *       "createdAt": "2026-09-16T12:00:00.000Z",
 *       "source": "seeded"
 *     }
 *   ]
 *
 * CONCURRENCY
 * -----------
 * Playwright workers are separate processes, so two of them can try to append at
 * the same moment. Every write takes an exclusive lock first (an atomic mkdir),
 * re-reads the file inside the lock, appends, and renames a temp file over the
 * original. That makes a torn or half-written array impossible.
 */

import * as fs from 'fs';
import * as path from 'path';
import { User } from './data';

/** One registry entry: a full customer plus the accounts it is known to own. */
export interface RegisteredUser extends User {
  /** Account ids this customer owned when last seen. Purely a request-saving cache. */
  accounts: string[];
  /** ISO timestamp, so a stale pool is obvious when reading the file. */
  createdAt: string;
  /** How the customer came to exist, for debugging a surprising pool. */
  source: 'seeded' | 'registered-by-test';
}

const REGISTRY_DIR = '.auth';
const REGISTRY_FILE = path.join(REGISTRY_DIR, 'users.json');
const LOCK_DIR = path.join(REGISTRY_DIR, 'users.lock');

/** Longest we will wait for another worker to finish its write. */
const LOCK_TIMEOUT_MS = 10_000;
const LOCK_RETRY_MS = 50;

function ensureDir(): void {
  fs.mkdirSync(REGISTRY_DIR, { recursive: true });
}

/**
 * Takes an exclusive lock. mkdir is atomic on every platform we run on, so it
 * doubles as a mutex: exactly one process can create the directory.
 */
function acquireLock(): void {
  ensureDir();
  const deadline = Date.now() + LOCK_TIMEOUT_MS;
  for (;;) {
    try {
      fs.mkdirSync(LOCK_DIR);
      return;
    } catch {
      if (Date.now() > deadline) {
        // A worker was killed mid-write and left the lock behind. Breaking it is
        // safe: the write itself is an atomic rename, so the file is never torn.
        try {
          fs.rmSync(LOCK_DIR, { recursive: true, force: true });
        } catch {
          /* another worker beat us to it */
        }
        continue;
      }
      // Busy-wait briefly. Writes are sub-millisecond, so contention is rare.
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, LOCK_RETRY_MS);
    }
  }
}

function releaseLock(): void {
  try {
    fs.rmSync(LOCK_DIR, { recursive: true, force: true });
  } catch {
    /* already gone */
  }
}

/** Reads the pool. A missing or unreadable file is an empty pool, never an error. */
export function readUsers(): RegisteredUser[] {
  try {
    const raw = fs.readFileSync(REGISTRY_FILE, 'utf8');
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RegisteredUser[]) : [];
  } catch {
    return [];
  }
}

/** Replaces the file atomically: write a temp file, then rename over the target. */
function writeUsersUnlocked(users: RegisteredUser[]): void {
  ensureDir();
  const temp = `${REGISTRY_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(users, null, 2)}\n`, 'utf8');
  fs.renameSync(temp, REGISTRY_FILE);
}

/**
 * Runs a mutation against the pool while holding the lock, re-reading inside the
 * lock so a concurrent append is never lost.
 */
function mutate<T>(change: (users: RegisteredUser[]) => T): T {
  acquireLock();
  try {
    const users = readUsers();
    const result = change(users);
    writeUsersUnlocked(users);
    return result;
  } finally {
    releaseLock();
  }
}

/**
 * Adds a customer, or merges into the existing entry if the username is already
 * known. Safe to call from several workers at once.
 */
export function addUser(
  user: User,
  options: { accounts?: string[]; source?: RegisteredUser['source'] } = {},
): RegisteredUser {
  return mutate((users) => {
    const existing = users.findIndex((candidate) => candidate.username === user.username);
    const entry: RegisteredUser = {
      ...user,
      accounts: options.accounts ?? (existing >= 0 ? users[existing].accounts : []),
      createdAt: existing >= 0 ? users[existing].createdAt : new Date().toISOString(),
      source: options.source ?? (existing >= 0 ? users[existing].source : 'registered-by-test'),
    };
    if (existing >= 0) {
      users[existing] = entry;
    } else {
      users.push(entry);
    }
    return entry;
  });
}

/**
 * Drops a customer from the pool. Used when a pooled customer can no longer sign
 * in - which happens wholesale when Parasoft resets the demo database (ENV-05):
 * every registered customer disappears at once and would otherwise be retried,
 * at a login timeout each, on every subsequent run.
 */
export function removeUser(username: string): void {
  mutate((users) => {
    const at = users.findIndex((candidate) => candidate.username === username);
    if (at >= 0) {
      users.splice(at, 1);
    }
  });
}

/**
 * Caches the account ids a customer owns, so later runs can skip the Accounts
 * Overview round trip. Unknown usernames are ignored rather than throwing.
 */
export function recordAccounts(username: string, accounts: string[]): void {
  mutate((users) => {
    const entry = users.find((candidate) => candidate.username === username);
    if (entry) {
      entry.accounts = accounts;
    }
  });
}

/**
 * Picks a customer from the pool.
 *
 * Every entry is complete and independently usable, so a random index is always
 * a valid choice - which is the point: spreading the work across customers stops
 * any single one accumulating the hundreds of accounts that make ParaBank stop
 * approving loans (ENV-04).
 *
 * @param index omit for a random pick, or pass one to target a specific entry.
 */
export function pickUser(index?: number): RegisteredUser | undefined {
  const users = readUsers();
  if (users.length === 0) {
    return undefined;
  }
  if (index !== undefined) {
    // Wrap rather than throw, so a caller can walk the pool with i, i+1, i+2...
    return users[((index % users.length) + users.length) % users.length];
  }
  // A random pick, but drawn from the healthy entries when there are any. Every
  // entry is still complete and usable on its own - this only biases the draw
  // away from customers the demo has worn out.
  const pool = healthyUsers();
  const draw = pool.length > 0 ? pool : users;
  return draw[Math.floor(Math.random() * draw.length)];
}

/** Default account count above which a customer counts as worn out (ENV-04). */
const DEFAULT_ACCOUNT_LIMIT = 100;

/**
 * The customers still in good shape, newest first.
 *
 * ParaBank degrades as a customer accumulates accounts: past roughly a hundred
 * it stops approving loans at all, which is how TC_LON_001 / TC_LON_003 start
 * failing for reasons that have nothing to do with the test (ENV-04 in
 * docs/DEFECTS.md). Newest first because a customer created this run is the one
 * with the least history of any kind.
 */
export function healthyUsers(accountLimit: number = DEFAULT_ACCOUNT_LIMIT): RegisteredUser[] {
  return readUsers()
    .filter((user) => user.accounts.length <= accountLimit)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Every known customer, in file order. */
export function allUsers(): RegisteredUser[] {
  return readUsers();
}

export const REGISTRY_PATH = REGISTRY_FILE;
