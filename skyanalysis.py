r"""
Collect Auto stretching sky analysis results from TestAutoIntegrate logs into a CSV file.

Usage:
    python skyanalysis.py <testlist.txt | logfile> [...] [-o output.csv] [--sep ";"]

Arguments can be TestAutoIntegrate test lists or log files. For a test list the latest
log in the results directory is used for each test. Test name is the second part of a
test list line, or the directory name of the setup file if the name is missing.

Output is one row per analysis, an LRGB test can have several rows, for example for
luminance and RGB images. Column role is decision for the analysis that selected the
stretching method, and info for analyses that are only logged, for example RGB after
luminance in LRGB, or all analyses when sky analysis is not used for the selection.
Tests without a log or without an analysis get a row with
a note so missing tests are visible. Default output file is skyanalysis_<input>.csv,
or skyanalysis_combined.csv for several inputs.

Log lines are written by autoStretchingAnalysis and skyAnalysisStretching in
AutoIntegrateEngine.js, update the patterns below if the log format changes.

Examples:
  python skyanalysis.py autotest_skyanalysis_TL_old_01.txt          -> skyanalysis_autotest_skyanalysis_TL_old_01.csv
  python skyanalysis.py autotest_skyanalysis_TL_old_0*.txt -o all.csv  (merge chunks)
  python skyanalysis.py results\SomeTest_20261011_224530.log
"""

import argparse
import csv
import glob
import os
import re
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
RESULTS_DIR = os.path.join(SCRIPT_DIR, "results")

# Lines that belong to one analysis are within this many lines from the start line
MAX_ANALYSIS_LINES = 15

# Fixed column order, columns from fraction lists are added after the matching column
COLUMNS = [
    "test", "image", "role", "note",
    "decision",
    "contrast", "contrast_limit", "contrast_select",
    "selected_by", "selected",
    "bright_area", "bright_limit", "faint_area",
    "unreliable",
    "sky_fraction", "sky_limit", "sky_select",
    "background", "noise", "median_tile_noise", "tiles", "linear", "seconds",
    "model_sky_fraction", "model_select",
    "model_scatter", "model_scatter_noise", "model_gradient", "model_median_tile", "model_iterations",
    "model_plane_rise", "model_scatter_growth",
    "model_failed",
    "log",
]

TIMESTAMP_RE = re.compile(r"^\[[^\]]*\] ")

HEADER_RE = re.compile(
    r"^Auto stretching analysis on (?P<image>\S+): "
    r"(?:contrast (?P<contrast>[-\d.]+)|contrast not available), "
    r"limit (?P<contrast_limit>[-\d.]+), would select (?P<contrast_select>.+?)"
    r"(?:, (?P<selected_by>Auto|explicitly) selected (?P<selected>.+))?$")

LINE_RES = [
    re.compile(r"^  bright area (?P<bright_area>[-\d.]+)%, limit (?P<bright_limit>[-\d.]+)%, "
               r"faint area (?P<faint_area>[-\d.]+)%"),
    re.compile(r"^  sky fraction (?P<sky_fraction>[-\d.]+)% \((?P<sky_list>[^)]*)\), "
               r"limit (?P<sky_limit>[-\d.]+)%, would select (?P<sky_select>.+)$"),
    re.compile(r"^  background (?P<background>\S+), noise (?P<noise>\S+), "
               r"median tile (?P<median_tile_noise>[-\d.]+) noise above background, (?P<tiles>\d+) tiles, "
               r"linear (?P<linear>\w+), (?P<seconds>[-\d.]+) sec"),
    re.compile(r"^  sky model: sky fraction (?P<model_sky_fraction>[-\d.]+)% \((?P<model_list>[^)]*)\), "
               r"would select (?P<model_select>.+)$"),
    re.compile(r"^  sky model: scatter (?P<model_scatter>\S+) \((?P<model_scatter_noise>\S+) noise\), "
               r"gradient (?P<model_gradient>[-\d.]+)%, median tile (?P<model_median_tile>[-\d.]+) scatter above sky model, "
               r"(?P<model_iterations>\d+) iterations"),
    re.compile(r"^  sky model: plane rise (?P<model_plane_rise>[-\d.]+) initial scatter, "
               r"scatter growth (?P<model_scatter_growth>[-\d.]+)x"),
]

UNRELIABLE_RE = re.compile(r"^  image statistics are not reliable")
MODEL_FAILED_RE = re.compile(r"^  sky model: fit failed")
KEEPING_RE = re.compile(r"^  keeping (?P<decision>.+) selected earlier by sky analysis")
DECISION_RE = re.compile(r"^Auto image stretching selected by sky analysis on (?P<image>\S+): (?P<decision>.+)$")

# Fraction list items like "0.5 noise 24%" or "2 scatter 81%"
FRACTION_RE = re.compile(r"([-\d.]+) (\w+) ([-\d.]+)%")


def add_fractions(row, prefix, txt, columns, after):
    """Add fraction list items as columns, for example sky_1_noise."""
    pos = columns.index(after) + 1
    for limit, unit, value in FRACTION_RE.findall(txt):
        col = prefix + "_" + limit + "_" + unit
        row[col] = value
        if col not in columns:
            columns.insert(pos, col)
        pos = columns.index(col) + 1


def parse_log(log_path, test_name, columns):
    """Return analysis rows from one log file."""
    rows = []
    row = None
    row_line = 0
    with open(log_path, encoding="utf-8", errors="replace") as f:
        for line_number, line in enumerate(f):
            line = TIMESTAMP_RE.sub("", line.rstrip("\r\n"))

            m = HEADER_RE.match(line)
            if m:
                row = {"test": test_name, "log": os.path.basename(log_path)}
                row.update({k: v for k, v in m.groupdict().items() if v is not None})
                row_line = line_number
                rows.append(row)
                continue

            m = DECISION_RE.match(line)
            if m:
                # Decision line follows the analysis of the same image
                for r in reversed(rows):
                    if r["image"] == m.group("image"):
                        r["decision"] = m.group("decision")
                        r["role"] = "decision"
                        break
                continue

            if row is None or line_number - row_line > MAX_ANALYSIS_LINES:
                continue

            for line_re in LINE_RES:
                m = line_re.match(line)
                if m:
                    values = m.groupdict()
                    if "sky_list" in values:
                        add_fractions(row, "sky", values.pop("sky_list"), columns, "sky_fraction")
                    if "model_list" in values:
                        add_fractions(row, "model", values.pop("model_list"), columns, "model_sky_fraction")
                    row.update(values)
                    break
            else:
                if UNRELIABLE_RE.match(line):
                    row["unreliable"] = "true"
                elif MODEL_FAILED_RE.match(line):
                    row["model_failed"] = "true"
                else:
                    m = KEEPING_RE.match(line)
                    if m:
                        row["decision"] = m.group("decision")

    # Only one analysis per run makes the decision, others are logged for information
    for r in rows:
        r.setdefault("role", "info")
    return rows


def load_test_list(path):
    """Return test names from a TestAutoIntegrate test list."""
    names = []
    with open(path, encoding="utf-8", errors="replace") as f:
        for line in f:
            line = line.strip()
            if line == "" or line.startswith("#"):
                continue
            parts = line.split(",")
            script = parts[0].strip().replace("\\", "/")
            name = parts[1].strip() if len(parts) >= 2 else ""
            if name == "":
                dirs = script.split("/")
                name = dirs[-2] if len(dirs) >= 2 else ""
            if name != "":
                names.append(name)
    return names


def latest_log(test_name):
    """Return the latest name_date_time.log file for a test, or None."""
    # Match only name_date_time.log so that for example Comet does not match Comet_stars
    log_re = re.compile("^" + re.escape(test_name) + r"_\d+_\d+\.log$", re.IGNORECASE)
    logs = [f for f in os.listdir(RESULTS_DIR) if log_re.match(f)]
    if not logs:
        return None
    return os.path.join(RESULTS_DIR, max(logs))


def test_name_from_log(log_path):
    name = os.path.splitext(os.path.basename(log_path))[0]
    m = re.match(r"^(.*)_\d+_\d+$", name)
    return m.group(1) if m else name


def main():
    parser = argparse.ArgumentParser(description="Collect Auto stretching sky analysis results into a CSV file.")
    parser.add_argument("inputs", nargs="+", help="test list (.txt) or log files")
    parser.add_argument("-o", "--output", help="output CSV file")
    parser.add_argument("--sep", default=",", help="CSV separator, default ','")
    args = parser.parse_args()

    # Windows command prompt does not expand wildcards
    inputs = []
    for inp in args.inputs:
        inputs.extend(sorted(glob.glob(inp)) if glob.has_magic(inp) else [inp])
    if not inputs:
        print("No files match " + " ".join(args.inputs))
        return 1

    columns = list(COLUMNS)
    rows = []
    for inp in inputs:
        if not os.path.exists(inp):
            print("File not found: " + inp)
            return 1
        if inp.lower().endswith(".txt"):
            tests = [(name, latest_log(name)) for name in load_test_list(inp)]
        else:
            tests = [(test_name_from_log(inp), inp)]
        for name, log in tests:
            if log is None:
                print("No log for " + name)
                rows.append({"test": name, "note": "no log"})
                continue
            print(log)
            log_rows = parse_log(log, name, columns)
            if not log_rows:
                print("  no sky analysis in log")
                rows.append({"test": name, "note": "no analysis", "log": os.path.basename(log)})
            rows.extend(log_rows)

    if args.output:
        output = args.output
    elif len(inputs) == 1:
        output = "skyanalysis_" + os.path.splitext(os.path.basename(inputs[0]))[0] + ".csv"
    else:
        output = "skyanalysis_combined.csv"

    with open(output, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=columns, delimiter=args.sep, restval="")
        writer.writeheader()
        writer.writerows(rows)

    analyses = sum(1 for r in rows if "image" in r)
    print("Wrote %d analyses from %d rows to %s" % (analyses, len(rows), output))
    return 0


if __name__ == "__main__":
    sys.exit(main())
