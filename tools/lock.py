"""Encrypt the invitation's private details for a static host.

GitHub Pages serves files and nothing else, so a JavaScript password check is
only a speed bump — anyone can read the page source. Instead this encrypts the
identifying content (names, parents, date, venue, accounts) with a key derived
from the password. The ciphertext ships publicly; without the password it is
noise, and a wrong password fails AES-GCM's authentication tag rather than
producing plausible garbage.

    python tools/lock.py --password "your-password"
    python tools/lock.py --password "your-password" --content content.json

`content.json` holds the real details in plaintext and is git-ignored. The
generated `assets/data/invitation.enc` is what gets committed.
"""
import argparse
import base64
import json
import os
import secrets
import sys

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_CONTENT = os.path.join(ROOT, 'content.json')
OUT = os.path.join(ROOT, 'assets', 'data', 'invitation.enc')

# WebCrypto does the same derivation on the guest's device; keep them in step.
ITERATIONS = 250_000


def b64(raw: bytes) -> str:
    return base64.b64encode(raw).decode('ascii')


def derive(password: str, salt: bytes) -> bytes:
    return PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=ITERATIONS,
    ).derive(password.encode('utf-8'))


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--password', required=True,
                    help='the password guests will type')
    ap.add_argument('--content', default=DEFAULT_CONTENT,
                    help='plaintext JSON of the invitation details')
    args = ap.parse_args()

    if len(args.password) < 6:
        sys.exit('password too short — use at least 6 characters')

    if not os.path.exists(args.content):
        sys.exit(f'content file not found: {args.content}')

    with open(args.content, encoding='utf-8') as fh:
        content = json.load(fh)

    plaintext = json.dumps(content, ensure_ascii=False,
                           separators=(',', ':')).encode('utf-8')

    salt = secrets.token_bytes(16)
    iv = secrets.token_bytes(12)
    ciphertext = AESGCM(derive(args.password, salt)).encrypt(iv, plaintext, None)

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8') as fh:
        json.dump({
            'v': 1,
            'kdf': 'PBKDF2-SHA256',
            'iter': ITERATIONS,
            'salt': b64(salt),
            'iv': b64(iv),
            'ct': b64(ciphertext),
        }, fh, indent=2)

    print(f'  wrote {os.path.relpath(OUT, ROOT)}  '
          f'({len(plaintext)} bytes plaintext -> {len(ciphertext)} bytes cipher)')
    print(f'  fields locked: {", ".join(sorted(content))}')
    print('\n  Guests can unlock by typing the password, or with a link that '
          'carries it:\n    index.html?to=Nama%20Tamu#k=<password>')


if __name__ == '__main__':
    main()
