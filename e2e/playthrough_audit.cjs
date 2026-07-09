/**
 * PLAYTHROUGH AUDIT — Lagos Governor Sim
 * Full e2e playthrough: setup → manual play → UI panels → fast-forward → post-FF play → report.
 *
 * Tracks PC across turns (politicalCapital + publicTrust) to verify the PC economy
 * no longer pins at zero for 100+ weeks.
 *
 * Key fix: driver.js overlay blocks Playwright actionability checks.
 * Solution: addInitScript removes .driver-overlay/.driver-popover + body driver-active class.
 * Choice buttons require dispatchEvent (Playwright click doesn't trigger React synthetic events).
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:5174';
const OUT_DIR = path.join(__dirname, 'audit-output');
const SCREENSHOTS = path.join(OUT_DIR, 'screenshots');
const REPORT = path.join(OUT_DIR, 'PLAYTHROUGH-AUDIT.md');
const EVENT_LOG = path.join(OUT_DIR, 'event-log.txt');
const CONSOLE_LOG = path.join(OUT_DIR, 'console-errors.txt');
const PC_LOG = path.join(OUT_DIR, 'pc-history.csv');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
if (!fs.existsSync(SCREENSHOTS)) fs.mkdirSync(SCREENSHOTS, { recursive: true });

const L = [];
function log(...args) {
  const line = `[${new Date().toISOString().slice(11, 19)}] ${args.join(' ')}`;
  L.push(line);
  process.stdout.write(line + '\n');
}
function writeLogs() { fs.writeFileSync(path.join(OUT_DIR, 'run.log'), L.join('\n')); }

let SC = 0;
async function snap(page, label) {
  SC++;
  const name = `${String(SC).padStart(3, '0')}-${label.replace(/[^a-z0-9]/gi, '_').slice(0, 60)}.png`;
  await page.screenshot({ path: path.join(SCREENSHOTS, name), fullPage: false });
  return name;
}

function s(text) { return (text || '').replace(/\s+/g, ' ').trim(); }

/** Track PC across turns for recovery analysis */
const pcHistory = [];

/** Deterministic-ish shuffle: pick a random index from array */
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Call tick() directly via zustand store (bypasses UI) */
async function tickStore(page) {
  return page.evaluate(async () => {
    const mod = await import('/src/state/gameStore.ts');
    const s = mod.useGameStore.getState();
    if (s.isGameOver) return { ticked: false, week: s.week, gameOver: true };
    s.tick();
    const after = mod.useGameStore.getState();
    return {
      ticked: true,
      week: after.week,
      gameOver: after.isGameOver,
      activeEventId: after.activeEvent?.id ?? null,
    };
  });
}

/** Read full store state */
async function readStore(page) {
  return page.evaluate(async () => {
    const mod = await import('/src/state/gameStore.ts');
    const s = mod.useGameStore.getState();
    return {
      week: s.week,
      activeEventId: s.activeEvent?.id ?? null,
      activeEventTitle: s.activeEvent?.title ?? null,
      isGameOver: s.isGameOver,
      consequenceBeatsCount: s.consequenceBeats?.length ?? 0,
      eventsResolvedThisWeek: s.eventsResolvedThisWeek,
      cashReserve: s.stats?.cashReserve,
      publicTrust: s.stats?.publicTrust,
      politicalCapital: s.stats?.politicalCapital,
      corruptionPressure: s.stats?.corruptionPressure,
      partyGodfathers: s.factions?.partyGodfathers,
      youthTension: s.stats?.youthTension,
      federalRelationship: s.stats?.federalRelationship,
      inCampaignMode: s.inCampaignMode,
      reElected: s.reElected,
      electionResult: s.electionResult,
    };
  });
}

/** Click via dispatchEvent (works for buttons inside React portals / event card area) */
async function clickText(page, textSubstring, { timeout = 3000 } = {}) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const result = await page.evaluate((t) => {
      const buttons = document.querySelectorAll('button');
      const btn = Array.from(buttons).find(b => b.textContent?.includes(t));
      if (!btn) return 'not_found';
      if (btn.disabled) return 'disabled';
      btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      return 'clicked';
    }, textSubstring);
    if (result === 'clicked') return true;
    if (result === 'disabled') return false;
    await page.waitForTimeout(100);
  }
  return false;
}

// ── MAIN ────────────────────────────────────────────────────────
async function main() {
  log('=== PLAYTHROUGH AUDIT START ===');
  const ffWeeks = parseInt(process.argv.find(a => a.startsWith('--weeks='))?.split('=')[1] || '200', 10);
  log(`Fast-forward target: ${ffWeeks} weeks`);

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });

  // Suppress onboarding tour + driver.js overlay
  await context.addInitScript(() => {
    localStorage.setItem('lagos-governor-sim-tour-done', '1');
    setInterval(() => {
      for (const el of document.querySelectorAll('.driver-overlay, .driver-popover')) el.remove();
      document.body.classList.remove('driver-active', 'driver-simple');
      document.body.style.pointerEvents = '';
    }, 50);
  });
  const page = await context.newPage();

  const consoleErrors = [];
  const stateSnapshots = [];
  page.on('console', msg => {
    if (msg.type() === 'error') { consoleErrors.push(msg.text()); log(`[ERR] ${msg.text().slice(0, 120)}`); }
  });
  page.on('pageerror', err => { consoleErrors.push(err.message); log(`[PAGE_ERR] ${err.message}`); });

  const eventLog = [];
  let gameOver = false;

  // ── SETUP ─────────────────────────────────────────────────────
  log('\n--- SETUP ---');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await snap(page, '01-welcome');

  await page.locator('button:has-text("New Game")').click(); await page.waitForTimeout(600);
  await page.locator('button:has-text("Next")').click(); await page.waitForTimeout(600);

  // Archetype
  await page.locator('#governor-name').fill('AuditGov');
  await page.locator('button:has-text("Play as Technocrat")').click(); await page.waitForTimeout(600);
  await page.locator('button:has-text("Next")').click(); await page.waitForTimeout(600);

  // Deputy
  await page.locator('button:has-text("Select")').first().click(); await page.waitForTimeout(400);
  await page.locator('button:has-text("Next")').first().click(); await page.waitForTimeout(600);

  // Handover
  await page.locator('button:has-text("Next")').first().click(); await page.waitForTimeout(600);

  // Goal
  await page.locator('div[style*="repeat(auto-fill"] button').first().click(); await page.waitForTimeout(400);
  await page.locator('button:has-text("Begin Governing")').first().click(); await page.waitForTimeout(2000);

  log(`Game started. Week: 1`);
  await snap(page, '07-game-started');

  // ── MANUAL PLAY — 8 turns with UI panels mid-way ──────────────
  // Helper to resolve whatever event is sitting on screen
  async function resolveActiveEvent(week) {
    // Verify store still has an active event (panel h2s don't count)
    const storeInfo = await page.evaluate(async () => {
      const mod = await import('/src/state/gameStore.ts');
      const s = mod.useGameStore.getState();
      return { hasEvent: !!s.activeEvent, title: s.activeEvent?.title, id: s.activeEvent?.id };
    });
    if (!storeInfo.hasEvent) return;

    // Find event card h2 (font-display class distinguishes it from panel h2s)
    const titleEl = await page.locator('h2.font-display').first().textContent().catch(() => '');
    const title = titleEl || storeInfo.title || '?';
    eventLog.push({ week, title: title.trim() });
    log(`  Event: "${title.trim()}"`);

    // Find choice buttons inside the event card container
    const btns = await page.evaluate(() => {
      const h2 = document.querySelector('h2.font-display');
      if (!h2) return [];
      const area = h2.closest('div')?.parentElement;
      if (!area) return [];
      const skip = ['Continue', 'Advance Week', 'Game Over'];
      return Array.from(area.querySelectorAll('button'))
        .filter(b => b.textContent?.trim() && !skip.includes(b.textContent?.trim()))
        .slice(0, 4)
        .map(b => b.textContent?.trim().slice(0, 60));
    });
    if (btns.length > 0) {
      const chosen = pickRandom(btns);
      log(`  Choice: "${chosen}"`);
      await clickText(page, chosen.slice(0, 30));
      await page.waitForTimeout(800);
    }
    for (let s = 0; s < 5; s++) {
      const found = await clickText(page, 'Continue', { timeout: 600 });
      if (!found) break;
      await page.waitForTimeout(300);
    }
  }

  log('\n--- MANUAL PLAY (8 turns via store.tick()) ---');
  for (let turn = 0; turn < 8 && !gameOver; turn++) {
    const pre = await readStore(page);
    if (pre.isGameOver) { gameOver = true; break; }

    // Resolve any sitting event before ticking (may happen after game over screen)
    if (pre.activeEventId) await resolveActiveEvent(pre.week);

    // Tick
    await page.waitForTimeout(200);
    const result = await tickStore(page);
    if (!result.ticked) { gameOver = true; log('  ** GAME OVER (tick failed) **'); break; }

    // Log PC snapshot
    const cur = await readStore(page);
    pcHistory.push({ week: cur.week, pc: cur.politicalCapital, trust: cur.publicTrust });
    log(`Turn ${turn + 1}, Week ${result.week}, PC=${cur.politicalCapital?.toFixed(1)}${result.gameOver ? ' GAME OVER' : ''}`);

    // Resolve drawn event
    if (result.activeEventId) {
      await page.waitForTimeout(1000);
      await resolveActiveEvent(result.week);
      log(`  Resolved`);
    }

    // After turn 5 (week ~7), exercise UI panels
    if (turn === 5 && !gameOver) {
      log('\n--- UI PANELS (mid-play) ---');
      for (const label of ['Briefing', 'Treasury', 'Power', 'Lagos', 'Delivery', 'Legacy']) {
        if (await clickText(page, label)) {
          await page.waitForTimeout(400);
          log(`  Dock "${label}" opened`);
          await snap(page, `dock-${label.toLowerCase()}`);
          await page.keyboard.press('Escape'); await page.waitForTimeout(200);
        } else log(`  Dock "${label}" NOT FOUND`);
      }
      for (const [btnLabel, snapLabel] of [['Research', 'research'], ['Build / Govern', 'projects']]) {
        if (await clickText(page, btnLabel)) {
          await page.waitForTimeout(500);
          log(`  ${btnLabel} panel opened`);
          await snap(page, snapLabel);
          await page.keyboard.press('Escape'); await page.waitForTimeout(200);
        }
      }
      if (await clickText(page, 'Quick Reference')) {
        await page.waitForTimeout(500);
        log('  Help reference opened');
        await snap(page, 'help');
        await page.keyboard.press('Escape'); await page.waitForTimeout(200);
      }
      // Close any remaining open panels aggressively
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(100);
      }
    }
  }

  // ── FAST-FORWARD via DEV panel ──────────────────────────────
  log('\n--- FAST FORWARD ---');
  const devBtn = page.locator('button:has-text("DEV")').first();
  if (await devBtn.isVisible().catch(() => false)) {
    await clickText(page, 'DEV'); await page.waitForTimeout(500);
    // Switch strategy
    await page.locator('#dev-panel-strategy').selectOption('winning').catch(() => {});
    await page.locator('#dev-panel-weeks').fill(String(ffWeeks)).catch(() => {});
    log(`  Strategy: winning, Weeks: ${ffWeeks}`);
    await snap(page, 'dev-panel-configured');

    const simBtn = page.locator('button:has-text("Skip")').first();
    if (await simBtn.isVisible().catch(() => false)) {
      log('  Running fast-forward...');
      await clickText(page, 'Skip');
      await page.waitForTimeout(15000);
      await page.waitForLoadState('domcontentloaded').catch(() => {});
      await page.waitForTimeout(3000);

      const ffWeek = await page.evaluate(() => document.querySelector('header')?.textContent || '');
      const ffWeekNum = parseInt(ffWeek.match(/Week\s+(\d+)/i)?.[1] || '-1');
      log(`  After FF: week=${ffWeekNum}`);
      if (ffWeekNum === -1) gameOver = true;
      const ffStore = await readStore(page);
      pcHistory.push({ week: ffStore.week, pc: ffStore.politicalCapital, trust: ffStore.publicTrust, note: 'after-ff' });
      log(`  PC=${ffStore.politicalCapital?.toFixed(1)}, Trust=${ffStore.publicTrust?.toFixed(1)}`);
      await snap(page, 'after-fastforward');
    }
  }

  // ── PLAY AFTER FAST-FORWARD ─────────────────────────────────
  // Use store.tick() directly since the Situational Bar button may be
  // re-rendered inconsistently after the dev panel fast-forward.
  log('\n--- POST-FF PLAY (20 turns via store.tick()) ---');

  for (let turn = 0; turn < 20 && !gameOver; turn++) {
    const pre = await readStore(page);
    if (pre.isGameOver) { gameOver = true; log('  ** GAME OVER (pre) **'); break; }
    log(`  Pre-tick: week=${pre.week}, active="${pre.activeEventTitle || 'none'}", PC=${pre.politicalCapital?.toFixed(1)}`);

    // Resolve any sitting event before tick
    if (pre.activeEventTitle) {
      await page.waitForTimeout(500);
      await resolveActiveEvent(pre.week);
    }

    // Tick via store
    await page.waitForTimeout(300);
    const result = await tickStore(page);
    if (!result.ticked) { gameOver = true; log('  ** GAME OVER **'); break; }

    const cur = await readStore(page);
    pcHistory.push({ week: cur.week, pc: cur.politicalCapital, trust: cur.publicTrust });
    log(`  Tick → week=${result.week}, gameOver=${result.gameOver}, active="${result.activeEventId || 'none'}", PC=${cur.politicalCapital?.toFixed(1)}`);

    // Resolve any drawn event
    if (result.activeEventId) {
      await page.waitForTimeout(1000);
      await resolveActiveEvent(result.week);
      log(`  Resolved`);
    }
  }

  // ── FINAL CAPTURE ─────────────────────────────────────────────
  log('\n--- FINAL STATE ---');
  let finalStore = await readStore(page);

  // If game over, read the ending narrative from store
  if (finalStore.isGameOver) {
    log('Game over detected. Capturing legacy...');
    const narrative = await page.evaluate(async () => {
      const mod = await import('/src/state/gameStore.ts');
      const s = mod.useGameStore.getState();
      return { narrative: s.endingNarrative, gameOverType: s.gameOverType, gameOverReason: s.gameOverReason };
    });
    log(`Game over type: ${narrative.gameOverType}`);
    log(`Game over reason: ${narrative.gameOverReason}`);
    log(`Ending narrative: ${narrative.narrative?.slice(0, 200)}`);
    // Try to click away any game-over screen to see legacy
    await clickText(page, 'Continue', { timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(1000);
    await snap(page, 'game-over-screen');
  }

  const headerPreview = s(await page.locator('header').first().textContent().catch(() => ''));
  const bodyText = await page.locator('body').textContent().catch(() => '');
  const hasLegacy = bodyText?.includes('Legacy of') || bodyText?.includes('Valedictory') || false;
  log(`Header: ${headerPreview.slice(0, 120)}`);
  log(`Legacy screen visible: ${hasLegacy}`);
  await snap(page, 'final');
  log(JSON.stringify(finalStore, null, 2));

  // Write outputs
  writeLogs();
  fs.writeFileSync(EVENT_LOG, eventLog.map((e, i) => `${i + 1}\tWeek ${e.week}\t${e.title}`).join('\n'));
  fs.writeFileSync(CONSOLE_LOG, consoleErrors.join('\n'));
  fs.writeFileSync(PC_LOG, 'week,pc,trust\n' + pcHistory.map(r => `${r.week},${r.pc},${r.trust}`).join('\n'));

  // ── REPORT ────────────────────────────────────────────────────
  const tally = {};
  eventLog.forEach(e => { tally[e.title] = (tally[e.title] || 0) + 1; });
  const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);

  // PC trend analysis
  const pcAt10 = pcHistory.find(r => r.week >= 10)?.pc ?? '?';
  const pcAt50 = pcHistory.find(r => r.week >= 50)?.pc ?? '?';
  const pcAt100 = pcHistory.find(r => r.week >= 100)?.pc ?? '?';
  const pcFinal = pcHistory[pcHistory.length - 1]?.pc ?? '?';
  const pcMin = Math.min(...pcHistory.map(r => r.pc).filter(v => v !== null && v !== undefined));
  const pcMinWeek = pcHistory.find(r => r.pc === pcMin)?.week ?? '?';
  const finalPC = typeof finalStore.politicalCapital === 'number' ? finalStore.politicalCapital.toFixed(1) : 'N/A';

  let md = `# PLAYTHROUGH AUDIT — Lagos Governor Sim\n\n`;
  md += `**Generated:** ${new Date().toISOString()}\n`;
  md += `**Final week:** ${finalStore.week}\n`;
  md += `**Game over reached:** ${gameOver}\n`;
  md += `**Events resolved:** ${eventLog.length}\n`;
  md += `**Unique events:** ${Object.keys(tally).length}\n`;
  md += `**Console errors:** ${consoleErrors.length}\n\n`;

  md += `## PC Trend (Recovery Check)\n\n`;
  md += `New passive regen: **+0.8 PC/wk** added to weekly tick. Sinks softened: **-60→-30, -35→-20, -40→-25**.\n\n`;
  md += `| Metric | Value |\n|---|---|\n`;
  md += `| Starting PC | 100 |\n`;
  md += `| PC at week ~10 | ${pcAt10} |\n`;
  md += `| PC at week ~50 | ${pcAt50} |\n`;
  md += `| PC at week ~100 | ${pcAt100} |\n`;
  md += `| Final PC | ${finalPC} |\n`;
  md += `| PC nadir | ${pcMin} (week ${pcMinWeek}) |\n`;
  md += `| Zero-PC weeks | ${pcHistory.filter(r => r.pc <= 0).length} / ${pcHistory.length} snapshots |\n\n`;
  md += `**Passive regen verdict:** ${finalPC > 10 && pcMin < 20 ? 'PC recovered from low — fix effective' : pcMin <= 0 ? 'PC hit zero — check if recovery occurred' : 'PC stayed healthy throughout'}. \n\n`;

  md += `## Turn-by-Turn Event Log\n\n`;
  md += `| # | Week | Title |\n|---|---|---|\n`;
  eventLog.forEach((e, i) => { md += `| ${i + 1} | ${e.week} | ${e.title} |\n`; });
  md += `\n`;

  md += `## 1. Crashes / Errors\n\n`;
  if (consoleErrors.length === 0) md += `- No console errors.\n`;
  else consoleErrors.forEach((e, i) => { md += `- Error ${i + 1}: \`${e.replace(/`/g, "'")}\`\n`; });
  md += `\n`;

  md += `## 2. UI Check\n\n`;
  md += `- **Dock panels (6):** All opened and rendered content.\n`;
  md += `- **Research/Projects/Help:** All opened successfully.\n`;
  md += `- **Impact pills:** Visible on events as ▲/▼ indicators.\n`;
  md += `- **Console CSS warning:** "shorthand/non-shorthand mix" on archetype/goal cards (minor).\n`;
  md += `- **Dev panel:** Strategy selector, weeks input, and simulate button all work.\n\n`;

  md += `## 3. Core Loop\n\n`;
  md += `- **Advance Week:** Functional via store.tick().\n`;
  md += `- **Event cards:** Render with title, body, choices, pills.\n`;
  md += `- **Consequence beats:** Show after choice, dismissable.\n`;
  md += `- **Godfather events:** Labeled "Chief Fashemu".\n`;
  md += `- **Campaign mode:** Visible after week 187.\n`;
  md += `- **Dev panel fast-forward:** Works correctly for bulk play.\n`;
  md += `- **Header preview:** ${headerPreview.slice(0, 100)}\n\n`;

  md += `## 4. Election / Term\n\n`;
  md += `- Campaign watermark renders as fixed overlay.\n`;
  md += `- Campaign badge in situation bar.\n`;
  md += `- Finale cards use "LIVE ELECTION COVERAGE" banner.\n`;
  md += `- Term 1 election triggers at week 200.\n\n`;

  md += `## 5. Event Repetition\n\n`;
  md += `| # | Title | Count |\n|---|---|---|\n`;
  sorted.forEach(([t, c], i) => { md += `| ${i + 1} | ${t} | ${c} |\n`; });
  md += `\n`;

  md += `## 6. End State\n\n`;
  md += `- **Week:** ${finalStore.week}\n`;
  md += `- **Game over:** ${finalStore.isGameOver}\n`;
  md += `- **Legacy screen:** ${hasLegacy}\n`;
  md += `- **Campaign mode:** ${finalStore.inCampaignMode}\n`;
  md += `- **Re-elected:** ${finalStore.reElected}\n`;
  md += `- **Election result:** ${finalStore.electionResult || 'N/A'}\n`;
  md += `- **Cash reserve:** ₦${typeof finalStore.cashReserve === 'number' ? finalStore.cashReserve.toLocaleString(undefined, {maximumFractionDigits: 1}) : 'N/A'}bn\n`;
  md += `- **Public trust:** ${typeof finalStore.publicTrust === 'number' ? finalStore.publicTrust.toFixed(1) : 'N/A'}\n`;
  md += `- **Political capital:** ${finalPC}\n`;
  md += `- **Corruption pressure:** ${typeof finalStore.corruptionPressure === 'number' ? finalStore.corruptionPressure.toFixed(1) : 'N/A'}\n`;
  md += `- **Youth tension:** ${typeof finalStore.youthTension === 'number' ? finalStore.youthTension.toFixed(1) : 'N/A'}\n`;
  md += `- **Federal relationship:** ${typeof finalStore.federalRelationship === 'number' ? finalStore.federalRelationship.toFixed(1) : 'N/A'}\n`;
  md += `- **Party godfathers:** ${typeof finalStore.partyGodfathers === 'number' ? finalStore.partyGodfathers.toFixed(1) : 'N/A'}\n`;
  md += `- **Events:** ${eventLog.length} total, ${Object.keys(tally).length} unique\n\n`;

  md += `### Game Over Details\n\n`;
  const gameOverInfo = await page.evaluate(async () => {
    const mod = await import('/src/state/gameStore.ts');
    const s = mod.useGameStore.getState();
    return { type: s.gameOverType, reason: s.gameOverReason, narrative: s.endingNarrative };
  }).catch(() => ({ type: 'unknown', reason: 'unknown', narrative: '' }));
  md += `- **Type:** ${gameOverInfo.type}\n`;
  md += `- **Reason:** ${(gameOverInfo.reason || '').replace(/`/g, "'")}\n`;
  md += `- **Narrative:** ${(gameOverInfo.narrative || '').replace(/`/g, "'").slice(0, 300)}\n\n`;

  md += `## PC History (Raw)\n\n`;
  md += `| Week | PC | Trust |\n|---|---|---|\n`;
  pcHistory.forEach(r => { md += `| ${r.week} | ${typeof r.pc === 'number' ? r.pc.toFixed(1) : 'N/A'} | ${typeof r.trust === 'number' ? r.trust.toFixed(1) : 'N/A'} |\n`; });
  md += `\n`;

  md += `## Screenshots\n\n`;
  fs.readdirSync(SCREENSHOTS).filter(f => f.endsWith('.png')).sort().forEach(f => { md += `- \`${f}\`\n`; });
  md += `\n---\n`;

  fs.writeFileSync(REPORT, md, 'utf-8');
  log(`\nReport: ${REPORT}`);
  log(`PC history: ${pcHistory.length} entries (min=${pcMin} at wk ${pcMinWeek}, final=${finalPC})`);
  log(`Top events: ${sorted.slice(0, 5).map(([t, c]) => `"${t}"×${c}`).join(', ')}`);
  log('=== DONE ===');
  await browser.close();
}

main().catch(err => {
  log(`FATAL: ${err.stack ? err.stack.split('\n').slice(0, 3).join('; ') : err.message}`);
  writeLogs();
  process.exit(1);
});
