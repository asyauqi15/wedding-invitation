# Undangan Pernikahan

A single-page online wedding invitation in HTML, CSS and vanilla JavaScript.
No build step, no framework, no backend — it runs as static files.

The couple's details are **not in this repository**. They live encrypted in
`assets/data/invitation.enc` and are decrypted in the guest's browser with a
password. See [Password](#password) below.

```
index.html                  markup for every section
assets/css/style.css        the whole design system
assets/js/main.js           behaviour, including the decryption gate
assets/data/invitation.enc  encrypted details (committed)
assets/img/                 artwork
assets/audio/               drop a background track here (optional)
content.json                plaintext details — GIT-IGNORED, never commit
tools/lock.py               encrypts content.json -> invitation.enc
tools/prepare_assets.py     re-stages artwork from its source folder
```

## Running it locally

```sh
python -m http.server 8000
```

then visit <http://127.0.0.1:8000/>.

**A server is required, not optional.** `crypto.subtle` — which does the
decryption — is only available in a secure context. `https://` and
`http://localhost` qualify; opening `index.html` as a `file://` URL does not,
and the gate will refuse to unlock.

## Password

GitHub Pages serves files and runs no code of its own, so a password compared
in JavaScript would protect nothing — anyone can read the page source. This
project encrypts instead:

- `content.json` (plaintext, git-ignored) holds the real names, parents, date,
  venue and bank accounts.
- `tools/lock.py` encrypts it with **AES-256-GCM**, using a key derived from
  the password with **PBKDF2-HMAC-SHA256, 250 000 iterations** and a random
  16-byte salt.
- The browser derives the same key with WebCrypto and decrypts in place. A
  wrong password fails GCM's authentication tag, so it is rejected outright
  rather than yielding plausible nonsense.

Until someone types the password, the served HTML contains `•••` in place of
every name, date and address, and the payload is indistinguishable from noise.

### Changing the password or the details

```sh
python tools/lock.py --password "your-new-password"
```

Edit `content.json` first if the details changed, then commit the regenerated
`assets/data/invitation.enc`. **Do not commit `content.json`** — `.gitignore`
covers it, so leave that entry alone.

### Sharing with guests

Either tell guests the password, or put it in the link so it opens directly:

```
https://<user>.github.io/<repo>/?to=Bapak%20Andi%20Wijaya#k=your-password
```

`?to=` sets the name on the cover; `#k=` unlocks silently and is then stripped
from the address bar. A successful unlock is remembered in `localStorage`, so a
guest is not asked twice on the same device.

Anyone holding that link holds the password — it is a soft gate for a private
launch, not per-guest access control.

## Deploying to GitHub Pages

The site is plain static files, so no workflow is needed:

1. Push the repo to GitHub.
2. **Settings → Pages → Source: Deploy from a branch**, branch `main`, folder
   `/ (root)`.
3. The site appears at `https://<user>.github.io/<repo>/` after a minute.

`.nojekyll` is committed so Pages serves the files as-is.

Note that **GitHub Pages sites are public on the free plan**, even when served
from a private repository. That is exactly why the content is encrypted rather
than merely hidden. The page also sends `noindex, nofollow` so it stays out of
search results.

## Changing the details

Everything guests see comes from `content.json`. Two things are worth knowing:

- **The date is stored twice.** `resepsiStart` / `resepsiEnd` are ISO 8601 with
  the `+07:00` offset and drive the countdown and the calendar button.
  `dateLong` / `dow` / `day` / `monthYear` / `resepsiTime` are the
  human-readable strings. Change both.
- **The bank account numbers are placeholders.** Replace them before sending
  the invitation out.

Non-private settings — `audioSrc`, `dataUrl`, `storeKey` — stay in the `CONFIG`
object at the top of `assets/js/main.js`.

### Background music

Drop an mp3 into `assets/audio/` and point `audioSrc` at it. The floating
control only appears once that is set, and playback starts from the guest's own
tap on **Buka Undangan**, which is what browser autoplay rules require.

## The cover envelope

The cover is a four-layer stack, matching how the printed piece assembles:

| layer | z | asset |
|---|---|---|
| open envelope, lace flap raised | 1 | `envelope-open.webp` |
| florals, tucked behind the card | 2 | `floral-spray.webp` |
| the invitation card itself | 3 | `.env__card`, paper texture + live text |
| front pocket with the wax seal | 4 | `envelope-flap.webp` |

Both envelope images are 1013px wide and bottom-aligned, so they register
without any nudging. **The front pocket's top edge dips to 64.6% of the
envelope height at the centre.** The card's foot sits at 73% so its lower edge
stays buried, and `.env__card` carries a large bottom padding so the last line
of type still clears 64.6%. Change the card's type size and you may need to
retune that padding — the date line is the one that gets swallowed.

## Atmosphere and motion

The page is deliberately not a flat wash. Four layers sit behind the content:

| layer | z | what it does |
|---|---|---|
| warm base gradient | -4 | `body::before`, plum rather than near-black |
| drifting glows | -3 | three blurred `.bg__glow` circles on 26–38s loops |
| damask lattice | -2 | `body::after`, an inline SVG tile at 7.5% opacity |
| grain + vignette | -3 | `.bg::after`, soft-light noise that kills banding |

Petals are built by `wirePetals()` rather than markup, so they can be skipped
entirely. Each gets a randomised column, size, duration and a **negative**
animation delay, which starts it mid-fall — otherwise all fourteen would drop
in formation on load.

Motion is kept slow on purpose: reveals fade up with a 110ms stagger between
siblings in a section, gilt lettering carries an 11s sheen, sprays sway, and
opening the cover lifts the card out of the envelope before the cover clears.

**Everything ambient is off under `prefers-reduced-motion: reduce`** — no
petals, no glows, no sheen, and reveals render in place.

### Tuning it down

- fewer petals: `PETAL_COUNT` in `assets/js/main.js`
- calmer background: lower the `.bg__glow` opacity, or `body::after` opacity
- no stagger: drop the `--d` loop in `wireReveal()`

## Ucapan & RSVP

Wishes are kept in the visitor's own browser via `localStorage`. Each guest
sees only what they themselves wrote, and nothing reaches you.

**To actually collect RSVPs you need a backend.** The submit handler in
`wireWishForm()` is the single place to POST to a Google Apps Script endpoint,
a form service, or your own API.

## Artwork

The burgundy envelope, floral spray, paper stock, venue engraving and icons
come from the ChungDoi *Minimalism Dark Red* template, staged from a local
download with `python tools/prepare_assets.py` (set `CHUNGDOI_DIR` if the
folder moved). **Check your licence with ChungDoi before publishing this
publicly** — a GitHub Pages site is public.

Typefaces — Alex Brush, Cormorant Garamond, Playfair Display and Amiri — are
loaded from Google Fonts, so no font files are redistributed here.

## Browser support

Current Chrome, Edge, Firefox and Safari. Uses `crypto.subtle`,
`IntersectionObserver`, `:has()`, `text-wrap`, `svh` units and `overflow: clip`.
Everything except `crypto.subtle` degrades to a plain, readable page on older
browsers; without it the invitation cannot be unlocked at all.
