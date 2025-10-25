import argparse
import logging
import sys
import time
import re
from typing import List, Optional, Tuple
from urllib.parse import urlencode, quote_plus, urljoin, urlparse

# --- HTTP ---
import requests
from bs4 import BeautifulSoup

REQUEST_TIMEOUT = 5  # seconds
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
}

# --- ODS backends ---
# Prefer pyexcel-ods3 (more tolerant), fallback to ezodf.
_PYEXCEL_AVAILABLE = False
_EZODF_AVAILABLE = False

try:
    from pyexcel_ods3 import get_data, save_data  # type: ignore
    _PYEXCEL_AVAILABLE = True
except Exception:
    _PYEXCEL_AVAILABLE = False

if not _PYEXCEL_AVAILABLE:
    try:
        import ezodf  # type: ignore
        _EZODF_AVAILABLE = True
    except Exception:
        _EZODF_AVAILABLE = False
else:
    # pyexcel present; import ezodf optionally for potential reads
    try:
        import ezodf  # type: ignore
        _EZODF_AVAILABLE = True
    except Exception:
        _EZODF_AVAILABLE = False


def normalize_spaces(s: str) -> str:
    return re.sub(r"\s+", " ", s.strip())


def tokenize_latin(name: str) -> List[str]:
    # keep only Latin letters, hyphens and spaces; split to words
    cleaned = re.sub(r"[^A-Za-z\- ]+", " ", name)
    parts = [p for p in cleaned.split() if p]
    return parts


def fetch(url: str) -> Optional[requests.Response]:
    try:
        resp = requests.get(url, headers=HEADERS, timeout=REQUEST_TIMEOUT, allow_redirects=True)
        if resp.status_code == 200:
            return resp
        logging.debug("HTTP %s -> %s", url, resp.status_code)
        return None
    except requests.RequestException as e:
        logging.debug("HTTP error for %s: %s", url, e)
        return None


def search_internal_greeninfo(query: str) -> List[Tuple[str, str]]:
    """
    Try several on-site search endpoints. Returns list of (title, url).
    """
    results: List[Tuple[str, str]] = []
    endpoints = [
        "https://www.greeninfo.ru/search/?q={q}",
        "https://www.greeninfo.ru/search/?search={q}",
        "https://www.greeninfo.ru/?q={q}",
        "https://www.greeninfo.ru/marketplace.html?search={q}",
    ]
    for ep in endpoints:
        url = ep.format(q=quote_plus(query))
        resp = fetch(url)
        if not resp:
            continue
        soup = BeautifulSoup(resp.text, "html.parser")
        for a in soup.find_all("a", href=True):
            href = a["href"]
            # Normalize relative links
            if href.startswith("/"):
                href = urljoin("https://www.greeninfo.ru", href)
            if "greeninfo.ru" not in href:
                continue
            title = normalize_spaces(a.get_text(" ").strip()) or href
            results.append((title, href))
        if results:
            break
    return dedup_results(results)


def search_duckduckgo_site(query: str) -> List[Tuple[str, str]]:
    """
    Fallback: use DuckDuckGo HTML endpoint to search within site:greeninfo.ru.
    """
    q = f"site:greeninfo.ru {query}"
    url = "https://duckduckgo.com/html/?" + urlencode({"q": q})
    resp = fetch(url)
    if not resp:
        return []
    soup = BeautifulSoup(resp.text, "html.parser")
    out: List[Tuple[str, str]] = []
    # Primary selector
    for a in soup.select("a.result__a, a.result__title"):
        href = a.get("href")
        if not href:
            continue
        title = normalize_spaces(a.get_text(" ").strip()) or href
        out.append((title, href))
    # Fallback generic blocks
    if not out:
        for res in soup.select("div.result, div.web-result"):
            a = res.find("a", href=True)
            if a:
                title = normalize_spaces(a.get_text(" ").strip()) or a["href"]
                out.append((title, a["href"]))
    return dedup_results(out)


def dedup_results(items: List[Tuple[str, str]]) -> List[Tuple[str, str]]:
    seen = set()
    out: List[Tuple[str, str]] = []
    for title, url in items:
        key = (title.lower(), url)
        if key in seen:
            continue
        seen.add(key)
        out.append((title, url))
    return out


SECTIONS = [
    "grassy",
    "flora",
    "trees",
    "shrubs",
    "vegetables",
    "conifers",
    "roses",
    "fruit",
    "berries",
    "houseplants",
    "weeds",
]


def try_direct_paths(words: List[str]) -> Optional[str]:
    """
    Probe canonical paths on greeninfo.ru without using search.
    - Genus (one word): /{section}/{genus}.html
    - Species (>=2 words): /{section}/{genus}_{species}.html and /{genus}-{species}.html
    Returns the first URL that loads with HTTP 200.
    """
    if not words:
        return None
    genus = words[0].lower()
    species = words[1].lower() if len(words) >= 2 else None

    candidates: List[str] = []

    if species:
        for sec in SECTIONS:
            for join in ("_", "-"):
                candidates.append(f"https://www.greeninfo.ru/{sec}/{genus}{join}{species}.html")
    # Always also try genus page
    for sec in SECTIONS:
        candidates.append(f"https://www.greeninfo.ru/{sec}/{genus}.html")

    for url in candidates:
        logging.debug("Direct probe: %s", url)
        resp = fetch(url)
        if resp:
            final_url = str(resp.url)
            logging.info("Direct hit: %s", final_url)
            return final_url
        time.sleep(0.05)
    return None


def pick_best_link(name: str, candidates: List[Tuple[str, str]]) -> Optional[str]:
    """
    Apply matching rules to pick a URL.
    - If 2+ words: look for both first two words; if not found, look for first word only.
    - If 1 word: look for genus-only page (single word in title/url). If only 2-word matches appear, keep searching (i.e., prefer NOT to return a 2-word match).
    """
    words = tokenize_latin(name)
    if not words:
        return None
    w1 = words[0].lower()
    w2 = words[1].lower() if len(words) >= 2 else None

    def text_of(item: Tuple[str, str]) -> str:
        t, u = item
        return f"{t} {u}".lower()

    # Helper to detect two-word botanical names beginning with w1
    def contains_two_word_name(text: str) -> bool:
        return bool(re.search(rf"\b{re.escape(w1)}\s+[a-z]{{2,}}\b", text))

    if w2:
        for title, url in candidates:
            t = text_of((title, url))
            if re.search(rf"\b{re.escape(w1)}\b", t) and re.search(rf"\b{re.escape(w2)}\b", t):
                return url
        for title, url in candidates:
            t = text_of((title, url))
            if re.search(rf"\b{re.escape(w1)}\b", t):
                return url
        return None
    else:
        genus_like: List[str] = []
        two_word_like: List[str] = []
        for title, url in candidates:
            t = text_of((title, url))
            if re.search(rf"\b{re.escape(w1)}\b", t):
                if contains_two_word_name(t):
                    two_word_like.append(url)
                else:
                    genus_like.append(url)
        if genus_like:
            return genus_like[0]
        return None


def find_greeninfo_link(name: str) -> Optional[str]:
    name_clean = normalize_spaces(name)
    logging.debug("Searching for: %s", name_clean)

    words = tokenize_latin(name_clean)

    # 0) Direct path probes
    direct = try_direct_paths(words)
    if direct:
        logging.debug("Found via direct paths.")
        return direct

    # 1) Try internal search
    candidates = search_internal_greeninfo(name_clean)
    logging.debug("Internal search candidates: %d", len(candidates))

    # 2) DuckDuckGo fallback
    if not candidates:
        time.sleep(0.2)
        candidates = search_duckduckgo_site(name_clean)
        logging.debug("DuckDuckGo search candidates: %d", len(candidates))

    if not candidates:
        return None

    picked = pick_best_link(name_clean, candidates)
    if picked:
        logging.info("Picked: %s -> %s", name_clean, picked)
    else:
        logging.info("No suitable link found for: %s", name_clean)
    return picked


# --- ODS handling ---
class ODSAccessor:
    def __init__(self, path: str):
        self.path = path
        self.backend = None

        # Prefer pyexcel for robustness
        if _PYEXCEL_AVAILABLE:
            self.backend = "pyexcel"
            self.data = get_data(self.path)  # type: ignore
            if not self.data:
                raise RuntimeError("ODS file has no sheets.")
            self.sheet_name = next(iter(self.data.keys()))
            self.rows = self.data[self.sheet_name]
        elif _EZODF_AVAILABLE:
            self.backend = "ezodf"
            ezodf.config.set_table_expand_strategy("all")  # type: ignore
            self.doc = ezodf.opendoc(self.path)  # type: ignore
            if not self.doc.sheets:
                raise RuntimeError("ODS file has no sheets.")
            self.sheet = self.doc.sheets[0]
        else:
            raise RuntimeError(
                "No ODS backend available. Please install one of:\n"
                "  pip install pyexcel-ods3\n"
                "or (fallback) pip install ezodf lxml"
            )

    def nrows(self) -> int:
        if self.backend == "ezodf":
            return self.sheet.nrows()
        else:
            return len(self.rows)

    def get_cell(self, r: int, c: int) -> Optional[str]:
        if self.backend == "ezodf":
            try:
                cell = self.sheet[r, c]
                val = cell.value
                if val is None:
                    return None
                return str(val)
            except IndexError:
                return None
        else:
            if r >= len(self.rows):
                return None
            row = self.rows[r]
            if c >= len(row):
                return None
            val = row[c]
            if val is None:
                return None
            return str(val)

    def _fallback_to_pyexcel(self) -> None:
        """Convert current ezodf doc to pyexcel in-memory structure and switch backend."""
        logging.warning("Switching ODS backend to pyexcel-ods3 due to ezodf write error.")
        # Build rows matrix
        max_rows = self.sheet.nrows()
        # Ensure at least 7 columns to safely write to column G (index 6)
        min_cols = max(getattr(self.sheet, "ncols", lambda: 0)() if hasattr(self.sheet, "ncols") else 0, 7)
        rows: List[List[Optional[str]]] = []
        for r in range(max_rows):
            row_list: List[Optional[str]] = []
            for c in range(min_cols):
                try:
                    val = self.sheet[r, c].value
                except IndexError:
                    val = None
                row_list.append(val)
            rows.append(row_list)
        # Switch
        self.backend = "pyexcel"
        self.data = { "Sheet1": rows }
        self.sheet_name = "Sheet1"
        self.rows = rows

    def set_cell(self, r: int, c: int, value: str) -> None:
        if self.backend == "ezodf":
            try:
                # Ensure row/col exist; ezodf can break on append_columns, so guard with try
                while r >= self.sheet.nrows():
                    self.sheet.append_rows(1)
                # If append_columns fails, fallback to pyexcel
                if c >= getattr(self.sheet, "ncols", lambda: 0)():
                    try:
                        need = c + 1 - self.sheet.ncols()
                        if need > 0:
                            self.sheet.append_columns(need)
                    except Exception as e:
                        logging.debug("ezodf append_columns failed: %s", e)
                        self._fallback_to_pyexcel()
                        return self.set_cell(r, c, value)
                self.sheet[r, c].set_value(value)
            except Exception as e:
                logging.debug("ezodf set_cell failed: %s", e)
                self._fallback_to_pyexcel()
                self.set_cell(r, c, value)
        else:
            # pyexcel backend
            while r >= len(self.rows):
                self.rows.append([])
            row = self.rows[r]
            if c >= len(row):
                row.extend([None] * (c - len(row) + 1))
            row[c] = value

    def save(self) -> None:
        if self.backend == "ezodf":
            try:
                self.doc.save()
            except Exception as e:
                logging.debug("ezodf save failed: %s", e)
                self._fallback_to_pyexcel()
                self.save()
        else:
            self.data[self.sheet_name] = self.rows
            save_data(self.path, self.data)


def process_file(path: str, max_rows: Optional[int], verbose: bool) -> None:
    logging.info("Opening file: %s", path)
    ods = ODSAccessor(path)
    total = ods.nrows()
    logging.info("Total rows: %s", total)

    processed = 0
    updated = 0

    # Periodic save thresholds
    SAVE_AFTER_UPDATES = 3
    SAVE_AFTER_PROCESSED = 5
    last_saved_updated = 0
    last_saved_processed = 0

    # Column indices
    COL_NAME = 0  # A
    COL_LINK = 6  # G

    rows_to_scan = min(total, max_rows) if max_rows is not None else total

    for r in range(rows_to_scan):
        plant = ods.get_cell(r, COL_NAME)
        if plant is None:
            logging.debug("Row %d: empty name, skip", r + 1)
            processed += 1
            if (updated - last_saved_updated) >= SAVE_AFTER_UPDATES or (processed - last_saved_processed) >= SAVE_AFTER_PROCESSED:
                logging.info("Autosave: %d new links, %d processed since last save", updated - last_saved_updated, processed - last_saved_processed)
                ods.save()
                last_saved_updated = updated
                last_saved_processed = processed
            continue

        existing = ods.get_cell(r, COL_LINK)
        if existing and str(existing).strip():
            logging.debug("Row %d: link already present, skip", r + 1)
            processed += 1
            if (updated - last_saved_updated) >= SAVE_AFTER_UPDATES or (processed - last_saved_processed) >= SAVE_AFTER_PROCESSED:
                logging.info("Autosave: %d new links, %d processed since last save", updated - last_saved_updated, processed - last_saved_processed)
                ods.save()
            last_saved_updated = updated
            last_saved_processed = processed
            continue

        plant_name = str(plant).strip()
        if not plant_name:
            logging.debug("Row %d: blank, skip", r + 1)
            processed += 1
            if (updated - last_saved_updated) >= SAVE_AFTER_UPDATES or (processed - last_saved_processed) >= SAVE_AFTER_PROCESSED:
                logging.info("Autosave: %d new links, %d processed since last save", updated - last_saved_updated, processed - last_saved_processed)
                ods.save()
                last_saved_updated = updated
                last_saved_processed = processed
            continue

        # Basic heuristic: ignore obvious headers
        if r == 0 and len(plant_name) <= 20 and plant_name.lower() in {"name", "latin", "latin name", "название", "латинское название"}:
            logging.debug("Row %d: header detected, skip", r + 1)
            processed += 1
            if (updated - last_saved_updated) >= SAVE_AFTER_UPDATES or (processed - last_saved_processed) >= SAVE_AFTER_PROCESSED:
                logging.info("Autosave: %d new links, %d processed since last save", updated - last_saved_updated, processed - last_saved_processed)
                ods.save()
                last_saved_updated = updated
                last_saved_processed = processed
            continue

        logging.info("Row %d: searching for '%s'", r + 1, plant_name)
        link = find_greeninfo_link(plant_name)

        # If >=2 words and not found, try fallback: search by first word only (explicitly)
        words = tokenize_latin(plant_name)
        if not link and len(words) >= 2:
            only_first = words[0]
            logging.debug("Row %d: retry by first word '%s'", r + 1, only_first)
            link = find_greeninfo_link(only_first)

        if link:
            ods.set_cell(r, COL_LINK, link)
            updated += 1
            time.sleep(0.4)
        processed += 1

        # Periodic save check
        if (updated - last_saved_updated) >= SAVE_AFTER_UPDATES or (processed - last_saved_processed) >= SAVE_AFTER_PROCESSED:
            logging.info("Autosave: %d new links, %d processed since last save", updated - last_saved_updated, processed - last_saved_processed)
            ods.save()
            last_saved_updated = updated
            last_saved_processed = processed

    # Final save
    ods.save()
    logging.info("Done. Processed: %d, Updated: %d", processed, updated)


def main(argv: Optional[List[str]] = None) -> None:
    parser = argparse.ArgumentParser(
        description="Заполняет в links.ods (столбец G) ссылки на страницы растений на greeninfo.ru, основываясь на названиях из столбца A."
    )
    parser.add_argument("ods_path", help="Путь к файлу .ods (например, links.ods)")
    parser.add_argument("--max-rows", type=int, default=None, help="Максимум обрабатываемых строк (с начала).")
    parser.add_argument("-v", "--verbose", action="store_true", help="Подробное логирование.")
    args = parser.parse_args(argv)

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(levelname)s: %(message)s",
    )

    try:
        process_file(args.ods_path, args.max_rows, args.verbose)
    except KeyboardInterrupt:
        logging.error("Прервано пользователем.")
        sys.exit(130)
    except Exception as e:
        logging.exception("Ошибка: %s", e)
        sys.exit(1)


if __name__ == "__main__":
    main()
