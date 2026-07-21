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

test('Version 2 uses the owner-approved credibility facts and Yossi portrait', () => {
  const html = read('index.html');

  assert.match(html, /הוקמה בשנת/);
  assert.match(html, /data-target="10000"/);
  assert.match(html, /data-target="500"/);
  assert.match(html, /data-target="7"/);
  assert.match(html, /images\/team\/yossi-shapir\.webp/);
  assert.match(html, /images\/team\/revital-messika\.webp/);
  assert.match(html, /מובילים בהנדסת בטיחות<br \/>מאז 2002/);
  assert.match(html, /id="gallery"/);
  assert.match(html, /images\/gallery\/team1\.jpg/);
  assert.match(html, /images\/gallery\/team2\.jpg/);
  assert.match(html, /images\/gallery\/tunnel-fire-test\.jpeg/);
  assert.equal(existsSync('images/team/yossi-shapir.jpeg'), true);
  assert.equal(existsSync('images/team/revital-messika.jpg'), true);
  assert.equal(existsSync('images/gallery/team1.jpg'), true);
  assert.equal(existsSync('images/gallery/team2.jpg'), true);
  assert.equal(existsSync('images/gallery/tunnel-fire-test.jpeg'), true);
  assert.doesNotMatch(read('style.css'), /hero-bg\.webp/);
  assert.match(read('style.css'), /height: 230px/);
  assert.match(read('style.css'), /width: 184px/);
  assert.match(html, /data-tab="public"/);
  assert.match(html, /מבני ציבור/);
  assert.match(html, /גופים ממשלתיים/);
  assert.match(html, /id="clients"/);
  assert.match(html, /משרד הביטחון/);
  assert.match(html, /name="privacyConsent"/);
  assert.match(html, /אני מסכים\/ה ל<a href="#privacy">מדיניות הפרטיות/);
  assert.match(html, /type="checkbox"[^>]*required/);
});
