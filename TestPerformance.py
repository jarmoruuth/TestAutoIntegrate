#!/usr/bin/env python3
"""Generate a performance report from the test result logs.

Every test run writes a log file into the results directory, for example
results/LRGB_20260921_192357.log. The log ends with a line

    Test runtime: 61.67 seconds

and the runs that start AutoIntegrate also have a line

    AutoIntegrate v1.87.2 test3, PixInsight v1.9.5-0 build 1702 (1090500)

This script reads those logs and writes an HTML page with a runtime graph for
each test, a table that compares the runtimes of the AutoIntegrate versions and
a list of the tests whose runtime has changed a lot. The same findings are also
printed to the console.

The graphs are inline SVG so the page needs no external libraries and it can be
opened directly in a browser.

Logs that have no runtime line are from older runs and are skipped. Logs that
have no version line are standalone script tests that do not start
AutoIntegrate, they are reported with an unknown version.

Usage:

    python TestPerformance.py
    python TestPerformance.py -o report.html --threshold 15
    python TestPerformance.py --test LRGB --test HaLRGB
    python TestPerformance.py --days 90 --csv runtimes.csv
    python TestPerformance.py --stats

Option --stats prints the console summary and does not write the page.

The script only reads the log files, it does not need PixInsight.
"""

import argparse
import csv
import datetime
import html
import os
import re
import statistics
import sys

DEFAULT_RESULTS_DIR = 'results'
DEFAULT_OUTPUT = 'TestPerformance.html'

# results/<test name>_<date>_<time>.log
LOG_NAME_RE = re.compile(r'^(?P<name>.+)_(?P<date>\d{8})_(?P<time>\d{6})\.log$')

RUNTIME_RE = re.compile(r'Test runtime:\s*([0-9]+(?:\.[0-9]+)?)\s*seconds')

# AutoIntegrate v1.87.2 test3, PixInsight v1.9.5-0 build 1702 (1090500)
VERSION_RE = re.compile(r'AutoIntegrate (v[^,\n]+?),\s*PixInsight (v\S+)\s+build\s+(\d+)')

# Number of earlier runs the last run is compared to.
BASELINE_RUNS = 10

# Versions shown in the version comparison table.
VERSION_COLUMNS = 6

# Colors for the version legend, reused when there are more versions.
COLORS = ['#3b78c3', '#d9822b', '#3f9e5a', '#a355b9', '#c9484b',
          '#1f9aa5', '#8a6d3b', '#6c6f75']


def parse_log(path, name, when):
    """Read one log file and return a run, or None when there is no runtime."""
    try:
        with open(path, encoding='utf-8', errors='replace') as f:
            text = f.read()
    except OSError as e:
        print('Cannot read %s: %s' % (path, e))
        return None

    runtimes = RUNTIME_RE.findall(text)
    if not runtimes:
        return None

    version = VERSION_RE.search(text)
    if version:
        ai_version = version.group(1).strip()
        pi_version = version.group(2).strip()
        pi_build = version.group(3)
    else:
        ai_version = ''
        pi_version = ''
        pi_build = ''

    if '✗ FAIL' in text or 'TEST ERRORS' in text:
        status = 'failed'
    elif '⊘ SKIP' in text:
        status = 'skipped'
    elif '✓ PASS' in text:
        status = 'passed'
    else:
        status = ''

    return {
        'name': name,
        'when': when,
        'runtime': float(runtimes[-1]),
        'ai_version': ai_version,
        'pi_version': pi_version,
        'pi_build': pi_build,
        'status': status,
        'file': os.path.basename(path),
    }


def read_runs(results_dir, tests, days):
    """Read all logs from the results directory."""
    if not os.path.isdir(results_dir):
        sys.exit('Results directory %s not found' % results_dir)

    if days:
        oldest = datetime.datetime.now() - datetime.timedelta(days=days)
    else:
        oldest = None

    runs = []
    skipped_name = 0
    skipped_runtime = 0

    for entry in sorted(os.listdir(results_dir)):
        if not entry.endswith('.log'):
            continue
        match = LOG_NAME_RE.match(entry)
        if not match:
            # For example diffs.log and logs saved with a name of their own.
            skipped_name += 1
            continue
        name = match.group('name')
        if tests and name not in tests:
            continue
        try:
            when = datetime.datetime.strptime(match.group('date') + match.group('time'),
                                              '%Y%m%d%H%M%S')
        except ValueError:
            skipped_name += 1
            continue
        if oldest and when < oldest:
            continue

        run = parse_log(os.path.join(results_dir, entry), name, when)
        if run is None:
            skipped_runtime += 1
            continue
        runs.append(run)

    runs.sort(key=lambda r: (r['name'], r['when']))
    return runs, skipped_name, skipped_runtime


def group_by_test(runs):
    """Return a dict of test name to runs, runs in time order."""
    tests = {}
    for run in runs:
        tests.setdefault(run['name'], []).append(run)
    return tests


def test_summary(runs, threshold):
    """Compare the last run of a test to the median of the earlier runs."""
    runtimes = [r['runtime'] for r in runs]
    last = runs[-1]
    earlier = runtimes[:-1][-BASELINE_RUNS:]
    baseline = statistics.median(earlier) if earlier else None
    if baseline:
        change = (last['runtime'] - baseline) / baseline * 100.0
    else:
        change = None
    return {
        'name': runs[0]['name'],
        'runs': len(runs),
        'first': runs[0]['when'],
        'last': last['when'],
        'last_runtime': last['runtime'],
        'last_status': last['status'],
        'median': statistics.median(runtimes),
        'min': min(runtimes),
        'max': max(runtimes),
        'baseline': baseline,
        'baseline_runs': len(earlier),
        'change': change,
        'flagged': change is not None and abs(change) >= threshold,
    }


def version_order(runs):
    """Versions in the order they were first used.

    Runs are grouped by test so they are not in time order here, the first use
    of every version is searched from the run times.
    """
    first_used = {}
    for run in runs:
        version = run['ai_version']
        if not version:
            continue
        if version not in first_used or run['when'] < first_used[version]:
            first_used[version] = run['when']
    return sorted(first_used, key=lambda v: first_used[v])


def version_medians(test_runs):
    """Median runtime for each version of one test."""
    by_version = {}
    for run in test_runs:
        if run['ai_version']:
            by_version.setdefault(run['ai_version'], []).append(run['runtime'])
    return {v: statistics.median(t) for v, t in by_version.items()}


def format_change(change):
    if change is None:
        return ''
    return '%+.0f%%' % change


def format_time(seconds):
    return '%.1f' % seconds


# =============================================================================
# Console report
# =============================================================================

def print_report(runs, summaries, versions, threshold):
    print('')
    print('Test runs:   %d' % len(runs))
    print('Tests:       %d' % len(summaries))
    print('First run:   %s' % min(r['when'] for r in runs).strftime('%Y-%m-%d'))
    print('Last run:    %s' % max(r['when'] for r in runs).strftime('%Y-%m-%d'))
    if versions:
        print('Versions:    %s' % ', '.join(versions[-VERSION_COLUMNS:]))
    print('')

    name_width = max(len(s['name']) for s in summaries)
    header = '%-*s %5s %9s %9s %9s %8s' % (name_width, 'Test', 'Runs', 'Median',
                                           'Last', 'Baseline', 'Change')
    print(header)
    print('-' * len(header))
    for s in sorted(summaries, key=lambda s: s['name'].lower()):
        baseline = format_time(s['baseline']) if s['baseline'] else '-'
        mark = ' *' if s['flagged'] else ''
        print('%-*s %5d %9s %9s %9s %8s%s'
              % (name_width, s['name'], s['runs'], format_time(s['median']),
                 format_time(s['last_runtime']), baseline, format_change(s['change']), mark))

    flagged = [s for s in summaries if s['flagged']]
    print('')
    if flagged:
        print('Tests where the last run differs more than %d%% from the median of the '
              'previous %d runs:' % (threshold, BASELINE_RUNS))
        for s in sorted(flagged, key=lambda s: -abs(s['change'])):
            print('    %-*s %s   %s -> %s seconds'
                  % (name_width, s['name'], format_change(s['change']),
                     format_time(s['baseline']), format_time(s['last_runtime'])))
    else:
        print('No test differs more than %d%% from its baseline.' % threshold)
    print('')


# =============================================================================
# HTML report
# =============================================================================

def svg_chart(test_runs, colors, width=820, height=190):
    """Runtime graph for one test as inline SVG."""
    left, right, top, bottom = 52, 12, 12, 26
    plot_w = width - left - right
    plot_h = height - top - bottom

    runtimes = [r['runtime'] for r in test_runs]
    ymax = max(runtimes) * 1.15
    if ymax <= 0:
        ymax = 1.0
    count = len(test_runs)

    def x_at(i):
        if count == 1:
            return left + plot_w / 2.0
        return left + plot_w * i / (count - 1)

    def y_at(value):
        return top + plot_h - plot_h * value / ymax

    parts = ['<svg class="chart" viewBox="0 0 %d %d" role="img">' % (width, height)]

    # Horizontal grid and y axis labels.
    for step in range(5):
        value = ymax * step / 4.0
        y = y_at(value)
        parts.append('<line class="grid" x1="%d" y1="%.1f" x2="%d" y2="%.1f"/>'
                     % (left, y, width - right, y))
        parts.append('<text class="ylabel" x="%d" y="%.1f">%s</text>'
                     % (left - 6, y + 3, format_time(value)))

    # Median line.
    median = statistics.median(runtimes)
    parts.append('<line class="median" x1="%d" y1="%.1f" x2="%d" y2="%.1f"/>'
                 % (left, y_at(median), width - right, y_at(median)))

    # Version changes.
    previous = None
    for i, run in enumerate(test_runs):
        version = run['ai_version']
        if version and previous and version != previous:
            parts.append('<line class="vchange" x1="%.1f" y1="%d" x2="%.1f" y2="%.1f"/>'
                         % (x_at(i), top, x_at(i), top + plot_h))
        if version:
            previous = version

    # Runtime line.
    points = ' '.join('%.1f,%.1f' % (x_at(i), y_at(r['runtime']))
                      for i, r in enumerate(test_runs))
    parts.append('<polyline class="line" points="%s"/>' % points)

    # Runs.
    for i, run in enumerate(test_runs):
        color = colors.get(run['ai_version'], '#9aa0a6')
        cls = 'dot failed' if run['status'] == 'failed' else 'dot'
        title = '%s  %s s  %s  %s%s' % (
            run['when'].strftime('%Y-%m-%d %H:%M'),
            format_time(run['runtime']),
            run['ai_version'] or 'unknown version',
            run['pi_version'] or 'unknown PixInsight',
            '  FAILED' if run['status'] == 'failed' else '')
        parts.append('<circle class="%s" cx="%.1f" cy="%.1f" r="3.2" fill="%s"><title>%s</title></circle>'
                     % (cls, x_at(i), y_at(run['runtime']), color, html.escape(title)))

    # X axis labels, first and last run.
    parts.append('<text class="xlabel start" x="%d" y="%d">%s</text>'
                 % (left, height - 8, test_runs[0]['when'].strftime('%Y-%m-%d')))
    if count > 1:
        parts.append('<text class="xlabel end" x="%d" y="%d">%s</text>'
                     % (width - right, height - 8, test_runs[-1]['when'].strftime('%Y-%m-%d')))
    parts.append('</svg>')
    return '\n'.join(parts)


def versions_seen_table(runs, versions, colors):
    """AutoIntegrate versions with their PixInsight versions and run counts."""
    if not versions:
        return ''
    rows = []
    for version in versions:
        version_runs = [r for r in runs if r['ai_version'] == version]
        pixinsight = sorted({r['pi_version'] + ' build ' + r['pi_build']
                             for r in version_runs if r['pi_version']})
        rows.append('<tr><th><span class="swatch" style="background:%s"></span>%s</th>'
                    '<td>%d</td><td>%s</td><td>%s</td><td class="left">%s</td></tr>'
                    % (colors.get(version, '#9aa0a6'), html.escape(version), len(version_runs),
                       min(r['when'] for r in version_runs).strftime('%Y-%m-%d'),
                       max(r['when'] for r in version_runs).strftime('%Y-%m-%d'),
                       html.escape(', '.join(pixinsight) or '-')))
    return ('<h2>Versions</h2>\n'
            '<p>AutoIntegrate versions in the order they were first run, and the PixInsight '
            'versions they were run with. A PixInsight update can change the runtimes as '
            'well.</p>\n'
            '<div class="tablewrap"><table class="versions">\n'
            '<tr><th>AutoIntegrate</th><th>Runs</th><th>First</th><th>Last</th>'
            '<th class="left">PixInsight</th></tr>\n%s\n</table></div>\n'
            % '\n'.join(rows))


def version_table(tests, versions, colors, threshold):
    """Median runtime of each test in the last versions."""
    shown = versions[-VERSION_COLUMNS:]
    if not shown:
        return ''

    rows = []
    for name in sorted(tests, key=str.lower):
        medians = version_medians(tests[name])
        if not any(v in medians for v in shown):
            continue
        cells = []
        previous = None
        for version in shown:
            value = medians.get(version)
            if value is None:
                cells.append('<td class="empty">-</td>')
                continue
            if previous:
                change = (value - previous) / previous * 100.0
                cls = 'slower' if change >= threshold else ('faster' if change <= -threshold else '')
                cells.append('<td class="%s">%s<span class="change">%s</span></td>'
                             % (cls, format_time(value), format_change(change)))
            else:
                cells.append('<td>%s</td>' % format_time(value))
            previous = value
        rows.append('<tr><th>%s</th>%s</tr>' % (html.escape(name), ''.join(cells)))

    if not rows:
        return ''

    head = ''.join('<th><span class="swatch" style="background:%s"></span>%s</th>'
                   % (colors.get(v, '#9aa0a6'), html.escape(v)) for v in shown)
    return ('<h2>Version comparison</h2>\n'
            '<p>Median runtime in seconds for each AutoIntegrate version, and the change '
            'from the previous version shown. Changes of %d%% or more are highlighted. '
            'Only runs that report a version are included.</p>\n'
            '<div class="tablewrap"><table class="versions">\n'
            '<tr><th>Test</th>%s</tr>\n%s\n</table></div>\n'
            % (threshold, head, '\n'.join(rows)))


def build_page(runs, tests, summaries, versions, colors, threshold, results_dir):
    generated = datetime.datetime.now().strftime('%Y-%m-%d %H:%M')
    first = min(r['when'] for r in runs).strftime('%Y-%m-%d')
    last = max(r['when'] for r in runs).strftime('%Y-%m-%d')
    flagged = [s for s in summaries if s['flagged']]

    out = []
    out.append('<!DOCTYPE html>')
    out.append('<html lang="en"><head><meta charset="utf-8">')
    out.append('<title>AutoIntegrate test performance</title>')
    out.append('<style>%s</style>' % PAGE_STYLE)
    out.append('</head><body>')
    out.append('<h1>AutoIntegrate test performance</h1>')
    out.append('<p class="meta">%d runs of %d tests from %s to %s, read from %s. '
               'Generated %s.</p>'
               % (len(runs), len(tests), first, last, html.escape(results_dir), generated))

    # Summary of the changes.
    out.append('<h2>Last run compared to the baseline</h2>')
    out.append('<p>Baseline is the median of the previous %d runs of the same test. '
               'Changes of %d%% or more are highlighted.</p>' % (BASELINE_RUNS, threshold))
    out.append('<div class="tablewrap"><table class="summary">')
    out.append('<tr><th>Test</th><th>Runs</th><th>Median</th><th>Min</th><th>Max</th>'
               '<th>Baseline</th><th>Last</th><th>Change</th><th>Last run</th></tr>')
    for s in sorted(summaries, key=lambda s: s['name'].lower()):
        if s['change'] is None:
            cls = ''
        elif s['change'] >= threshold:
            cls = 'slower'
        elif s['change'] <= -threshold:
            cls = 'faster'
        else:
            cls = ''
        out.append('<tr%s><th>%s</th><td>%d</td><td>%s</td><td>%s</td><td>%s</td>'
                   '<td>%s</td><td>%s</td><td class="%s">%s</td><td>%s</td></tr>'
                   % (' class="failed"' if s['last_status'] == 'failed' else '',
                      html.escape(s['name']), s['runs'], format_time(s['median']),
                      format_time(s['min']), format_time(s['max']),
                      format_time(s['baseline']) if s['baseline'] else '-',
                      format_time(s['last_runtime']), cls, format_change(s['change']),
                      s['last'].strftime('%Y-%m-%d')))
    out.append('</table></div>')

    if flagged:
        out.append('<p class="note">%d test%s differ more than %d%% from the baseline: %s.</p>'
                   % (len(flagged), '' if len(flagged) == 1 else 's', threshold,
                      ', '.join(html.escape(s['name']) for s in
                                sorted(flagged, key=lambda s: -abs(s['change'])))))

    out.append(versions_seen_table(runs, versions, colors))
    out.append(version_table(tests, versions, colors, threshold))

    # Graphs.
    out.append('<h2>Runtime of each test</h2>')
    out.append('<p>Runs in time order, runtime in seconds. The dotted line is the median of '
               'all runs and the vertical lines are AutoIntegrate version changes. Dot color '
               'is the version, a red ring is a failed run. Point at a dot to see the '
               'details.</p>')
    if versions:
        legend = ''.join('<span class="legenditem"><span class="swatch" style="background:%s">'
                         '</span>%s</span>' % (colors.get(v, '#9aa0a6'), html.escape(v))
                         for v in versions)
        out.append('<div class="legend">%s</div>' % legend)
    for name in sorted(tests, key=str.lower):
        test_runs = tests[name]
        summary = next(s for s in summaries if s['name'] == name)
        out.append('<div class="test">')
        out.append('<h3>%s <span class="sub">%d runs, median %s s, last %s s (%s)</span></h3>'
                   % (html.escape(name), summary['runs'], format_time(summary['median']),
                      format_time(summary['last_runtime']), format_change(summary['change'])
                      if summary['change'] is not None else 'no baseline'))
        out.append(svg_chart(test_runs, colors))
        out.append('</div>')

    out.append('</body></html>')
    return '\n'.join(out)


PAGE_STYLE = """
body { font-family: system-ui, "Segoe UI", Arial, sans-serif; margin: 24px; color: #1f2328;
       background: #ffffff; max-width: 1100px; }
h1 { font-size: 22px; margin-bottom: 4px; }
h2 { font-size: 17px; margin-top: 32px; border-bottom: 1px solid #d7dae0; padding-bottom: 4px; }
h3 { font-size: 14px; margin: 18px 0 2px 0; }
h3 .sub { font-weight: normal; color: #6a7078; font-size: 12px; margin-left: 8px; }
p { font-size: 13px; line-height: 1.5; }
p.meta { color: #6a7078; font-size: 12px; }
p.note { background: #fff6e5; border-left: 3px solid #d9822b; padding: 8px 10px; }
.tablewrap { overflow-x: auto; }
table { border-collapse: collapse; font-size: 13px; margin-top: 8px; }
th, td { border: 1px solid #d7dae0; padding: 4px 8px; text-align: right; }
th { background: #f3f5f8; font-weight: 600; }
tr > th:first-child, table th:first-child { text-align: left; }
tr.failed > th:first-child::after { content: " (failed)"; color: #c9484b; font-weight: normal; }
td.slower { background: #fdeaea; color: #a3282b; }
td.faster { background: #e8f6ec; color: #256c3a; }
td.empty { color: #b5bac1; }
td.left, th.left { text-align: left; }
td .change { display: block; font-size: 11px; color: #6a7078; }
td.slower .change, td.faster .change { color: inherit; }
.legend { margin: 10px 0 2px 0; font-size: 12px; color: #40464e; }
.legenditem { display: inline-block; margin-right: 14px; white-space: nowrap; }
.swatch { display: inline-block; width: 10px; height: 10px; border-radius: 2px;
          margin-right: 5px; vertical-align: baseline; }
.test { margin-bottom: 6px; }
svg.chart { width: 100%; height: auto; background: #fbfcfd; border: 1px solid #e3e6ea;
            border-radius: 3px; }
svg .grid { stroke: #e3e6ea; stroke-width: 1; }
svg .median { stroke: #9aa0a6; stroke-width: 1; stroke-dasharray: 4 3; }
svg .vchange { stroke: #c8ccd2; stroke-width: 1; stroke-dasharray: 2 3; }
svg .line { fill: none; stroke: #b6bcc4; stroke-width: 1.2; }
svg .dot.failed { stroke: #c9484b; stroke-width: 2; }
svg text { font-family: system-ui, "Segoe UI", Arial, sans-serif; fill: #6a7078; font-size: 10px; }
svg .ylabel { text-anchor: end; }
svg .xlabel.start { text-anchor: start; }
svg .xlabel.end { text-anchor: end; }
"""


def write_csv(path, runs):
    with open(path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['test', 'date', 'runtime_seconds', 'autointegrate_version',
                         'pixinsight_version', 'pixinsight_build', 'status', 'file'])
        for run in runs:
            writer.writerow([run['name'], run['when'].strftime('%Y-%m-%d %H:%M:%S'),
                             '%.2f' % run['runtime'], run['ai_version'], run['pi_version'],
                             run['pi_build'], run['status'], run['file']])
    print('Wrote ' + path)


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))

    parser = argparse.ArgumentParser(description='Generate a performance report from the '
                                                 'test result logs.')
    parser.add_argument('-d', '--results', default=os.path.join(script_dir, DEFAULT_RESULTS_DIR),
                        help='results directory (default: results next to this script)')
    parser.add_argument('-o', '--output', default=None,
                        help='output HTML file (default: TestPerformance.html in the '
                             'results directory)')
    parser.add_argument('--test', action='append', default=[],
                        help='include only this test, can be given several times')
    parser.add_argument('--days', type=int, default=0,
                        help='include only runs from the last DAYS days')
    parser.add_argument('--threshold', type=float, default=20.0,
                        help='highlight changes of this many percent (default 20)')
    parser.add_argument('--csv', default=None, help='also write the runs to a CSV file')
    parser.add_argument('--stats', action='store_true',
                        help='print the console summary only, do not write the page')
    args = parser.parse_args()

    runs, skipped_name, skipped_runtime = read_runs(args.results, set(args.test), args.days)
    if not runs:
        sys.exit('No test runs with a runtime found in %s' % args.results)

    if skipped_runtime:
        print('Skipped %d log files that have no runtime line, likely from older runs.'
              % skipped_runtime)
    if skipped_name:
        print('Skipped %d files whose name is not <test>_<date>_<time>.log.' % skipped_name)

    tests = group_by_test(runs)
    summaries = [test_summary(test_runs, args.threshold) for test_runs in tests.values()]
    versions = version_order(runs)
    colors = {v: COLORS[i % len(COLORS)] for i, v in enumerate(versions)}

    print_report(runs, summaries, versions, args.threshold)

    if args.csv:
        write_csv(args.csv, runs)

    if args.stats:
        return

    output = args.output or os.path.join(args.results, DEFAULT_OUTPUT)
    page = build_page(runs, tests, summaries, versions, colors, args.threshold, args.results)
    with open(output, 'w', encoding='utf-8') as f:
        f.write(page)
    print('Wrote %s, %d runs of %d tests' % (output, len(runs), len(tests)))


if __name__ == '__main__':
    main()
