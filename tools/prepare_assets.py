"""Stage the artwork the invitation ships with.

Sources
  design/           screen frames of the original template, used only for the
                    velvet stage backdrop (see build_backdrop.py)
  ChungDoi download the burgundy envelope, florals, paper stock, engraving and
                    icons, already supplied as high-resolution RGBA

Typefaces are not copied: every face the template uses is on Google Fonts and
is linked from the stylesheet instead.
"""
import os
import shutil
import sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'img')

VENDOR = os.environ.get('CHUNGDOI_DIR', os.path.join(
    os.path.expanduser('~'), 'Downloads',
    'Minimalism Dark Red Template - Elegant Burgundy Wedding Invitation Online _ ChungDoi_files'))

# source name -> shipped name
COPY = {
    'envelope-background.webp': 'envelope-open.webp',
    'envelope-cover.webp':      'envelope-flap.webp',
    'flower2-decoration.webp':  'floral-spray.webp',
    'paper.webp':               'paper.webp',
    'castle-background.webp':   'venue.webp',
    'cake.webp':                'icon-cake.webp',
    'minimalism_darkred.webp':  'gift.webp',
}

# artwork from the earlier pass that the vendor set replaces
STALE = ['lace-card.png', 'lace-oval.png', 'spray-a.png', 'spray-b.png',
         'spray-c.png', 'wax-seal.png', 'venue-engraving.png', 'backdrop.jpg',
         'note-card.webp', 'icon-camera.webp', 'icon-dine.webp']


def main():
    if not os.path.isdir(VENDOR):
        sys.exit(f'vendor asset folder not found:\n  {VENDOR}\n'
                 'set CHUNGDOI_DIR to point at it')
    os.makedirs(OUT, exist_ok=True)

    for name in STALE:
        p = os.path.join(OUT, name)
        if os.path.exists(p):
            os.remove(p)
            print(f'  - {name}')

    for src, dst in COPY.items():
        s = os.path.join(VENDOR, src)
        if not os.path.exists(s):
            print(f'  ! missing {src}')
            continue
        shutil.copy2(s, os.path.join(OUT, dst))
        im = Image.open(s)
        print(f'  + {dst:22} {im.size[0]}x{im.size[1]} {im.mode}')


if __name__ == '__main__':
    main()
