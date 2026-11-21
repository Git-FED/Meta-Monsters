#!/usr/bin/env python3
"""Build Metamonsters v1 asset set: copy + downscale the sprites the game needs.

Sources (all under ~/workspace/pokemon-game-research/sprites/):
  base front:  extracted/metamonsters-sprites/<cat>/ + starters/
  base back:   extracted/metamonsters-sprites-back/<cat>/ + starters/
  bat 106-108: bat/
  instinct:    instinct/   (186, two naming conventions)
  items:       extracted-items/metamonsters-items/
  tools:       extracted-tools/metamonsters-tools/
Outputs (~/workspace/metamonsters-game/assets/):
  sprites/creatures/<dex>-front.png / <dex>-back.png   (512x512)
  sprites/instinct/<dex>-instinct-front.png / -back.png (512x512)
  sprites/items/<slug>.png  (128x128)
  sprites/tools/<slug>.png  (128x128)
  map/world-map.png (as-is)
  assets-manifest.json
"""
import json, os, re, sys
from PIL import Image

SRC = os.path.expanduser("~/workspace/pokemon-game-research/sprites")
DST = os.path.expanduser("~/workspace/metamonsters-game/assets")
MAIN_DEX = [f"{i:03d}" for i in range(1, 91)] + ["106", "107", "108"]

FRONT_RE = re.compile(r"^(?:media-generation-)?(\d{3})-(.+?)(?:-0-[0-9a-f-]+)?\.png$")
BACK_RE = re.compile(r"^(?:media-generation-)?(\d{3})-(.+?)-back(?:-0-[0-9a-f-]+)?\.png$")
INST_RE = re.compile(r"^(?:media-generation-)?(\d{3})-(.+?)-instinct(?:-0-[0-9a-f-]+)?\.png$")
INST_BACK_RE = re.compile(r"^(?:media-generation-)?(\d{3})-(.+?)-instinct-back(?:-0-[0-9a-f-]+)?\.png$")
ITEM_RE = re.compile(r"^media-generation-(.+?)-0-[0-9a-f-]+\.png$")


def scan(dirs, front_re, back_re):
    """Return {dex: {'front': path, 'back': path}} from a list of dirs."""
    out = {}
    for d in dirs:
        if not os.path.isdir(d):
            continue
        for f in sorted(os.listdir(d)):
            if not f.endswith(".png"):
                continue
            m = back_re.match(f)
            if m:
                out.setdefault(m.group(1), {})["back"] = os.path.join(d, f)
                continue
            m = front_re.match(f)
            if m:
                out.setdefault(m.group(1), {})["front"] = os.path.join(d, f)
    return out


def downscale(src, dst, size):
    im = Image.open(src)
    if im.size != (size, size):
        im = im.resize((size, size), Image.LANCZOS)
    im.save(dst, optimize=True)


def main():
    os.makedirs(f"{DST}/sprites/creatures", exist_ok=True)
    os.makedirs(f"{DST}/sprites/instinct", exist_ok=True)
    os.makedirs(f"{DST}/sprites/items", exist_ok=True)
    os.makedirs(f"{DST}/sprites/tools", exist_ok=True)
    os.makedirs(f"{DST}/map", exist_ok=True)

    cats = ["mammal", "bird", "reptile", "amphibian", "fish", "insect",
            "arachnid", "crustacean", "mollusk", "starters"]
    front_dirs = [f"{SRC}/extracted/metamonsters-sprites/{c}" for c in cats]
    back_dirs = [f"{SRC}/extracted/metamonsters-sprites-back/{c}" for c in cats]
    base = scan(front_dirs, FRONT_RE, BACK_RE)
    base_back = scan(back_dirs, FRONT_RE, BACK_RE)
    for dex, v in base_back.items():
        base.setdefault(dex, {}).update(v)
    bat = scan([f"{SRC}/bat"], FRONT_RE, BACK_RE)
    for dex, v in bat.items():
        base.setdefault(dex, {}).update(v)

    instinct = scan([f"{SRC}/instinct"], INST_RE, INST_BACK_RE)

    manifest = {"creatures": {}, "instinct": {}, "items": {}, "tools": {}}
    missing = []
    for dex in MAIN_DEX:
        e = base.get(dex, {})
        if "front" not in e or "back" not in e:
            missing.append((dex, "base", sorted(e.keys())))
            continue
        downscale(e["front"], f"{DST}/sprites/creatures/{dex}-front.png", 512)
        downscale(e["back"], f"{DST}/sprites/creatures/{dex}-back.png", 512)
        manifest["creatures"][dex] = {"front": f"assets/sprites/creatures/{dex}-front.png",
                                       "back": f"assets/sprites/creatures/{dex}-back.png"}
        ie = instinct.get(dex, {})
        if "front" not in ie or "back" not in ie:
            missing.append((dex, "instinct", sorted(ie.keys())))
            continue
        downscale(ie["front"], f"{DST}/sprites/instinct/{dex}-instinct-front.png", 512)
        downscale(ie["back"], f"{DST}/sprites/instinct/{dex}-instinct-back.png", 512)
        manifest["instinct"][dex] = {"front": f"assets/sprites/instinct/{dex}-instinct-front.png",
                                      "back": f"assets/sprites/instinct/{dex}-instinct-back.png"}

    for kind, srcdir in (("items", f"{SRC}/extracted-items/metamonsters-items"),
                          ("tools", f"{SRC}/extracted-tools/metamonsters-tools")):
        for f in sorted(os.listdir(srcdir)):
            m = ITEM_RE.match(f)
            if not m:
                print(f"WARN: unparsable {kind} file {f}")
                continue
            slug = m.group(1)
            downscale(os.path.join(srcdir, f), f"{DST}/sprites/{kind}/{slug}.png", 128)
            manifest[kind][slug] = f"assets/sprites/{kind}/{slug}.png"

    # world map as-is
    import shutil
    shutil.copy(os.path.expanduser("~/workspace/pokemon-game-research/metamonsters-world-map.png"),
                f"{DST}/map/world-map.png")

    with open(f"{DST}/assets-manifest.json", "w") as fh:
        json.dump(manifest, fh, indent=1, sort_keys=True)

    print(f"creatures: {len(manifest['creatures'])}/93, instinct: {len(manifest['instinct'])}/93")
    print(f"items: {len(manifest['items'])}/83, tools: {len(manifest['tools'])}/14")
    print("MISSING:", missing if missing else "none")
    return 1 if missing else 0


if __name__ == "__main__":
    sys.exit(main())
