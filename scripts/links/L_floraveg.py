
# -*- coding: utf-8 -*-
"""
update_links_ods_with_mbg_v5.py

What's new in v5
----------------
- floraveg first tries the direct page: /taxon/overview/<name> (wait up to 5s).
  If URL stays on /taxon/overview/... we accept it as found (even if the title is generic).
- If not found: fall back to /taxon/list?q=...; then UI search at /taxon/.
- Detailed logging of attempted URLs and collected links.
- MBG still uses Google CSE; prefers PlantFinderDetails; supports one-word names.
- First row is always treated as headers; processing starts from row 2.
"""
from __future__ import annotations

import argparse
import time
import re
from urllib.parse import quote

import ezodf

# Selenium
from selenium import webdriver
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.firefox.options import Options as FirefoxOptions
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import WebDriverException, TimeoutException

FLO_BASE = "https://floraveg.eu"
FLO_LIST_TPL = FLO_BASE + "/taxon/list?q={query}"
FLO_TAXON_UI = FLO_BASE + "/taxon/"
FLO_OVERVIEW_PREFIX = FLO_BASE + "/taxon/overview/"
FLO_SEARCH_INPUT_SELECTORS = [
    "input[type='search']",
    "input[name='q']",
    "form input",
    "input",
]

# Google CSE for Missouri Botanical Garden
MBG_CSE_TPL = "https://cse.google.com/cse?cx=015816930756675652018:7gxyi5crvvu&q={query}&sa=Search&sitesearch=&width=800"

DEFAULT_SLEEP = 0.3
FLO_WAIT_SEC = 5.0
CSE_WAIT_SEC = 12.0


def latin_binomial_key(text: str) -> str:
    """Return 'genus species' key from a text in lower-case (used only for floraveg)."""
    if not text:
        return ""
    text = re.sub(r"\([^)]*\)", " ", text)
    text = text.replace("×", "x").replace("✕", "x")
    tokens = re.findall(r"[A-Za-z]+", text.lower())
    skip = {"subsp", "ssp", "var", "f", "forma", "subvar", "cv", "cultivar"}
    core = [t for t in tokens if t not in skip]
    return " ".join(core[:2]) if len(core) >= 2 else ""


def create_driver(browser="chrome", headless=True):
    """Create Selenium WebDriver (chrome|firefox)."""
    if browser.lower() == "chrome":
        opts = ChromeOptions()
        if headless:
            opts.add_argument("--headless=new")
        opts.add_argument("--no-sandbox")
        opts.add_argument("--disable-dev-shm-usage")
        opts.add_argument("--disable-gpu")
        opts.add_argument("--window-size=1280,900")
        opts.set_capability("pageLoadStrategy", "eager")
        return webdriver.Chrome(options=opts)
    else:
        opts = FirefoxOptions()
        if headless:
            opts.add_argument("--headless")
        return webdriver.Firefox(options=opts)


def get_page_title(driver):
    try:
        return (driver.title or "").strip()
    except Exception:
        return ""


# -------- floraveg helpers --------
def floraveg_collect_overview_links(driver) -> list[str]:
    """Collect all links to taxon overview currently visible on page."""
    anchors = driver.find_elements(By.CSS_SELECTOR, f"a[href^='{FLO_OVERVIEW_PREFIX}']")
    links = []
    for a in anchors:
        href = a.get_attribute("href") or ""
        if href and href.startswith(FLO_OVERVIEW_PREFIX):
            links.append(href)
    # deduplicate preserving order
    seen = set()
    uniq = []
    for h in links:
        if h not in seen:
            seen.add(h)
            uniq.append(h)
    return uniq


def try_floraveg_overview(driver, plant_name: str, verbose=False) -> str | None:
    """Try direct /taxon/overview/<name> with up to 5s wait. Accept if URL stays on overview."""
    # Encode spaces as %20; keep underscores as-is if already present
    encoded = quote(plant_name.strip(), safe="_")
    url = FLO_OVERVIEW_PREFIX + encoded
    try:
        if verbose:
            print("    floraveg: try overview URL:", url)
        driver.get(url)
        # Wait until URL starts with overview prefix (it should immediately), and give content time
        WebDriverWait(driver, FLO_WAIT_SEC).until(
            lambda d: d.current_url.startswith(FLO_OVERVIEW_PREFIX)
        )
        # Even if title is generic, accept the page as existing if we are still on overview/*
        title = get_page_title(driver)
        if verbose:
            print("    floraveg: overview title:", title)
        return driver.current_url
    except TimeoutException:
        if verbose:
            print("    floraveg: overview timed out (no stable overview URL).")
    except WebDriverException as e:
        if verbose:
            print("    floraveg overview error:", e)
    return None


def find_on_floraveg(driver, plant_name: str, verbose=False) -> str | None:
    """
    floraveg search flow:
      0) try direct overview /taxon/overview/<name>
      1) /taxon/list?q=<query> -> collect overview links -> first
      2) /taxon/ UI search -> first overview link
    Only attempt floraveg when the name is binomial (two words).
    """
    if len(plant_name.split()) < 2:
        if verbose:
            print("    floraveg: skipped (not binomial)")
        return None

    # Step 0: direct overview
    direct = try_floraveg_overview(driver, plant_name, verbose=verbose)
    if direct:
        return direct

    # Step 1: list search
    q = quote(plant_name.strip())
    list_url = FLO_LIST_TPL.format(query=q)
    try:
        if verbose:
            print("    floraveg: open list URL:", list_url)
        driver.get(list_url)
        WebDriverWait(driver, FLO_WAIT_SEC).until(
            lambda d: len(floraveg_collect_overview_links(d)) > 0
        )
        links = floraveg_collect_overview_links(driver)
        if verbose:
            print("    floraveg: list links:", links[:3], ("... total " + str(len(links)) if len(links) > 3 else ""))
        if links:
            return links[0]
    except TimeoutException:
        if verbose:
            print("    floraveg: no links found on list page (timeout).")
    except WebDriverException as e:
        if verbose:
            print("    floraveg list error:", e)

    # Step 2: fallback to UI search
    try:
        if verbose:
            print("    floraveg: open UI:", FLO_TAXON_UI)
        driver.get(FLO_TAXON_UI)
        input_el = None
        for sel in [
            "input[type='search']",
            "input[name='q']",
            "form input",
            "input",
        ]:
            try:
                input_el = WebDriverWait(driver, 2.0).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, sel))
                )
                if input_el:
                    if verbose:
                        print(f"    floraveg: found search input with selector: {sel!r}")
                    break
            except TimeoutException:
                continue

        if not input_el:
            if verbose:
                print("    floraveg: could not find search input on UI page.")
            return None

        from selenium.webdriver.common.keys import Keys
        input_el.clear()
        input_el.send_keys(plant_name)
        input_el.send_keys(Keys.ENTER)

        WebDriverWait(driver, FLO_WAIT_SEC).until(
            lambda d: len(floraveg_collect_overview_links(d)) > 0
        )
        links = floraveg_collect_overview_links(driver)
        if verbose:
            print("    floraveg: UI links:", links[:3], ("... total " + str(len(links)) if len(links) > 3 else ""))
        if links:
            return links[0]

    except TimeoutException:
        if verbose:
            print("    floraveg: no links found via UI (timeout).")
    except WebDriverException as e:
        if verbose:
            print("    floraveg UI error:", e)

    return None


# -------- MBG via Google CSE --------
def find_on_mbg_cse(driver, plant_name: str, verbose=False) -> str | None:
    """
    Open MBG Google CSE and take the FIRST result link.
    Prefer PlantFinderDetails when present.
    Works for single-word or multi-word names.
    """
    query = quote(plant_name.strip(), safe="")
    url = MBG_CSE_TPL.format(query=query)
    try:
        if verbose:
            print("    MBG CSE url:", url)
        driver.get(url)
        wait = WebDriverWait(driver, CSE_WAIT_SEC)
        try:
            wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".gsc-results .gsc-webResult")))
        except TimeoutException:
            if verbose:
                print("    MBG CSE: results container not found (timeout).")
            return None

        links = []
        for sel in [
            ".gsc-results .gsc-webResult a.gs-title[href]",
            ".gsc-results a.gs-title[href]",
            ".gsc-results .gsc-webResult a[href]",
        ]:
            anchors = driver.find_elements(By.CSS_SELECTOR, sel)
            for a in anchors:
                href = a.get_attribute("href") or ""
                if href and href.startswith("http"):
                    links.append(href)
            if links:
                break

        if verbose:
            print("    MBG CSE links:", links[:3], ("... total " + str(len(links)) if len(links) > 3 else ""))

        if not links:
            return None

        for h in links:
            if "PlantFinderDetails" in h:
                return h
        return links[0]

    except WebDriverException as e:
        if verbose:
            print("    MBG CSE error:", e)
        return None


# -------- ODS helpers --------
def ensure_cell(ws, r, c):
    """Ensure ws[r, c] exists."""
    try:
        return ws[r, c]
    except IndexError:
        if r >= ws.nrows():
            ws.append_rows(r - ws.nrows() + 1)
        if c >= ws.ncols():
            ws.append_columns(c - ws.ncols() + 1)
        return ws[r, c]


def process_ods(path: str, browser: str, headless: bool, max_rows: int | None, verbose: bool):
    print(f"Opening ODS: {path}")
    doc = ezodf.opendoc(path)
    if not doc.sheets:
        raise RuntimeError("ODS has no sheets.")
    ws = doc.sheets[0]

    # Always treat the first row as headers
    first_data_row = 1 if ws.nrows() > 1 else 0
    ensure_cell(ws, 0, 1).set_value("floraveg")
    ensure_cell(ws, 0, 2).set_value("MBG")

    end_row = ws.nrows() if max_rows is None else min(ws.nrows(), first_data_row + max_rows)
    total = max(0, end_row - first_data_row)
    print(f"Rows to process: {total} (from {first_data_row} to {end_row-1})")

    driver = create_driver(browser=browser, headless=headless)
    print(f"Browser started: {browser} (headless={headless})")

    changed = 0
    try:
        for i, r in enumerate(range(first_data_row, end_row), start=1):
            a = ws[r, 0]
            name = (a.value or "").strip() if a else ""
            if not name:
                if verbose:
                    print(f"[{i}/{total}] skip empty row")
                continue

            flo_cell = ensure_cell(ws, r, 1)
            mbg_cell = ensure_cell(ws, r, 2)

            print(f"[{i}/{total}] {name}")

            # floraveg (binomials only)
            if not (flo_cell.value or "").strip():
                if len(name.split()) >= 2:
                    u1 = find_on_floraveg(driver, name, verbose=verbose)
                    if u1:
                        flo_cell.set_value(u1)
                        doc.save()
                        changed += 1
                        if verbose:
                            print("  floraveg:", u1)
                    else:
                        if verbose:
                            print("  floraveg: not found")
                else:
                    if verbose:
                        print("  floraveg: skipped (not binomial)")

            # MBG via CSE (any non-empty name)
            if not (mbg_cell.value or "").strip():
                u2 = find_on_mbg_cse(driver, name, verbose=verbose)
                if u2:
                    mbg_cell.set_value(u2)
                    doc.save()
                    changed += 1
                    if verbose:
                        print("  MBG:", u2)
                else:
                    if verbose:
                        print("  MBG: not found")

            time.sleep(DEFAULT_SLEEP)

    finally:
        try:
            driver.quit()
        except Exception:
            pass
        try:
            doc.save()
        finally:
            try:
                doc.close()
            except Exception:
                pass

    print(f"Done. Cells updated: {changed}")


def main():
    p = argparse.ArgumentParser(description="Fill ODS with links from floraveg.eu and MBG (via CSE).")
    p.add_argument("ods_path", help="Path to .ods file")
    p.add_argument("--browser", default="chrome", choices=["chrome", "firefox"], help="Browser for Selenium")
    p.add_argument("--no-headless", action="store_true", help="Run browser with UI")
    p.add_argument("--max-rows", type=int, default=None, help="Limit processed rows")
    p.add_argument("-v", "--verbose", action="store_true", help="Verbose output")
    args = p.parse_args()

    process_ods(args.ods_path, browser=args.browser, headless=not args.no_headless,
                max_rows=args.max_rows, verbose=args.verbose)


if __name__ == "__main__":
    main()
