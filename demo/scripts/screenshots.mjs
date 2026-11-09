// Drive the demo through the loop and write the docs screenshots to docs/screenshots/.
//
//   npm run screenshots              # uses a demo already on :3010, or starts one
//   DEMO_URL=https://… npm run screenshots
//
// The scripted model answers the same way every run, so the images only change when the UI does.
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const DEMO_DIR = fileURLToPath(new URL('..', import.meta.url));
const OUT_DIR = fileURLToPath(new URL('../../docs/screenshots/', import.meta.url));
const BASE = process.env.DEMO_URL ?? 'http://localhost:3010';

/** Which shots each variant produces. Arabic gets one, to show right-to-left. */
const RUNS = [
  { theme: 'dark', lang: 'en', shots: ['issue', 'proposal', 'accepted', 'publish'] },
  { theme: 'light', lang: 'en', shots: ['issue', 'proposal', 'accepted', 'publish'] },
  { theme: 'dark', lang: 'ar', shots: ['proposal'] },
];

async function isUp(url) {
  try {
    return (await fetch(url)).ok;
  } catch {
    return false;
  }
}

/** Start `next dev` for the demo unless one is already answering. Returns a stop function. */
async function ensureServer() {
  if (await isUp(BASE)) return () => undefined;
  if (process.env.DEMO_URL) throw new Error(`Nothing answers at ${BASE}.`);
  const child = spawn(fileURLToPath(new URL('../node_modules/.bin/next', import.meta.url)), ['dev', '-p', '3010'], {
    cwd: DEMO_DIR,
    stdio: 'ignore',
    // Own process group, so stopping it also stops the workers next starts, and nothing else.
    detached: true,
  });
  const deadline = Date.now() + 90_000;
  while (!(await isUp(BASE))) {
    if (Date.now() > deadline) throw new Error('The demo server did not start within 90 s.');
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return () => process.kill(-child.pid, 'SIGTERM');
}

async function capture(page, name) {
  await page.mouse.move(0, 0);
  await page.screenshot({ path: `${OUT_DIR}${name}.png`, animations: 'disabled' });
  console.log(`✓ ${name}.png`);
}

/** Hover the last line of the flagged sentence, so the popover opens below the paragraph. */
async function hoverIssue(page) {
  const point = await page.locator('[data-ip-issue]').first().evaluate((node) => {
    const rects = node.getClientRects();
    const last = rects[rects.length - 1];
    return { x: last.left + Math.min(40, last.width / 2), y: last.top + last.height / 2 };
  });
  await page.mouse.move(point.x, point.y);
  await page.locator('.ip-issue-popover').waitFor();
}

async function run(browser, { theme, lang, shots }) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2, colorScheme: theme });
  const prefix = `${lang === 'en' ? '' : `${lang}-`}`;
  const shot = (name) => (shots.includes(name) ? capture(page, `${prefix}${name}-${theme}`) : undefined);

  await page.goto(`${BASE}/?theme=${theme}&lang=${lang}`);
  await page.locator('[data-ip-issue]').first().waitFor();
  // Put the cursor in the last paragraph so no toolbar button shows as active.
  await page.locator('.ProseMirror p').last().click();

  await hoverIssue(page);
  await shot('issue');

  // Taking a shot moves the mouse away, which closes the popover.
  await hoverIssue(page);
  await page.locator('.ip-issue-popover .ip-btn--primary').click();
  await page.locator('.ip-rewrite-bar--ready').waitFor();
  await shot('proposal');

  await page.keyboard.press('Enter');
  await page.locator('.ip-rewrite-bar').waitFor({ state: 'detached' });
  await page.locator('[data-ip-issue]').waitFor({ state: 'detached' });
  await shot('accepted');

  if (shots.includes('publish')) {
    await page.locator('.demo-step').nth(3).click();
    const drawer = page.locator('.ip-drawer');
    await drawer.locator('.ip-field', { has: page.locator('textarea') }).locator('.ip-btn--quiet').click();
    await drawer.locator('.ip-suggestion').first().waitFor();
    await shot('publish');
    await drawer.screenshot({ path: `${OUT_DIR}${prefix}publish-panel-${theme}.png`, animations: 'disabled' });
    console.log(`✓ ${prefix}publish-panel-${theme}.png`);
  }
  await page.close();
}

await mkdir(OUT_DIR, { recursive: true });
const stopServer = await ensureServer();
const browser = await chromium.launch();
try {
  for (const variant of RUNS) await run(browser, variant);
} finally {
  await browser.close();
  stopServer();
}
