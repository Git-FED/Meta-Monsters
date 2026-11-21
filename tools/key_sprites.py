"""Flood-fill key white backgrounds -> transparent, in place.
Only near-white pixels connected to the image border are removed, so
interior white parts of the art (bellies, highlights) are preserved.
Uses scipy binary_propagation (C speed). Idempotent: safe to re-run.
"""
from PIL import Image
import numpy as np
from scipy import ndimage
import os

THRESH = 245  # channel value above which a pixel counts as "white"

def key_image(path):
    im = Image.open(path).convert('RGBA')
    arr = np.array(im)
    white = (arr[:, :, 0] > THRESH) & (arr[:, :, 1] > THRESH) & (arr[:, :, 2] > THRESH)
    seed = np.zeros_like(white)
    seed[0, :] = white[0, :]
    seed[-1, :] = white[-1, :]
    seed[:, 0] = white[:, 0]
    seed[:, -1] = white[:, -1]
    bg = ndimage.binary_propagation(seed, mask=white)
    n = int(bg.sum())
    if n:
        arr[bg] = (0, 0, 0, 0)
        Image.fromarray(arr, 'RGBA').save(path, 'PNG')
    return n

def main():
    total = 0; done = 0; skipped = []
    roots = ['assets/sprites/creatures', 'assets/sprites/instinct', 'assets/sprites/items', 'assets/sprites/tools', 'assets/chars']
    for root in roots:
        for fn in sorted(os.listdir(root)):
            if not fn.endswith('.png'):
                continue
            p = os.path.join(root, fn)
            n = key_image(p)
            total += 1
            if n:
                done += 1
            else:
                skipped.append(p)
    print(f'keyed {done}/{total} images with background removed')
    if skipped:
        print('NO WHITE REMOVED:', skipped)

if __name__ == '__main__':
    main()
