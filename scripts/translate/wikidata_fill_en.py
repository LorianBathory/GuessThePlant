#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Update English names in plants.csv from Wikidata based on scientific names (wdt:P225).

Usage:
  python wikidata_fill_en_fixed.py /path/to/plants.csv [--sci-col sci] [--en-col en] [--batch 25] [--passes 2] [--backup]
  python wikidata_fill_en_fixed.py /path/to/plants.csv --output /path/to/output.csv

Notes:
- Fills only the target English column; other columns are preserved.
- Queries only English vernacular names (P1843@en) and falls back to English label when absent.
- Runs multiple passes over still-empty cells if --passes > 1.
"""

import argparse
import csv
import sys
import time
from typing import List, Dict, Set, Tuple
import os
import shutil
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

SPARQL_URL = "https://query.wikidata.org/sparql"
USER_AGENT = "WD-PlantEN-Filler/1.0 (+https://example.org)"
DEFAULT_BATCH_SIZE = 25
SLEEP = 0.2  # pause between batches to be polite

def eprint(*args, **kwargs):
    print(*args, file=sys.stderr, **kwargs)

def make_session() -> requests.Session:
    s = requests.Session()
    s.headers.update({
        "User-Agent": USER_AGENT,
        "Accept": "application/sparql-results+json",
    })
    retry = Retry(
        total=5,
        backoff_factor=0.6,
        status_forcelist=(429, 500, 502, 503, 504),
        allowed_methods=frozenset(["GET", "POST"]),
        raise_on_status=False,
    )
    s.mount("https://", HTTPAdapter(max_retries=retry))
    return s

def chunk(seq: List[str], n: int):
    for i in range(0, len(seq), n):
        yield seq[i:i+n]

def build_query(names: List[str]) -> str:
    esc = []
    for n in names:
        s = n.replace("\\", "\\\\").replace('"', '\\"')
        esc.append(f'("{s}")')
    values = "\n  ".join(esc)
    return f"""
SELECT ?latin ?qid ?vname ?enLabel WHERE {{
  VALUES (?latin) {{
    {values}
  }}
  ?item wdt:P225 ?latin .
  BIND(STRAFTER(STR(?item), "entity/") AS ?qid)
  OPTIONAL {{ ?item wdt:P1843 ?vname . FILTER(LANG(?vname) = "en") }}
  OPTIONAL {{ ?item rdfs:label ?enLabel . FILTER(LANG(?enLabel) = "en") }}
}}
""".strip()

def fetch_batch(sess: requests.Session, names: List[str]) -> List[Dict]:
    q = build_query(names)
    for attempt in range(1, 6):
        try:
            r = sess.post(SPARQL_URL, data={"query": q, "format": "json"}, timeout=60)
        except requests.RequestException as ex:
            eprint(f"Request error (attempt {attempt}): {ex}")
            time.sleep(min(1.0 * attempt, 5.0))
            continue
        if r.status_code == 200:
            try:
                return r.json().get("results", {}).get("bindings", [])
            except Exception as ex:
                eprint(f"JSON parse error: {ex}")
                return []
        eprint(f"HTTP {r.status_code} from WD (attempt {attempt}).")
        time.sleep(min(1.0 * attempt, 5.0))
    return []

def collect(rows: List[Dict]) -> Dict[str, Dict[str, Set[str]]]:
    out: Dict[str, Dict[str, Set[str]]] = {}
    for b in rows:
        def v(key):
            x = b.get(key)
            return x.get("value") if x else None
        latin = v("latin")
        if not latin:
            continue
        entry = out.setdefault(latin, {"vern": set(), "label": set(), "qid": set()})
        if v("vname"):
            entry["vern"].add(v("vname"))
        if v("enLabel"):
            entry["label"].add(v("enLabel"))
        if v("qid"):
            entry["qid"].add(v("qid"))
    return out

def pick_en(info: Dict[str, Set[str]]) -> str:
    if info["vern"]:
        return " | ".join(sorted(info["vern"], key=str.lower))
    if info["label"]:
        return " | ".join(sorted(info["label"], key=str.lower))
    return ""

def read_csv_rows(path: str) -> Tuple[List[Dict[str, str]], List[str]]:
    with open(path, "r", encoding="utf-8-sig", newline="") as f:
        r = csv.DictReader(f)
        rows = [dict(row) for row in r]
        fieldnames = r.fieldnames or []
    return rows, fieldnames

def write_csv_rows(path: str, rows: List[Dict[str, str]], fieldnames: List[str]) -> None:
    with open(path, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        for row in rows:
            w.writerow(row)

def ensure_columns(fieldnames: List[str], sci_col: str, en_col: str) -> List[str]:
    f = list(fieldnames)
    if sci_col not in f:
        raise SystemExit(f"Column '{sci_col}' not found in CSV header: {f}")
    if en_col not in f:
        f.append(en_col)
    return f

def process_pass(sess: requests.Session, rows: List[Dict[str, str]], sci_col: str, en_col: str, batch_size: int) -> int:
    to_lookup: List[str] = []
    idx_map: Dict[str, List[int]] = {}
    for i, row in enumerate(rows):
        latin = (row.get(sci_col) or "").strip()
        en_val = (row.get(en_col) or "").strip()
        if latin and not en_val:
            to_lookup.append(latin)
            idx_map.setdefault(latin, []).append(i)

    if not to_lookup:
        return 0

    filled = 0
    for group in chunk(to_lookup, batch_size):
        eprint(f"Querying Wikidata for {len(group)} names...")
        data = collect(fetch_batch(sess, group))
        for latin in group:
            info = data.get(latin)
            if not info:
                continue
            en_name = pick_en(info)
            if not en_name:
                continue
            for i in idx_map.get(latin, []):
                if not (rows[i].get(en_col) or "").strip():
                    rows[i][en_col] = en_name
                    filled += 1
        time.sleep(SLEEP)
    return filled

def main():
    global SLEEP  # moved to the top of the function

    ap = argparse.ArgumentParser()
    ap.add_argument("csv_path", help="Path to plants.csv")
    ap.add_argument("--sci-col", default="sci", help="CSV column with scientific names")
    ap.add_argument("--en-col", default="en", help="CSV column to fill with English names")
    ap.add_argument("--batch", type=int, default=DEFAULT_BATCH_SIZE, help="Batch size for SPARQL VALUES")
    ap.add_argument("--passes", type=int, default=2, help="Number of passes over still-empty cells")
    ap.add_argument("--sleep", type=float, default=SLEEP, help="Pause between batches (seconds)")
    ap.add_argument("--output", default=None, help="Write to a separate CSV instead of in-place update")
    ap.add_argument("--backup", action="store_true", help="Create .bak backup when writing in-place")
    args = ap.parse_args()

    SLEEP = max(0.0, float(args.sleep))

    rows, fieldnames = read_csv_rows(args.csv_path)
    fieldnames = ensure_columns(fieldnames, args.sci_col, args.en_col)

    if args.output:
        out_path = args.output
    else:
        out_path = args.csv_path
        if args.backup:
            bak = args.csv_path + ".bak"
            shutil.copyfile(args.csv_path, bak)
            eprint(f"Backup created: {bak}")

    sess = make_session()

    total_filled = 0
    for p in range(1, max(1, args.passes) + 1):
        filled = process_pass(sess, rows, args.sci_col, args.en_col, args.batch)
        total_filled += filled
        eprint(f"Pass {p}: filled {filled} rows.")
        if filled == 0:
            break

    write_csv_rows(out_path, rows, fieldnames)
    eprint(f"Done. Wrote: {out_path}. Newly filled: {total_filled}. Rows total: {len(rows)}")

if __name__ == "__main__":
    main()
