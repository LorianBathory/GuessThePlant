#!/usr/bin/env python3
"""Synchronise links.ods Latin names with PlantData.csv."""
from __future__ import annotations

import argparse
import csv
import os
import re
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path
from typing import Iterable, List, Sequence, Tuple
import xml.etree.ElementTree as ET

from name_utils import canonical_name_key

# Namespaces used in ODF content.xml files
NAMESPACES = {
    "office": "urn:oasis:names:tc:opendocument:xmlns:office:1.0",
    "table": "urn:oasis:names:tc:opendocument:xmlns:table:1.0",
    "text": "urn:oasis:names:tc:opendocument:xmlns:text:1.0",
    "style": "urn:oasis:names:tc:opendocument:xmlns:style:1.0",
    "fo": "urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0",
    "meta": "urn:oasis:names:tc:opendocument:xmlns:meta:1.0",
    "number": "urn:oasis:names:tc:opendocument:xmlns:datastyle:1.0",
    "draw": "urn:oasis:names:tc:opendocument:xmlns:drawing:1.0",
    "svg": "urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0",
    "dc": "http://purl.org/dc/elements/1.1/",
    "xlink": "http://www.w3.org/1999/xlink",
    "chart": "urn:oasis:names:tc:opendocument:xmlns:chart:1.0",
    "dr3d": "urn:oasis:names:tc:opendocument:xmlns:dr3d:1.0",
    "math": "http://www.w3.org/1998/Math/MathML",
    "form": "urn:oasis:names:tc:opendocument:xmlns:form:1.0",
    "script": "urn:oasis:names:tc:opendocument:xmlns:script:1.0",
    "dom": "http://www.w3.org/2001/xml-events",
    "xforms": "http://www.w3.org/2002/xforms",
    "xsd": "http://www.w3.org/2001/XMLSchema",
    "xsi": "http://www.w3.org/2001/XMLSchema-instance",
}

for prefix, uri in NAMESPACES.items():
    ET.register_namespace(prefix, uri)


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Ensure scripts/links/links.ods Latin names match PlantData.csv order.",
    )
    parser.add_argument(
        "--plant-data",
        type=Path,
        default=Path(__file__).resolve().parents[2] / "PlantData.csv",
        help="Path to PlantData.csv (default: repository root)",
    )
    parser.add_argument(
        "--links-ods",
        type=Path,
        default=Path(__file__).resolve().parent / "links.ods",
        help="Path to links.ods (default: scripts/links/links.ods)",
    )
    return parser.parse_args(argv)


def read_plant_names(csv_path: Path) -> List[Tuple[int, str]]:
    names: List[Tuple[int, str]] = []
    with csv_path.open(newline="", encoding="utf-8") as fh:
        reader = csv.reader(fh)
        try:
            next(reader)
        except StopIteration:
            return names
        for row_index, row in enumerate(reader, start=2):
            if len(row) <= 4:
                names.append((row_index, ""))
                continue
            names.append((row_index, row[4].strip()))
    return names


def extract_namespace_declarations(xml_text: str) -> None:
    default_match = re.search(r"xmlns=\"([^\"]+)\"", xml_text)
    if default_match:
        ET.register_namespace("", default_match.group(1))
    for prefix, uri in re.findall(r"xmlns:([A-Za-z0-9_-]+)=\"([^\"]+)\"", xml_text):
        ET.register_namespace(prefix, uri)


def read_ods_rows(ods_path: Path) -> Tuple[List[List[str]], str]:
    with zipfile.ZipFile(ods_path) as archive:
        content_bytes = archive.read("content.xml")
        content_text = content_bytes.decode("utf-8")
    extract_namespace_declarations(content_text)
    root = ET.fromstring(content_text)
    ns = {"table": NAMESPACES["table"], "text": NAMESPACES["text"]}
    table_elem = root.find(".//table:table", ns)
    if table_elem is None:
        raise RuntimeError("Could not find table element in links.ods")
    rows: List[List[str]] = []
    for row in table_elem.findall("table:table-row", ns):
        cells: List[str] = []
        for cell in row.findall("table:table-cell", ns):
            repeat = int(cell.get(f"{{{NAMESPACES['table']}}}number-columns-repeated", "1"))
            texts = ["".join(text_part for text_part in p.itertext()) for p in cell.findall("text:p", ns)]
            value = "\n".join(texts)
            cells.extend([value] * repeat)
        rows.append(cells)
    return rows, content_text


def normalize_table(rows: Iterable[List[str]], column_count: int) -> List[List[str]]:
    normalized: List[List[str]] = []
    for row in rows:
        padded = list(row) + [""] * (column_count - len(row))
        normalized.append(padded[:column_count])
    return normalized


def build_updated_rows(
    header: List[str],
    existing_rows: List[List[str]],
    plant_rows: List[Tuple[int, str]],
    column_count: int,
) -> Tuple[List[List[str]], List[Tuple[int, str]], List[str]]:
    exact_rows: dict[str, List[str]] = {}
    normalised_index: dict[str, str] = {}

    def register_row(name: str, row: List[str]) -> None:
        if name in exact_rows:
            return
        exact_rows[name] = row
        norm = canonical_name_key(name)
        if norm and norm not in normalised_index:
            normalised_index[norm] = name

    def pop_row(name: str) -> List[str] | None:
        row = exact_rows.pop(name, None)
        if row is not None:
            norm = canonical_name_key(name)
            if norm and normalised_index.get(norm) == name:
                normalised_index.pop(norm, None)
        return row

    for row in existing_rows:
        if not row:
            continue
        key = row[0].strip()
        if key:
            register_row(key, list(row))

    updated_rows: List[List[str]] = [list(header)]
    new_entries: List[Tuple[int, str]] = []

    for csv_row_index, plant_name in plant_rows:
        row = pop_row(plant_name)
        if row is None:
            norm = canonical_name_key(plant_name)
            if norm:
                alt_key = normalised_index.pop(norm, None)
                if alt_key:
                    row = pop_row(alt_key)
        if row is None:
            row = [""] * column_count
            row[0] = plant_name
            new_entries.append((csv_row_index, plant_name))
        else:
            row = list(row) + [""] * (column_count - len(row))
            row = row[:column_count]
            row[0] = plant_name
        updated_rows.append(row)

    removed = sorted(exact_rows.keys())
    return updated_rows, new_entries, removed


def update_content_xml(content_text: str, rows: List[List[str]]) -> bytes:
    root = ET.fromstring(content_text)
    ns = {
        "table": NAMESPACES["table"],
        "text": NAMESPACES["text"],
        "office": NAMESPACES["office"],
    }
    table_elem = root.find(".//table:table", ns)
    if table_elem is None:
        raise RuntimeError("Could not find table element while writing links.ods")

    for row_elem in list(table_elem.findall("table:table-row", ns)):
        table_elem.remove(row_elem)

    for row in rows:
        row_elem = ET.Element(f"{{{ns['table']}}}table-row")
        for value in row:
            cell_attrs = {f"{{{ns['office']}}}value-type": "string"}
            if value:
                cell_attrs[f"{{{ns['office']}}}string-value"] = value
            cell_elem = ET.Element(f"{{{ns['table']}}}table-cell", cell_attrs)
            paragraphs = value.split("\n") if value else [""]
            for paragraph in paragraphs:
                text_elem = ET.Element(f"{{{ns['text']}}}p")
                if paragraph:
                    text_elem.text = paragraph
                cell_elem.append(text_elem)
            row_elem.append(cell_elem)
        table_elem.append(row_elem)

    return ET.tostring(root, encoding="UTF-8", xml_declaration=True)


def write_ods(ods_path: Path, new_content: bytes) -> None:
    with zipfile.ZipFile(ods_path) as archive:
        members = {name: archive.read(name) for name in archive.namelist() if name != "content.xml"}
    temp_dir = ods_path.parent
    temp_fd, temp_path = tempfile.mkstemp(
        suffix=".ods", prefix="links_sync_", dir=str(temp_dir)
    )
    os.close(temp_fd)
    temp_path_obj = Path(temp_path)
    try:
        with zipfile.ZipFile(temp_path_obj, "w") as archive:
            mimetype_data = members.get("mimetype")
            if mimetype_data is not None:
                archive.writestr("mimetype", mimetype_data, compress_type=zipfile.ZIP_STORED)
            for name, data in members.items():
                if name == "mimetype":
                    continue
                archive.writestr(name, data, compress_type=zipfile.ZIP_DEFLATED)
            archive.writestr("content.xml", new_content, compress_type=zipfile.ZIP_DEFLATED)
        temp_path_obj.replace(ods_path)
        temp_path_obj = None
    finally:
        if temp_path_obj is not None and temp_path_obj.exists():
            temp_path_obj.unlink()


def run_link_scripts(links_dir: Path, ods_path: Path) -> None:
    scripts = sorted(
        p for p in links_dir.iterdir() if p.suffix == ".py" and p.name != Path(__file__).name
    )
    for script_path in scripts:
        cmd = [sys.executable, str(script_path), str(ods_path)]
        print(f"Running {script_path.name} ...")
        subprocess.run(cmd, check=True, cwd=links_dir)


def main(argv: Sequence[str] | None = None) -> None:
    args = parse_args(argv)
    plant_rows = read_plant_names(args.plant_data)
    if not plant_rows:
        print("PlantData.csv appears to be empty or missing data.")
        return

    ods_rows, original_content_text = read_ods_rows(args.links_ods)
    if not ods_rows:
        raise RuntimeError("links.ods does not contain any rows")

    column_count = max((len(row) for row in ods_rows), default=0)
    if column_count == 0:
        raise RuntimeError("links.ods has no columns to process")
    normalized_original = normalize_table(ods_rows, column_count)
    header = normalized_original[0]
    existing_rows = normalized_original[1:]

    updated_rows, new_entries, removed_names = build_updated_rows(
        header, existing_rows, plant_rows, column_count
    )

    if normalize_table(updated_rows, column_count) == normalized_original:
        print("links.ods is already synchronised.")
        return

    new_content = update_content_xml(original_content_text, updated_rows)
    write_ods(args.links_ods, new_content)
    print(f"links.ods updated with {len(new_entries)} new entries.")
    if new_entries:
        formatted_new = []
        for csv_row_index, plant_name in new_entries:
            label = plant_name if plant_name else "<empty>"
            formatted_new.append(f"{csv_row_index}: {label}")
        print("Added entries (CSV row: name): " + "; ".join(formatted_new))
    if removed_names:
        print(
            "Removed entries not present in PlantData.csv: "
            + ", ".join(removed_names)
        )

    if new_entries:
        run_link_scripts(Path(__file__).resolve().parent, args.links_ods)


if __name__ == "__main__":
    main()
