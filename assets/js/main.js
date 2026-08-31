/* ==========================================================================
   Undangan pernikahan
   Everything you are likely to change lives in CONFIG below.
   ========================================================================== */

const CONFIG = {
  /* --- the couple ------------------------------------------------------ */
  docTitle:     'Lifa & Syauqi — Undangan Pernikahan',
  coupleShort:  'Lifa & Syauqi',
  brideShort:   'Lifa',
  groomShort:   'Syauqi',
  brideName:    'Nur Kholifah',
  brideParents: 'Putri dari Bapak Muhamad Yusuf & Ibu Siti Nurmi',
  groomName:    'Ahmad Syauqi',
  groomParents: 'Putra dari Bapak Rendra Farid & Ibu Lindawaty',

  /* --- the day --------------------------------------------------------- */
  /* Bima is WITA, so the offset is +08:00 — getting this wrong would skew
     the countdown and the calendar entry by an hour for every guest. */
  resepsiStart: '2026-12-12T14:00:00+08:00',
  resepsiEnd:   '2026-12-12T17:00:00+08:00',

  dateLong:     'Sabtu, 12 Desember 2026',
  dow:          'Sabtu',
  day:          '12',
  monthYear:    'Desember 2026',
  resepsiTime:  'Pukul 14.00 WITA – selesai',

  /* --- the venue ------------------------------------------------------- */
  venueName:    'Gedung Seni dan Budaya Kota Bima',
  venueAddress: 'Kota Bima, Nusa Tenggara Barat',
  mapsUrl:      'https://maps.app.goo.gl/JfqBHkEiUmhTtsmW8',

  /* --- digital envelope ------------------------------------------------ */
  accounts: [
    { bank: 'Bank BCA',     number: '389-064-4762',    holder: 'Ahmad Syauqi' },
    { bank: 'Bank Mandiri', number: '142-00-2067680-4', holder: 'Nur Kholifah' },
  ],

  /* --- background music ------------------------------------------------ */
  /* drop an mp3 into assets/audio/ and name it here; empty hides the button */
  audioSrc: '',
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
  if (CONFIG.docTitle) document.title = CONFIG.docTitle;
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
    btn.className = 'btn btn--ghost';
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
    /* an async step's rejection would otherwise escape the try block */
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
  attempt('config', applyConfig);
  attempt('guest', applyGuest);
  attempt('accounts', buildAccounts);
  attempt('countdown', startCountdown);
  attempt('calendar', wireCalendar);
  attempt('wishes', wireWishForm);
  attempt('reveal', wireReveal);

  const startMusic = attempt('music', wireMusic);
  attempt('cover', () => wireCover(startMusic));
});
