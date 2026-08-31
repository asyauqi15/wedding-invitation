# Undangan Pernikahan

A single-page online wedding invitation in HTML, CSS and vanilla JavaScript.
No build step, no framework, no backend — it runs as static files.

```
index.html                markup for every section
assets/css/style.css      the whole design system
assets/js/main.js         CONFIG block + behaviour
assets/img/               artwork
assets/audio/             drop a background track here (optional)
tools/prepare_assets.py   re-stages artwork from its source folder
```

## Running it locally

```sh
python -m http.server 8000
```

then visit <http://127.0.0.1:8000/>.

Opening `index.html` directly works too, but a server is worth using:
`navigator.clipboard` (the **Salin Nomor** buttons) needs a secure context and
falls back to a legacy copy over `file://`.

## Deploying to GitHub Pages

The site is plain static files, so no workflow is needed:

1. Push the repo to GitHub.
2. **Settings → Pages → Source: Deploy from a branch**, branch `main`, folder
   `/ (root)`.
3. The site appears at `https://<user>.github.io/<repo>/` after a minute.

`.nojekyll` is committed so Pages serves the files as-is.

Two things learned the hard way:

- **Pages from a private repository needs GitHub Pro.** On the free plan,
  flipping the repo to private unpublishes the site — and it *deletes the Pages
  configuration*, so switching back to public does not restore it. Pages has to
  be enabled again.
- The invitation is fully public: names, date, venue and the bank account
  numbers are all in the page source. It sends `noindex, nofollow` so it stays
  out of search results, but anyone with the URL can read it.

## Changing the details

Everything guests see comes from the `CONFIG` object at the top of
`assets/js/main.js`. The same text is also written into `index.html`, so the
page still reads correctly with JavaScript switched off; `CONFIG` overwrites any
element carrying a matching `data-field`. Two things are worth knowing:

- **The date is stored twice.** `resepsiStart` / `resepsiEnd` are ISO 8601 and
  drive the countdown and the calendar button; `dateLong` / `dow` / `day` /
  `monthYear` / `resepsiTime` are the human-readable strings. Change both.
- **The offset is `+08:00`, not `+07:00`.** The venue is in Bima, which is
  WITA. Getting this wrong skews the countdown and the calendar entry by an
  hour for every guest.

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
| warm base gradient | -4 | `body::before`, parchment rather than flat cream |
| drifting glows | -3 | three blurred `.bg__glow` circles on 26–38s loops |
| damask lattice | -2 | `body::after`, an inline SVG tile at 6% opacity |
| grain + warm edge | -3 | `.bg::after`, multiplied noise that kills banding |

Petals are built by `wirePetals()` rather than markup, so they can be skipped
entirely. Each gets a randomised column, size, duration and a **negative**
animation delay, which starts it mid-fall — otherwise all fourteen would drop
in formation on load.

Motion is kept slow on purpose: reveals fade up with a 110ms stagger between
siblings in a section, the script headings carry an 11s sheen, sprays sway, and
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

The burgundy envelope, floral spray, paper stock and icons come from the
ChungDoi *Minimalism Dark Red* template, staged from a local download with
`python tools/prepare_assets.py` (set `CHUNGDOI_DIR` if the folder moved).
**Check your licence with ChungDoi before publishing this publicly** — a
GitHub Pages site is public.

`venue.webp` is a rendering of the real venue, not template art. It arrives on
a dark vignette, so `tools/make_venue.py` mattes the building out and fades the
plaza into the paper:

```sh
python tools/make_venue.py "path/to/render.png"
```

It is left out of `prepare_assets.py` on purpose — staging it from the template
folder again would overwrite the real venue.

Typefaces — Alex Brush, Cormorant Garamond, Playfair Display and Amiri — are
loaded from Google Fonts, so no font files are redistributed here.

## Browser support

Current Chrome, Edge, Firefox and Safari. Uses `IntersectionObserver`,
`:has()`, `text-wrap`, `svh` units and `overflow: clip` — all of which degrade
to a plain, readable page on anything older. `prefers-reduced-motion` is
honoured throughout.
