"""Pack the paper-doll art without rebuilding the base game atlas."""

import json
from pathlib import Path

from PIL import Image


PROJECT = Path(__file__).resolve().parents[3]
RAW = PROJECT / "Core/game/raw6"
ASSETS = PROJECT / "docs/game/assets"
WIDTH = 2048
PADDING = 3
WRIST_ROWS = {
    "blade": 66,
    "warden": 67,
    "myco": 72,
    "ranger": 73,
    "summoner": 67,
    "shifter": 72,
}
GLOVES = ("gloves_worn", "gauntlet_worn")
BOOTS = ("boots_leather_worn", "boots_tan_worn", "eg_mirestep_worn")


def load_sprite(path):
    with Image.open(path) as image:
        return image.convert("RGBA")


def alpha_span(sprite, row):
    alpha = sprite.getchannel("A")
    band = alpha.crop((0, row - 1, sprite.width, row + 2))
    left, _, right, _ = band.point(lambda value: 255 if value >= 128 else 0).getbbox()
    return left, right


def align_leg(sprite):
    # At 2 atlas pixels per rig unit, row 10 is the hip pivot.
    # Keep the ankle beneath it and preserve the shape of the boot below it.
    width, hip_row, ankle_row = 72, 10, 42
    hip = sum(alpha_span(sprite, hip_row)) / 2
    ankle = sum(alpha_span(sprite, ankle_row)) / 2
    mesh = []
    for start, end, first, last in (
        (0, hip_row, hip, hip),
        (hip_row, ankle_row, hip, ankle),
        (ankle_row, sprite.height, ankle, ankle),
    ):
        left_top, left_bottom = first - width / 2, last - width / 2
        mesh.append(((0, start, width, end), (
            left_top, start, left_bottom, end,
            left_bottom + width, end, left_top + width, start,
        )))
    return sprite.transform((width, sprite.height), Image.Transform.MESH, mesh, Image.Resampling.BICUBIC)


def glove_arm(arm, glove, wrist_row):
    cuff_row = round(glove.height * 0.12)
    cuff_left, cuff_right = alpha_span(glove, cuff_row)
    wrist_left, wrist_right = alpha_span(arm, wrist_row + 3)
    width = round(glove.width * (wrist_right - wrist_left + 2) / (cuff_right - cuff_left))
    width = min(width, arm.width - wrist_left + 12)
    wrist_center = (wrist_left + wrist_right) / 2
    cuff_center = (cuff_left + cuff_right) / (2 * glove.width)
    x = max(0, min(arm.width - width, round(wrist_center - width * cuff_center)))
    hand = glove.resize((width, arm.height - wrist_row), Image.Resampling.LANCZOS)
    combined = Image.new("RGBA", arm.size)
    # The sleeve extends underneath the cuff. The original palm is removed.
    sleeve_end = wrist_row + round(hand.height * 0.25)
    combined.paste(arm.crop((0, 0, arm.width, sleeve_end)), (0, 0))
    combined.alpha_composite(hand, (x, wrist_row))
    return combined


def fit_rig_sprites(sprites):
    for cls, row in WRIST_ROWS.items():
        arm_name = f"rig_art_{cls}_arm"
        arm = sprites.get(arm_name)
        if arm is not None:
            for name in GLOVES:
                if name in sprites:
                    sprites[f"{arm_name}_{name}"] = glove_arm(arm, sprites[name], row)
    for name in (*BOOTS, *(f"rig_art_{cls}_leg" for cls in WRIST_ROWS)):
        if name in sprites:
            sprites[name] = align_leg(sprites[name])


def main():
    sprites = {
        path.stem: load_sprite(path)
        for path in (RAW / "rig_art").glob("*.png")
    }
    for path in (RAW / "endgame/worn").glob("*.png"):
        sprite = load_sprite(path)
        sprite.thumbnail((128, 128), Image.Resampling.LANCZOS)
        sprites[path.stem] = sprite
    if not sprites:
        raise ValueError("No paper-doll sprites found")
    fit_rig_sprites(sprites)

    positions = {}
    x = y = PADDING
    row_height = 0
    for name, sprite in sorted(sprites.items(), key=lambda item: (-item[1].height, item[0])):
        if x + sprite.width + PADDING > WIDTH:
            x = PADDING
            y += row_height + PADDING
            row_height = 0
        positions[name] = [x, y, sprite.width, sprite.height]
        x += sprite.width + PADDING
        row_height = max(row_height, sprite.height)

    height = y + row_height + PADDING
    base_height = json.loads((ASSETS / "atlas.json").read_text(encoding="utf-8"))["h"]
    if base_height + height + 4 > 4096:
        raise ValueError("The paper-doll atlas exceeds the combined texture size")
    atlas = Image.new("RGBA", (WIDTH, height))
    for name, sprite in sprites.items():
        atlas.paste(sprite, tuple(positions[name][:2]))

    atlas.save(ASSETS / "rig-art.webp", lossless=True, method=6)
    (ASSETS / "rig-art.json").write_text(
        json.dumps({"w": WIDTH, "h": height, "s": positions}, separators=(",", ":")) + "\n",
        encoding="utf-8",
    )
    print(f"Packed {len(sprites)} sprites into {WIDTH} × {height}")


if __name__ == "__main__":
    main()
