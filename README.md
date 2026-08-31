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
tools/make_venue.py       mattes a venue photo/render onto the stationery
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

## The design system

*Old world botanical × elegant Indonesian wedding × Bima heritage.*

Ivory is the ground, olive carries the botanical half of the identity, burgundy
is the romantic accent, and gold is hairlines only. The palette lives in one
`:root` block in `assets/css/style.css`; no rule hardcodes a colour twice.

| token | value | role |
|---|---|---|
| `--color-ivory` | `#F5F0E6` | the canvas the whole page is printed on |
| `--color-paper` | `#FBF8F1` | the default panel face, a step above the canvas |
| `--color-cream` | `#EDE4D3` | the alternate panel face, a step below it |
| `--color-burgundy` | `#722F37` | names, headings, primary buttons, two panels |
| `--color-olive` | `#4F5A3A` | the verse panel |
| `--color-olive-soft` | `#7A8060` | eyebrows, field labels, small caps |
| `--color-gold` | `#B49A62` | hairline rules and the ampersand, nothing else |
| `--color-text` | `#292820` | body copy |

**A dark panel does not restate its colours.** `.sec--olive` and `.sec--burgundy`
redefine the contextual tokens (`--tone`, `--accent`, `--hairline`, …) once, and
everything inside follows. `.detail` — the ivory island inside the burgundy
panel — takes the page tokens back the same way.

### The panel system

The page is **one flat sheet of ivory**, and every section is a panel of paper
laid on it — inset from the edge, rounded, generously padded.

| | |
|---|---|
| `--gutter` | `clamp(16px, 4vw, 28px)` — air between a panel and the page edge |
| `--gap-card` | `clamp(16px, 4vw, 20px)` — the gap between two panels |
| `--radius-card` | `clamp(22px, 6vw, 28px)` |
| `--shell` | `30rem` — an elegant reading width, never wider |

**The separation is tonal, not lit.** Three light values a few points apart do
the work: `--color-paper` sits above the canvas, `--color-cream` below it, and a
`--card-edge` hairline at 5% opacity is there only to find the edge. There is no
shadow, no gradient and no elevation anywhere in the invitation — the audit
asserts that, because a drop shadow is the fastest way to turn stationery into a
dashboard. Accent panels drop the hairline; olive and burgundy separate
themselves.

Each panel carries `overflow: hidden`, so a corner ornament is clipped to the
radius and reads as printed on the sheet rather than pasted over it.

The dividers and the footer have no face of their own — they sit on the open
canvas between panels.

**The envelope is deliberately outside all of this.** It stays a fixed,
full-screen opening on the same ivory, with no radius and no inset; the panel
system begins once it has been opened.

### Rhythm

Panels alternate between decorative and informational so the page breathes, and
the accents stay accents — one olive, two burgundy, six light:

```
hero      paper      names, nothing competing
quote     olive      the verse, deliberately bare
couple    paper      editorial, symmetrical, no photographs
date      cream      the day and the countdown
venue     paper      the architectural engraving, no frame
event     burgundy   details on an ivory island
gift      cream      account numbers, obvious copy buttons
wishes    paper      RSVP, styled as stationery
closing   burgundy   the back page
```

Four of the nine carry no ornament at all. That is the point: the decoration is
selective, and a clean panel is a finished panel.

### Typography

Three families, loaded from Google Fonts:

- **Playfair Display** — the couple's names, headings, numerals
- **Cormorant Garamond** — body copy, labels, the italic ampersand
- **Amiri** — Arabic only

There is no script face. The couple's names are the strongest typographic
element on the page and carry that weight as an editorial serif, not a cursive.

## Artwork slots

Every decorative graphic is referenced through **one CSS variable**, all of them
declared in the `ASSET SLOTS` block at the top of `assets/css/style.css`. A new
file drops in with a single-line edit and nothing else moves.

All twelve slots are filled, from eleven files: the closing watermark is the
venue engraving again rather than a separate cut of it.

A slot whose file is missing is still safe — a background image that 404s paints
nothing, so an absent ornament costs a little whitespace and never a broken
layout. That is what keeps a half-delivered set shippable.

| slot | file | lands in |
|---|---|---|
| `--asset-venue-engraving` | `venue-architectural-engraving.webp` | venue — the signature illustration |
| `--asset-olive-branch` | `olive-botanical-branch.webp` | hero, a sprig above the names |
| `--asset-couple-botanical` | `olive-burgundy-botanical.webp` | couple, above the bismillah |
| `--asset-floral-spray` | `burgundy-floral-spray.webp` | the cover envelope, left and right |
| `--asset-divider` | `wedding-ornamental-divider.webp` | the `.ornament` rules between sections |
| `--asset-wax-seal` | `ls-wax-seal.webp` | the cover envelope's front pocket |
| `--asset-corner-tl` / `-br` | `botanical-corner-top-left.webp` / `-bottom-right.webp` | the verse band, a diagonal pair |
| `--asset-corner-tr` | `botanical-corner-top-right.webp` | event band |
| `--asset-corner-bl` | `botanical-corner-bottom-left.webp` | RSVP |
| `--asset-footer-ornament` | `botanical-footer-ornament.webp` | footer |
| `--asset-venue-mark` | `var(--asset-venue-engraving)` | closing, ghosted behind the text |

No section carries all four corners: the verse band takes a diagonal pair, the
event band one, the RSVP one. Four corners on one section is exactly the crowding
this design is trying to avoid.

Three shapes cover every slot:

- **sprigs** (`.deco--branch`, `--couple`) sit in the flow above the section they
  open, sized by width against the artwork's own proportion
- **corners** are anchored at the section edge, deliberately outside the reading
  column, so they never cross text
- **plates** (the venue, the cover sprays, the seal, the divider, the footer
  ornament) are shaped boxes

Anything shaped needs its proportion recorded, or the art is letterboxed inside
the wrong hole. Those live beside the slots as `--venue-ratio`, `--spray-ratio`, `--branch-ratio`,
`--couple-ratio`, `--divider-ratio`, `--seal-ratio`, `--footer-ratio` and one per
corner — `--corner-tl-ratio` through `--corner-br-ratio`, since **the four corner
pieces do not share a proportion** (1.310, 1.463, 1.124, 1.103). Each is measured
off the delivered file. **Replacing a file with one of a different
proportion means retuning its ratio.**

The divider artwork draws its own rule out to both ends, so `.ornament` adds no
hairlines of its own.

The corner pieces are full-colour engraving, and their burgundy and cream flowers
already carry against a dark band, so a band only holds the art back off the type
(`opacity: .6`, against `.45` on a light section). Flat line work would want
`filter: brightness(0) invert(1)` instead — on this collection that would flatten
the whole piece to a white silhouette.

Two traps worth knowing before touching any of this:

- **`.sec--burgundy .deco` outranks `.deco--closing`** (two classes against one),
  so the closing watermark has to be restated *after* the band rule or it jumps
  from a ghost at `.13` to a full-strength building at `.6` behind the names.
- **Every corner sits in a section's padding except the RSVP one**, because the
  wish list grows down to the foot of its section. `.sec--wishes` carries extra
  bottom padding so that corner gets its own room instead of printing itself
  behind the last guest's message. If you change the corner's size, re-check
  that clearance.

## The cover envelope

The cover is a four-layer stack, matching how the printed piece assembles:

| layer | z | asset |
|---|---|---|
| open envelope, lace flap raised | 1 | `envelope-open.webp` |
| bouquets, tucked behind the card | 2 | `--asset-floral-spray` |
| the invitation card itself | 3 | `.env__card`, ivory + live text |
| front pocket with the wax seal | 4 | `envelope-flap.webp` |
| the seal slot | 5 | `--asset-wax-seal` |

Both envelope images are 1013px wide and bottom-aligned, so they register
without any nudging. **The front pocket's top edge dips to 64.6% of the
envelope height at the centre.** The card's foot sits at 73% so its lower edge
stays buried, and `.env__card` carries a large bottom padding so the last line
of type still clears 64.6%. Change the card's type size and you may need to
retune that padding — the date line is the one that gets swallowed.

**`envelope-flap.webp` already has a gold seal printed on it**, measured at 49.4%
across and 72.5% down the envelope, 16.7% wide. `.env__seal` is registered on
that centre and run at 21% — a little larger — so the L&S seal covers the printed
one completely instead of sitting beside it. Shrink it and the old seal starts to
show around the edge.

`burgundy-floral-spray.webp` is a wide bouquet rather than a long trailing spray,
so the two copies flank the raised flap and spill past the card's top corners
instead of running down the sides.

## Motion

Deliberately little of it. An elegant printed invitation does not shimmer:

- the cover opens — the card lifts out of the envelope, then the cover follows
- sections fade up as they enter the viewport, with a 110ms stagger between
  siblings (`--d`, set in `wireReveal()`)
- the music disc turns while a track is playing

There are no drifting glows, no falling petals, no sheen on the lettering and no
sway on the ornaments. **Everything is off under `prefers-reduced-motion:
reduce`**, where reveals simply render in place.

## Ucapan & RSVP

Wishes are kept in the visitor's own browser via `localStorage`. Each guest
sees only what they themselves wrote, and nothing reaches you.

**To actually collect RSVPs you need a backend.** The submit handler in
`wireWishForm()` is the single place to POST to a Google Apps Script endpoint,
a form service, or your own API.

The list flows rather than scrolling inside its own box. It used to be capped at
`24rem` with `overflow-y: auto`, which clipped the last message mid-sentence once
the panel narrowed — and a nested scroll pane is a dashboard pattern, not
stationery. Since each guest only ever sees the wishes they wrote themselves, the
list stays short on its own.

## Artwork provenance

The burgundy envelope, floral spray and paper stock come from the ChungDoi
*Minimalism Dark Red* template, staged from a local download with
`python tools/prepare_assets.py` (set `CHUNGDOI_DIR` if the folder moved).
**Check your licence with ChungDoi before publishing this publicly** — a
GitHub Pages site is public.

`venue-architectural-engraving.webp` is a rendering of the real venue, not
template art. It arrives on a dark vignette, so `tools/make_venue.py` mattes the
building out and fades the plaza into the paper, and writes it under that name:

```sh
python tools/make_venue.py "path/to/render.png"
```

It is left out of `prepare_assets.py` on purpose — staging it from the template
folder again would overwrite the real venue. The page prints it like an antique
plate: desaturated, warmed, and multiplied into the ivory instead of laid on top
of it in a frame.

`floral-spray.webp`, `gift.webp`, `icon-cake.webp` and `paper.webp` are no longer
referenced: the ChungDoi spray was replaced by `burgundy-floral-spray.webp`, the
illustrated gift and cake icons gave way to type, and the envelope card is flat
ivory rather than a paper texture. They are kept on disk in case you want them
back.

## Browser support

Current Chrome, Edge, Firefox and Safari. Uses `IntersectionObserver`,
`text-wrap`, `svh` units and `overflow: clip` — all of which degrade to a plain,
readable page on anything older. `prefers-reduced-motion` is honoured
throughout.

Mobile is the priority: the layout is designed at 390px, every touch target is
at least 44px tall, and form fields are set at 16px so iOS does not zoom the
page when one is focused.
