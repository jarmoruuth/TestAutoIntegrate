"""
Copy FITS files and put a bad RA value into the copies, for testing
ImageSolver failure handling in AutoIntegrate.

RA keywords RA (decimal degrees), OBJCTRA (sexagesimal hours) and CRVAL1
(WCS reference RA, degrees) are changed if they exist. Other header cards
and image data are copied unchanged. Original files are never modified.

Usage:
  python badra.py <file or directory> ... -o <output directory> [--offset DEG | --ra DEG | --invalid]

  --offset DEG   add DEG degrees to RA, default 90, gives a wrong position so solving fails
  --ra DEG       set RA to DEG degrees
  --invalid      set RA to a value that cannot be parsed

Examples:
  python badra.py D:/Telescopes/test/Seestar_Monkey_Head_Nebula -o D:/Telescopes/test/BadRA
  python badra.py D:/data/lights --invalid -o D:/Telescopes/test/BadRA_invalid
"""

import argparse
import glob
import os
import sys

CARD = 80
BLOCK = 2880
FITS_EXTENSIONS = (".fit", ".fits", ".fts")


def read_header(f):
    """Read primary header cards until END. Returns list of cards and header byte length."""
    cards = []
    nbytes = 0
    while True:
        block = f.read(BLOCK)
        if len(block) < BLOCK:
            raise ValueError("unexpected end of file in header")
        nbytes += BLOCK
        for i in range(0, BLOCK, CARD):
            card = block[i:i + CARD].decode("ascii", errors="replace")
            cards.append(card)
            if card.startswith("END") and card[3:].strip() == "":
                return cards, nbytes


def card_value(card):
    """Return value text of a card without the comment, or None."""
    if card[8:10] != "= ":
        return None
    text = card[10:]
    if text.lstrip().startswith("'"):
        start = text.index("'")
        end = text.find("'", start + 1)
        while end != -1 and end + 1 < len(text) and text[end + 1] == "'":
            end = text.find("'", end + 2)
        return text[start + 1:end].strip() if end != -1 else text[start + 1:].strip()
    return text.split("/")[0].strip()


def card_comment(card):
    text = card[10:]
    if text.lstrip().startswith("'"):
        end = text.rfind("'")
        rest = text[end + 1:]
    else:
        rest = text
    pos = rest.find("/")
    return rest[pos + 1:].strip() if pos != -1 else ""


def make_card(name, value, comment, is_string):
    if is_string:
        value_text = "'" + value.replace("'", "''").ljust(8) + "'"
        value_text = value_text.ljust(20)
    else:
        value_text = value.rjust(20)
    card = name.ljust(8) + "= " + value_text
    if comment:
        card += " / " + comment
    return card[:CARD].ljust(CARD)


def parse_ra_hours(text):
    """Parse sexagesimal or decimal RA hours, returns hours or None."""
    parts = text.replace(":", " ").split()
    try:
        if len(parts) == 3:
            return float(parts[0]) + float(parts[1]) / 60 + float(parts[2]) / 3600
        if len(parts) == 1:
            return float(parts[0])
    except ValueError:
        pass
    return None


def format_ra_hours(hours):
    hours = hours % 24
    h = int(hours)
    m = int((hours - h) * 60)
    s = ((hours - h) * 60 - m) * 60
    return "%02d %02d %05.2f" % (h, m, s)


def new_ra_degrees(old_degrees, args):
    if args.ra is not None:
        return args.ra % 360
    return (old_degrees + args.offset) % 360


def change_cards(cards, args):
    """Change RA cards, returns list of change descriptions."""
    changes = []
    for i, card in enumerate(cards):
        name = card[:8].strip()
        if name not in ("RA", "OBJCTRA", "CRVAL1"):
            continue
        value = card_value(card)
        if value is None:
            continue
        comment = card_comment(card)
        if name == "OBJCTRA":
            if args.invalid:
                new_value = "XX YY ZZ"
            else:
                hours = parse_ra_hours(value)
                if hours is None:
                    continue
                new_value = format_ra_hours(new_ra_degrees(hours * 15, args) / 15)
            cards[i] = make_card(name, new_value, comment, True)
        else:
            if args.invalid:
                # String value in a numeric keyword, cannot be used as RA
                new_value = "invalid"
                cards[i] = make_card(name, new_value, comment, True)
            else:
                try:
                    degrees = float(value)
                except ValueError:
                    continue
                new_value = "%.6f" % new_ra_degrees(degrees, args)
                cards[i] = make_card(name, new_value, comment, False)
        changes.append("%s %s -> %s" % (name, value, new_value))
    return changes


def process_file(path, outdir, args):
    with open(path, "rb") as f:
        cards, header_len = read_header(f)
        changes = change_cards(cards, args)
        f.seek(header_len)
        data = f.read()
    # Header is padded with spaces after END to a full block
    header = "".join(cards).encode("ascii")
    header += b" " * (-len(header) % BLOCK)
    if len(header) != header_len:
        raise ValueError("header length changed")
    outpath = os.path.join(outdir, os.path.basename(path))
    with open(outpath, "wb") as f:
        f.write(header)
        f.write(data)
    if changes:
        print("%s: %s" % (os.path.basename(path), ", ".join(changes)))
    else:
        print("%s: no RA keywords found, copied unchanged" % os.path.basename(path))


def find_files(inputs):
    files = []
    for name in inputs:
        if os.path.isdir(name):
            for entry in sorted(os.listdir(name)):
                if entry.lower().endswith(FITS_EXTENSIONS):
                    files.append(os.path.join(name, entry))
        else:
            files.extend(sorted(glob.glob(name)))
    return files


def main():
    parser = argparse.ArgumentParser(description="Copy FITS files with a bad RA value.")
    parser.add_argument("inputs", nargs="+", help="FITS files, wildcards or directories")
    parser.add_argument("-o", "--outdir", required=True, help="output directory for the changed copies")
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--offset", type=float, default=90.0, help="degrees added to RA, default 90")
    group.add_argument("--ra", type=float, help="set RA to this value in degrees")
    group.add_argument("--invalid", action="store_true", help="set RA to a value that cannot be parsed")
    args = parser.parse_args()

    files = find_files(args.inputs)
    if not files:
        sys.exit("No FITS files found")
    outdir = os.path.abspath(args.outdir)
    for path in files:
        if os.path.dirname(os.path.abspath(path)) == outdir:
            sys.exit("Output directory must not be the input directory: " + outdir)
    os.makedirs(outdir, exist_ok=True)

    errors = 0
    for path in files:
        try:
            process_file(path, outdir, args)
        except (OSError, ValueError) as e:
            print("%s: error: %s" % (path, e))
            errors += 1
    print("%d files written to %s, %d errors" % (len(files) - errors, outdir, errors))
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
