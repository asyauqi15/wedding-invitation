/* ==========================================================================
   Undangan pernikahan

   The invitation's details are NOT in this file. GitHub Pages is a static
   host, so a password compared in JavaScript would protect nothing — the
   source is public. Instead every identifying field lives encrypted in
   assets/data/invitation.enc and is decrypted in the browser with a key
   derived from the guest's password. Edit content.json and re-run
   tools/lock.py to change them.
   ========================================================================== */

const CONFIG = {
  /* the locked payload is merged in here once the password checks out */
  audioSrc: '',            /* drop an mp3 in assets/audio/ and name it here */
  dataUrl: 'assets/data/invitation.enc',
  storeKey: 'undangan.unlocked.v1',
};

/* ========================================================================= */

const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* Text set from CONFIG or a guest name is user-controlled, so it always goes
   in as text — never as markup. */
const setText = (el, value) => { if (el) el.textContent = value; };

/* --------------------------------------------------------------- config --- */

function applyConfig() {
  $$('[data-field]').forEach((el) => {
    const value = CONFIG[el.dataset.field];
    if (typeof value === 'string' && value) setText(el, value);
  });

  const map = $('#mapBtn');
  if (map && CONFIG.mapsUrl) map.href = CONFIG.mapsUrl;
}

/* ----------------------------------------------------------------- gate --- */

const enc = new TextEncoder();
const dec = new TextDecoder();

function fromB64(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

/* PBKDF2 params travel with the payload so the two sides cannot drift apart */
async function unlock(payload, password) {
  const base = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey'],
  );
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: fromB64(payload.salt), iterations: payload.iter, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  );
  /* a wrong password fails GCM's auth tag here rather than yielding garbage */
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromB64(payload.iv) }, key, fromB64(payload.ct),
  );
  return JSON.parse(dec.decode(plain));
}

function applyContent(content) {
  Object.assign(CONFIG, content);
  if (content.docTitle) document.title = content.docTitle;
  applyConfig();
  attempt('accounts', buildAccounts);
  attempt('countdown', startCountdown);
}

async function wireGate() {
  const gate = $('#gate');
  const form = $('#gateForm');
  const field = $('#gateKey');
  const note = $('#gateNote');
  const btn = $('#gateBtn');
  if (!gate || !form) return;

  if (!window.crypto || !crypto.subtle) {
    setText(note, 'Peramban ini tidak mendukung pembuka undangan. '
                + 'Coba buka lewat tautan https.');
    return;
  }

  let payload;
  try {
    const res = await fetch(CONFIG.dataUrl, { cache: 'no-cache' });
    if (!res.ok) throw new Error(res.status);
    payload = await res.json();
  } catch {
    setText(note, 'Gagal memuat undangan. Periksa koneksi Anda.');
    return;
  }

  const open = (content) => {
    applyContent(content);
    gate.classList.add('is-done');
    document.body.classList.add('is-unlocked');
    setTimeout(() => { gate.hidden = true; }, 700);
  };

  const tryKey = async (password, { quiet = false } = {}) => {
    if (!password) return false;
    btn.disabled = true;
    setText(note, 'Membuka…');
    try {
      const content = await unlock(payload, password);
      try { localStorage.setItem(CONFIG.storeKey, password); } catch { /* private mode */ }
      open(content);
      return true;
    } catch {
      setText(note, quiet ? '' : 'Kata sandi salah. Silakan coba lagi.');
      if (!quiet) field.select();
      return false;
    } finally {
      btn.disabled = false;
    }
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    tryKey(field.value.trim());
  });

  /* a shared link can carry the password: index.html?to=Nama#k=sandi */
  const hashKey = new URLSearchParams(location.hash.slice(1)).get('k');
  if (hashKey && await tryKey(hashKey, { quiet: true })) {
    history.replaceState(null, '', location.pathname + location.search);
    return;
  }

  /* a guest who already unlocked on this device does not get asked again */
  let saved = null;
  try { saved = localStorage.getItem(CONFIG.storeKey); } catch { /* ignore */ }
  if (saved) await tryKey(saved, { quiet: true });
}

/* ---------------------------------------------------------------- guest --- */

function applyGuest() {
  const params = new URLSearchParams(location.search);
  const raw = params.get('to') || params.get('kepada') || '';
  const name = raw.trim().replace(/\s+/g, ' ').slice(0, 80);
  if (name) setText($('#guestName'), name);
}

/* -------------------------------------------------------------- accounts --- */

function buildAccounts() {
  const list = $('#accounts');
  if (!list) return;

  CONFIG.accounts.forEach((acc) => {
    const li = document.createElement('li');

    const bank = document.createElement('span');
    bank.className = 'acc__bank';
    bank.textContent = acc.bank;

    const no = document.createElement('span');
    no.className = 'acc__no';
    no.textContent = acc.number;

    const holder = document.createElement('span');
    holder.className = 'acc__name';
    holder.textContent = `a.n. ${acc.holder}`;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn--outline';
    btn.textContent = 'Salin Nomor';
    btn.addEventListener('click', async () => {
      const done = await copyText(acc.number);
      btn.textContent = done ? 'Tersalin ✓' : 'Gagal menyalin';
      setTimeout(() => { btn.textContent = 'Salin Nomor'; }, 1800);
    });

    li.append(bank, no, holder, btn);
    list.append(li);
  });
}

async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    /* clipboard API needs a secure context; fall back to a hidden field */
    try {
      const ta = document.createElement('textarea');
      ta.value = value;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
      document.body.append(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

/* ------------------------------------------------------------- countdown --- */

function startCountdown() {
  const root = $('#countdown');
  if (!root) return;

  const target = new Date(CONFIG.resepsiStart).getTime();
  if (Number.isNaN(target)) return;

  const cells = {
    d: $('[data-cd="d"]', root),
    h: $('[data-cd="h"]', root),
    m: $('[data-cd="m"]', root),
    s: $('[data-cd="s"]', root),
  };

  /* declared up front: the first tick runs immediately, and on a date that has
     already passed it clears the interval on that very first call */
  let timer = null;

  const tick = () => {
    const left = Math.max(target - Date.now(), 0);
    const total = Math.floor(left / 1000);
    setText(cells.d, String(Math.floor(total / 86400)));
    setText(cells.h, String(Math.floor(total / 3600) % 24));
    setText(cells.m, String(Math.floor(total / 60) % 60));
    setText(cells.s, String(total % 60));
    if (left === 0 && timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };

  tick();
  if (Date.now() < target) timer = setInterval(tick, 1000);
}

/* -------------------------------------------------------------- calendar --- */

function wireCalendar() {
  const btn = $('#calBtn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const stamp = (iso) => new Date(iso).toISOString().replace(/[-:]|\.\d{3}/g, '');
    const url = new URL('https://calendar.google.com/calendar/render');
    url.searchParams.set('action', 'TEMPLATE');
    url.searchParams.set('text', `Pernikahan ${CONFIG.coupleShort}`);
    url.searchParams.set('dates', `${stamp(CONFIG.resepsiStart)}/${stamp(CONFIG.resepsiEnd)}`);
    url.searchParams.set('details', `Resepsi Pernikahan ${CONFIG.resepsiTime}`);
    url.searchParams.set('location', `${CONFIG.venueName}, ${CONFIG.venueAddress}`);
    window.open(url.toString(), '_blank', 'noopener');
  });
}

/* ---------------------------------------------------------------- wishes --- */

const WISH_KEY = 'undangan.wishes.v1';
const ATTEND_LABEL = {
  hadir: 'Insya Allah hadir',
  ragu:  'Masih ragu',
  absen: 'Berhalangan hadir',
};

function readWishes() {
  try {
    const raw = localStorage.getItem(WISH_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeWishes(list) {
  try {
    localStorage.setItem(WISH_KEY, JSON.stringify(list.slice(-200)));
    return true;
  } catch {
    /* private windows and blocked site data both land here */
    return false;
  }
}

function renderWishes(list) {
  const root = $('#wishList');
  if (!root) return;
  root.textContent = '';

  if (!list.length) {
    const li = document.createElement('li');
    li.className = 'is-empty';
    li.textContent = 'Belum ada ucapan. Jadilah yang pertama.';
    root.append(li);
    return;
  }

  list.slice().reverse().forEach((w) => {
    const li = document.createElement('li');

    const head = document.createElement('div');
    head.className = 'w__head';

    const name = document.createElement('span');
    name.className = 'w__name';
    name.textContent = w.name;

    const tag = document.createElement('span');
    tag.className = 'w__tag';
    tag.textContent = ATTEND_LABEL[w.attend] || w.attend;

    head.append(name, tag);

    const msg = document.createElement('p');
    msg.className = 'w__msg';
    msg.textContent = w.message;

    const when = document.createElement('span');
    when.className = 'w__when';
    when.textContent = formatWhen(w.at);

    li.append(head, msg, when);
    root.append(li);
  });
}

function formatWhen(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function wireWishForm() {
  const form = $('#wishForm');
  if (!form) return;
  const note = $('#wishNote');

  renderWishes(readWishes());

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const fields = [$('#wName'), $('#wAttend'), $('#wMsg')];
    fields.forEach((f) => f.classList.remove('is-invalid'));

    const missing = fields.filter((f) => !f.value.trim());
    if (missing.length) {
      missing.forEach((f) => f.classList.add('is-invalid'));
      setText(note, 'Mohon lengkapi nama, kehadiran dan ucapan.');
      missing[0].focus();
      return;
    }

    const entry = {
      name: $('#wName').value.trim().slice(0, 60),
      attend: $('#wAttend').value,
      message: $('#wMsg').value.trim().slice(0, 500),
      at: new Date().toISOString(),
    };

    const list = readWishes();
    list.push(entry);
    const saved = writeWishes(list);
    renderWishes(list);

    form.reset();
    setText(note, saved
      ? 'Terima kasih atas ucapan dan doanya.'
      : 'Ucapan tampil di halaman ini, namun tidak dapat disimpan di peramban Anda.');
    setTimeout(() => setText(note, ''), 5000);
  });
}

/* ----------------------------------------------------------------- music --- */

function wireMusic() {
  const btn = $('#musicBtn');
  const audio = $('#audio');
  if (!btn || !audio || !CONFIG.audioSrc) return;

  audio.src = CONFIG.audioSrc;

  const setState = (playing) => {
    btn.setAttribute('aria-pressed', String(playing));
    btn.setAttribute('aria-label', playing ? 'Jeda musik' : 'Putar musik');
  };

  btn.addEventListener('click', async () => {
    if (audio.paused) {
      try { await audio.play(); setState(true); } catch { setState(false); }
    } else {
      audio.pause();
      setState(false);
    }
  });

  audio.addEventListener('ended', () => setState(false));

  return async () => {
    btn.hidden = false;
    /* browsers only allow this because it follows the guest's own click */
    try { await audio.play(); setState(true); } catch { setState(false); }
  };
}

/* ---------------------------------------------------------------- petals --- */

const PETAL_COUNT = 14;

function wirePetals() {
  const field = $('#petals');
  if (!field) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const frag = document.createDocumentFragment();
  for (let i = 0; i < PETAL_COUNT; i += 1) {
    const p = document.createElement('span');
    const size = 6 + Math.random() * 8;
    p.className = 'petal';
    p.style.left = `${Math.random() * 100}%`;
    p.style.width = `${size}px`;
    p.style.height = `${size * 1.15}px`;
    p.style.animationDuration = `${16 + Math.random() * 16}s`;
    /* negative delay starts each petal mid-fall, so none of them queue up */
    p.style.animationDelay = `${-Math.random() * 28}s`;
    p.style.setProperty('--dx', `${(Math.random() * 18 - 9).toFixed(1)}vw`);
    p.style.setProperty('--rot', `${Math.round(220 + Math.random() * 500)}deg`);
    frag.append(p);
  }
  field.append(frag);
}

/* ---------------------------------------------------------------- reveal --- */

function wireReveal() {
  const items = $$('[data-reveal]');
  if (!items.length) return;

  /* siblings inside one section arrive in sequence rather than all at once */
  $$('.sec').forEach((sec) => {
    $$('[data-reveal]', sec).forEach((el, i) => {
      el.style.setProperty('--d', `${Math.min(i, 5) * 110}ms`);
    });
  });

  if (!('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-in'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

  items.forEach((el) => io.observe(el));
}

/* ------------------------------------------------------------------ open --- */

function wireCover(startMusic) {
  const btn = $('#openBtn');
  const cover = $('#cover');
  const invite = $('#invite');
  if (!btn || !cover || !invite) return;

  btn.addEventListener('click', () => {
    document.body.classList.remove('is-locked');
    document.body.classList.add('is-open');
    invite.setAttribute('aria-hidden', 'false');
    window.scrollTo({ top: 0, behavior: 'auto' });

    if (startMusic) startMusic();

    /* keep the cover out of the tab order once it has faded; the timer is the
       fallback for when transitionend does not fire, as with reduced motion */
    let retired = false;
    const retire = () => {
      if (retired) return;
      retired = true;
      cover.hidden = true;
    };
    cover.addEventListener('transitionend', retire, { once: true });
    setTimeout(retire, 1900);
  }, { once: true });
}

/* ------------------------------------------------------------------ boot --- */

/* Each widget is wired in isolation: a guest should still be able to open the
   invitation even if one section throws. */
function attempt(label, fn) {
  try {
    const result = fn();
    /* wireGate is async, so a rejection would escape the try block */
    if (result && typeof result.catch === 'function') {
      result.catch((err) => console.error(`[undangan] ${label} gagal:`, err));
    }
    return result;
  } catch (err) {
    console.error(`[undangan] ${label} gagal:`, err);
    return undefined;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  attempt('guest', applyGuest);
  attempt('calendar', wireCalendar);
  attempt('wishes', wireWishForm);
  attempt('reveal', wireReveal);
  attempt('petals', wirePetals);

  const startMusic = attempt('music', wireMusic);
  attempt('cover', () => wireCover(startMusic));
  attempt('gate', wireGate);
});
