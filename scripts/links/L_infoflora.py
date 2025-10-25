import argparse
import logging
import math
import re
import sys
from typing import Optional, List
import pandas as pd
import requests
from urllib.parse import quote_plus

# ----------- HTTP session -----------
SESSION = requests.Session()
SESSION.headers.update({
    "User-Agent": "Mozilla/5.0 (compatible; InfofloraLinker/1.0; +https://example.com)"
})
REQUEST_TIMEOUT = 5  # seconds

# ----------- Utilities -----------
def is_empty(val) -> bool:
    if val is None:
        return True
    if isinstance(val, float) and math.isnan(val):
        return True
    if isinstance(val, str) and val.strip() == "":
        return True
    return False

def word_count(name: str) -> int:
    return len(re.findall(r"\S+", name.strip()))

def normalize_name(name: str) -> str:
    """
    Убираем лишние пробелы, заменяем спецсимвол × на x.
    """
    name = name.strip()
    name = re.sub(r"\s+", " ", name)
    name = name.replace("×", "x")
    return name

def slugify_latin_name(name: str) -> str:
    """
    Переводим в формат, похожий на URL infoflora:
    - нижний регистр
    - латинские буквы/цифры/дефисы
    - пробелы -> дефисы
    - убираем точки и лишние символы (оставляем '-', цифры, a-z)
    """
    name = normalize_name(name)
    # чаще всего подходит первые два слова (род + вид)
    parts = name.split()
    base = " ".join(parts[:2]) if len(parts) >= 2 else name
    base = base.lower()
    base = base.replace("’", "").replace("'", "")
    base = re.sub(r"[.,;:()]", "", base)
    base = re.sub(r"\s+", "-", base)
    base = re.sub(r"[^a-z0-9\-]", "", base)
    base = re.sub(r"-{2,}", "-", base).strip("-")
    return base

def candidate_slugs(name: str) -> List[str]:
    """
    Формируем несколько вариантов слага:
    - первые два слова
    - все слова (иногда нужно)
    """
    name = normalize_name(name).lower()
    name_clean = re.sub(r"[’']", "", name).replace("×", "x")
    # вариант 1: genus + species
    parts = name_clean.split()
    s1 = slugify_latin_name(name_clean)
    cands = [s1]
    if len(parts) > 2:
        # вариант 2: все слова
        s2 = re.sub(r"[.,;:()]", "", name_clean)
        s2 = re.sub(r"\s+", "-", s2)
        s2 = re.sub(r"[^a-z0-9\-]", "", s2).strip("-")
        if s2 and s2 != s1:
            cands.append(s2)
    # уникализируем, сохраняем порядок
    seen = set()
    out = []
    for s in cands:
        if s and s not in seen:
            seen.add(s)
            out.append(s)
    return out

def try_direct_infoflora(name: str) -> Optional[str]:
    """
    Пробуем прямые ссылки:
    https://www.infoflora.ch/{lang}/flora/{slug}.html
    где lang в [en, de, fr, it]
    """
    langs = ["en", "de", "fr", "it"]
    slugs = candidate_slugs(name)
    for lang in langs:
        for slug in slugs:
            url = f"https://www.infoflora.ch/{lang}/flora/{slug}.html"
            try:
                logging.debug(f"Try direct URL: {url}")
                r = SESSION.get(url, timeout=REQUEST_TIMEOUT, allow_redirects=True)
                if r.status_code == 200 and "/flora/" in r.url and r.url.endswith(".html"):
                    logging.info(f"Direct hit: {r.url}")
                    return r.url
                else:
                    logging.debug(f"Direct miss [{r.status_code}]: {url}")
            except requests.RequestException as e:
                logging.debug(f"Direct error for {url}: {e}")
                continue
    return None

def try_duckduckgo(name: str) -> Optional[str]:
    """
    Резервный поиск через DuckDuckGo (html endpoint).
    Берём первый результат, ведущий на /flora/...*.html
    """
    query = f"site:infoflora.ch {name}"
    url = f"https://duckduckgo.com/html/?q={quote_plus(query)}"
    try:
        logging.debug(f"DDG query: {url}")
        r = SESSION.get(url, timeout=REQUEST_TIMEOUT)
        if r.status_code != 200:
            logging.debug(f"DDG status {r.status_code}")
            return None
        # На странице ссылки в <a class="result__a" href="...">
        # Также могут быть редиректы через duckduckgo.com/l/?uddg=...
        links = re.findall(r'href="([^"]+)"', r.text)
        candidates = []
        for href in links:
            # раскодируем uddg-переадресации
            m = re.search(r"uddg=([^&]+)", href)
            if m:
                try:
                    from urllib.parse import unquote
                    href = unquote(m.group(1))
                except Exception:
                    pass
            if "infoflora.ch" in href and "/flora/" in href and href.endswith(".html"):
                candidates.append(href)
        # немного приоритезируем по наличию слага
        slugs = candidate_slugs(name)
        def score(h: str) -> int:
            s = 0
            for slug in slugs:
                if slug in h:
                    s += 2
            if "/en/" in h:
                s += 1
            return -s  # чем выше, тем раньше
        candidates = sorted(set(candidates), key=score)
        if candidates:
            logging.info(f"DDG hit: {candidates[0]}")
            return candidates[0]
    except requests.RequestException as e:
        logging.debug(f"DDG error: {e}")
    return None

def find_infoflora_url(name: str) -> Optional[str]:
    name = normalize_name(name)
    logging.info(f"Searching for: {name}")
    url = try_direct_infoflora(name)
    if url:
        return url
    url = try_duckduckgo(name)
    return url

# ----------- I/O with ODS -----------
def load_ods(path: str) -> pd.DataFrame:
    logging.info(f"Loading ODS: {path}")
    # первая вкладка по умолчанию
    return pd.read_excel(path, engine="odf")

def save_ods(df: pd.DataFrame, path: str) -> None:
    logging.info(f"Writing back to ODS: {path}")
    # перезаписываем файл тем же именем; другие столбцы сохраняются
    with pd.ExcelWriter(path, engine="odf") as writer:
        df.to_excel(writer, index=False)

# ----------- Main routine -----------
def process_file(path: str, max_rows: Optional[int] = None) -> None:
    df = load_ods(path)

    # гарантируем наличие нужных столбцов
    # столбец A -> индекс 0, столбец E -> индекс 4
    # если датафрейм уже с именованными колонками, работаем по позиции
    if df.shape[1] < 5:
        logging.error("File must have at least 5 columns (A..E).")
        sys.exit(1)

    processed = 0
    updated = 0
    skipped_filled = 0
    skipped_short = 0
    failed = 0

    n_rows = len(df) if max_rows is None else min(len(df), max_rows)
    logging.info(f"Rows to check: {n_rows}")

    for idx in range(n_rows):
        name_cell = df.iat[idx, 0]
        link_cell = df.iat[idx, 4] if df.shape[1] >= 5 else None

        if not is_empty(link_cell):
            skipped_filled += 1
            logging.debug(f"Row {idx}: link already present, skip.")
            continue

        if is_empty(name_cell):
            skipped_short += 1
            logging.debug(f"Row {idx}: empty name, skip.")
            continue

        name_str = str(name_cell).strip()
        if word_count(name_str) < 2:
            skipped_short += 1
            logging.debug(f"Row {idx}: single word '{name_str}', skip.")
            continue

        processed += 1
        url = find_infoflora_url(name_str)
        if url:
            df.iat[idx, 4] = url
            updated += 1
            logging.info(f"Row {idx}: set URL -> {url}")
        else:
            failed += 1
            logging.warning(f"Row {idx}: not found -> '{name_str}'")

    # сохраняем изменения, даже если ни одной ссылки не найдено (но файл не будет повреждён)
    save_ods(df, path)

    logging.info("Done.")
    logging.info(f"Processed: {processed}, Updated: {updated}, "
                 f"Skipped (filled): {skipped_filled}, Skipped (empty/1-word): {skipped_short}, "
                 f"Not found: {failed}")

def parse_args(argv=None):
    p = argparse.ArgumentParser(
        description="Fill links to infoflora.ch for Latin plant names from links.ods"
    )
    p.add_argument("path", help="Path to links.ods")
    p.add_argument("--max-rows", type=int, default=None, help="Limit number of processed rows")
    p.add_argument("-v", "--verbose", action="store_true", help="Verbose logging")
    return p.parse_args(argv)

def main():
    args = parse_args()
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(levelname)s: %(message)s"
    )
    try:
        process_file(args.path, args.max_rows)
    except Exception as e:
        logging.error(f"Fatal error: {e}")
        sys.exit(2)

if __name__ == "__main__":
    main()
