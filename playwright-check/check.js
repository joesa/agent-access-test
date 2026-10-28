const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = __dirname;
const REPO_URL = 'https://github.com/microsoft/playwright';
const AVATAR_URL = 'https://github.com/joesa.png';

(async () => {
  const browser = await chromium.launch();
  const version = browser.version();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });

  const blocked = new Map();
  ctx.on('page', (pg) => {
    pg.on('requestfailed', (req) => {
      const key = `${new URL(req.url()).hostname} :: ${req.failure()?.errorText}`;
      blocked.set(key, (blocked.get(key) || 0) + 1);
    });
  });

  const res = { chromiumVersion: version };
  const page = await ctx.newPage();

  // 1. repository page
  await page.goto(REPO_URL, { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(5000);
  res.pageTitle = await page.title();
  res.description = await page.evaluate(() => {
    const h = [...document.querySelectorAll('h2, h3')].find((e) => e.innerText.trim() === 'About');
    const sec = h && (h.closest('[class*="sidebarSection"]') || h.parentElement);
    const p = sec && [...sec.querySelectorAll('p, span, div')].find((n) => n.innerText.trim().length > 40);
    return p ? p.innerText.trim() : null;
  });
  res.ogDescription = await page.evaluate(() => document.querySelector('meta[property="og:description"]')?.content?.trim());

  const relLink = page.locator('a[href*="/releases/tag/"]').first();
  res.releaseWidget = {
    populated: await relLink.count().then((c) => c > 0),
    sidebarHtml: await page.evaluate(() => {
      const h = [...document.querySelectorAll('h2, h3')].find((e) => e.innerText.trim() === 'Releases');
      const sec = h && (h.closest('[class*="sidebarSection"]') || h.parentElement);
      return sec ? sec.innerHTML.replace(/\s+/g, ' ').slice(0, 400) : null;
    }),
  };
  await page.screenshot({ path: path.join(OUT, 'repo.png'), fullPage: true });

  // latest release: /releases/latest redirect + releases page (both on github.com)
  const r1 = await page.goto(REPO_URL + '/releases/latest', { waitUntil: 'domcontentloaded', timeout: 90000 });
  res.latestRelease = { url: r1.url(), tag: r1.url().split('/releases/tag/')[1] || null };
  await page.waitForTimeout(2000);
  res.latestRelease.pageHeading = await page.evaluate(() => document.querySelector('h1')?.innerText.replace(/\s+/g, ' ').trim());
  res.latestRelease.api = await page.evaluate(async () => {
    const r = await fetch('https://api.github.com/repos/microsoft/playwright/releases/latest');
    const j = await r.json();
    return { tag_name: j.tag_name, name: j.name, published_at: j.published_at, draft: j.draft, prerelease: j.prerelease };
  }).catch((e) => String(e).split('\n')[0]);

  // 3b/2. avatar image
  const imgPage = await (await browser.newContext({ deviceScaleFactor: 1 })).newPage();
  const ares = await imgPage.goto(AVATAR_URL, { waitUntil: 'load', timeout: 90000 });
  res.avatar = {
    requestUrl: AVATAR_URL,
    status: ares.status(),
    finalUrl: ares.url(),
    contentType: ares.headers()['content-type'],
    contentLengthHeader: Number(ares.headers()['content-length']),
  };
  res.avatar.dimensions = await imgPage.evaluate(() => {
    const img = document.querySelector('img');
    return { naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight };
  });
  res.avatar.bytesFetched = await (async () => {
    try {
      return (await ares.body()).length;
    } catch {
      return page.evaluate(async (u) => (await (await fetch(u, { mode: 'cors' })).arrayBuffer()).byteLength, ares.url());
    }
  })();
  await imgPage.locator('img').screenshot({ path: path.join(OUT, 'avatar.png') });
  res.avatar.screenshotPngBytes = fs.statSync(path.join(OUT, 'avatar.png')).size;
  res.repoScreenshotBytes = fs.statSync(path.join(OUT, 'repo.png')).size;

  res.blockedRequests = Object.fromEntries(blocked);
  res.blockedRequestCount = [...blocked.values()].reduce((a, c) => a + c, 0);

  await browser.close();
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(res, null, 2) + '\n');
  console.log(JSON.stringify(res, null, 2));
})();
