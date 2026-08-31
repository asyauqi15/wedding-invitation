"""Cut the venue rendering out of its dark ground for the cream card.

The source is a sepia architectural rendering sitting on a radial vignette —
near-black at the top corners, mid-tan at the bottom. Dropped straight onto the
parchment card that dark ground would read as a heavy rectangle, so the
building is matted out and the plaza is faded into the paper instead of ending
on a hard edge.

    python tools/make_venue.py "path/to/render.png"
"""
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'img', 'venue-architectural-engraving.webp')

# the building and plaza sit well above the vignette; 115 splits them cleanly
CUT = 115
FADE = 90          # rows of plaza that dissolve into the card


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    src = sys.argv[1]
    if not os.path.exists(src):
        sys.exit(f'source not found: {src}')

    rgb = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
    lum = rgb[..., 0] * .299 + rgb[..., 1] * .587 + rgb[..., 2] * .114

    # solid silhouette: threshold, close the gaps the line work opens, then
    # fill so the dark windows and doors stay opaque
    solid = lum > CUT
    solid = ndimage.binary_closing(solid, np.ones((9, 9)), iterations=2)
    solid = ndimage.binary_fill_holes(solid)
    lab, n = ndimage.label(solid)
    if n > 1:
        sizes = ndimage.sum(solid, lab, range(1, n + 1))
        solid = lab == (1 + int(np.argmax(sizes)))

    # pull the boundary in a few pixels: the vignette immediately outside the
    # building is dark, and left in it reads as a grubby outline on cream
    solid = ndimage.binary_erosion(solid, np.ones((3, 3)), iterations=3)
    alpha = ndimage.gaussian_filter(solid.astype(np.float32), 1.8)

    # let the plaza melt into the paper rather than stopping on a cut line
    h = alpha.shape[0]
    ramp = np.ones(h, np.float32)
    ramp[h - FADE:] = np.linspace(1, 0, FADE, dtype=np.float32)
    alpha *= ramp[:, None]

    ys, xs = np.where(alpha > 0.02)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    rgb, alpha = rgb[y0:y1, x0:x1], alpha[y0:y1, x0:x1]

    buf = np.zeros((*alpha.shape, 4), np.uint8)
    buf[..., :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    buf[..., 3] = np.clip(alpha * 255, 0, 255).astype(np.uint8)

    im = Image.fromarray(buf, 'RGBA')
    if im.size[0] > 1400:
        im = im.resize((1400, round(1400 * im.size[1] / im.size[0])), Image.LANCZOS)
    im.save(OUT, quality=88, method=6)
    print(f'  wrote {os.path.relpath(OUT, ROOT)}  {im.size[0]}x{im.size[1]}')


if __name__ == '__main__':
    main()
