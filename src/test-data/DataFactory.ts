/**
 * Everything that must differ on each run.
 *
 * Call these inside a test body or a fixture, never at module scope: a value
 * created at import time is shared by every parallel worker, which is exactly
 * the collision this factory exists to prevent.
 */

import { baseUser, User, Payee, Profile } from './data';
import { today, dateOffset } from '../utils/dates';

/** Short, collision-resistant suffix: timestamp in base36 plus random noise. */
const unique = (): string =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const rand = (digits: number): string =>
  String(Math.floor(Math.random() * 10 ** digits)).padStart(digits, '0');

/**
 * TD_USER_NEW. One base object plus overrides, so every negative case is a
 * single line: generateUser({ firstName: '' }).
 */
export function generateUser(overrides: Partial<User> = {}): User {
  const id = unique();
  return {
    ...baseUser,
    username: `aweber_${id}`,
    ssn: `${rand(3)}-${rand(2)}-${rand(4)}`,
    ...overrides,
  };
}

/**
 * TD_LOOKUP_UNKNOWN. An identity that matches no customer, for the negative
 * Customer Lookup case (TC_FLI_002).
 *
 * Generated rather than fixed on purpose. ParaBank is a shared demo and the
 * lookup matches on the submitted details: a fixed "impossible" identity such
 * as SSN 000-00-0000 stops being impossible the moment anyone registers with
 * it - which happened, and the lookup then returned that stranger's real
 * username and password. A random 9-digit SSN plus a unique surname cannot be
 * pre-registered by anyone.
 */
export function generateUnknownLookup(): { profile: Profile; ssn: string } {
  const id = unique();
  return {
    profile: {
      firstName: 'Ghost',
      lastName: `Nobody${id}`,
      address: `${rand(4)} Nowhere Road`,
      city: 'Atlantis',
      state: 'Narnia',
      zipCode: rand(5),
      phone: '',
    },
    ssn: `${rand(3)}-${rand(2)}-${rand(4)}`,
  };
}

/** TD_PAYEE_01. The payee name carries the unique suffix so runs stay distinct. */
export function generatePayee(overrides: Partial<Payee> = {}): Payee {
  const id = unique();
  const accountNumber = rand(5);
  return {
    payeeName: `City Power And Light ${id}`,
    address: '500 Grid Avenue',
    city: 'Portland',
    state: 'Oregon',
    zipCode: '97205',
    phone: '5035550188',
    accountNumber,
    verifyAccount: accountNumber,
    amount: '15.00',
    ...overrides,
  };
}

/** TD_UPDATE_01. New contact details for the Update Contact Info form. */
export function generateProfileUpdate(overrides: Partial<Profile> = {}): Profile {
  const id = unique();
  return {
    firstName: baseUser.firstName,
    lastName: baseUser.lastName,
    address: `19 Lakeview Drive ${id}`,
    city: 'Eugene',
    state: 'Oregon',
    zipCode: '97401',
    phone: '5415550132',
    ...overrides,
  };
}

/** TD_FIND_BY_DATE - today as MM-DD-YYYY. */
export { today, dateOffset };

/** TD_FIND_BY_RANGE - a range that brackets today. */
export function generateDateRange(daysBack = 7): { fromDate: string; toDate: string } {
  return { fromDate: dateOffset(-daysBack), toDate: today() };
}
