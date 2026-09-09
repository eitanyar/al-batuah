import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import test from 'node:test';

const read = (path) => readFileSync(path, 'utf8');
const hash = (value) => createHash('sha256').update(value).digest('hex');
const assetHash = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');

export const readOwnerCopyFixture = () => JSON.parse(read('test/fixtures/owner-approved-copy.json'));

export const extractSectionById = (html, id) => {
  const start = html.search(new RegExp(`<section[^>]*\\bid="${id}"[^>]*>`));
  assert.notEqual(start, -1, `missing section #${id}`);
  const end = html.indexOf('</section>', start);
  assert.notEqual(end, -1, `unclosed section #${id}`);
  return html.slice(start, end + '</section>'.length);
};

export const sectionOrder = (html, markers) => markers.map((marker) => {
  const position = html.indexOf(marker);
  assert.notEqual(position, -1, `missing marker: ${marker}`);
  return position;
});

test('owner-approved fixture drives the requested homepage text', () => {
  const html = read('index.html');
  const copy = readOwnerCopyFixture();
  const stats = html.slice(html.indexOf('<!-- STATS SECTION -->'), html.indexOf('<!-- SERVICES SECTION -->'));
  const expert = html.slice(html.indexOf('<!-- EXPERT SHOWCASE SECTION -->'), html.indexOf('<!-- GALLERY SECTION -->'));
  const team = html.slice(html.indexOf('<!-- TEAM SECTION -->'), html.indexOf('<!-- ABOUT SECTION -->'));
  const gallery = extractSectionById(html, 'gallery');
  const contact = extractSectionById(html, 'contact');

  assert.deepEqual(Object.keys(copy).sort(), ['contactTitle', 'expertShowcaseTitle', 'galleryStatus', 'galleryTitle', 'leadershipLabel', 'leadershipTitle', 'statsCta', 'statsTitle']);
  assert.match(stats, new RegExp(`<h2 class="stats-title">${copy.statsTitle}</h2>`));
  assert.match(stats, new RegExp(`<a href="#contact" class="btn btn-dark">${copy.statsCta}</a>`));
  assert.match(stats, /data-target="10"/);
  assert.match(expert, new RegExp(`<h2 class="section-title">${copy.expertShowcaseTitle}</h2>`));
  assert.match(team, new RegExp(`<p class="section-label">${copy.leadershipLabel}</p>`));
  assert.match(team, new RegExp(`<h2 class="section-title">${copy.leadershipTitle}</h2>`));
  assert.doesNotMatch(team, /section-desc/);
  assert.match(gallery, new RegExp(`<h2 class="section-title">${copy.galleryTitle}</h2>`));
  assert.match(gallery, new RegExp(`<p class="under-construction-gallery-status">${copy.galleryStatus}</p>`));
  assert.match(contact, new RegExp(`<h2>${copy.contactTitle}</h2>`));
});

test('hero uses only the approved responsive decorative local assets', () => {
  const html = read('index.html');
  const css = read('style.css');
  const hero = extractSectionById(html, 'home');
  const heroWithoutMedia = hero
    .replace(/\s*<picture class="hero-media"[\s\S]*?<\/picture>/, '')
    .replace(/\n\s*\n/g, '\n');

  assert.equal(hash(heroWithoutMedia), '3af3f5c548cc2a743db67250d980c4e6616c34be3b608e5667f5f020e20639cf');
  assert.match(html, /<link rel="preload" as="image" href="images\/hero\/final-desktop-al-batuah\.png" media="\(min-width: 769px\)" \/>/);
  assert.match(html, /<link rel="preload" as="image" href="images\/hero\/final-mobile-al-batuah\.png" media="\(max-width: 768px\)" \/>/);
  assert.match(hero, /<picture class="hero-media" aria-hidden="true">/);
  assert.match(hero, /<source media="\(max-width: 768px\)" srcset="images\/hero\/final-mobile-al-batuah\.png" \/>/);
  assert.match(hero, /<img src="images\/hero\/final-desktop-al-batuah\.png" width="640" height="360" alt="" loading="eager" fetchpriority="high" decoding="async" \/>/);
  assert.doesNotMatch(hero, /https?:|data:/);
  assert.match(css, /\.hero-media \{[\s\S]*?position: absolute;[\s\S]*?inset: 0;[\s\S]*?z-index: 0;/);
  assert.match(css, /\.hero-media img \{[\s\S]*?width: 100%;[\s\S]*?height: 100%;[\s\S]*?object-fit: cover;[\s\S]*?object-position: center center;/);
  assert.match(css, /\.hero-overlay \{[\s\S]*?z-index: 1;/);
  assert.match(css, /@media \(max-width: 768px\)/);
});

test('owner assets are copied byte-for-byte and all homepage sections meet their contracts', () => {
  const html = read('index.html');
  const expert = html.slice(html.indexOf('<!-- EXPERT SHOWCASE SECTION -->'), html.indexOf('<!-- GALLERY SECTION -->'));
  const gallery = extractSectionById(html, 'gallery');
  const orders = sectionOrder(html, ['<!-- TEAM SECTION -->', '<!-- ABOUT SECTION -->', '<!-- CONTACT SECTION -->']);

  for (const [path, expectedHash] of [
    ['images/hero/final-desktop-al-batuah.png', '534e7aa7da0f451dffad4917fa4ea042a46ee91892f0aa9f3aee5930d82eed86'],
    ['images/hero/final-mobile-al-batuah.png', '45f649e38cd103154cf7310f4e4e982e07e79b3d4f256093973fd6d430f846c9'],
    ['images/gallery/team-group-owner.jpg', '9270c772136109c50a5da9ff9391769ffb5a4d199e98af736b5076184d192ea7'],
  ]) {
    assert.equal(existsSync(path), true, `${path} must exist`);
    assert.equal(assetHash(path), expectedHash, `${path} must retain its approved bytes`);
  }

  assert.equal((expert.match(/<img /g) ?? []).length, 3);
  assert.match(expert, /images\/gallery\/team-group-owner\.jpg/);
  assert.match(expert, /images\/gallery\/team1\.jpg/);
  assert.match(expert, /images\/gallery\/team2\.jpg/);
  assert.doesNotMatch(expert, /tunnel-fire-test/);
  assert.doesNotMatch(gallery, /<img|gallery-grid|gallery-item/);
  assert.equal((html.match(/href="#gallery"/g) ?? []).length, 1);
  assert.ok(orders[0] < orders[1] && orders[1] < orders[2]);
});

test('owner update leaves required SEO metadata byte-identical', () => {
  const html = read('index.html');
  const expected = [
    [/<title>.*?<\/title>/, 'db23ac02837913da12dd9a30dedc9e73afee9f1a55b2e6f2a0e69ed17b41e9d7'],
    [/<meta name="description".*?\/>/, 'fff02d5eaa284b8b6e5aeeaeac0c04183c71fd471cbc32a75c78cf6a18707e20'],
    [/<meta name="robots".*?\/>/, '42bc8e5f9d156d16b82f73221f5ceab6a621ab467bca841b1675817b2b411685'],
  ];

  for (const [pattern, expectedHash] of expected) {
    const match = html.match(pattern);
    assert.ok(match, `missing metadata matching ${pattern}`);
    assert.equal(hash(match[0]), expectedHash);
  }
});
