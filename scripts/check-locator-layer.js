#!/usr/bin/env node
/**
 * Enforces the framework's structural rules, so a regression fails the build
 * rather than being spotted in review:
 *
 *  1. No raw selector strings in src/pages or tests - every selector comes from
 *     src/locators via an imported constant.
 *  2. No arbitrary waits (waitForTimeout / sleep).
 *  3. No focused tests (.only).
 *  4. No Playwright import inside src/locators - that layer stays selectors only.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const violations = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.isFile() && full.endsWith('.ts') ? [full] : [];
  });
}

const report = (file, line, rule, text) =>
  violations.push(`${path.relative(ROOT, file)}:${line}  [${rule}]  ${text.trim()}`);

// A selector passed straight into a Playwright locator call, rather than a
// constant imported from the locators layer. `L.foo`, `L.foo(id)` are fine.
const RAW_SELECTOR = /\.(?:locator|getByTestId)\(\s*(['"`])/;
const ARBITRARY_WAIT = /waitForTimeout\s*\(|\bsleep\s*\(/;
const FOCUSED_TEST = /\b(?:test|describe|it)\.only\b/;

for (const file of [...walk(path.join(ROOT, 'src', 'pages')), ...walk(path.join(ROOT, 'tests'))]) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((text, i) => {
    if (RAW_SELECTOR.test(text)) report(file, i + 1, 'raw-selector', text);
    if (ARBITRARY_WAIT.test(text)) report(file, i + 1, 'arbitrary-wait', text);
    if (FOCUSED_TEST.test(text)) report(file, i + 1, 'focused-test', text);
  });
}

for (const file of walk(path.join(ROOT, 'src', 'locators'))) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((text, i) => {
    if (/@playwright\/test/.test(text)) report(file, i + 1, 'playwright-in-locators', text);
  });
}

if (violations.length > 0) {
  console.error(`Locator layer check FAILED - ${violations.length} violation(s):\n`);
  violations.forEach((v) => console.error('  ' + v));
  process.exit(1);
}

console.log('Locator layer check passed: no raw selectors, arbitrary waits or focused tests.');
