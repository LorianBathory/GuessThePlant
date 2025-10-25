#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import csv
import time
import shutil
from collections import defaultdict
from pathlib import Path

def norm_sci(s: str) -> str:
    if s is None:
        return ""
    s = " ".join(s.strip().split())
    return s.lower()

def sniff_delimiter(path: Path, fallback=";"):
    sample = path.read_text(encoding="utf-8-sig", errors="replace")[:65536]
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=[",",";","\t","|"])
        return dialect.delimiter
    except Exception:
        return fallback

def lower_keys(d: dict):
    return { (k or "").strip().lower(): v for k, v in (d or {}).items() }

def load_dutch_map(dutch_csv_path: Path):
    """
    Ожидаемые поля (без учёта регистра/пробелов/BOM):
      scientificName, vernacularName, family
    """
    delim = sniff_delimiter(dutch_csv_path)
    print(f"[dutch] Использую разделитель: {repr(delim)}")

    names_map = defaultdict(set)
    family_map = {}

    with open(dutch_csv_path, "r", encoding="utf-8-sig", newline="") as f:
        reader = csv.reader(f, delimiter=delim)
        rows = list(reader)

    if not rows:
        print("Ошибка: dutch_names.csv пуст.")
        sys.exit(1)

    # нормализуем заголовки
    header = [ (h or "").strip().lstrip("\ufeff").lower() for h in rows[0] ]
    print(f"[dutch] Заголовки: {header}")

    try:
        idx_sci = header.index("scientificname")
        idx_nl  = header.index("vernacularname")
        idx_fam = header.index("family")
    except ValueError as e:
        print("Ошибка: в dutch_names.csv нет ожидаемых колонок: family, scientificName, vernacularName")
        sys.exit(1)

    for r in rows[1:]:
        # пропустим короткие строки
        if len(r) <= max(idx_sci, idx_nl, idx_fam):
            continue
        sci = norm_sci(r[idx_sci])
        nl  = (r[idx_nl] or "").strip()
        fam = (r[idx_fam] or "").strip()
        if not sci:
            continue
        if nl:
            names_map[sci].add(nl)
        if fam and sci not in family_map:
            family_map[sci] = fam

    return names_map, family_map

def backup_file(path: Path) -> Path:
    ts = time.strftime("%Y%m%d_%H%M%S")
    backup = path.with_name(f"{path.stem}_backup_{ts}{path.suffix}")
    shutil.copy2(str(path), str(backup))
    return backup

def main():
    if len(sys.argv) != 3:
        print("Usage: py -3 nl_names.py plants.csv dutch_names.csv")
        sys.exit(1)

    plants_path = Path(sys.argv[1])
    dutch_path  = Path(sys.argv[2])

    if not plants_path.exists():
        print(f"Не найден файл: {plants_path}"); sys.exit(1)
    if not dutch_path.exists():
        print(f"Не найден файл: {dutch_path}"); sys.exit(1)

    names_map, family_map = load_dutch_map(dutch_path)

    # читаем plants.csv (допустим любой разделитель)
    delim_plants = sniff_delimiter(plants_path, fallback=",")
    print(f"[plants] Использую разделитель: {repr(delim_plants)}")
    with open(plants_path, "r", encoding="utf-8-sig", newline="") as f:
        dr = csv.DictReader(f, delimiter=delim_plants)
        rows = list(dr)
        fieldnames = dr.fieldnames or []
    # нормализуем имена колонок для проверки
    lower_fields = [ (h or "").strip().lower() for h in fieldnames ]
    required = ["id","sci","ru","en","nl","family"]
    missing = [r for r in required if r not in lower_fields]
    if missing:
        print("Ошибка: в plants.csv отсутствуют колонки: " + ", ".join(missing))
        sys.exit(1)

    # создаём бэкап
    backup = backup_file(plants_path)
    print(f"Создан бэкап: {backup.name}")

    # карта: нормализованное имя колонки -> оригинальное имя (чтобы сохранить порядок и регистр)
    colmap = { (h or "").strip().lower(): h for h in fieldnames }

    updated_nl = 0
    updated_fam = 0

    for row in rows:
        sci_raw = row.get(colmap["sci"], "")
        key = norm_sci(sci_raw)

        # NL
        if (row.get(colmap["nl"]) or "").strip() == "" and key in names_map and names_map[key]:
            row[colmap["nl"]] = " | ".join(sorted(names_map[key], key=str.lower))
            updated_nl += 1

        # family
        if (row.get(colmap["family"]) or "").strip() == "" and key in family_map:
            row[colmap["family"]] = family_map[key]
            updated_fam += 1

    # пишем обратно plants.csv тем же разделителем и теми же заголовками
    with open(plants_path, "w", encoding="utf-8-sig", newline="") as f:
        dw = csv.DictWriter(f, fieldnames=fieldnames, delimiter=delim_plants)
        dw.writeheader()
        for row in rows:
            dw.writerow(row)

    print(f"Обновлено NL: {updated_nl}")
    print(f"Обновлено family: {updated_fam}")
    print("Готово.")

if __name__ == "__main__":
    main()