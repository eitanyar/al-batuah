import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
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

test('the production build emits the JavaScript that powers site interactions', () => {
  execFileSync('npm', ['run', 'build'], { stdio: 'pipe' });

  const builtHtml = read('dist/index.html');
  const scriptMatch = builtHtml.match(/<script[^>]+type="module"[^>]+src="([^"]+\.js)"/);

  assert.ok(scriptMatch, 'the built page must reference an emitted module JavaScript asset');
  assert.notEqual(scriptMatch[1], '/script.js', 'the built page must not leave script.js unresolved');

  const assetPath = `dist/${scriptMatch[1].replace(/^\//, '')}`;
  assert.equal(existsSync(assetPath), true, `built JavaScript asset must exist: ${assetPath}`);

  const asset = read(assetPath);
  assert.match(asset, /hamburger/, 'the built asset must include the mobile navigation behavior');
  assert.match(asset, /stats-section/, 'the built asset must include the statistics counter behavior');
});

test('the contact form only claims success after the email service confirms delivery', () => {
  const html = read('index.html');
  const script = read('script.js');

  assert.doesNotMatch(html, /הודעתך נשלחה בהצלחה/);
  assert.match(html, /id="formNotice"/);
  assert.match(script, /fetch\('\/api\/contact'/);
  assert.match(script, /if \(response\.ok\) \{\s*setNotice\('success'/);
  assert.equal(existsSync('functions/api/contact.js'), true);
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
  assert.match(html, /data-target="10"/);
  assert.match(html, /images\/team\/yossi-shapir\.webp/);
  assert.match(html, /images\/team\/revital-messika\.webp/);
  assert.match(html, /מצוינות ללא פשרות מאז 2002/);
  assert.match(html, /ביצוע סימולציות ממוחשבות CFD/);
  assert.match(html, /ניסוי שריפה מבוקר/);
  assert.match(html, /id="gallery"/);
  assert.match(html, /images\/gallery\/team1\.jpg/);
  assert.match(html, /images\/gallery\/team2\.jpg/);
  assert.match(html, /images\/gallery\/team-group-owner\.jpg/);
  assert.equal(existsSync('images/team/yossi-shapir.jpeg'), true);
  assert.equal(existsSync('images/team/revital-messika.jpg'), true);
  assert.equal(existsSync('images/gallery/team1.jpg'), true);
  assert.equal(existsSync('images/gallery/team2.jpg'), true);
  assert.equal(existsSync('images/gallery/team-group-owner.jpg'), true);
  assert.equal(existsSync('images/hero/final-desktop-al-batuah.png'), true);
  assert.equal(existsSync('images/hero/final-mobile-al-batuah.png'), true);
  assert.doesNotMatch(read('style.css'), /hero-bg\.webp/);
  assert.match(read('style.css'), /height: 230px/);
  assert.match(read('style.css'), /width: 184px/);
  assert.match(html, /data-tab="infra"/);
  assert.match(html, /תשתיות ותחבורה/);
  assert.match(html, /גופים ממשלתיים וציבוריים/);
  assert.match(html, /id="clients"/);
  assert.match(html, /משרד הביטחון/);
  assert.match(html, /name="privacyConsent"/);
  assert.match(html, /אני מסכים\/ה ל<a href="#privacy">מדיניות הפרטיות/);
  assert.match(html, /type="checkbox"[^>]*required/);
  assert.match(html, /id="accessibilityToggle"/);
  assert.match(html, /id="accessibilityPanel"/);
  assert.match(html, /data-accessibility="increase-font"/);
  assert.match(html, /מסירת הפרטים בטופס היא מרצונך החופשי/);
  assert.match(html, /לצורך חזרה לפנייתך ומתן השירות המבוקש בלבד/);
  assert.match(html, /Resend/);
  assert.match(html, /איננו משתמשים בעוגיות שיווקיות או בכלי מעקב פרסומיים/);
});
