#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Unified pipeline for plant name enrichment.

This helper runs the existing translation/enrichment scripts sequentially so that
`plants.csv` (or a compatible dataset) receives the same updates as when each
script is invoked manually. It also understands `.ods` spreadsheets: they are
converted to a temporary CSV for processing and then updated in-place once all
stages succeed (a `.ods.bak` backup is created automatically).

Stages (in order):
1. `map_plants_ru.py`  – fill Russian names via iNaturalist.
2. `plantarium_fill_ru.py` – try Plantarium for the remaining Russian names.
3. `wikidata_fill_en.py` – fill English names via Wikidata.
4. `nl_names.py` – fill Dutch names and families from a CSV export.
5. `nl_names_nakt.py` – fill Dutch names from the Naktuinbouw Excel list.

Each stage can be skipped with command-line flags if the corresponding data or
network resources are unavailable. Options allow forwarding the most common
parameters to the underlying scripts.
"""
from __future__ import annotations

import argparse
import csv
import shutil
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path
from typing import Iterable, List, Sequence
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parent
ODS_NS = {
    "office": "urn:oasis:names:tc:opendocument:xmlns:office:1.0",
    "table": "urn:oasis:names:tc:opendocument:xmlns:table:1.0",
    "text": "urn:oasis:names:tc:opendocument:xmlns:text:1.0",
}


class StageError(RuntimeError):
    """Raised when one of the pipeline stages fails."""


def ensure_exists(path: Path, description: str) -> None:
    if not path.exists():
        raise FileNotFoundError(f"{description} not found: {path}")


def build_python_cmd(script: Path, *extra: str) -> List[str]:
    return [sys.executable, str(script), *extra]


def load_ods_rows(ods_path: Path) -> List[List[str]]:
    """Extract rows from the first sheet of an ODS workbook."""

    with zipfile.ZipFile(ods_path, "r") as zf:
        try:
            content = zf.read("content.xml")
        except KeyError as exc:  # pragma: no cover - defensive branch
            raise StageError(f"{ods_path} is missing content.xml") from exc

    root = ET.fromstring(content)
    table = root.find(".//table:table", ODS_NS)
    if table is None:  # pragma: no cover - unexpected structure
        raise StageError(f"{ods_path} does not contain a spreadsheet table")

    rows: List[List[str]] = []
    def iter_table_rows() -> Iterable[ET.Element]:
        for header in table.findall("table:table-header-rows", ODS_NS):
            for row in header.findall("table:table-row", ODS_NS):
                yield row
        for row in table.findall("table:table-row", ODS_NS):
            yield row

    for row in iter_table_rows():
        repeat = int(row.attrib.get(f"{{{ODS_NS['table']}}}number-rows-repeated", "1"))
        values: List[str] = []

        for cell in row:
            if cell.tag == f"{{{ODS_NS['table']}}}table-cell":
                text_parts = [
                    "".join(p.itertext())
                    for p in cell.findall("text:p", ODS_NS)
                ]
                value = "\n".join(part for part in text_parts if part)
                repeat_cols = int(
                    cell.attrib.get(
                        f"{{{ODS_NS['table']}}}number-columns-repeated", "1"
                    )
                )
                values.extend([value] * repeat_cols)
            elif cell.tag == f"{{{ODS_NS['table']}}}covered-table-cell":
                repeat_cols = int(
                    cell.attrib.get(
                        f"{{{ODS_NS['table']}}}number-columns-repeated", "1"
                    )
                )
                values.extend([""] * repeat_cols)

        if not values:
            values = [""]

        for _ in range(repeat):
            rows.append(values.copy())

    return rows


def write_csv(path: Path, rows: Sequence[Sequence[str]]) -> None:
    with path.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.writer(fh)
        for row in rows:
            writer.writerow(list(row))


def read_csv(path: Path) -> List[List[str]]:
    with path.open("r", encoding="utf-8", newline="") as fh:
        reader = csv.reader(fh)
        return [list(row) for row in reader]


def replace_ods_content(ods_path: Path, rows: Sequence[Sequence[str]]) -> None:
    """Update the first sheet of an ODS file with the provided rows."""

    with zipfile.ZipFile(ods_path, "r") as zin:
        infos = zin.infolist()
        payload = {info.filename: zin.read(info.filename) for info in infos}

    content_xml = payload.get("content.xml")
    if content_xml is None:  # pragma: no cover - defensive branch
        raise StageError(f"{ods_path} is missing content.xml")

    root = ET.fromstring(content_xml)
    table = root.find(".//table:table", ODS_NS)
    if table is None:  # pragma: no cover - defensive branch
        raise StageError(f"{ods_path} does not contain a spreadsheet table")

    # Remove existing table rows
    for header in list(table.findall("table:table-header-rows", ODS_NS)):
        table.remove(header)
    for row_el in list(table.findall("table:table-row", ODS_NS)):
        table.remove(row_el)

    max_cols = max((len(r) for r in rows), default=0)

    for row in rows:
        row_el = ET.Element(f"{{{ODS_NS['table']}}}table-row")
        padded = list(row) + [""] * (max_cols - len(row))
        for value in padded:
            cell_el = ET.Element(
                f"{{{ODS_NS['table']}}}table-cell",
                {f"{{{ODS_NS['office']}}}value-type": "string"},
            )
            text_el = ET.SubElement(cell_el, f"{{{ODS_NS['text']}}}p")
            if value:
                text_el.text = value
            row_el.append(cell_el)
        table.append(row_el)

    new_content = ET.tostring(root, encoding="utf-8", xml_declaration=True)

    with zipfile.ZipFile(ods_path, "w") as zout:
        for info in infos:
            data = new_content if info.filename == "content.xml" else payload[info.filename]
            new_info = zipfile.ZipInfo(info.filename)
            new_info.date_time = info.date_time
            new_info.compress_type = info.compress_type
            new_info.create_system = info.create_system
            new_info.flag_bits = info.flag_bits
            new_info.external_attr = info.external_attr
            new_info.internal_attr = info.internal_attr
            new_info.comment = info.comment
            new_info.extra = info.extra
            zout.writestr(new_info, data)


def run_stage(name: str, cmd: List[str]) -> None:
    print(f"\n=== {name} ===")
    print(" ".join(cmd))
    proc = subprocess.run(cmd, check=False)
    if proc.returncode != 0:
        raise StageError(f"Stage '{name}' failed with exit code {proc.returncode}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run the translation/enrichment pipeline on plants.csv"
    )
    parser.add_argument(
        "plants_csv",
        type=Path,
        help="Path to plants.csv (will be modified in place unless scripts use --output)",
    )
    parser.add_argument(
        "--dutch-csv",
        type=Path,
        default=ROOT / "dutch_names.csv",
        help="Path to dutch_names.csv (defaults to bundled dutch_names.csv)",
    )
    parser.add_argument(
        "--nakt-xlsx",
        type=Path,
        default=ROOT / "Naktuinbouw_Standaardlijst.xlsx",
        help="Path to the Naktuinbouw Excel file",
    )
    parser.add_argument(
        "--skip-inat",
        action="store_true",
        help="Skip the iNaturalist Russian name stage",
    )
    parser.add_argument(
        "--inat-delay",
        type=float,
        default=0.3,
        help="Delay between iNaturalist API requests (seconds)",
    )
    parser.add_argument(
        "--skip-plantarium",
        action="store_true",
        help="Skip the Plantarium Russian name stage",
    )
    parser.add_argument(
        "--plantarium-passes",
        type=int,
        default=2,
        help="Number of Plantarium passes over empty rows",
    )
    parser.add_argument(
        "--plantarium-sleep",
        type=float,
        default=0.25,
        help="Sleep between Plantarium requests (seconds)",
    )
    parser.add_argument(
        "--skip-wikidata",
        action="store_true",
        help="Skip the Wikidata English name stage",
    )
    parser.add_argument(
        "--wikidata-batch",
        type=int,
        default=25,
        help="Batch size for Wikidata SPARQL lookups",
    )
    parser.add_argument(
        "--wikidata-passes",
        type=int,
        default=2,
        help="Number of passes for Wikidata lookups",
    )
    parser.add_argument(
        "--wikidata-sleep",
        type=float,
        default=0.2,
        help="Sleep between Wikidata batches (seconds)",
    )
    parser.add_argument(
        "--skip-dutch-csv",
        action="store_true",
        help="Skip importing Dutch names from dutch_names.csv",
    )
    parser.add_argument(
        "--skip-dutch-nakt",
        action="store_true",
        help="Skip importing Dutch names from the Naktuinbouw Excel list",
    )
    parser.add_argument(
        "--create-backups",
        action="store_true",
        help="Forward the --backup flag to Plantarium and Wikidata stages",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    ensure_exists(args.plants_csv, "plants file")

    plants_csv = args.plants_csv
    temp_dir: tempfile.TemporaryDirectory[str] | None = None
    backup_path: Path | None = None

    if plants_csv.suffix.lower() == ".ods":
        print(
            f"Detected ODS spreadsheet: {plants_csv}. Converting to a temporary CSV for processing..."
        )
        temp_dir = tempfile.TemporaryDirectory()
        temp_csv = Path(temp_dir.name) / "plants.csv"
        rows = load_ods_rows(plants_csv)
        write_csv(temp_csv, rows)
        plants_csv = temp_csv
        backup_path = args.plants_csv.with_suffix(args.plants_csv.suffix + ".bak")
        if backup_path.exists():
            raise StageError(
                f"Backup file already exists: {backup_path}. "
                "Please remove or rename it before running the pipeline."
            )

    try:
        if not args.skip_inat:
            script = ROOT / "map_plants_ru.py"
            ensure_exists(script, "map_plants_ru.py")
            run_stage(
                "iNaturalist (Russian names)",
                build_python_cmd(
                    script,
                    str(plants_csv),
                    "--delay",
                    str(max(args.inat_delay, 0.0)),
                ),
            )

        if not args.skip_plantarium:
            script = ROOT / "plantarium_fill_ru.py"
            ensure_exists(script, "plantarium_fill_ru.py")
            cmd = build_python_cmd(
                script,
                str(plants_csv),
                "--passes",
                str(max(1, args.plantarium_passes)),
                "--sleep",
                str(max(args.plantarium_sleep, 0.0)),
            )
            if args.create_backups:
                cmd.append("--backup")
            run_stage("Plantarium (Russian names)", cmd)

        if not args.skip_wikidata:
            script = ROOT / "wikidata_fill_en.py"
            ensure_exists(script, "wikidata_fill_en.py")
            cmd = build_python_cmd(
                script,
                str(plants_csv),
                "--batch",
                str(max(1, args.wikidata_batch)),
                "--passes",
                str(max(1, args.wikidata_passes)),
                "--sleep",
                str(max(args.wikidata_sleep, 0.0)),
            )
            if args.create_backups:
                cmd.append("--backup")
            run_stage("Wikidata (English names)", cmd)

        if not args.skip_dutch_csv:
            ensure_exists(args.dutch_csv, "dutch_names.csv")
            if args.dutch_csv.suffix.lower() == ".ods":
                raise StageError(
                    f"{args.dutch_csv} looks like an ODS spreadsheet. "
                    "Export it to CSV (e.g. dutch_names.csv) or pass --skip-dutch-csv."
                )
            script = ROOT / "nl_names.py"
            ensure_exists(script, "nl_names.py")
            run_stage(
                "Dutch CSV names",
                build_python_cmd(
                    script,
                    str(plants_csv),
                    str(args.dutch_csv),
                ),
            )

        if not args.skip_dutch_nakt:
            script = ROOT / "nl_names_nakt.py"
            ensure_exists(script, "nl_names_nakt.py")
            ensure_exists(args.nakt_xlsx, "Naktuinbouw Excel file")
            run_stage(
                "Naktuinbouw Excel names",
                build_python_cmd(
                    script,
                    str(plants_csv),
                    str(args.nakt_xlsx),
                ),
            )

    except (StageError, FileNotFoundError) as exc:
        print(f"\nPipeline aborted: {exc}", file=sys.stderr)
        sys.exit(1)

    else:
        if args.plants_csv.suffix.lower() == ".ods":
            assert backup_path is not None
            shutil.copy2(args.plants_csv, backup_path)
            updated_rows = read_csv(plants_csv)
            replace_ods_content(args.plants_csv, updated_rows)
            print(
                f"\nUpdated {args.plants_csv} using pipeline results (backup saved to {backup_path})."
            )
    finally:
        if temp_dir is not None:
            temp_dir.cleanup()

    print("\nPipeline completed successfully.")


if __name__ == "__main__":
    main()
