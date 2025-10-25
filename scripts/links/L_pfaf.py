
import argparse
import logging
import sys
import time
import re
from urllib.parse import quote_plus, urljoin, urlparse, parse_qs
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import pandas as pd
from bs4 import BeautifulSoup

PFAF_BASE = "https://pfaf.org"
TIMEOUT = 5  # seconds
HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; pfaf-linker/1.0; +https://example.org)"
}

def make_session():
    s = requests.Session()
    retries = Retry(
        total=3,
        connect=2,
        read=2,
        backoff_factor=0.6,
        status_forcelist=(429, 500, 502, 503, 504),
        allowed_methods=frozenset(["GET"])
    )
    s.mount("https://", HTTPAdapter(max_retries=retries))
    s.headers.update(HEADERS)
    return s

def is_multitoken_latin(name: str) -> bool:
    if not name:
        return False
    cleaned = " ".join(name.strip().split())
    tokens = [t for t in cleaned.split(" ") if re.search(r"[A-Za-z]", t)]
    return len(tokens) >= 2

def normalize_query(name: str) -> str:
    n = re.sub(r"[××]", " ", name)
    n = re.sub(r"\s+", " ", n).strip()
    return n

def looks_like_plant_page(html: str, query_words):
    soup = BeautifulSoup(html, "html.parser")
    title = (soup.title.get_text(strip=True) if soup.title else "").lower()
    h1 = ""
    h = soup.find(["h1", "h2"])
    if h:
        h1 = h.get_text(" ", strip=True).lower()
    text = (title + " " + h1)
    hits = sum(1 for w in query_words if w in text)
    return hits >= max(1, len(query_words) - 1)

def direct_link(session: requests.Session, latin_name: str) -> str | None:
    query = normalize_query(latin_name)
    url = f"{PFAF_BASE}/user/Plant.aspx?LatinName={quote_plus(query)}"
    try:
        r = session.get(url, timeout=TIMEOUT, allow_redirects=True)
    except requests.RequestException:
        return None
    if r.status_code != 200:
        return None
    qw = [w.lower() for w in query.split()]
    if "Plant.aspx?LatinName=" in r.url and looks_like_plant_page(r.text, qw):
        return r.url
    parsed = urlparse(r.url)
    if parsed.path.endswith("/user/Plant.aspx"):
        latin = parse_qs(parsed.query).get("LatinName", [""])[0]
        if latin:
            if looks_like_plant_page(r.text, [w.lower() for w in latin.split()]):
                return r.url
    return None

def search_results_link(session: requests.Session, latin_name: str) -> str | None:
    query = normalize_query(latin_name)
    candidates = [
        f"{PFAF_BASE}/user/DatabaseSearched.aspx?LatinName={quote_plus(query)}",
        f"{PFAF_BASE}/user/DatabaseSearch.aspx?LatinName={quote_plus(query)}",
    ]
    for url in candidates:
        try:
            r = session.get(url, timeout=TIMEOUT, allow_redirects=True)
        except requests.RequestException:
            continue
        if r.status_code != 200:
            continue
        soup = BeautifulSoup(r.text, "html.parser")
        links = []
        for a in soup.find_all("a", href=True):
            href = a["href"]
            if "Plant.aspx?LatinName=" in href:
                links.append(urljoin(PFAF_BASE, href))
        if not links:
            continue
        q = query.lower()
        def score(u: str) -> float:
            parsed = urlparse(u)
            latin = parse_qs(parsed.query).get("LatinName", [""])[0].lower()
            qw = set(q.split())
            lw = set(latin.split())
            common = len(qw & lw)
            penalty = abs(len(latin) - len(q))
            return common * 10 - penalty
        links.sort(key=score, reverse=True)
        try:
            rr = session.get(links[0], timeout=TIMEOUT, allow_redirects=True)
            if rr.status_code == 200 and looks_like_plant_page(rr.text, [w.lower() for w in query.split()]):
                return rr.url
        except requests.RequestException:
            pass
    return None

def find_pfaf_link(session: requests.Session, latin_name: str) -> str | None:
    link = direct_link(session, latin_name)
    if link:
        return link
    link = search_results_link(session, latin_name)
    if link:
        return link
    return None

def main():
    parser = argparse.ArgumentParser(
        description="Заполняет столбец F файла .ods ссылками на страницы растений с pfaf.org."
    )
    parser.add_argument("ods_path", help="Путь к файлу .ods (например, links.ods)")
    parser.add_argument("--max-rows", type=int, default=None, help="Максимум обрабатываемых строк")
    parser.add_argument("-v", "--verbose", action="store_true", help="Подробный лог")
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)s: %(message)s",
        datefmt="%H:%M:%S",
    )

    ods_path = args.ods_path
    logging.info(f"Чтение файла: {ods_path}")

    try:
        df = pd.read_excel(ods_path, engine="odf", header=0)
    except Exception as e:
        logging.error(f"Не удалось прочитать .ods: {e}")
        sys.exit(1)

    if df.shape[1] <= 5:
        for _ in range(6 - df.shape[1]):
            df[f"_tmp_{_}"] = pd.NA

    session = make_session()

    processed = 0
    updated_rows = 0

    total_rows = len(df)
    logging.info(f"Строк в таблице: {total_rows}")

    col_name_A = df.columns[0]
    col_name_F = df.columns[5]

    for idx, row in df.iterrows():
        if args.max_rows is not None and processed >= args.max_rows:
            break

        name = str(row[col_name_A]).strip() if pd.notna(row[col_name_A]) else ""
        existing = str(row[col_name_F]).strip() if pd.notna(row[col_name_F]) else ""

        if not is_multitoken_latin(name):
            logging.debug(f"[{idx}] Пропуск: '{name}' — пусто/одно слово")
            processed += 1
            continue

        if existing and existing.lower() != "nan":
            logging.debug(f"[{idx}] Пропуск: столбец F уже заполнен: {existing}")
            processed += 1
            continue

        logging.info(f"[{idx}] Поиск: {name}")
        link = find_pfaf_link(session, name)

        if link:
            df.at[idx, col_name_F] = link
            updated_rows += 1
            logging.info(f"[{idx}] Найдено: {link}")
        else:
            logging.warning(f"[{idx}] Не найдено на pfaf.org")

        processed += 1
        time.sleep(0.2)

    logging.info(f"Обновлено строк: {updated_rows}. Сохранение файла...")

    try:
        with pd.ExcelWriter(ods_path, engine="odf", mode="w") as writer:
            df.to_excel(writer, index=False)
    except Exception as e:
        logging.error(f"Не удалось записать .ods: {e}")
        sys.exit(1)

    logging.info("Готово.")

if __name__ == "__main__":
    main()
