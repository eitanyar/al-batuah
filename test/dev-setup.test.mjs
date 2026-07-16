import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(path, 'utf8');

test('the site exposes local development, preview, and test commands', () => {
  assert.equal(existsSync('package.json'), true, 'package.json must exist');

  const packageJson = JSON.parse(read('package.json'));

  assert.equal(typeof packageJson.scripts?.dev, 'string');
  assert.equal(typeof packageJson.scripts?.preview, 'string');
  assert.equal(typeof packageJson.scripts?.test, 'string');
  assert.match(packageJson.scripts.dev, /vite/);
  assert.equal(existsSync('index.html'), true);
  assert.equal(existsSync('images/logo-final.png'), true);
});

test('the contact form never claims an email was sent before an email service exists', () => {
  const html = read('index.html');
  const script = read('script.js');

  assert.doesNotMatch(html, /הודעתך נשלחה בהצלחה/);
  assert.match(html, /id="formNotice"/);
  assert.doesNotMatch(script, /setTimeout\(\(\) => \{\s*formSuccess\.classList\.add\('show'\)/);
  assert.match(script, /formNotice\.classList\.add\('show'\)/);
});

test('the temporary review site asks search engines not to index it', () => {
  const html = read('index.html');

  assert.match(html, /<meta name="robots" content="noindex, nofollow, noarchive, nosnippet"\s*\/>/);
  assert.equal(existsSync('robots.txt'), false, 'do not block crawlers from reading the noindex tag');
});

test('the review build is available to publish only the site files', () => {
  const packageJson = JSON.parse(read('package.json'));

  assert.equal(typeof packageJson.scripts?.['build:review'], 'string');
  assert.equal(existsSync('scripts/build-review-site.mjs'), true);
});
