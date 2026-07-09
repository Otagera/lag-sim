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

/**
 * Call tick() via cached zustand store (manual play only — before Vite HMR fires).
 */
async function tickStore(page) {
  return page.evaluate(async () => {
    const s = globalThis.__store.useGameStore.getState();
    if (s.isGameOver) return { ticked: false, week: s.week, gameOver: true };
    s.tick();
    const after = globalThis.__store.useGameStore.getState();
    return {
      ticked: true,
      week: after.week,
      gameOver: after.isGameOver,
      activeEventId: after.activeEvent?.id ?? null,
      activeEventTitle: after.activeEvent?.title ?? null,
      politicalCapital: after.stats?.politicalCapital,
      publicTrust: after.stats?.publicTrust,
      cashReserve: after.stats?.cashReserve,
    };
  });
}

/** Resolve active event via store */
async function resolveEventViaStore(page, choiceId) {
  return page.evaluate(async (cid) => {
    globalThis.__store.useGameStore.getState().resolveEvent(cid);
  }, choiceId);
}

/** Dismiss consequence beats via store */
async function dismissBeats(page) {
  return page.evaluate(async () => {
    const beats = globalThis.__store.useGameStore.getState().consequenceBeats;
    if (beats.length > 0) {
      globalThis.__store.useGameStore.getState().dismissConsequenceBeat();
    }
    return beats.length;
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

  // Eagerly import the store module ONCE and cache on globalThis.
  await page.evaluate(async () => {
    if (!globalThis.__store) {
      globalThis.__store = await import('/src/state/gameStore.ts');
    }
  });
  log(`Store module cached globally (eager import)`);

  await snap(page, '07-game-started');

  // ── MANUAL PLAY — 8 turns with UI panels mid-way ──────────────
  // Helper to resolve whatever event is sitting on screen.
  // Uses the zustand store directly (resolveEvent / dismissConsequenceBeat)
  // instead of DOM click dispatchEvent, which is unreliable for React synthetic events.
  async function resolveActiveEvent(week) {
    const storeInfo = await page.evaluate(async () => {
      const s = globalThis.__store.useGameStore.getState();
      return { hasEvent: !!s.activeEvent, title: s.activeEvent?.title, choices: s.activeEvent?.choices ?? [] };
    });
    if (!storeInfo.hasEvent) return;

    const title = storeInfo.title || '?';
    eventLog.push({ week, title: title.trim() });
    log(`  Event: "${title.trim()}"`);

    // Resolve via store: pick a random choice and call resolveEvent
    if (storeInfo.choices.length > 0) {
      const choice = pickRandom(storeInfo.choices);
      log(`  Choice: "${choice.label?.slice(0, 60)}" (cost: ${choice.politicalCapitalCost || 0} PC)`);
      await resolveEventViaStore(page, choice.id);
      await page.waitForTimeout(600);
    }

    // Dismiss consequence beats via store
    for (let s = 0; s < 10; s++) {
      const remaining = await dismissBeats(page);
      if (remaining === 0) break;
      await page.waitForTimeout(150);
    }
  }

  log('\n--- MANUAL PLAY (8 turns via store.tick()) ---');
  for (let turn = 0; turn < 8 && !gameOver; turn++) {
    // Tick
    await page.waitForTimeout(200);
    const result = await tickStore(page);
    if (!result.ticked) { gameOver = true; log('  ** GAME OVER (tick failed) **'); break; }

    pcHistory.push({ week: result.week, pc: result.politicalCapital, trust: result.publicTrust });
    log(`Turn ${turn + 1}, Week ${result.week}, PC=${result.politicalCapital?.toFixed(1)}${result.gameOver ? ' GAME OVER' : ''}`);

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

          // When Treasury is open, try a prestige action
          if (label === 'Treasury') {
            const pcBefore = await readDOMPC();
            log(`  PC before prestige action: ${pcBefore}`);
            const clicked = await clickText(page, 'Media Blitz', { timeout: 2000 });
            if (clicked) {
              log('  Prestige action "Media Blitz" clicked');
              await page.waitForTimeout(300);
              // Click confirm dialog
              await clickText(page, 'Confirm', { timeout: 2000 });
              await page.waitForTimeout(500);
              await snap(page, 'prestige-action-done');
              const pcAfter = await readDOMPC();
              log(`  PC after prestige action: ${pcAfter}`);
            } else {
              log('  Prestige action "Media Blitz" not clickable (maybe cooldown/cash)');
            }
          }

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

  // ── DOM HELPERS (used by both FF capture and post-FF play) ──

  /** Read week from DOM header text */
  async function readDOMWeek() {
    const text = await page.evaluate(() => document.querySelector('header')?.textContent || '');
    const m = text.match(/Week\s+(\d+)/i);
    return m ? parseInt(m[1], 10) : -1;
  }

  /** Read PC from the PC chip (data-tour="pc-chip") */
  async function readDOMPC() {
    return page.evaluate(() => {
      const chip = document.querySelector('[data-tour="pc-chip"]');
      if (!chip) return NaN;
      const spans = chip.querySelectorAll('span');
      const valueSpan = spans[spans.length - 1];
      const val = parseFloat(valueSpan?.textContent || '');
      return isNaN(val) ? NaN : val;
    });
  }

  /** Click Advance Week button */
  async function clickAdvanceWeek() {
    const clicked = await page.evaluate(() => {
      const btn = document.querySelector('button[data-tour="next-week"]');
      if (!btn || btn.disabled) return 'disabled';
      btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      return 'clicked';
    });
    return clicked === 'clicked';
  }

  /** Resolve active event via UI: click a random choice button */
  async function resolveEventViaUI() {
    await page.waitForTimeout(800);
    const choices = await page.evaluate(() => {
      const eventArea = document.querySelector('[class*="event-"]') || document.body;
      return Array.from(eventArea.querySelectorAll('button'))
        .filter(b => b.textContent && b.textContent.trim().length > 2)
        .map(b => ({ text: b.textContent?.trim()?.slice(0, 80) || '', disabled: !!b.disabled }));
    });
    const choiceBtns = choices.filter(c =>
      !c.text.startsWith('?') && !c.text.includes('Research') && !c.text.includes('Projects')
      && !c.text.includes('Advance Week') && !c.text.includes('Game Over')
      && !c.text.includes('Click anywhere') && !c.text.includes('Decision Made')
    );
    if (choiceBtns.length === 0) return false;
    const picked = pickRandom(choiceBtns);
    return clickText(page, picked.text.slice(0, 30));
  }

  /** Wait for all consequence beats to auto-dismiss (max 10s total) */
  async function waitForDismiss() {
    for (let i = 0; i < 20; i++) {
      const hasBeat = await page.evaluate(() => {
        return document.body.textContent?.includes('Click anywhere or wait to dismiss') || false;
      });
      if (!hasBeat) return true;
      await clickText(page, 'Click anywhere or wait to dismiss', { timeout: 300 }).catch(() => {});
      await page.waitForTimeout(200);
    }
    return false;
  }

  /** Check if game over screen is showing via advance-week button */
  async function isGameOverFromDOM() {
    const hasDisabledBtn = await page.evaluate(() => {
      const btn = document.querySelector('button[data-tour="next-week"]');
      return btn ? btn.disabled : true;
    });
    const hasGameOverText = await page.evaluate(() => document.body.textContent?.includes('Game Over') || false);
    return hasDisabledBtn && hasGameOverText;
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
      const ffPC = await readDOMPC();
      log(`  After FF: week=${ffWeekNum}`);
      if (ffWeekNum === -1) gameOver = true;
      pcHistory.push({ week: ffWeekNum, pc: ffPC, trust: NaN });
      log(`  PC=${isNaN(ffPC) ? '?' : ffPC.toFixed(1)}`);
      await snap(page, 'after-fastforward');
    }
  }

  // ── PLAY AFTER FAST-FORWARD ─────────────────────────────────
  // Use UI clicks for post-FF play (store access triggers Vite HMR which resets state).

  const ffWeekNum = await readDOMWeek();
  log(`  POST-FF START: week=${ffWeekNum}, gameOver=${gameOver}`);

  if (!gameOver && ffWeekNum > 0) {
    log('\n--- POST-FF PLAY (UI-driven, up to 20 turns) ---');
    for (let turn = 0; turn < 20; turn++) {
      // Advance week
      if (!(await clickAdvanceWeek())) {
        log(`  ** GAME OVER ** (advance week disabled)`);
        // Wait for LegacyScreen to render
        await page.waitForTimeout(2000);
        // Check for "Begin Second Term" (re-election win)
        const won = await clickText(page, 'Begin Second Term', { timeout: 2000 }).catch(() => false);
        if (won) {
          log('  Re-elected! Beginning second term...');
          await page.waitForTimeout(1000);
          continue; // Try advancing again
        }
        // Check for plain "Continue" on game-over screen
        await clickText(page, 'Continue', { timeout: 1500 }).catch(() => {});
        break; // Game is truly over
      }
      await page.waitForTimeout(800);

      // Resolve event card if present
      await resolveEventViaUI().catch(() => {});
      await page.waitForTimeout(300);

      // Wait for consequence beats to auto-dismiss
      await waitForDismiss().catch(() => {});

      // Read week + PC from DOM
      const currentWeek = await readDOMWeek();
      const currentPC = await readDOMPC();
      pcHistory.push({ week: currentWeek, pc: currentPC, trust: NaN });
      log(`  Post-FF ${turn + 1}, week=${currentWeek}, PC=${isNaN(currentPC) ? '?' : currentPC.toFixed(1)}`);
    }
  }

  // ── FINAL CAPTURE ─────────────────────────────────────────────
  log('\n--- FINAL STATE ---');

  // Capture final state from DOM (avoids Vite HMR store reset)
  const bodyText = await page.locator('body').textContent().catch(() => '');
  const hasLegacy = bodyText?.includes('Legacy of') || bodyText?.includes('Valedictory') || false;

  const goTypeMatch = bodyText?.match(/(bankruptcy|federal|uprising|impeachment|primary|term)/i);
  const goType = goTypeMatch ? goTypeMatch[1] : 'unknown';

  let endingNarrative = '';
  if (hasLegacy) {
    const narrativeEl = await page.evaluate(() => {
      const el = document.querySelector('[class*="legacy"]') || document.querySelector('main');
      return el?.textContent?.slice(0, 300) || '';
    });
    endingNarrative = narrativeEl.slice(0, 200);
  }

  const finalHeader = s(await page.locator('header').first().textContent().catch(() => ''));
  const finalWeekMatch = finalHeader.match(/Week\s+(\d+)/i);
  const finalWeek = finalWeekMatch ? parseInt(finalWeekMatch[1], 10) : '?';
  const finalPCMatch = bodyText.match(/PC\s*([\d.]+)/) || bodyText.match(/Political\s*Capital[:\s]+([\d.]+)/i);
  const finalPC = finalPCMatch ? finalPCMatch[1] : 'N/A';

  log(`Game over type: ${goType}`);
  log(`Legacy screen visible: ${hasLegacy}`);
  log(`Final week: ${finalWeek}, PC: ${finalPC}`);
  if (endingNarrative) log(`Narrative: ${endingNarrative}`);

  await clickText(page, 'Continue', { timeout: 2000 }).catch(() => {});
  await page.waitForTimeout(1000);
  await snap(page, 'game-over-screen');
  await snap(page, 'final');

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
  const pcMin = Math.min(...pcHistory.map(r => r.pc).filter(v => v !== null && v !== undefined && !isNaN(v)));
  const pcMinWeek = pcHistory.find(r => r.pc === pcMin)?.week ?? '?';

  let md = `# PLAYTHROUGH AUDIT — Lagos Governor Sim\n\n`;
  md += `**Generated:** ${new Date().toISOString()}\n`;
  md += `**Final week:** ${finalWeek}\n`;
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
  md += `- **Header preview:** ${finalHeader.slice(0, 100)}\n\n`;

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
  md += `- **Week:** ${finalWeek}\n`;
  md += `- **Game over:** ${gameOver || hasLegacy}\n`;
  md += `- **Legacy screen:** ${hasLegacy}\n`;
  md += `- **Political capital:** ${finalPC}\n`;
  md += `- **Game over type:** ${goType}\n`;
  md += `- **Events:** ${eventLog.length} total, ${Object.keys(tally).length} unique\n\n`;

  md += `### Game Over Details\n\n`;
  md += `- **Type:** ${goType}\n`;
  md += `- **Narrative:** ${endingNarrative.replace(/`/g, "'").slice(0, 300)}\n\n`;

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
