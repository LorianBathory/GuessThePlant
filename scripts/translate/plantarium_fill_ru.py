#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Заполняет русские названия растений (столбец ru) в CSV по латинским названиям (столбец sci),
используя сайт https://www.plantarium.ru/.

Версия 2 — улучшения:
- Нормализация латинских названий (регистр, пробелы).
- Поддержка гибридного знака: пробует варианты "Genus × species" и "Genus x species".
- Расширенный поиск: equal → begin → part.
- Предпочтение страниц таксонов (/page/view/item/NNNNN.html) в выдаче.
- Защита от ложных срабатываний вроде «Синонимы», «Систематика» и т. п.
"""

import argparse
import csv
import sys
import time
from typing import List, Dict, Tuple, Optional
import re
import shutil
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from urllib.parse import urlencode, quote_plus
from bs4 import BeautifulSoup

BASE = "https://www.plantarium.ru"
SEARCH = f"{BASE}/page/search.html"
UA = "Plantarium-RU-Filler/2.0 (+https://example.org)"
REQ_SLEEP = 0.25

RANK_WORDS = (
    "род", "вид", "семейство", "подсемейство", "триба", "секция",
    "подсекция", "подрод", "класс", "отряд", "группа", "раздел"
)
RANK_ABBR = ("сем.", "подсем.", "подр.", "секц.", "подсекц.", "тр.")
STOP_BAD = {"синонимы", "синоним", "систематика", "описание", "примечания", "литература", "распространение", "экология"}
RUS_CHARS = r"А-Яа-яЁё"

def eprint(*args, **kwargs):
    print(*args, file=sys.stderr, **kwargs)

def make_session() -> requests.Session:
    s = requests.Session()
    s.headers.update({"User-Agent": UA})
    retry = Retry(
        total=5,
        backoff_factor=0.5,
        status_forcelist=(429, 500, 502, 503, 504),
        allowed_methods=frozenset(["GET"]),
        raise_on_status=False,
    )
    s.mount("https://", HTTPAdapter(max_retries=retry))
    return s

def build_search_url(sample: str, match: str = "equal") -> str:
    params = {"match": match, "mode": "taxons", "sample": sample}
    return f"{SEARCH}?{urlencode(params, quote_via=quote_plus)}"

def norm_spaces(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()

def make_latin_variants(latin: str) -> List[str]:
    """Сгенерировать разумные варианты для поиска на Plantarium."""
    latin = norm_spaces(latin)
    tokens = latin.split(" ")
    variants = []
    # Базовый
    variants.append(latin)
    # Регистр: Genus species → Genus species(lower)
    if len(tokens) >= 2:
        genus = tokens[0].capitalize()
        species = tokens[1].lower()
        tail = tokens[2:]  # подвиды, авторы игнорируем в поиске
        base2 = norm_spaces(" ".join([genus, species] + tail))
        variants.append(base2)
        # Гибридные варианты
        variants.append(norm_spaces(f"{genus} × {species}"))
        variants.append(norm_spaces(f"{genus} x {species}"))
    # Только род (если пользователь дал вид, но вид не находится — поможет match=part)
    if tokens:
        variants.append(tokens[0].capitalize())
    # Без дубликатов, сохраняя порядок
    seen = set()
    out = []
    for v in variants:
        if v not in seen:
            out.append(v); seen.add(v)
    return out

def first_taxon_href_from_search(html: str, target_latin: str) -> Optional[str]:
    """Выбрать наиболее релевантную ссылку из результатов поиска."""
    soup = BeautifulSoup(html, "html.parser")
    # Сначала собираем ссылки на страницы таксонов (строгий паттерн)
    taxon_links = []
    other_links = []
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if not href.startswith("/"):
            continue
        text = a.get_text(" ", strip=True)
        if re.match(r"^/page/view/item/\d+\.html$", href):
            taxon_links.append((href, text))
        elif any(seg in href for seg in ["/taxon/", "/page/"]):
            other_links.append((href, text))

    # Нормализуем для сопоставления
    t_norm = norm_spaces(target_latin).lower()
    t_genus = t_norm.split(" ")[0] if t_norm else ""

    def score(link_text: str) -> int:
        s = 0
        lt = link_text.lower()
        if t_norm and t_norm in lt:
            s += 3
        if t_genus and t_genus in lt:
            s += 1
        # Бонус: в тексте присутствует кириллица и латиница — часто это заголовок таксона
        if re.search(rf"[{RUS_CHARS}]", link_text) and re.search(r"[A-Za-z]", link_text):
            s += 1
        return s

    candidates = taxon_links or other_links
    if not candidates:
        return None

    best = max(candidates, key=lambda ht: score(ht[1]))
    return BASE + best[0]

def cleanup_ru(s: str) -> str:
    if not s:
        return ""
    s = s.strip()
    s = re.sub(r"[\s,;:—–-]+$", "", s)
    s = re.sub(r'^[\(\["«]+', "", s)
    s = re.sub(r'[\)\]»"]+$', "", s)
    # Удаляем слова ранга в начале
    for _ in range(2):
        m = re.match(rf"^((?:{'|'.join(re.escape(x) for x in RANK_WORDS+RANK_ABBR)})\.?)\s+(.+)$", s, flags=re.IGNORECASE)
        if m:
            s = m.group(2).strip()
    s_low = s.lower()
    if s_low in STOP_BAD or s_low in RANK_WORDS or s_low.rstrip(".") in RANK_WORDS:
        return ""
    if not re.search(rf"[{RUS_CHARS}]", s):
        return ""
    if len(s) > 120:
        s = s[:120].rstrip()
    return s

def pick_ru_from_mixed(text: str, latin: str) -> Optional[str]:
    """Пытаемся вытащить русское название, опираясь на латинское."""
    latin_norm = norm_spaces(latin)
    # Вариант 1: «Русское — Latin»
    m = re.search(rf"([{RUS_CHARS}][{RUS_CHARS}\s\"'().,-]+?)\s+[–—-]\s*{re.escape(latin_norm)}\b", text)
    if m:
        cand = cleanup_ru(m.group(1))
        if cand:
            return cand
    # Вариант 2: «Русское Latin» (без тире)
    idx = text.find(latin_norm)
    if idx > 0:
        left = text[:idx]
        parts = re.findall(rf"[{RUS_CHARS}][{RUS_CHARS}\s\-\"'().,]{{1,120}}", left)
        if parts:
            cand = cleanup_ru(parts[-1])
            if cand:
                return cand
    # Вариант 3: «Latin — Русское»
    m = re.search(rf"{re.escape(latin_norm)}\b\s*[–—-]\s*([{RUS_CHARS}][{RUS_CHARS}\s\"'().,-]{{1,120}})", text)
    if m:
        cand = cleanup_ru(m.group(1))
        if cand:
            return cand
    # Вариант 4: «Latin (Русское)»
    m = re.search(rf"{re.escape(latin_norm)}\s*[\(\[]\s*([{RUS_CHARS}][{RUS_CHARS}\s\-]{{1,120}})[\)\]]", text)
    if m:
        cand = cleanup_ru(m.group(1))
        if cand:
            return cand
    return None

def extract_ru_name_from_taxon_page(html: str, target_latin: str) -> Optional[str]:
    soup = BeautifulSoup(html, "html.parser")
    # 1) h1
    h1 = soup.find("h1")
    if h1:
        name = pick_ru_from_mixed(h1.get_text(" ", strip=True), target_latin)
        if name:
            return name
    # 2) title
    if soup.title and soup.title.string:
        name = pick_ru_from_mixed(norm_spaces(soup.title.string), target_latin)
        if name:
            return name
    # 3) крупные элементы
    for tag in soup.find_all(["h2", "h3", "h4", "strong", "b"]):
        txt = tag.get_text(" ", strip=True)
        # Отсев служебных заголовков
        if txt.strip().lower() in STOP_BAD:
            continue
        name = pick_ru_from_mixed(txt, target_latin)
        if name:
            return name
    # 4) общий текст
    text = soup.get_text(" ", strip=True)
    name = pick_ru_from_mixed(text, target_latin)
    if name:
        return name
    return None

def read_csv_rows(path: str) -> Tuple[List[Dict[str, str]], List[str]]:
    with open(path, "r", encoding="utf-8-sig", newline="") as f:
        r = csv.DictReader(f)
        rows = [dict(row) for row in r]
        fields = r.fieldnames or []
    return rows, fields

def write_csv_rows(path: str, rows: List[Dict[str, str]], fieldnames: List[str]) -> None:
    with open(path, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        for row in rows:
            w.writerow(row)

def ensure_columns(fieldnames: List[str], sci_col: str, ru_col: str) -> List[str]:
    f = list(fieldnames)
    if sci_col not in f:
        raise SystemExit(f"Column '{sci_col}' not found in CSV header: {f}")
    if ru_col not in f:
        f.append(ru_col)
    return f

def fetch_ru_name(sess: requests.Session, latin: str) -> Optional[str]:
    # Перебор вариантов написания
    for sample in make_latin_variants(latin):
        # Три режима поиска
        for match in ("equal", "begin", "part"):
            url = build_search_url(sample, match=match)
            r = sess.get(url, timeout=30)
            if r.status_code != 200:
                continue
            href = first_taxon_href_from_search(r.text, sample)
            if not href:
                continue
            rp = sess.get(href, timeout=30)
            if rp.status_code != 200:
                continue
            ru = extract_ru_name_from_taxon_page(rp.text, sample)
            if ru:
                ru = cleanup_ru(ru)
                if ru:
                    return ru
            time.sleep(REQ_SLEEP)
    return None

def process_pass(sess: requests.Session, rows: List[Dict[str, str]], sci_col: str, ru_col: str, sleep: float) -> int:
    filled = 0
    for i, row in enumerate(rows):
        latin = (row.get(sci_col) or "").strip()
        ru_val = (row.get(ru_col) or "").strip()
        if not latin or ru_val:
            continue
        try:
            ru = fetch_ru_name(sess, latin)
        except requests.RequestException as ex:
            eprint(f"[{i}] network error for '{latin}': {ex}")
            ru = None
        if ru:
            rows[i][ru_col] = ru
            filled += 1
            eprint(f"[{i}] {latin} -> {ru}")
        else:
            eprint(f"[{i}] {latin} -> not found")
        time.sleep(sleep)
    return filled

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("csv_path", help="Path to plants.csv")
    ap.add_argument("--sci-col", default="sci", help="CSV column with scientific names")
    ap.add_argument("--ru-col", default="ru", help="CSV column to fill with Russian names")
    ap.add_argument("--passes", type=int, default=2, help="How many passes over still-empty cells")
    ap.add_argument("--sleep", type=float, default=REQ_SLEEP, help="Pause between requests (seconds)")
    ap.add_argument("--output", default=None, help="Write to a separate CSV instead of in-place update")
    ap.add_argument("--backup", action="store_true", help="Create .bak backup when writing in-place")
    args = ap.parse_args()

    rows, fieldnames = read_csv_rows(args.csv_path)
    fieldnames = ensure_columns(fieldnames, args.sci_col, args.ru_col)

    if args.output:
        out_path = args.output
    else:
        out_path = args.csv_path
        if args.backup:
            bak = args.csv_path + ".bak"
            shutil.copyfile(args.csv_path, bak)
            eprint(f"Backup created: {bak}")

    sess = make_session()

    total = 0
    for p in range(1, max(1, args.passes) + 1):
        eprint(f"Pass {p}...")
        added = process_pass(sess, rows, args.sci_col, args.ru_col, sleep=max(0.0, args.sleep))
        total += added
        eprint(f"Pass {p}: filled {added}.")
        if added == 0:
            break

    write_csv_rows(out_path, rows, fieldnames)
    eprint(f"Done. Wrote: {out_path}. Newly filled: {total}. Rows total: {len(rows)}")

if __name__ == "__main__":
    main()
