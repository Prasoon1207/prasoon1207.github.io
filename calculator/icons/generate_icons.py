#!/usr/bin/env python3
"""Generates the home-screen icons for the calculator app.

iOS only accepts PNG for `apple-touch-icon`, so the icons cannot be SVG. This
script draws them from scratch: no image library is needed, and PNG encoding is
a short zlib + CRC exercise. Edges are anti-aliased analytically by turning the
signed distance to each shape into coverage, which avoids supersampling.

Run from anywhere:  python3 calculator/icons/generate_icons.py
"""
import math
import os
import struct
import zlib

# Icons are full-bleed squares. iOS rounds `apple-touch-icon` itself, and the
# glyph sits inside the middle 50%, which keeps it within the safe circle that
# Android's maskable icons crop to.
SIZES = {
    "icon-180.png": 180,
    "icon-192.png": 192,
    "icon-512.png": 512,
    "icon-maskable-512.png": 512,
}

GRADIENT_START = (0x8B, 0x7A, 0xFF)
GRADIENT_END = (0x56, 0x42, 0xD6)
GLYPH_COLOR = (0xFF, 0xFF, 0xFF)

STROKE = 0.016   # capsule radius, as a fraction of the icon's width
REACH = 0.075    # half-length of a glyph arm
DOT = 0.018      # radius of the dots in the division sign


def capsule(ax, ay, bx, by, radius=STROKE):
    """A line segment with rounded ends, as (kind, params)."""
    return ("capsule", (ax, ay, bx, by, radius))


def dot(cx, cy, radius=DOT):
    return ("circle", (cx, cy, radius))


def build_glyph():
    """The four arithmetic operators, laid out two by two."""
    shapes = []
    left, right = 0.34, 0.66
    top, bottom = 0.34, 0.66
    diagonal = REACH / math.sqrt(2)

    # Plus, top left.
    shapes.append(capsule(left - REACH, top, left + REACH, top))
    shapes.append(capsule(left, top - REACH, left, top + REACH))

    # Minus, top right.
    shapes.append(capsule(right - REACH, top, right + REACH, top))

    # Multiply, bottom left.
    shapes.append(capsule(left - diagonal, bottom - diagonal, left + diagonal, bottom + diagonal))
    shapes.append(capsule(left + diagonal, bottom - diagonal, left - diagonal, bottom + diagonal))

    # Divide, bottom right.
    shapes.append(capsule(right - REACH, bottom, right + REACH, bottom))
    shapes.append(dot(right, bottom - REACH * 0.72))
    shapes.append(dot(right, bottom + REACH * 0.72))

    return shapes


def distance_to_capsule(px, py, ax, ay, bx, by, radius):
    pax, pay = px - ax, py - ay
    bax, bay = bx - ax, by - ay
    denominator = bax * bax + bay * bay
    t = 0.0 if denominator == 0 else (pax * bax + pay * bay) / denominator
    t = max(0.0, min(1.0, t))
    dx, dy = pax - bax * t, pay - bay * t
    return math.hypot(dx, dy) - radius


def distance_to_glyph(px, py, shapes):
    best = float("inf")
    for kind, params in shapes:
        if kind == "capsule":
            distance = distance_to_capsule(px, py, *params)
        else:
            cx, cy, radius = params
            distance = math.hypot(px - cx, py - cy) - radius
        if distance < best:
            best = distance
    return best


def render(size, shapes):
    """Returns the icon as a list of RGB byte rows."""
    rows = []
    # Coverage ramps across one pixel, which is what softens the glyph edges.
    feather = 1.0 / size

    for y in range(size):
        py = (y + 0.5) / size
        row = bytearray()
        for x in range(size):
            px = (x + 0.5) / size

            # Diagonal gradient background.
            ramp = (px + py) / 2.0
            background = tuple(
                int(round(GRADIENT_START[i] + (GRADIENT_END[i] - GRADIENT_START[i]) * ramp))
                for i in range(3)
            )

            distance = distance_to_glyph(px, py, shapes)
            alpha = min(1.0, max(0.0, 0.5 - distance / feather))
            if alpha <= 0.0:
                row += bytes(background)
            else:
                row += bytes(
                    int(round(background[i] + (GLYPH_COLOR[i] - background[i]) * alpha))
                    for i in range(3)
                )
        rows.append(bytes(row))
    return rows


def write_png(path, rows, size):
    def chunk(tag, data):
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    # Colour type 2 is 8-bit RGB; filter byte 0 means "no filter" per scanline.
    header = struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)
    raw = b"".join(b"\x00" + row for row in rows)

    with open(path, "wb") as handle:
        handle.write(b"\x89PNG\r\n\x1a\n")
        handle.write(chunk(b"IHDR", header))
        handle.write(chunk(b"IDAT", zlib.compress(raw, 9)))
        handle.write(chunk(b"IEND", b""))


def main():
    out_dir = os.path.abspath(os.path.dirname(__file__))
    shapes = build_glyph()
    cache = {}

    for filename, size in SIZES.items():
        if size not in cache:
            cache[size] = render(size, shapes)
        path = os.path.join(out_dir, filename)
        write_png(path, cache[size], size)
        print("wrote %s (%dx%d, %d bytes)" % (filename, size, size, os.path.getsize(path)))


if __name__ == "__main__":
    main()
