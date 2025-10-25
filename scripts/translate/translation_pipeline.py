#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Unified pipeline for plant name enrichment.

This helper runs the existing translation/enrichment scripts sequentially so that
`plants.csv` (or a compatible dataset) receives the same updates as when each
script is invoked manually.

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
import subprocess
import sys
from pathlib import Path
from typing import List

ROOT = Path(__file__).resolve().parent


class StageError(RuntimeError):
    """Raised when one of the pipeline stages fails."""


def ensure_exists(path: Path, description: str) -> None:
    if not path.exists():
        raise FileNotFoundError(f"{description} not found: {path}")


def build_python_cmd(script: Path, *extra: str) -> List[str]:
    return [sys.executable, str(script), *extra]


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

    ensure_exists(args.plants_csv, "plants.csv")

    try:
        if not args.skip_inat:
            script = ROOT / "map_plants_ru.py"
            ensure_exists(script, "map_plants_ru.py")
            run_stage(
                "iNaturalist (Russian names)",
                build_python_cmd(
                    script,
                    str(args.plants_csv),
                    "--delay",
                    str(max(args.inat_delay, 0.0)),
                ),
            )

        if not args.skip_plantarium:
            script = ROOT / "plantarium_fill_ru.py"
            ensure_exists(script, "plantarium_fill_ru.py")
            cmd = build_python_cmd(
                script,
                str(args.plants_csv),
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
                str(args.plants_csv),
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
                    str(args.plants_csv),
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
                    str(args.plants_csv),
                    str(args.nakt_xlsx),
                ),
            )

    except (StageError, FileNotFoundError) as exc:
        print(f"\nPipeline aborted: {exc}", file=sys.stderr)
        sys.exit(1)

    print("\nPipeline completed successfully.")


if __name__ == "__main__":
    main()
