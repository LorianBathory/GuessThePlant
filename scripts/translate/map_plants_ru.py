#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
map_plants_ru.py
Обновляет столбец 'ru' в исходном CSV (plants.csv) по латинскому названию из столбца 'sci',
используя iNaturalist API. Делает два прохода по пустым 'ru' (на случай временных сбоев API).

Пример:
    python map_plants_ru.py plants.csv
    python map_plants_ru.py plants.csv --delay 0.2

Вывод в терминале в формате:
    [14] Allium tuberosum -> Лук клубневой
или
    [14] Allium tuberosum -> [no ru name]

Требует: requests
"""
import csv
import sys
import time
import argparse
import logging
from typing import Optional, List, Dict
import requests

INAT_BASE = "https://api.inaturalist.org/v1/taxa"
HEADERS = {"User-Agent": "latin-ru-mapper/1.1 (+contact@example.com)"}

def fetch_russian_names(scientific_name: str, timeout: float = 20.0) -> List[str]:
    """
    Ищет русские вернакуляры через iNaturalist /v1/taxa с all_names=true и locale=ru.
    Возвращает список уникальных русских названий (может быть пустым).
    """
    params = {
        "q": scientific_name,
        "locale": "ru",
        "per_page": 10,
        "all_names": "true",
        "is_active": "true"
    }
    try:
        r = requests.get(INAT_BASE, params=params, headers=HEADERS, timeout=timeout)
        r.raise_for_status()
        data = r.json()
    except Exception as e:
        logging.debug("Request error for %s: %s", scientific_name, e)
        return []

    results = data.get("results", []) or []
    if not results:
        return []

    # Предпочитаем точное совпадение научного имени
    sci_lower = scientific_name.strip().lower()
    chosen = None
    for tx in results:
        if str(tx.get("name", "")).strip().lower() == sci_lower:
            chosen = tx
            break
    if chosen is None:
        chosen = results[0]

    names = chosen.get("names", []) or []

    # Фильтруем русские
    ru_names: List[str] = []
    for n in names:
        if (n.get("lexicon") == "Russian") and n.get("name"):
            val = str(n.get("name")).strip()
            if val and val not in ru_names:
                ru_names.append(val)

    # Если пусто, попробуем preferred_common_name и проверим на кириллицу
    if not ru_names:
        pref = chosen.get("preferred_common_name")
        if isinstance(pref, str) and pref.strip():
            if any("а" <= ch.lower() <= "я" or ch.lower() == "ё" for ch in pref):
                ru_names.append(pref.strip())

    return ru_names

def load_csv(path: str):
    with open(path, "r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames or []
        if "sci" not in fieldnames:
            print("ERROR: 'sci' column not found in CSV header.", file=sys.stderr)
            sys.exit(1)
        if "ru" not in fieldnames:
            fieldnames.append("ru")  # добавим столбец, если отсутствует
        rows = list(reader)
    return fieldnames, rows

def write_csv_inplace(path: str, fieldnames: List[str], rows: List[Dict[str, str]]):
    with open(path, "w", encoding="utf-8", newline="") as f_out:
        writer = csv.DictWriter(f_out, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            out_row = {fn: row.get(fn, "") for fn in fieldnames}
            writer.writerow(out_row)

def process_inplace(csv_path: str, delay: float = 0.3) -> None:
    fieldnames, rows = load_csv(csv_path)
    total = len(rows)

    # Два прохода по пустым 'ru'
    for pass_idx in range(2):
        for idx, row in enumerate(rows, start=1):
            sci_name = (row.get("sci") or "").strip()
            ru_name = (row.get("ru") or "").strip()

            if not sci_name:
                continue
            if ru_name:
                continue  # уже заполнено

            ru_candidates = fetch_russian_names(sci_name)
            if ru_candidates:
                chosen = ru_candidates[0]
                row["ru"] = chosen
                print(f"[{idx}] {sci_name} -> {chosen}")
            else:
                if pass_idx == 1:  # сообщаем окончательный итог только после второго прохода
                    print(f"[{idx}] {sci_name} -> [no ru name]")

            if delay > 0:
                time.sleep(delay)

    # Записываем обратно в тот же файл
    write_csv_inplace(csv_path, fieldnames, rows)
    # Итоговая статистика
    filled = sum(1 for r in rows if (r.get("ru") or "").strip())
    print(f"Done. Filled 'ru' for {filled}/{total}. Saved in-place: {csv_path}")

def main():
    parser = argparse.ArgumentParser(description="Обновляет столбец 'ru' в исходном CSV по 'sci' с помощью iNaturalist API (2 прохода).")
    parser.add_argument("input_csv", help="Путь к исходному CSV с колонками 'sci' и (опционально) 'ru'")
    parser.add_argument("--delay", type=float, default=0.3, help="Задержка между запросами к API в секундах (по умолчанию 0.3)")
    args = parser.parse_args()

    process_inplace(args.input_csv, delay=args.delay)

if __name__ == "__main__":
    main()
