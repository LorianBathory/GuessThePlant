#!/usr/bin/env python3
"""
Скрипт для поиска растений на сайте Missouri Botanical Garden
и добавления ссылок в файл ODS

Использование:
    python search_plants_fixed.py <файл.ods> [опции]
    
Примеры:
    python search_plants_fixed.py links.ods
    python search_plants_fixed.py links.ods -v
    python search_plants_fixed.py links.ods -v --max-rows 20

Требования:
    pip install odfpy beautifulsoup4 requests
"""

import time
import sys
import os
import argparse
import logging
from pathlib import Path
import urllib.parse
import requests
from bs4 import BeautifulSoup
from odf import opendocument, table, text
import re

# Версия скрипта
VERSION = "3.0"

# Настройка логирования
logger = logging.getLogger(__name__)


def setup_logging(verbose=False):
    """Настройка системы логирования"""
    level = logging.DEBUG if verbose else logging.INFO
    
    if verbose:
        log_format = '%(asctime)s [%(levelname)s] %(message)s'
        date_format = '%H:%M:%S'
    else:
        log_format = '%(message)s'
        date_format = None
    
    logging.basicConfig(
        level=level,
        format=log_format,
        datefmt=date_format,
        handlers=[logging.StreamHandler(sys.stdout)]
    )


def search_plant_direct(plant_name, verbose=False):
    """
    Выполняет поиск растения напрямую на сайте Missouri Botanical Garden
    
    Args:
        plant_name: название растения для поиска
        verbose: подробный вывод информации
        
    Returns:
        str: URL найденного растения или None
    """
    # Используем поиск непосредственно на сайте MBG
    base_url = "https://www.missouribotanicalgarden.org/PlantFinder/PlantFinderSearch.aspx"
    
    # Сначала пробуем прямой URL на основе научного названия
    # MBG часто использует URL вида: /PlantFinder/PlantFinderDetails.aspx?taxonid=XXX&isprofile=1&basic=НАЗВАНИЕ
    direct_search_url = f"https://www.missouribotanicalgarden.org/PlantFinder/PlantFinderListResults.aspx?basic={urllib.parse.quote(plant_name)}"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
    }
    
    try:
        if verbose:
            logger.debug(f"Поиск растения: {plant_name}")
            logger.debug(f"URL запроса: {direct_search_url}")
        
        # Делаем запрос к странице поиска
        response = requests.get(direct_search_url, headers=headers, timeout=30, allow_redirects=True)
        
        if verbose:
            logger.debug(f"Статус ответа: {response.status_code}")
            logger.debug(f"Размер ответа: {len(response.text)} байт")
        
        if response.status_code != 200:
            if verbose:
                logger.debug(f"Неуспешный статус: {response.status_code}")
            return None
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Если страница содержит результаты поиска, ищем первую ссылку на детальную страницу
        # Ищем ссылки вида PlantFinderDetails.aspx
        plant_links = []
        
        # Поиск всех ссылок на странице
        for link in soup.find_all('a', href=True):
            href = link['href']
            # Ищем ссылки на детальную страницу растения
            if 'PlantFinderDetails.aspx' in href:
                # Формируем полный URL если это относительная ссылка
                if href.startswith('/'):
                    full_url = f"https://www.missouribotanicalgarden.org{href}"
                elif href.startswith('http'):
                    full_url = href
                else:
                    full_url = f"https://www.missouribotanicalgarden.org/PlantFinder/{href}"
                
                if full_url not in plant_links:
                    plant_links.append(full_url)
                    if verbose:
                        logger.debug(f"Найдена ссылка: {full_url}")
        
        # Если не нашли ссылки на детальную страницу, проверяем, не перенаправило ли нас сразу на неё
        if not plant_links:
            # Проверяем URL после всех редиректов
            final_url = response.url
            if 'PlantFinderDetails.aspx' in final_url:
                if verbose:
                    logger.debug(f"Перенаправлено на: {final_url}")
                return final_url
            
            # Также проверяем, есть ли на странице информация о растении
            # (иногда результат поиска сразу показывает страницу растения)
            title = soup.find('title')
            if title and plant_name.lower() in title.text.lower():
                if 'PlantFinder' in final_url:
                    if verbose:
                        logger.debug(f"Найдена страница растения: {final_url}")
                    return final_url
        
        if plant_links:
            # Возвращаем первую найденную ссылку
            result_url = plant_links[0]
            if verbose:
                logger.debug(f"Выбрана первая ссылка: {result_url}")
            return result_url
        
        if verbose:
            logger.debug("Ссылки на растение не найдены")
        
        return None
        
    except requests.exceptions.Timeout:
        logger.error(f"Таймаут при поиске: {plant_name}")
        return None
    except requests.exceptions.RequestException as e:
        logger.error(f"Ошибка HTTP при поиске {plant_name}: {e}")
        return None
    except Exception as e:
        logger.error(f"Непредвиденная ошибка при поиске {plant_name}: {e}")
        if verbose:
            import traceback
            logger.debug(traceback.format_exc())
        return None


def search_plant_google_fallback(plant_name, verbose=False):
    """
    Резервный метод поиска через DuckDuckGo (не требует API ключей)
    
    Args:
        plant_name: название растения для поиска
        verbose: подробный вывод информации
        
    Returns:
        str: URL найденного растения или None
    """
    # Используем DuckDuckGo HTML версию для поиска
    query = f"{plant_name} site:missouribotanicalgarden.org/PlantFinder"
    search_url = f"https://html.duckduckgo.com/html/?q={urllib.parse.quote(query)}"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
    }
    
    try:
        if verbose:
            logger.debug(f"Резервный поиск через DuckDuckGo: {query}")
            logger.debug(f"URL: {search_url}")
        
        response = requests.get(search_url, headers=headers, timeout=30)
        
        if response.status_code != 200:
            if verbose:
                logger.debug(f"Неуспешный статус: {response.status_code}")
            return None
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # В DuckDuckGo результаты находятся в классе result__url
        results = soup.find_all('a', class_='result__url')
        
        for result in results:
            href = result.get('href', '')
            # Проверяем, что это ссылка на MBG PlantFinder
            if 'missouribotanicalgarden.org' in href and 'PlantFinder' in href:
                # DuckDuckGo может добавлять свои параметры, очищаем URL
                if '?' in href:
                    clean_url = href.split('?')[0] + '?' + '&'.join([p for p in href.split('?')[1].split('&') 
                                                                     if p.startswith('taxonid') or p.startswith('isprofile')])
                else:
                    clean_url = href
                
                if verbose:
                    logger.debug(f"Найдена ссылка через DuckDuckGo: {clean_url}")
                return clean_url
        
        if verbose:
            logger.debug("Результаты не найдены через DuckDuckGo")
        
        return None
        
    except Exception as e:
        if verbose:
            logger.debug(f"Ошибка при поиске через DuckDuckGo: {e}")
        return None


def get_cell_text(cell):
    """
    Извлекает текст из ячейки ODS
    
    Args:
        cell: объект ячейки таблицы
        
    Returns:
        str: текст ячейки
    """
    text_nodes = cell.getElementsByType(text.P)
    cell_text = ""
    if text_nodes:
        for p in text_nodes:
            if p.firstChild:
                cell_text += str(p.firstChild)
    return cell_text.strip()


def set_cell_text(cell, new_text):
    """
    Устанавливает текст в ячейку ODS
    
    Args:
        cell: объект ячейки таблицы
        new_text: новый текст для ячейки
    """
    # Очищаем существующий текст
    for child in list(cell.childNodes):
        cell.removeChild(child)
    
    # Добавляем новый текст
    p = text.P()
    p.addText(new_text)
    cell.appendChild(p)


def process_ods_file(input_file, skip_existing=True, max_rows=None, 
                     delay=2.5, verbose=False, in_place=False):
    """
    Обрабатывает ODS файл: читает названия растений из столбца A,
    выполняет поиск и записывает результаты в столбец C
    
    Args:
        input_file: путь к входному файлу ODS
        skip_existing: пропускать строки, где уже есть ссылка в столбце C
        max_rows: максимальное количество строк для обработки (None = все)
        delay: задержка между запросами в секундах
        verbose: подробный вывод информации
        in_place: обновлять существующий файл вместо создания нового
        
    Returns:
        dict: статистика обработки
    """
    if not os.path.exists(input_file):
        logger.error(f"Файл не найден: {input_file}")
        return None
    
    logger.info(f"Загрузка файла: {input_file}")
    
    try:
        doc = opendocument.load(input_file)
    except Exception as e:
        logger.error(f"Ошибка при загрузке файла: {e}")
        return None
    
    sheets = doc.spreadsheet.getElementsByType(table.Table)
    
    if not sheets:
        logger.error("Таблицы не найдены в файле")
        return None
    
    sheet = sheets[0]
    rows = sheet.getElementsByType(table.TableRow)
    total_rows = len(rows)
    
    logger.info(f"Всего строк в таблице: {total_rows}")
    
    if max_rows:
        logger.info(f"Ограничение: обработка максимум {max_rows} строк")
    
    if skip_existing:
        logger.info("Режим: пропуск строк с существующими ссылками")
    else:
        logger.info("Режим: перезапись всех ссылок")
    
    logger.info(f"Задержка между запросами: {delay} сек")
    logger.info("")
    
    # Статистика
    stats = {
        'processed': 0,
        'found': 0,
        'not_found': 0,
        'skipped': 0,
        'errors': 0
    }
    
    start_time = time.time()
    
    # Пропускаем заголовок (первая строка)
    for row_idx, row in enumerate(rows):
        if row_idx == 0:
            if verbose:
                logger.debug(f"Строка {row_idx}: Заголовок - пропуск")
            continue
        
        if max_rows and stats['processed'] >= max_rows:
            logger.info(f"\nДостигнуто ограничение: {max_rows} строк")
            break
            
        cells = row.getElementsByType(table.TableCell)
        
        if len(cells) < 1:
            continue
        
        # Читаем название растения из столбца A
        plant_name = get_cell_text(cells[0])
        
        if not plant_name or plant_name.lower() == 'sci':
            continue
        
        # Проверяем, есть ли уже ссылка в столбце C
        existing_link = ""
        if len(cells) > 2:
            existing_link = get_cell_text(cells[2])
        
        if skip_existing and existing_link and existing_link.startswith('http'):
            logger.info(f"Строка {row_idx}: {plant_name}")
            logger.info(f"  ⚠ Ссылка уже существует, пропуск")
            stats['skipped'] += 1
            continue
        
        logger.info(f"Строка {row_idx}: {plant_name}")
        
        if verbose:
            logger.debug(f"Начало поиска для: {plant_name}")
        
        stats['processed'] += 1
        
        # Сначала пробуем прямой поиск на сайте MBG
        found_link = search_plant_direct(plant_name, verbose=verbose)
        
        # Если не нашли, пробуем через DuckDuckGo
        if not found_link:
            if verbose:
                logger.debug("Прямой поиск не дал результатов, пробуем DuckDuckGo...")
            found_link = search_plant_google_fallback(plant_name, verbose=verbose)
        
        if found_link:
            logger.info(f"  ✓ Найдено: {found_link}")
            stats['found'] += 1
            
            # Убеждаемся, что в строке достаточно ячеек для столбца C
            while len(cells) < 3:
                new_cell = table.TableCell()
                row.appendChild(new_cell)
                cells = row.getElementsByType(table.TableCell)
            
            # Записываем ссылку в столбец C
            set_cell_text(cells[2], found_link)
        else:
            logger.info(f"  ✗ Ссылка не найдена")
            stats['not_found'] += 1
        
        # Задержка между запросами
        if stats['processed'] < (max_rows or total_rows):
            if verbose:
                logger.debug(f"Пауза {delay} сек...")
            time.sleep(delay)
        
        logger.info("")
    
    # Определяем имя выходного файла
    if in_place:
        output_file = input_file
    else:
        input_path = Path(input_file)
        output_file = str(input_path.parent / f"{input_path.stem}_updated{input_path.suffix}")
    
    # Сохраняем изменения
    elapsed_time = time.time() - start_time
    
    logger.info(f"Сохранение результатов в: {output_file}")
    
    try:
        doc.save(output_file)
        if verbose:
            logger.debug(f"Файл успешно сохранен")
    except Exception as e:
        logger.error(f"Ошибка при сохранении файла: {e}")
        stats['errors'] += 1
        return stats
    
    # Вывод статистики
    logger.info("")
    logger.info("=" * 60)
    logger.info("ИТОГОВАЯ СТАТИСТИКА")
    logger.info("=" * 60)
    logger.info(f"Обработано строк:              {stats['processed']}")
    logger.info(f"Найдено ссылок:                {stats['found']}")
    logger.info(f"Не найдено:                    {stats['not_found']}")
    logger.info(f"Пропущено (уже есть ссылка):   {stats['skipped']}")
    if stats['errors'] > 0:
        logger.info(f"Ошибок:                        {stats['errors']}")
    logger.info(f"Время выполнения:              {elapsed_time:.1f} сек")
    logger.info(f"Результаты сохранены в:        {output_file}")
    logger.info("=" * 60)
    
    return stats


def parse_arguments():
    """Парсинг аргументов командной строки"""
    parser = argparse.ArgumentParser(
        description='Поиск растений на Missouri Botanical Garden и добавление ссылок в ODS файл',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Примеры использования:
  %(prog)s links.ods                    # Обновить существующий файл
  %(prog)s links.ods -v                 # С подробным выводом
  %(prog)s links.ods --max-rows 20      # Обработать только 20 строк
  %(prog)s links.ods --new-file         # Создать новый файл _updated.ods
        """
    )
    
    parser.add_argument(
        'input_file',
        help='Путь к ODS файлу для обработки'
    )
    
    parser.add_argument(
        '-v', '--verbose',
        action='store_true',
        help='Подробный вывод информации'
    )
    
    parser.add_argument(
        '--max-rows',
        type=int,
        metavar='N',
        help='Максимальное количество строк для обработки'
    )
    
    parser.add_argument(
        '--no-skip-existing',
        dest='skip_existing',
        action='store_false',
        help='Перезаписывать существующие ссылки'
    )
    
    parser.add_argument(
        '--new-file',
        action='store_true',
        help='Создать новый файл вместо обновления существующего'
    )
    
    parser.add_argument(
        '--delay',
        type=float,
        default=2.5,
        metavar='SEC',
        help='Задержка между запросами в секундах (по умолчанию: 2.5)'
    )
    
    parser.add_argument(
        '--version',
        action='version',
        version=f'%(prog)s {VERSION}'
    )
    
    return parser.parse_args()


def main():
    """Основная функция"""
    args = parse_arguments()
    
    # Настройка логирования
    setup_logging(verbose=args.verbose)
    
    # По умолчанию обновляем существующий файл
    in_place = not args.new_file
    
    # Заголовок
    logger.info("=" * 60)
    logger.info("ПОИСК РАСТЕНИЙ НА MISSOURI BOTANICAL GARDEN")
    logger.info(f"Версия скрипта: {VERSION}")
    logger.info("=" * 60)
    logger.info("")
    
    if args.verbose:
        logger.debug(f"Параметры:")
        logger.debug(f"  Файл: {args.input_file}")
        logger.debug(f"  Обновление на месте: {in_place}")
        logger.debug(f"  Макс. строк: {args.max_rows or 'все'}")
        logger.debug(f"  Пропуск существующих: {args.skip_existing}")
        logger.debug(f"  Задержка: {args.delay} сек")
        logger.debug("")
    
    # Обработка файла
    stats = process_ods_file(
        input_file=args.input_file,
        skip_existing=args.skip_existing,
        max_rows=args.max_rows,
        delay=args.delay,
        verbose=args.verbose,
        in_place=in_place
    )
    
    if stats is None:
        logger.error("\nОбработка завершилась с ошибкой")
        return 1
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
