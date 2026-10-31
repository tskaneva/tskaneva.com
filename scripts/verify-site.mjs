import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('../dist/', import.meta.url);
const site = 'https://tskaneva.com';
const pages = [];

function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (entry.name === 'index.html') pages.push(path);
  }
}

walk(root.pathname);
if (pages.length === 0) throw new Error('No generated pages to verify');

const escapeXml = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;');
const urls = [];
for (const path of pages) {
  const html = readFileSync(path, 'utf8');
  const route = relative(root.pathname, path).replace(/index\.html$/, '');
  const expected = new URL(route, `${site}/`).toString().replace(/\/$/, route ? '' : '/');
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1];
  const ogUrl = html.match(/<meta property="og:url" content="([^"]+)"/i)?.[1];
  const ogImage = html.match(/<meta property="og:image" content="([^"]+)"/i)?.[1];
  if (canonical !== expected || ogUrl !== expected) {
    throw new Error(`Incorrect canonical or Open Graph URL for ${route || '/'}`);
  }
  if (!ogImage || !ogImage.startsWith(site)) throw new Error(`Missing local Open Graph image for ${route || '/'}`);
  const imagePath = join(root.pathname, new URL(ogImage).pathname);
  if (!existsSync(imagePath)) throw new Error(`Open Graph image does not exist: ${ogImage}`);
  urls.push(expected);
}

for (const icon of ['favicon.ico']) {
  if (!existsSync(join(root.pathname, icon))) throw new Error(`Missing ${icon}`);
}

urls.sort();
writeFileSync(join(root.pathname, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`).join('\n')}\n</urlset>\n`);
const robots = readFileSync(join(root.pathname, 'robots.txt'), 'utf8');
if (!robots.includes(`Sitemap: ${site}/sitemap.xml`)) throw new Error('robots.txt does not reference sitemap.xml');
console.log(`Verified canonical URLs, Open Graph images, favicons and robots.txt for ${pages.length} pages; generated sitemap.xml.`);
