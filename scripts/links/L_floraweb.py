#!/usr/bin/env python3
"""
Скрипт для поиска растений на сайте floraweb.de
Читает названия из столбца A файла ODS, ищет на сайте и записывает ссылки в столбец D
"""

import argparse
import logging
import sys
import time
import re
from pathlib import Path
import requests
from bs4 import BeautifulSoup
import pandas as pd
from openpyxl import load_workbook
from openpyxl.utils.dataframe import dataframe_to_rows

# Настройка логирования
def setup_logging(verbose):
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(levelname)s - %(message)s',
        datefmt='%H:%M:%S'
    )
    return logging.getLogger(__name__)

def read_ods_file(filepath):
    """Чтение ODS файла с помощью pandas"""
    try:
        # Читаем ODS файл
        df = pd.read_excel(filepath, engine='odf', header=None)
        logging.info(f"Успешно загружен файл {filepath}")
        logging.info(f"Размер таблицы: {len(df)} строк × {len(df.columns)} столбцов")
        return df
    except Exception as e:
        logging.error(f"Ошибка при чтении файла {filepath}: {e}")
        sys.exit(1)

def save_ods_file(df, filepath):
    """Сохранение DataFrame обратно в ODS файл"""
    try:
        # Сохраняем в ODS формат
        with pd.ExcelWriter(filepath, engine='odf', mode='w') as writer:
            df.to_excel(writer, index=False, header=False)
        logging.info(f"Файл {filepath} успешно сохранён")
    except Exception as e:
        logging.error(f"Ошибка при сохранении файла: {e}")
        raise

def get_first_letters(plant_name):
    """Получение первых двух букв для алфавитного указателя"""
    if not plant_name or len(plant_name) < 2:
        return None
    # Берём первые две буквы и делаем первую заглавной, вторую строчной
    # Это соответствует формату на сайте floraweb.de
    first_letter = plant_name[0].upper()
    second_letter = plant_name[1].lower()
    return first_letter + second_letter

def search_plant_via_taxoquery(plant_name, session, timeout=5):
    """Поиск растения через taxoquery API - альтернативный метод"""
    
    # Заменяем пробелы на + для URL
    query_name = plant_name.replace(' ', '+')
    url = f"https://www.floraweb.de/php/taxoquery.php?taxname={query_name}"
    
    logging.debug(f"Поиск через taxoquery: {url}")
    
    try:
        response = session.get(url, timeout=timeout)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Ищем секцию "Trefferliste" (список результатов)
        # Первая ссылка в результатах - обычно самая релевантная
        all_links = soup.find_all('a')
        
        for link in all_links:
            href = link.get('href', '')
            
            # Ищем ссылки вида artenhome.php?name-use-id=XXXXX
            if 'artenhome.php?name-use-id=' in href:
                # Извлекаем ID из ссылки
                import re
                match = re.search(r'name-use-id=(\d+)', href)
                if match:
                    taxon_id = match.group(1)
                    
                    # Формируем финальную ссылку на страницу таксономии
                    final_url = f"https://www.floraweb.de/php/taxonomie.php?taxon-id={taxon_id}"
                    
                    # Проверяем доступность финальной ссылки
                    check_response = session.get(final_url, timeout=timeout)
                    if check_response.status_code == 200:
                        logging.info(f"✓ Найдено через taxoquery: {plant_name} → ID: {taxon_id} → {final_url}")
                        return final_url
                    else:
                        logging.debug(f"Страница таксономии недоступна для ID {taxon_id}")
                        # Возвращаем ссылку на artenhome как запасной вариант
                        if href.startswith('/'):
                            artenhome_url = f"https://www.floraweb.de{href}"
                        elif href.startswith('http'):
                            artenhome_url = href
                        else:
                            artenhome_url = f"https://www.floraweb.de/php/{href}"
                        logging.info(f"✓ Найдено через taxoquery (artenhome): {plant_name} → {artenhome_url}")
                        return artenhome_url
        
        logging.debug(f"Не найдено результатов через taxoquery для: {plant_name}")
        return None
        
    except requests.Timeout:
        logging.error(f"Превышено время ожидания для taxoquery: {plant_name}")
        return None
    except requests.RequestException as e:
        logging.error(f"Ошибка при запросе taxoquery для {plant_name}: {e}")
        return None
    except Exception as e:
        logging.error(f"Неожиданная ошибка при поиске через taxoquery {plant_name}: {e}")
        return None

def search_plant_on_floraweb(plant_name, session, timeout=5):
    """Поиск растения на сайте floraweb.de - сначала через алфавитный указатель, потом через taxoquery"""
    
    # Метод 1: Поиск через алфавитный указатель
    first_letters = get_first_letters(plant_name)
    if not first_letters:
        logging.warning(f"Не удалось определить буквы для поиска: {plant_name}")
        # Переходим сразу к методу 2
        return search_plant_via_taxoquery(plant_name, session, timeout)
    
    # Формируем URL для алфавитного указателя
    url = f"https://www.floraweb.de/php/register.php?lower={first_letters}"
    
    logging.debug(f"Метод 1 - Алфавитный указатель: {url}")
    
    try:
        response = session.get(url, timeout=timeout)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Структура страницы: список <li> с ссылками <a>
        # Ищем все элементы списка
        list_items = soup.find_all('li')
        
        logging.debug(f"Найдено элементов списка: {len(list_items)}")
        
        for li in list_items:
            # В каждом <li> ищем ссылку
            link = li.find('a')
            if not link:
                continue
            
            link_text = link.get_text(strip=True)
            
            # Убираем стрелку и текст после неё (например, "→ Hunds-Rose")
            if '→' in link_text:
                # Берём только часть до стрелки
                plant_part = link_text.split('→')[0].strip()
            else:
                plant_part = link_text
            
            # Теперь проверяем совпадение
            # plant_part может быть "Rosa canina L." или "Rosa canina Mill." и т.д.
            if plant_part.startswith(plant_name):
                # Проверяем, что после названия идёт пробел, точка или конец строки
                if len(plant_part) == len(plant_name) or \
                   (len(plant_part) > len(plant_name) and plant_part[len(plant_name)] in ' .'):
                    
                    href = link.get('href')
                    if href:
                        # Формируем полный URL
                        if href.startswith('/'):
                            full_url = f"https://www.floraweb.de{href}"
                        elif href.startswith('http'):
                            full_url = href
                        else:
                            # Относительный путь от текущей директории
                            full_url = f"https://www.floraweb.de/php/{href}"
                        
                        logging.info(f"✓ Найдено в алфавитном указателе: {plant_name} → '{link_text}' → {full_url}")
                        return full_url
        
        # Если не нашли в списках, пробуем поискать просто в ссылках
        all_links = soup.find_all('a')
        
        for link in all_links:
            link_text = link.get_text(strip=True)
            
            # Обработка текста со стрелками
            if '→' in link_text:
                plant_part = link_text.split('→')[0].strip()
            else:
                plant_part = link_text
            
            if plant_part.startswith(plant_name):
                if len(plant_part) == len(plant_name) or \
                   (len(plant_part) > len(plant_name) and plant_part[len(plant_name)] in ' .'):
                    
                    href = link.get('href')
                    if href:
                        if href.startswith('/'):
                            full_url = f"https://www.floraweb.de{href}"
                        elif href.startswith('http'):
                            full_url = href
                        else:
                            full_url = f"https://www.floraweb.de/php/{href}"
                        
                        logging.info(f"✓ Найдено в алфавитном указателе (вне списка): {plant_name} → '{link_text}' → {full_url}")
                        return full_url
        
        logging.debug(f"Не найдено в алфавитном указателе: {plant_name}")
        
    except requests.Timeout:
        logging.error(f"Превышено время ожидания для алфавитного указателя: {plant_name}")
    except requests.RequestException as e:
        logging.error(f"Ошибка при запросе алфавитного указателя для {plant_name}: {e}")
    except Exception as e:
        logging.error(f"Неожиданная ошибка при поиске в алфавитном указателе {plant_name}: {e}")
    
    # Метод 2: Если не нашли в алфавитном указателе, пробуем через taxoquery
    logging.debug(f"Переключаемся на метод 2 - taxoquery для: {plant_name}")
    result = search_plant_via_taxoquery(plant_name, session, timeout)
    
    if not result:
        logging.warning(f"✗ Не найдено ни одним методом: {plant_name}")
    
    return result

def process_plants(filepath, max_rows=None, verbose=False):
    """Основная функция обработки растений"""
    
    logger = setup_logging(verbose)
    
    # Читаем файл
    df = read_ods_file(filepath)
    
    # Убеждаемся, что столбец D (индекс 3) существует
    while len(df.columns) <= 3:
        df[len(df.columns)] = None
    
    # Создаём сессию для HTTP запросов
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    })
    
    processed = 0
    found = 0
    skipped = 0
    
    # Определяем количество строк для обработки
    rows_to_process = min(len(df), max_rows) if max_rows else len(df)
    
    logging.info(f"Начинаем обработку {rows_to_process} строк")
    
    for idx in range(rows_to_process):
        # Получаем значение из столбца A (индекс 0)
        plant_name = df.iloc[idx, 0] if pd.notna(df.iloc[idx, 0]) else None
        
        if not plant_name:
            logging.debug(f"Строка {idx + 1}: пустая, пропускаем")
            skipped += 1
            continue
        
        plant_name = str(plant_name).strip()
        
        # Проверяем, что название содержит 2+ слова
        words = plant_name.split()
        if len(words) < 2:
            logging.debug(f"Строка {idx + 1}: '{plant_name}' - только одно слово, пропускаем")
            skipped += 1
            continue
        
        # Проверяем, не заполнен ли уже столбец D
        existing_link = df.iloc[idx, 3] if len(df.columns) > 3 else None
        if pd.notna(existing_link) and existing_link:
            logging.debug(f"Строка {idx + 1}: '{plant_name}' - ссылка уже есть, пропускаем")
            skipped += 1
            continue
        
        logging.info(f"Обработка строки {idx + 1}: '{plant_name}'")
        
        # Ищем растение на сайте
        link = search_plant_on_floraweb(plant_name, session)
        
        if link:
            # Записываем ссылку в столбец D (индекс 3)
            df.iloc[idx, 3] = link
            found += 1
            
            # Сохраняем файл после каждой найденной ссылки
            save_ods_file(df, filepath)
        
        processed += 1
        
        # Небольшая задержка между запросами
        if processed < rows_to_process:
            time.sleep(0.5)
    
    # Финальная статистика
    logging.info("=" * 50)
    logging.info(f"Обработка завершена!")
    logging.info(f"Обработано строк: {processed}")
    logging.info(f"Найдено растений: {found}")
    logging.info(f"Пропущено строк: {skipped}")
    
    return found

def main():
    parser = argparse.ArgumentParser(
        description='Поиск растений на сайте floraweb.de с записью ссылок в ODS файл'
    )
    parser.add_argument(
        'file',
        type=str,
        help='Путь к ODS файлу с названиями растений'
    )
    parser.add_argument(
        '-v', '--verbose',
        action='store_true',
        help='Подробный вывод информации'
    )
    parser.add_argument(
        '--max-rows',
        type=int,
        default=None,
        help='Максимальное количество строк для обработки'
    )
    
    args = parser.parse_args()
    
    # Проверяем существование файла
    filepath = Path(args.file)
    if not filepath.exists():
        print(f"Ошибка: файл '{filepath}' не найден")
        sys.exit(1)
    
    if not filepath.suffix.lower() == '.ods':
        print(f"Предупреждение: файл '{filepath}' не имеет расширения .ods")
    
    # Запускаем обработку
    try:
        found_count = process_plants(filepath, args.max_rows, args.verbose)
        sys.exit(0 if found_count > 0 else 1)
    except KeyboardInterrupt:
        print("\nОбработка прервана пользователем")
        sys.exit(1)
    except Exception as e:
        print(f"Критическая ошибка: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
