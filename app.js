'use strict';
/* BOUNCER — a nightclub door for your dopamine apps.
   Data lives in this browser's localStorage (key bouncer_v1).
   iPhone Shortcuts do the redirecting; this page is the door. */

const APPS = {
  instagram: { name: 'Instagram', url: 'instagram://',  a: '#ff7a1a' },
  youtube:   { name: 'YouTube',   url: 'youtube://',    a: '#ff3b30' },
  tiktok:    { name: 'TikTok',    url: 'snssdk1233://', a: '#3de8ff' },
  snapchat:  { name: 'Snapchat',  url: 'snapchat://',   a: '#ffe14d' },
  games:     { name: 'Games',     url: 'none',          a: '#9b5cff' },
};
const LIMIT = 60;          // minutes per app per day
const OPEN_HOUR = 10;      // club opens at 10am, every day
const PASSES = [5, 10, 15];
const OVER_HOLD = { 5: 20, 10: 40, 15: 60 };
const OVER_CH = { 5: 1, 10: 2, 15: 3 };
const CH_ORDER = ['type', 'maths', 'breathe', 'count'];
const REASONS = [['bored', 'Bored'], ['habit', 'Pure habit'], ['avoid', 'Avoiding something'], ['reply', 'Replying to someone'], ['specific', 'Something specific']];
const REASON_NAME = Object.fromEntries(REASONS);
const KEY = 'bouncer_v1';

/* ---------------- roasts ---------------- */
const R = {
  morning: [
    "It's {time}. The club opens at 10. Go brush your teeth.",
    "Nobody worth watching posts before 10. That's science.",
    "The feed hasn't even woken up yet. Why have you?",
    "Bro it's {time}. Drink water. Look at the sky. Anything.",
    "Mornings are for building. You can rot after 10, like a professional.",
    "Doors open at 10. Right now you've got a whole morning and zero excuses.",
    "{app} at {time}? Your future self just sighed.",
  ],
  morningRepeat: [
    "Knock #{k} this morning. Still locked. Knock #{k1} will also be locked.",
    "You keep knocking like the answer's going to change. It's not.",
    "I respect the persistence. I just don't respect the target.",
  ],
  lockdown: [
    "You locked this yourself. {left} to go. I'm just following orders.",
    "Nice try. Lockdown's got {left} left.",
    "Past you didn't trust present you. Past you was right.",
    "Turned the Focus off? Cute. Still {left}.",
    "Nobody gets in. Not even you. Especially not you.",
    "You signed the contract, champ. {left}.",
  ],
  normal: [
    "Name's not on the list. Convince me.",
    "Easy. Who sent you?",
    "Back again? The algorithm missed you too.",
    "You've got {mins} min of {app} left today. Spend it like it's money. Because it is.",
    "I'm a bouncer, not your mum. But your mum would also say no.",
    "Door's not locked. It's just heavy.",
    "Ah, {app}. Where minutes go to die.",
  ],
  justLeft: "You walked away {ago}. What changed? Nothing changed.",
  justIn: "Your pass just ran out and you're already back. Interesting.",
  night: "It's {time}. Nothing on {app} is worth this hour.",
  many: "Knock #{k} today. I'm starting to recognise your face.",
  over: [
    "Your hour's done. This is overtime, and overtime costs.",
    "60 minutes wasn't enough? Bold. Let's see how bad you want it.",
    "You already gave {app} an hour of your life. It gave you nothing back.",
    "Look at you, begging at the door after closing. Go on then, earn it.",
  ],
  overMore: [
    "Overtime #{k}. I'm writing this one in red.",
    "Again? Even the algorithm thinks you need a hobby.",
    "At this point {app} should be paying you.",
    "This is your {nth} overtime. The receipt is getting long, bro.",
  ],
  grant: [
    "Clock starts now. I'll be here when it runs out.",
    "In you go. Try to come out with your dignity.",
    "Enjoy. The door gets heavier every time.",
    "Fine. But I'm watching the clock.",
  ],
  grantOver: [
    "I've seen this film. It doesn't end well.",
    "Overtime granted. It's going on the receipt in red.",
    "You earned it. That's the saddest sentence I've said all day.",
  ],
  nope: [
    "Respect. The feed will survive without you.",
    "That's the most attractive thing you've done all day.",
    "Walked away. Legend behaviour.",
    "The algorithm is crying. Good.",
    "Main character energy. Off-screen, for once.",
    "Look at you, having a life.",
  ],
};
const ord = n => n + (['th', 'st', 'nd', 'rd'][(n % 100 > 10 && n % 100 < 14) ? 0 : (n % 10 < 4 ? n % 10 : 0)]);

/* ---------------- tiny helpers ---------------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const enc = encodeURIComponent;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const now = () => Date.now();
const pad = n => String(n).padStart(2, '0');
const dk = t => { const d = new Date(t); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const isToday = t => dk(t) === dk(now());
const fmtH = h => { h = ((h % 24) + 24) % 24; return (h % 12 || 12) + (h < 12 ? 'am' : 'pm'); };
const clock = (t = now()) => { const d = new Date(t); return `${d.getHours() % 12 || 12}:${pad(d.getMinutes())}${d.getHours() < 12 ? 'am' : 'pm'}`; };
const hms = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 3600)}:${pad(Math.floor(s % 3600 / 60))}:${pad(s % 60)}`; };
const human = ms => { const m = Math.max(0, Math.ceil(ms / 60000)); const h = Math.floor(m / 60); return h ? `${h}h ${m % 60}m` : `${m} min`; };
const ago = t => { const m = Math.round((now() - t) / 60000); if (m < 1) return 'seconds ago'; if (m < 60) return `${m} min ago`; const h = Math.round(m / 60); return h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`; };
const pick = a => a[Math.floor(Math.random() * a.length)];
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const fill = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');
const uid = () => now().toString(36) + Math.random().toString(36).slice(2, 7);
const norm = s => String(s).toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2600); }
function setAccent(c) { document.documentElement.style.setProperty('--a', c); }
const root = $('#root');
let ticker = null;
function every(fn, ms = 1000) { clearInterval(ticker); ticker = setInterval(fn, ms); }

/* ---------------- the bouncer (sprites + speech bubble) ---------------- */
const SPR = 'sprites/';
const POSES = {
  idle:  { f: [1, 2, 3, 4, 3, 2], fps: 3 },
  stop:  { f: [1, 2], fps: 1.6 },
  wag:   { f: [1, 2, 3, 2], fps: 6 },
  clip:  { f: [1, 2], fps: 1.2 },
  wave:  { f: [1, 2, 3], fps: 4, once: true },
  clap:  { f: [1, 2, 3, 2], fps: 6 },
  watch: { f: [1, 2], fps: 1.5 },
  write: { f: [1, 2], fps: 3 },
};
Object.entries(POSES).forEach(([k, p]) => new Set(p.f).forEach(i => { const im = new Image(); im.src = `${SPR}${k}-${i}.png`; }));
const WAG = ["Wrong. Use your brain, not your thumbs.", "Nope. Again.", "That's not it, champ.", "Are you even trying?"];
const LETGO = ["Let go? Weak. From the top.", "Hands off already? Start again.", "Commitment issues, I see."];

// pose(img, 'clap')            -> switch and loop
// pose(img, 'wag', 1800)       -> play for 1.8s, then return to the previous pose
function pose(img, name, ms) {
  if (!img || !POSES[name]) return;
  const prev = img._anim || {};
  clearInterval(prev.t); clearTimeout(prev.back);
  const p = POSES[name]; let i = 0;
  img.dataset.pose = name;
  const show = () => { img.src = `${SPR}${name}-${p.f[i]}.png`; };
  show();
  const t = setInterval(() => {
    if (!img.isConnected || (p.once && i >= p.f.length - 1)) return clearInterval(t);
    i = (i + 1) % p.f.length; show();
  }, 1000 / p.fps);
  const base = ms ? (prev.base || name) : name;
  img._anim = { t, base, back: ms ? setTimeout(() => pose(img, base), ms) : null };
}
function typeInto(el, text) {
  if (!el) return;
  clearInterval(el._t);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = text; return; }
  let i = 0;
  const draw = () => { el.innerHTML = esc(text.slice(0, i)) + `<span class="ghost">${esc(text.slice(i))}</span>`; };
  draw();
  el._t = setInterval(() => { i = Math.min(text.length, i + 1); draw(); if (i >= text.length) clearInterval(el._t); }, 22);
}
function stageHTML(start, line, { rope = false, over = false, cls = '' } = {}) {
  return `<div class="stage ${cls}">
    <div class="bubble ${over ? 'over' : ''}"><span class="lab">The bouncer</span><p id="say" data-text="${esc('“' + line + '”')}"></p></div>
    <div class="spr-box"><img class="sprite" id="spr" alt="The bouncer" data-start="${start}"></div>
    ${rope ? `<div class="rope-front">${ROPE}</div>` : ''}
  </div>`;
}
function startStage() {
  const img = $('#spr'); if (img) pose(img, img.dataset.start);
  const s = $('#say'); if (s) typeInto(s, s.dataset.text);
}
function say(text, p, ms) {
  typeInto($('#say'), '“' + text + '”');
  if (p) pose($('#spr'), p, ms);
}

/* ---------------- state ---------------- */
function blank() { return { events: [], locks: [], settings: { passShortcut: 'Bouncer Pass', lockShortcut: 'Bouncer Lockdown', useFocus: true } }; }
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (s && Array.isArray(s.events)) { const b = blank(); return { events: s.events, locks: s.locks || [], settings: { ...b.settings, ...(s.settings || {}) } }; }
  } catch (e) { /* fall through */ }
  return blank();
}
let S = load();
function save() {
  const cut = now() - 60 * 864e5;
  S.events = S.events.filter(e => e.t > cut);
  S.locks = S.locks.filter(l => l.e > cut);
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast("Couldn't save. Private browsing?"); }
}

const appOf = id => APPS[id] ? { id, ...APPS[id] } : { id: id || 'other', name: id ? id[0].toUpperCase() + id.slice(1) : 'That app', url: 'none', a: '#9b5cff' };
const todays = app => S.events.filter(e => isToday(e.t) && (!app || e.app === app));
const usedMins = app => todays(app).filter(e => e.o === 'in').reduce((s, e) => s + (e.m || 0), 0);
const overMins = app => todays(app).filter(e => e.o === 'in' && e.over).reduce((s, e) => s + (e.m || 0), 0);
const leftMins = app => Math.max(0, LIMIT - usedMins(app));
const overCount = app => todays(app).filter(e => e.o === 'in' && e.over).length;
const activeLock = () => S.locks.filter(l => l.e > now()).sort((a, b) => b.e - a.e)[0] || null;
const isMorning = (t = now()) => new Date(t).getHours() < OPEN_HOUR;
const opensAt = () => { const d = new Date(); d.setHours(OPEN_HOUR, 0, 0, 0); return d.getTime(); };
function nopeStreak() {
  let cur = 0, best = 0, run = 0;
  for (const e of [...S.events].sort((a, b) => a.t - b.t)) {
    if (e.o === 'out') { run++; best = Math.max(best, run); } else if (e.o === 'in') run = 0;
  }
  cur = run; return { cur, best };
}
function baseUrl() { return location.href.split(/[?#]/)[0].replace(/index\.html$/, ''); }
function passLink(app, mins) { return `shortcuts://run-shortcut?name=${enc(S.settings.passShortcut)}&input=text&text=${enc(`${mins} ${app.id} ${app.url}`)}`; }
function lockLink(mins) { return `shortcuts://run-shortcut?name=${enc(S.settings.lockShortcut)}&input=text&text=${mins}`; }

/* ======================================================================
   THE DOOR   (?app=instagram)
   ====================================================================== */
let D = null;

function openDoor(appId, test) {
  const a = appOf(appId);
  setAccent(a.a);
  const lock = activeLock();
  const mode = lock ? 'lockdown' : isMorning() ? 'morning' : leftMins(a.id) <= 0 ? 'over' : 'normal';
  // a reload within 30s reuses the same knock
  let ev = test ? null : S.events.find(e => e.app === a.id && (e.o === 'pending' || e.o === 'locked') && now() - e.t < 30000);
  const n = todays(a.id).filter(e => e !== ev).length; // earlier knocks today
  if (!ev) {
    ev = { id: uid(), t: now(), app: a.id, o: (mode === 'lockdown' || mode === 'morning') ? 'locked' : 'pending' };
    if (!test) { S.events.push(ev); save(); }
  }
  D = { a, ev, n, mode, lock, test, step: 'why', reason: null, what: '', mins: 0, chal: [], ci: 0, oc: overCount(a.id), t0: now() };
  D.line = doorLine();
  if (mode === 'lockdown' || mode === 'morning') renderLocked();
  else if (mode === 'normal') walkIn();
  else renderDoor();
}

/* Under the hour: no questions, no hold. Hand out the next chunk and open the app. */
const AUTO_CHUNK = 15;
function walkIn() {
  const { a } = D;
  const mins = Math.min(AUTO_CHUNK, leftMins(a.id));
  const leftAfter = leftMins(a.id) - mins;
  D.mins = mins;
  if (!D.test) { Object.assign(D.ev, { o: 'in', m: mins, auto: true }); save(); }
  const link = passLink(a, mins);
  root.innerHTML = `
  <main class="door">
    <header class="door-top"><span class="mini-sign">Bouncer</span><span class="tag acid">On the list</span></header>
    ${stageHTML('wave', `On the list. Go on. ${leftAfter} min left after this one.`)}
    <p class="kicker">${esc(a.name)} · ${mins}-minute pass</p>
    <h1 class="door-h white">Go on.</h1>
    <div class="meterbox">
      <div class="meterline"><span class="lab">Left after this pass</span><b>${leftAfter} of ${LIMIT} min</b></div>
      <div class="meter"><i style="width:${Math.min(100, (LIMIT - leftAfter) / LIMIT * 100)}%"></i></div>
    </div>
    <div class="actions">
      <a class="btn btn-in" href="${esc(link)}">${a.url === 'none' ? 'Start the pass' : `Open ${esc(a.name)}`}</a>
      <p class="hint">Nothing happened? The <b>${esc(S.settings.passShortcut)}</b> shortcut isn't set up yet. <a class="linkish" href="${baseUrl()}#setup">Setup guide</a></p>
      ${D.test ? '<p class="hint">Test door: nothing here gets saved.</p>' : ''}
    </div>
  </main>`;
  startStage();
  if (!D.test) setTimeout(() => { location.href = link; }, 150);
}

function doorLine() {
  const { a, n, mode } = D;
  const v = { app: a.name, time: clock(), k: n + 1, k1: n + 2, mins: leftMins(a.id) };
  if (mode === 'lockdown') return fill(pick(R.lockdown), { ...v, left: human(D.lock.e - now()) });
  if (mode === 'morning') {
    const mornKnocks = todays(a.id).filter(e => e !== D.ev && isMorning(e.t)).length;
    return fill(mornKnocks >= 1 ? pick(R.morningRepeat) : pick(R.morning), { ...v, k: mornKnocks + 1, k1: mornKnocks + 2 });
  }
  if (mode === 'over') {
    return D.oc === 0 ? fill(pick(R.over), v) : fill(pick(R.overMore), { ...v, k: D.oc + 1, nth: ord(D.oc + 1) });
  }
  const prev = S.events.filter(e => e.app === a.id && e !== D.ev && e.o !== 'pending').sort((x, y) => y.t - x.t)[0];
  const h = new Date().getHours();
  if (prev && prev.o === 'out' && now() - prev.t < 10 * 60000) return fill(R.justLeft, { ago: ago(prev.t) });
  if (prev && prev.o === 'in' && now() - (prev.t + (prev.m || 0) * 60000) < 3 * 60000) return R.justIn;
  if (h >= 23 || h < 4) return fill(R.night, v);
  if (n >= 4) return fill(R.many, v);
  return fill(pick(R.normal), v);
}

const ROPE = `<svg class="rope" viewBox="0 0 340 96" aria-hidden="true">
  <defs><linearGradient id="brass" x1="0" x2="1"><stop offset="0" stop-color="#6d4f17"/><stop offset=".5" stop-color="#f6d58a"/><stop offset="1" stop-color="#6d4f17"/></linearGradient></defs>
  <path d="M30 30 Q170 104 310 30" fill="none" stroke="#c4122f" stroke-width="10" stroke-linecap="round"/>
  <path d="M30 27 Q170 99 310 27" fill="none" stroke="rgba(255,255,255,.28)" stroke-width="2" stroke-linecap="round"/>
  <rect x="21" y="18" width="18" height="76" rx="4" fill="url(#brass)"/><circle cx="30" cy="14" r="11" fill="url(#brass)"/>
  <rect x="301" y="18" width="18" height="76" rx="4" fill="url(#brass)"/><circle cx="310" cy="14" r="11" fill="url(#brass)"/>
</svg>`;

function renderLocked() {
  const { a, mode, lock, n } = D;
  const end = mode === 'lockdown' ? lock.e : opensAt();
  root.innerHTML = `
  <main class="door">
    <header class="door-top"><span class="mini-sign">Bouncer</span><span class="tag red">${mode === 'lockdown' ? 'Lockdown' : 'Closed till 10am'}</span></header>
    ${stageHTML(mode === 'lockdown' ? 'watch' : 'stop', D.line, { rope: true, over: true })}
    <p class="kicker">${esc(a.name)}</p>
    <h1 class="door-h">No.</h1>
    <div class="countdown"><span class="lab">${mode === 'lockdown' ? 'Lockdown ends in' : 'Doors open in'}</span><b id="cd">${hms(end - now())}</b><span class="lab">at ${clock(end)}</span></div>
    <div class="actions">
      <p class="hint">Knock #${n + 1} today. Noted. Swipe up and go do literally anything else.</p>
      <a class="btn ghost" href="${baseUrl()}">Back to the club</a>
    </div>
  </main>`;
  startStage();
  every(() => {
    const ms = end - now();
    const el = $('#cd'); if (el) el.textContent = hms(ms);
    if (ms <= 0) { clearInterval(ticker); location.reload(); }
  });
}

function renderDoor() {
  const { a, mode, n } = D;
  const over = mode === 'over';
  const used = usedMins(a.id), left = leftMins(a.id), om = overMins(a.id);
  root.innerHTML = `
  <main class="door">
    <header class="door-top"><span class="mini-sign">Bouncer</span>
      <span class="tag ${over ? 'red' : ''}">${over ? 'Overtime' : `Knock #${n + 1} today`}</span></header>
    ${stageHTML('idle', D.line, { over })}
    <p class="kicker">${over ? esc(a.name) + ' · after hours' : 'Door check · ' + clock()}</p>
    <h1 class="door-h" style="font-size:min(${Math.min(16, 150 / (a.name.length + 1)).toFixed(1)}vw,112px)">${over ? 'Again?' : esc(a.name) + '?'}</h1>
    <div class="meterbox">
      <div class="meterline"><span class="lab">${over ? 'Hour used up' : 'Left today'}</span>
        <b class="${over ? 'red' : ''}">${over ? (om ? `+${om} min overtime` : `All ${LIMIT} min used`) : `${left} of ${LIMIT} min`}</b></div>
      <div class="meter ${over ? 'over' : ''}"><i style="width:${Math.min(100, used / LIMIT * 100)}%"></i></div>
    </div>
    <section id="step"></section>
    ${D.test ? '<p class="hint">Test door: nothing here gets saved.</p>' : ''}
  </main>`;
  startStage();
  drawStep();
}

function drawStep() {
  const box = $('#step'); if (!box) return;
  const { a, mode } = D;
  const over = mode === 'over';
  const outBtn = (label = "Nah, I'm out") => `<button class="btn btn-out" data-act="out">${label}</button>`;

  if (D.step === 'why') {
    box.innerHTML = `<div class="step">
      <p class="q">Why are you here?</p>
      <div class="chips">${REASONS.map(([k, l]) => `<button class="chip ${D.reason === k ? 'on' : ''}" data-r="${k}">${l}</button>`).join('')}</div>
      <div class="actions">${outBtn()}<button class="btn btn-in" data-act="next" ${D.reason ? '' : 'disabled'}>Let me in →</button></div>
    </div>`;
  }

  if (D.step === 'pass') {
    const left = leftMins(a.id);
    let opts = over ? PASSES : PASSES.filter(p => p <= left);
    if (!over && !opts.length && left > 0) opts = [left];
    const needWhat = D.reason === 'specific';
    box.innerHTML = `<div class="step">
      ${needWhat ? `<p class="q">What exactly are you going in for?</p>
        <input class="inp" id="what" maxlength="80" placeholder="e.g. reply to Ali's story" value="${esc(D.what)}">` : ''}
      <p class="q">${over ? 'Pick your overtime. Bigger pass, harder door.' : 'Pick a pass.'}</p>
      <div class="passes">${opts.map(p => `<button class="pass" data-m="${p}" ${needWhat && !D.what.trim() ? 'disabled' : ''}>
          <b>${p}</b><small>${over ? `${overHold(p)}s hold<br>${overChals(p)} challenge${overChals(p) > 1 ? 's' : ''}` : 'min'}</small></button>`).join('')}</div>
      <div class="actions">${outBtn('Changed my mind. Out.')}</div>
    </div>`;
    const w = $('#what');
    if (w) {
      w.addEventListener('input', () => { D.what = w.value; $$('.pass', box).forEach(b => b.disabled = !w.value.trim()); });
      setTimeout(() => w.focus(), 50);
    }
  }

  if (D.step === 'chal') {
    const c = D.chal[D.ci];
    box.innerHTML = `<div class="step">${chalHTML(c, D.ci, D.chal.length)}<div class="actions">${outBtn('Too much effort. Out.')}</div></div>`;
    bindChal(c);
    const img = $('#spr');
    if (img && img._anim?.base !== 'clip') {
      say(D.ci === 0 ? "Hold on. Let me check the list. You've got homework first." : pick(["Next one. I've got all night.", "Not bad. Keep going.", "Still here? Fine. Next."]), 'clip');
    }
  }

  if (D.step === 'hold') {
    const secs = holdSecs();
    box.innerHTML = `<div class="step">
      <p class="q">${over ? 'Last thing. Hold it. All of it.' : `Hold to go in. ${D.mins}-minute pass.`}</p>
      <button class="hold" id="hold"><span class="hl">Hold ${secs}s to go in</span></button>
      <div class="actions">${outBtn('Let go. Walk away.')}</div>
    </div>`;
    bindHold($('#hold'), secs, grant);
    if ($('#spr')?._anim?.base !== 'idle') say(over ? `Hold it the whole ${secs} seconds. Let go and we start again.` : 'Hold it.', 'idle');
  }

  box.onclick = e => {
    const r = e.target.closest('[data-r]'), act = e.target.closest('[data-act]'), m = e.target.closest('[data-m]');
    if (r) { D.reason = r.dataset.r; drawStep(); }
    else if (act && act.dataset.act === 'out') walkAway();
    else if (act && act.dataset.act === 'next' && D.reason) { D.step = 'pass'; drawStep(); }
    else if (m && !m.disabled) {
      D.mins = +m.dataset.m;
      if (over) { D.chal = makeChals(overChals(D.mins)); D.ci = 0; D.step = 'chal'; }
      else D.step = 'hold';
      drawStep();
    }
  };
}

const overHold = m => Math.min(180, Math.round(OVER_HOLD[m] * (1 + 0.5 * D.oc)));
const overChals = m => Math.min(4, OVER_CH[m] + (D.oc >= 2 ? 1 : 0));
function holdSecs() { return D.mode === 'over' ? overHold(D.mins) : Math.min(15, 5 + 2 * D.n); }

function makeChals(k) {
  return CH_ORDER.slice(0, k).map(t => {
    if (t === 'type') return { t, phrase: `I am choosing ${D.a.name} over my own plans` };
    if (t === 'maths') return { t, x: rnd(13, 49), y: rnd(3, 9) };
    if (t === 'count') return { t, ans: D.n + 1, wrong: 0 };
    return { t };
  });
}
function chalHTML(c, i, k) {
  const head = `<span class="lab">Challenge ${i + 1} of ${k}</span>`;
  if (c.t === 'type') return `${head}<p class="q">Type this, word for word:</p><p class="phrase">${esc(c.phrase)}</p>
    <input class="inp" id="ci" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="Start typing…">`;
  if (c.t === 'maths') return `${head}<p class="q">Quick maths. No calculator, champ.</p><p class="phrase big">${c.x} × ${c.y}</p>
    <input class="inp" id="ci" inputmode="numeric" autocomplete="off" placeholder="Answer">`;
  if (c.t === 'count') return `${head}<p class="q">How many times have you knocked on ${esc(D.a.name)}'s door today? Including now.</p>
    <input class="inp" id="ci" inputmode="numeric" autocomplete="off" placeholder="Be honest">`;
  return `${head}<p class="q">Three slow breaths. Stay on this screen or it restarts.</p>
    <div class="breath"><div class="orb" id="orb"></div><p id="bt">Ready when you are</p></div>
    <button class="btn ghost" id="bstart">Start breathing</button>`;
}
function solved() {
  D.ci++;
  if (D.ci >= D.chal.length) D.step = 'hold';
  setTimeout(drawStep, 350);
}
function bindChal(c) {
  const inp = $('#ci');
  if (inp) {
    inp.addEventListener('paste', e => { e.preventDefault(); toast('Pasting? Really? Type it.'); });
    setTimeout(() => inp.focus(), 50);
    inp.addEventListener('input', () => {
      const v = inp.value;
      let ok = false;
      if (c.t === 'type') ok = norm(v) === norm(c.phrase);
      if (c.t === 'maths') ok = v.trim() !== '' && +v === c.x * c.y;
      if (c.t === 'count') ok = +v === c.ans;
      if (ok) { inp.classList.add('ok'); inp.disabled = true; solved(); }
    });
    inp.addEventListener('keydown', e => {
      if (e.key !== 'Enter' || inp.disabled) return;
      inp.classList.remove('bad'); void inp.offsetWidth; inp.classList.add('bad');
      if (c.t === 'count') { c.wrong++; say(c.wrong >= 2 ? `It's ${c.ans}. ${c.ans}. Let that sink in.` : "Wrong. It's more than you think.", 'wag', 1800); }
      else if (c.t === 'maths') say('Nope. Try again, Einstein.', 'wag', 1800);
      else say('Not quite. Word for word. I can read, you know.', 'wag', 1800);
    });
    return;
  }
  // breathing: 3 cycles of 4s in / 4s out; leaving the screen restarts it
  const orb = $('#orb'), bt = $('#bt'), start = $('#bstart');
  let timer = null;
  const reset = () => { clearInterval(timer); timer = null; orb.classList.remove('in'); bt.textContent = 'Left the screen. Start again.'; start.style.display = ''; };
  start.onclick = () => {
    start.style.display = 'none';
    const t0 = now();
    const step = () => {
      const s = (now() - t0) / 1000;
      if (s >= 24) { clearInterval(timer); document.removeEventListener('visibilitychange', vis); bt.textContent = 'Done. Calmer? No? Shame.'; solved(); return; }
      const phase = Math.floor(s / 4) % 2 === 0;
      orb.classList.toggle('in', phase);
      bt.textContent = `${phase ? 'Breathe in' : 'Breathe out'} · ${Math.floor(s / 8) + 1} of 3`;
    };
    step(); timer = setInterval(step, 200);
  };
  const vis = () => { if (document.hidden && timer) reset(); };
  document.addEventListener('visibilitychange', vis);
}

function bindHold(btn, secs, onDone) {
  const lab = btn.querySelector('.hl'), base = lab.textContent;
  let raf = 0, t0 = 0, done = false;
  const stop = () => { if (done || !t0) return; cancelAnimationFrame(raf); t0 = 0; btn.classList.remove('on'); btn.style.setProperty('--p', 0); lab.textContent = 'Let go? Start again.'; say(pick(LETGO), 'wag', 2000); setTimeout(() => { if (!t0 && !done) lab.textContent = base; }, 1400); };
  const tick = () => {
    const p = Math.min(1, (performance.now() - t0) / (secs * 1000));
    btn.style.setProperty('--p', p);
    lab.textContent = `Keep holding… ${Math.ceil(secs * (1 - p))}s`;
    if (p >= 1) { done = true; btn.classList.remove('on'); lab.textContent = 'Fine.'; onDone(); }
    else raf = requestAnimationFrame(tick);
  };
  btn.addEventListener('pointerdown', e => {
    e.preventDefault(); if (done) return;
    try { btn.setPointerCapture(e.pointerId); } catch (_) {}
    t0 = performance.now(); btn.classList.add('on'); raf = requestAnimationFrame(tick);
  });
  ['pointerup', 'pointercancel'].forEach(ev => btn.addEventListener(ev, stop));
  btn.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
}

function walkAway() {
  if (!D.test) { Object.assign(D.ev, { o: 'out', r: D.reason || undefined }); save(); }
  renderNope();
}

function grant() {
  const over = D.mode === 'over';
  if (!D.test) {
    Object.assign(D.ev, { o: 'in', m: D.mins, r: D.reason || undefined, w: D.what.trim() || undefined, over: over || undefined, hold: holdSecs() });
    save();
  }
  const link = passLink(D.a, D.mins);
  root.innerHTML = `
  <main class="door">
    <header class="door-top"><span class="mini-sign">Bouncer</span><span class="tag ${over ? 'red' : 'acid'}">${over ? 'Overtime' : 'Pass granted'}</span></header>
    ${stageHTML('wave', pick(over ? R.grantOver : R.grant), { over })}
    <p class="kicker">${esc(D.a.name)} · ${D.mins}-minute pass</p>
    <h1 class="door-h white">Fine.</h1>
    ${D.what.trim() ? `<div class="roast"><span class="lab">You said you're going in to</span><p>${esc(D.what.trim())}. Do that. Then leave.</p></div>` : ''}
    <div class="actions">
      <a class="btn btn-in" href="${esc(link)}">${D.a.url === 'none' ? 'Start the pass' : `Open ${esc(D.a.name)}`}</a>
      <p class="hint">Nothing happened? The <b>${esc(S.settings.passShortcut)}</b> shortcut isn't set up yet. <a class="linkish" href="${baseUrl()}#setup">Setup guide</a></p>
    </div>
  </main>`;
  startStage();
  if (!D.test) setTimeout(() => { location.href = link; }, 900);
}

function renderNope() {
  setAccent('#c6ff3d');
  const t = todays();
  const nopes = t.filter(e => e.o === 'out').length;
  const st = nopeStreak();
  root.innerHTML = `
  <main class="door">
    <header class="door-top"><span class="mini-sign">Bouncer</span><span class="tag acid">Walked away</span></header>
    ${stageHTML('clap', pick(R.nope))}
    <h1 class="nope-h">Nope.</h1>
    <div class="trio">
      <div><b>${nopes}</b><span>Nopes today</span></div>
      <div><b>${st.cur}</b><span>In a row</span></div>
      <div><b>~${nopes * 10}</b><span>Min won back</span></div>
    </div>
    <div class="actions">
      <p class="hint">Swipe up to go home. Your phone, your rules.</p>
      <a class="btn ghost" href="${baseUrl()}">See the club</a>
    </div>
  </main>`;
  startStage();
  confetti();
}

function confetti() {
  const box = document.createElement('div'); box.className = 'confetti';
  const cols = ['#c6ff3d', '#3de8ff', '#9b5cff', '#ffb020', '#f4effa'];
  for (let i = 0; i < 60; i++) {
    const p = document.createElement('i');
    p.style.left = Math.random() * 100 + '%';
    p.style.background = pick(cols);
    p.style.animationDuration = (1.8 + Math.random() * 1.8) + 's';
    p.style.animationDelay = (Math.random() * .5) + 's';
    p.style.transform = `rotate(${rnd(0, 180)}deg)`;
    box.appendChild(p);
  }
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 4500);
}

/* ======================================================================
   THE CLUB   (home / stats / lockdown / receipt / setup)
   ====================================================================== */
let armed = null, armT = null;

function renderClub(opts = {}) {
  setAccent('#9b5cff');
  const lock = activeLock(), mor = isMorning();
  const t = todays();
  const nopes = t.filter(e => e.o === 'out').length;
  const ins = t.filter(e => e.o === 'in').length;
  const blocked = t.filter(e => e.o === 'locked').length;
  const st = nopeStreak();
  const d = new Date();

  root.innerHTML = `
  <main class="club">
    <header class="club-head">
      <span class="lab">${d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
      <h1 class="sign">B<span class="o">o</span>uncer</h1>
      <span class="lab">A nightclub for bad habits</span>
    </header>
    ${stageHTML(lock ? 'watch' : 'clip', clubLine(lock, mor, t, nopes), { cls: 'club-stage', over: !!(lock || mor) })}
    <div class="status ${lock || mor ? 'closed' : ''}" id="status"></div>

    <div class="grid">
      <section class="card lock span2 ${opts.flash ? 'flash' : ''}" id="lockdown">${lockCard(lock)}</section>

      <section class="card">
        <h2>Tonight's list</h2>
        <p class="sub">An hour each. Tap one to test its door. Tests aren't saved.</p>
        <div class="list">${Object.keys(APPS).map(appRow).join('')}</div>
      </section>

      <section class="card">
        <h2>Today at the door</h2>
        <p class="sub">${t.length ? `${t.length} knock${t.length > 1 ? 's' : ''} so far.` : 'Nobody at the door yet. Suspicious.'}</p>
        <div class="stats4">
          <div class="stat"><b style="color:var(--acid)">${nopes}</b><span>Nopes</span></div>
          <div class="stat"><b>${ins}</b><span>Let in</span></div>
          <div class="stat"><b style="color:var(--red)">${blocked}</b><span>Turned away</span></div>
          <div class="stat"><b>${st.cur}</b><span>Nope streak</span></div>
        </div>
        <div class="receipt-cta" style="margin-top:16px">
          <span class="dim" style="font-size:14px">Best streak: ${st.best}</span>
          <button class="btn btn-out" id="receipt" style="min-height:48px;font-size:15px">Print today's receipt</button>
        </div>
      </section>

      <section class="card">${weekCard()}</section>
      <section class="card">${heatCard()}</section>
      <section class="card">${excuseCard()}</section>
      <section class="card" id="setup">${setupCard()}</section>
      <section class="card span2">${settingsCard(lock)}</section>
    </div>
  </main>`;

  bindClub();
  startStage();
  const upd = () => {
    const l = activeLock(), m = isMorning();
    const s = $('#status'); if (!s) return;
    s.className = 'status' + (l || m ? ' closed' : '');
    s.innerHTML = l ? `<i class="dot"></i><b>Lockdown</b><span>${hms(l.e - now())} left · ends ${clock(l.e)}</span>`
      : m ? `<i class="dot"></i><b>Club closed</b><span>Opens at 10am · ${hms(opensAt() - now())}</span>`
      : `<i class="dot"></i><b>Club open</b><span>An hour per app. Use it wisely.</span>`;
    const lc = $('#lockcd'); if (lc && l) lc.textContent = hms(l.e - now());
    if (!!l !== !!lock || m !== mor) renderClub();
  };
  upd(); every(upd);
  if (opts.flash) setTimeout(() => $('#lockdown')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
  if (location.hash === '#setup') setTimeout(() => { $('#setup')?.scrollIntoView({ behavior: 'smooth' }); $('#setup details')?.setAttribute('open', ''); }, 100);
}

function clubLine(lock, mor, t, nopes) {
  if (lock) return pick([`Lockdown. I don't care who you are. ${human(lock.e - now())} to go.`, 'You locked the doors yourself. I just stand here looking scary.']);
  if (mor) return pick(["We open at 10. Don't even look at me.", 'Doors are shut. Go be productive or something.']);
  const total = Object.keys(APPS).reduce((s, id) => s + leftMins(id), 0);
  if (!t.length) return pick(["Quiet night. I like it. Keep it that way.", "Nobody's knocked today. Respect."]);
  if (t.some(e => e.over)) return 'Overtime already today? The receipt is going to be brutal.';
  if (nopes) return `${nopes} nope${nopes > 1 ? 's' : ''} today. I'm almost proud.`;
  return pick([`${total} minutes left on the list today. I'm counting.`, "Name? Let me check the list."]);
}

function lockCard(lock) {
  const btns = [1, 2, 3].map(h => `<button class="lockbtn ${armed === h ? 'armed' : ''}" data-lock="${h}">
      <b>${lock ? '+' : ''}${h}h</b><small>${armed === h ? 'Tap again. No escape.' : lock ? 'Add on' : 'Lock all'}</small></button>`).join('');
  return `<h2>Lockdown</h2>
    ${lock ? `<div class="lockcount"><b id="lockcd">${hms(lock.e - now())}</b><span class="dim">Every app is locked till ${clock(lock.e)}. You can add time. You can't take it off.</span></div>`
           : `<p class="sub">Locks every app on the list. No cancel button, no emergency exit, no mercy.${S.settings.useFocus ? ' Your Lockdown Focus switches on too.' : ''}</p>`}
    <div class="lockbtns">${btns}</div>`;
}

function appRow(id) {
  const a = appOf(id);
  const used = usedMins(id), om = overMins(id), left = leftMins(id);
  return `<a class="row" style="--a:${a.a}" href="?app=${id}&test=1">
    <span class="badge">${a.name[0]}</span>
    <span><span class="nm">${a.name}</span><div class="meter ${om ? 'over' : ''}"><i style="width:${Math.min(100, used / LIMIT * 100)}%"></i></div></span>
    <span class="rt ${om ? 'over' : ''}">${om ? `+${om} OT` : `${left} min left`}</span>
  </a>`;
}

function lastDays(n) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - i); out.push(dk(d.getTime())); }
  return out;
}
function weekCard() {
  const days = lastDays(7);
  const data = days.map(k => {
    const ev = S.events.filter(e => dk(e.t) === k);
    return { k, out: ev.filter(e => e.o === 'out').length, in: ev.filter(e => e.o === 'in').length, lk: ev.filter(e => e.o === 'locked').length };
  });
  const max = Math.max(1, ...data.map(d => d.out + d.in + d.lk));
  const total = data.reduce((s, d) => s + d.out + d.in + d.lk, 0);
  const no = data.reduce((s, d) => s + d.out, 0);
  return `<h2>This week</h2>
    <p class="sub">${total ? `${total} knocks. You said no ${Math.round(no / Math.max(1, total - data.reduce((s, d) => s + d.lk, 0)) * 100) || 0}% of the times you had a choice.` : 'No knocks this week yet.'}</p>
    <div class="week">${data.map((d, i) => {
      const h = (d.out + d.in + d.lk) / max * 100;
      const seg = (v, c) => v ? `<i style="height:${v / (d.out + d.in + d.lk) * 100}%;background:${c}"></i>` : '';
      return `<div class="wcol ${i === 6 ? 'today' : ''}"><div class="wbar" style="height:${Math.max(2, h)}%">${seg(d.out, 'var(--acid)')}${seg(d.in, 'var(--violet)')}${seg(d.lk, 'var(--red)')}</div>
        <span>${new Date(d.k + 'T12:00').toLocaleDateString('en-GB', { weekday: 'narrow' })}</span></div>`;
    }).join('')}</div>
    <div class="legend"><span><i style="background:var(--acid)"></i>Nope</span><span><i style="background:var(--violet)"></i>Let in</span><span><i style="background:var(--red)"></i>Turned away</span></div>`;
}
function dangerHour(evs) {
  const hist = Array(24).fill(0);
  evs.forEach(e => hist[new Date(e.t).getHours()]++);
  const max = Math.max(...hist);
  return { hist, max, top: max ? hist.indexOf(max) : -1 };
}
function heatCard() {
  const evs = S.events.filter(e => now() - e.t < 14 * 864e5);
  const { hist, max, top } = dangerHour(evs);
  return `<h2>Danger hour</h2>
    ${top >= 0 ? `<p class="big-line">You crack hardest at <em>${fmtH(top)}–${fmtH(top + 1)}</em>.</p>` : `<p class="sub">Not enough knocks yet. Give it a day.</p>`}
    <p class="sub">When you knock, last 14 days.</p>
    <div class="heat">${hist.map((v, h) => `<i title="${fmtH(h)}: ${v}" style="opacity:${max ? 0.08 + v / max * 0.92 : 0.08}"></i>`).join('')}</div>
    <div class="heatx"><span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>12am</span></div>`;
}
function excuseCard() {
  const evs = S.events.filter(e => e.r && now() - e.t < 30 * 864e5);
  const counts = REASONS.map(([k, l]) => ({ l, n: evs.filter(e => e.r === k).length })).sort((a, b) => b.n - a.n);
  const max = Math.max(1, ...counts.map(c => c.n));
  const top = counts[0];
  return `<h2>Your excuses</h2>
    ${top && top.n ? `<p class="big-line">Number one excuse: <em>${top.l.toLowerCase()}</em>.</p>` : '<p class="sub">No excuses logged yet.</p>'}
    <p class="sub">Last 30 days.</p>
    <div class="bars">${counts.map(c => `<div><span>${c.l}</span><div class="meter"><i style="width:${c.n / max * 100}%"></i></div><b>${c.n}</b></div>`).join('')}</div>`;
}

function setupCard() {
  const base = baseUrl();
  const urls = Object.keys(APPS).map(id => `<div class="url"><code>${esc(base)}?app=${id}</code><button class="copy" data-copy="${esc(base)}?app=${id}">Copy</button></div>`).join('');
  const P = esc(S.settings.passShortcut), L = esc(S.settings.lockShortcut);
  return `<h2>Setup on iPhone</h2>
  <p class="sub">About 15 minutes, once. Everything runs in the Shortcuts app.</p>

  <details class="guide"><summary>0 · Where to keep Bouncer</summary>
    <ol>
      <li>Open this page in <b>Safari</b> and bookmark it. Don't use “Add to Home Screen”: a home-screen app keeps separate data from Safari, so your stats would split in two.</li>
      <li>Want an icon anyway? Make a shortcut with one <b>Open URLs</b> action pointing to <code>${esc(base)}</code> and add <i>that</i> to your home screen.</li>
    </ol>
  </details>

  <details class="guide"><summary>1 · The “${P}” shortcut</summary>
    <ol>
      <li>Shortcuts → <b>+</b> → name it exactly <code>${P}</code>.</li>
      <li>Tap the <b>ⓘ</b> at the bottom, turn on <b>Use with Share Sheet</b> or <b>Receive input</b>, and set it to receive <b>Text</b>. This lets the door hand it the pass.</li>
      <li>Add <b>Split Text</b>: split <i>Shortcut Input</i> by <b>Spaces</b>.</li>
      <li>Add <b>Get Item from List</b> → <b>First Item</b>. Then <b>Set Variable</b> <code>Mins</code>.</li>
      <li>Add <b>Get Item from List</b> (from Split Text) → <b>Item At Index 2</b>. Then <b>Set Variable</b> <code>App</code>.</li>
      <li>Add <b>Get Item from List</b> (from Split Text) → <b>Last Item</b>. Then <b>Set Variable</b> <code>Link</code>.</li>
      <li>Add <b>Adjust Date</b>: <b>Add</b> <code>Mins</code> <b>minutes</b> to <b>Current Date</b>.</li>
      <li>Add <b>Format Date</b>: Adjusted Date, format <b>ISO 8601</b>.</li>
      <li>Add <b>Save File</b>: save Formatted Date, turn <b>Ask Where to Save</b> off, folder <b>Shortcuts</b>, subpath <code>bouncer-</code><i>App</i><code>.txt</code>, <b>Overwrite If File Exists</b> on.</li>
      <li>Add <b>If</b> <code>Link</code> <b>is not</b> <code>none</code> → inside it <b>Open URLs</b> <code>Link</code>.</li>
    </ol>
    <p>The door sends something like <code>10 instagram instagram://</code>: a 10-minute pass for Instagram, then open it.</p>
  </details>

  <details class="guide"><summary>2 · One automation per app</summary>
    <ol>
      <li>Shortcuts → <b>Automation</b> → <b>+</b> → <b>App</b> → choose <b>Instagram</b> → <b>Is Opened</b> → <b>Run Immediately</b> (turn off Notify When Run).</li>
      <li>New blank shortcut, add:
        <ol>
          <li><b>Get File from Folder</b>: folder <b>Shortcuts</b>, path <code>bouncer-instagram.txt</code>, <b>Error If Not Found</b> off.</li>
          <li><b>Get Dates from Input</b> (the File).</li>
          <li><b>If</b> Dates <b>is after</b> <b>Current Date</b> → <b>Stop This Shortcut</b>. End If.</li>
          <li><b>Open URLs</b>: the Instagram door link below.</li>
        </ol></li>
      <li>Repeat for YouTube, TikTok, Snapchat and each game. Swap the file name to <code>bouncer-youtube.txt</code> etc. and use that app's link. Every game uses <code>games</code>.</li>
    </ol>
    <div class="urls">${urls}</div>
    <p>Your pass active? The automation lets you straight in. No pass? Straight to the door.</p>
  </details>

  <details class="guide"><summary>3 · The Lockdown Focus</summary>
    <ol>
      <li>Settings → <b>Focus</b> → <b>+</b> → Custom → name it <b>Lockdown</b>. Silence notifications from the five apps, and under <b>Home Screen</b> hide the page they live on.</li>
      <li>Shortcuts → <b>+</b> → name it exactly <code>${L}</code>, set it to receive <b>Text</b> input (same as step 1).</li>
      <li>Add <b>Adjust Date</b>: Add <i>Shortcut Input</i> <b>minutes</b> to <b>Current Date</b>.</li>
      <li>Add <b>Set Focus</b>: turn <b>Lockdown</b> <b>On</b> <b>Until Time</b> → Adjusted Date.</li>
      <li>Now pressing 1h / 2h / 3h here locks the door <i>and</i> flips the Focus on.</li>
      <li>Going the other way: Automation → <b>+</b> → <b>Focus</b> → Lockdown → <b>When Turning On</b> → Run Immediately → <b>Open URLs</b> <code>${esc(base)}?lock=start</code>. Turning the Focus on from Control Centre brings you here to pick 1h, 2h or 3h.</li>
      <li>Optional: a scheduled Focus till 10am (Settings → Focus → Schedule) to hide the apps every morning. The door is locked till 10 either way.</li>
    </ol>
    <div class="note-box">Turning the Focus off doesn't end a lockdown. The door keeps its own clock.</div>
  </details>`;
}

function settingsCard(lock) {
  const s = S.settings;
  return `<h2>Settings</h2>
  <p class="sub">The rules (10am, an hour each, no escape) aren't up for debate. These are.</p>
  <div class="settings">
    <div class="field"><label for="sp">Pass shortcut name</label><input class="inp" id="sp" value="${esc(s.passShortcut)}"></div>
    <div class="field"><label for="sl">Lockdown shortcut name</label><input class="inp" id="sl" value="${esc(s.lockShortcut)}"></div>
    <label class="toggle">Turn on the Lockdown Focus when I start a lockdown <input type="checkbox" id="sf" ${s.useFocus ? 'checked' : ''}></label>
    <div class="btnrow">
      <button class="btn ghost" id="exp">Back up data</button>
      <label class="btn ghost" for="imp">Restore backup</label><input type="file" id="imp" accept="application/json" hidden>
      ${S.events.length ? '' : '<button class="btn ghost" id="demo">Load a demo week</button>'}
      <button class="btn ghost" id="wipe" ${lock ? 'disabled' : ''}>${lock ? 'No wiping in lockdown' : 'Wipe everything'}</button>
    </div>
  </div>`;
}

function bindClub() {
  $$('[data-lock]').forEach(b => b.onclick = () => {
    const h = +b.dataset.lock;
    if (armed !== h) {
      armed = h; clearTimeout(armT);
      armT = setTimeout(() => { armed = null; const c = $('#lockdown'); if (c) c.innerHTML = lockCard(activeLock()), bindClub(); }, 3500);
      $('#lockdown').innerHTML = lockCard(activeLock()); bindClub(); return;
    }
    armed = null; clearTimeout(armT); startLock(h);
  });
  $$('[data-copy]').forEach(b => b.onclick = async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = 'Copied'; } catch (_) { toast('Copy failed. Long-press the link instead.'); }
  });
  const rb = $('#receipt'); if (rb) rb.onclick = showReceipt;
  const sp = $('#sp'), sl = $('#sl'), sf = $('#sf');
  if (sp) sp.onchange = () => { S.settings.passShortcut = sp.value.trim() || 'Bouncer Pass'; save(); toast('Saved'); };
  if (sl) sl.onchange = () => { S.settings.lockShortcut = sl.value.trim() || 'Bouncer Lockdown'; save(); toast('Saved'); };
  if (sf) sf.onchange = () => { S.settings.useFocus = sf.checked; save(); renderClub(); };
  const exp = $('#exp'); if (exp) exp.onclick = () => {
    const blob = new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `bouncer-backup-${dk(now())}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  const imp = $('#imp'); if (imp) imp.onchange = async () => {
    try {
      const d = JSON.parse(await imp.files[0].text());
      if (!Array.isArray(d.events)) throw 0;
      // never let a restore shorten a running lockdown
      const keep = S.locks.filter(l => l.e > now());
      S = { events: d.events, locks: [...(d.locks || []), ...keep], settings: { ...blank().settings, ...(d.settings || {}) } };
      save(); toast('Restored'); renderClub();
    } catch (_) { toast("That's not a Bouncer backup."); }
  };
  const demo = $('#demo'); if (demo) demo.onclick = () => { loadDemo(); renderClub(); toast('Demo week loaded. Wipe it before real use.'); };
  const wipe = $('#wipe'); if (wipe) wipe.onclick = () => {
    if (activeLock()) return toast('Nice try. Not during lockdown.');
    if (confirm('Wipe all Bouncer data on this browser? This cannot be undone.')) { S = blank(); save(); renderClub(); toast('Wiped. Fresh start.'); }
  };
}

function startLock(h) {
  const cur = activeLock();
  const from = cur ? cur.e : now();
  const end = from + h * 3600e3;
  S.locks.push({ s: now(), e: end, h });
  save();
  if (location.search) history.replaceState(null, '', baseUrl());
  renderClub();
  toast(`Locked till ${clock(end)}. No escape.`);
  if (S.settings.useFocus) {
    const mins = Math.ceil((end - now()) / 60000);
    setTimeout(() => { location.href = lockLink(mins); }, 700);
  }
}

/* ---------------- receipt ---------------- */
function showReceipt() {
  const t = todays();
  const d = new Date();
  const lines = [];
  let totalUsed = 0, totalOT = 0;
  for (const id of Object.keys(APPS)) {
    const ev = t.filter(e => e.app === id); if (!ev.length) continue;
    const a = appOf(id), used = usedMins(id), ot = overMins(id);
    totalUsed += used; totalOT += ot;
    lines.push(`<div class="app">${a.name.toUpperCase()}</div>
      <div class="ln in1"><span>KNOCKS</span><span>${ev.length}</span></div>
      <div class="ln in1"><span>NOPE'D</span><span>${ev.filter(e => e.o === 'out').length}</span></div>
      <div class="ln in1"><span>LET IN</span><span>${ev.filter(e => e.o === 'in').length}</span></div>
      ${ev.some(e => e.o === 'locked') ? `<div class="ln in1"><span>TURNED AWAY</span><span>${ev.filter(e => e.o === 'locked').length}</span></div>` : ''}
      ${ev.some(e => e.o === 'pending') ? `<div class="ln in1"><span>LEFT ME HANGING</span><span>${ev.filter(e => e.o === 'pending').length}</span></div>` : ''}
      <div class="ln in1"><span>TIME USED</span><span>${Math.min(used - ot, LIMIT)}/${LIMIT} MIN</span></div>
      ${ot ? `<div class="ln in1 rd"><span>OVERTIME ×${ev.filter(e => e.over).length}</span><span>+${ot} MIN</span></div>` : ''}`);
  }
  const nopes = t.filter(e => e.o === 'out').length, ins = t.filter(e => e.o === 'in').length;
  const locksToday = S.locks.filter(l => isToday(l.s));
  const reasons = REASONS.map(([k, l]) => ({ l, n: t.filter(e => e.r === k).length })).sort((a, b) => b.n - a.n);
  const { top } = dangerHour(t);
  const specific = t.filter(e => e.w).map(e => e.w);
  let roast;
  if (!t.length) roast = 'Zero knocks. Monk mode. Or you forgot your phone.';
  else if (totalOT) roast = 'Overtime detected. Management is disappointed.';
  else if (nopes > ins) roast = 'More nopes than yeses. Rare. Frame this.';
  else if (ins && !nopes) roast = "You didn't say no once. Not once.";
  else roast = 'Thank you for scrolling. Please don\'t come again.';
  const bars = Array.from({ length: 46 }, () => `<i style="width:${pick([1, 1, 2, 3])}px;margin-right:${pick([1, 2, 2, 3])}px"></i>`).join('');

  const ov = document.createElement('div');
  ov.className = 'overlay';
  ov.innerHTML = `<img class="receipt-guy" id="rguy" alt="The bouncer writing your receipt"><div class="slot"></div>
  <article class="receipt" aria-label="Today's receipt">
    <h3>BOUNCER</h3>
    <div class="c">A NIGHTCLUB FOR BAD HABITS<br>EST. THE DAY YOU GOT SICK OF IT</div>
    <div class="hr"></div>
    <div class="ln"><span>${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</span><span>${clock().toUpperCase()}</span></div>
    <div class="ln"><span>GUEST</span><span>YOU (AGAIN)</span></div>
    <div class="ln"><span>RECEIPT NO.</span><span>${String(t.length * 7919 % 100000).padStart(5, '0')}</span></div>
    <div class="hr"></div>
    ${lines.join('') || '<div class="c">NO KNOCKS RECORDED</div>'}
    <div class="hr"></div>
    <div class="ln"><span>LOCKDOWNS STARTED</span><span>${locksToday.length}${locksToday.length ? ` (${locksToday.reduce((s, l) => s + (l.h || 0), 0)}H)` : ''}</span></div>
    <div class="ln"><span>TOP EXCUSE</span><span>${reasons[0].n ? reasons[0].l.toUpperCase() : '—'}</span></div>
    <div class="ln"><span>DANGER HOUR</span><span>${top >= 0 ? `${fmtH(top)}-${fmtH(top + 1)}`.toUpperCase() : '—'}</span></div>
    ${specific.length ? `<div class="ln"><span>"JUST QUICKLY"</span><span>×${specific.length}</span></div>` : ''}
    <div class="ln"><span>TIME WON BACK</span><span>~${nopes * 10} MIN</span></div>
    <div class="hr2"></div>
    <div class="ln tot"><span>TOTAL SCREEN TAX</span><span>${totalUsed} MIN</span></div>
    ${totalOT ? `<div class="ln tot rd"><span>OF WHICH OVERTIME</span><span>${totalOT} MIN</span></div>` : ''}
    <div class="hr2"></div>
    <p class="roastline">${esc(roast)}</p>
    <div class="barcode">${bars}</div>
    <div class="c">NO REFUNDS ON TIME SPENT</div>
  </article>
  <div class="receipt-actions"><button class="btn ghost" id="rclose">Close</button></div>`;
  document.body.appendChild(ov);
  const guy = $('#rguy');
  pose(guy, 'write');
  ov.addEventListener('click', e => { if (e.target === ov || e.target.id === 'rclose') { clearInterval(guy._anim?.t); ov.remove(); } });
}

/* ---------------- demo data ---------------- */
function loadDemo() {
  const ids = Object.keys(APPS), outs = ['out', 'out', 'in', 'in', 'in', 'locked', 'pending'];
  for (let day = 6; day >= 0; day--) {
    const k = rnd(5, 14);
    for (let i = 0; i < k; i++) {
      const d = new Date(); d.setDate(d.getDate() - day);
      const hr = pick([8, 9, 13, 16, 19, 21, 22, 22, 23, 23, 0]);
      d.setHours(hr, rnd(0, 59), 0, 0);
      if (d.getTime() > now()) continue;
      let o = hr < 10 ? 'locked' : pick(outs);
      if (o === 'locked' && hr >= 10) o = 'out';
      const e = { id: uid(), t: d.getTime(), app: pick(ids), o };
      if (o === 'in' || o === 'out') e.r = pick(REASONS)[0];
      if (o === 'in') { e.m = pick(PASSES); if (Math.random() < .15) e.over = true; }
      S.events.push(e);
    }
  }
  save();
}

/* ---------------- router ---------------- */
(function route() {
  const q = new URLSearchParams(location.search);
  const app = q.get('app');
  if (app) return openDoor(app.toLowerCase(), q.get('test') === '1');
  if (q.get('lock') === 'start') return renderClub({ flash: true });
  renderClub();
})();
