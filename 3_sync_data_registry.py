# 3_sync_data_registry.py
"""
СИНХРОНИЗАЦИЯ DATA REGISTRY
Пересобирает js/data-registry.js из файлов папки data/.
data/ — единственный источник истины. Без этого шага сайт на хостинге
и сайт по file:// показывают разные данные, и ссылки перестают совпадать.

Запуск:  python 3_sync_data_registry.py
"""
import glob
import json
import os
import sys

DATA_DIR = "data"
OUTPUT_JS = os.path.join("js", "data-registry.js")

HEADER = """/* js/data-registry.js */
/* АВТОГЕНЕРАЦИЯ: Не редактировать вручную. Используйте 3_sync_data_registry.py */
/**
 * ГИБРИДНЫЙ ПРОВАЙДЕР ДАННЫХ (Data Registry)
 * Обеспечивает 100% работоспособность сайта при запуске локально через file://
 * Содержит точные копии всех JSON манифестов из папки data/.
 */
export const DATA_REGISTRY = {
"""


def collect_ids(node, bucket):
    """Рекурсивно собирает все id, чтобы отловить коллизии deep links."""
    if isinstance(node, dict):
        node_id = node.get("id")
        if isinstance(node_id, str) and node_id:
            bucket.append(node_id)
        for value in node.values():
            collect_ids(value, bucket)
    elif isinstance(node, list):
        for value in node:
            collect_ids(value, bucket)


def build():
    if not os.path.isdir(DATA_DIR):
        print(f"[ERROR] Папка '{DATA_DIR}' не найдена. Запустите скрипт из корня проекта.")
        return 1

    files = sorted(glob.glob(os.path.join(DATA_DIR, "*.json")))
    if not files:
        print(f"[ERROR] В папке '{DATA_DIR}' нет JSON манифестов.")
        return 1

    entries = []
    all_ids = []
    total_bytes = 0

    for path in files:
        name = os.path.basename(path)
        try:
            with open(path, "r", encoding="utf-8") as handle:
                payload = json.load(handle)
        except json.JSONDecodeError as error:
            print(f"[ERROR] Битый JSON в '{name}': строка {error.lineno}, символ {error.colno} — {error.msg}")
            print("        Реестр НЕ перезаписан. Исправьте файл и повторите.")
            return 1
        except OSError as error:
            print(f"[ERROR] Не удалось прочитать '{name}': {error}")
            return 1

        collect_ids(payload, all_ids)
        body = json.dumps(payload, ensure_ascii=False, indent=2).replace("\n", "\n    ")
        key = json.dumps(name, ensure_ascii=False)
        entries.append(f"    {key}: {body}")

        size = os.path.getsize(path)
        total_bytes += size
        count = len(payload) if isinstance(payload, list) else 1
        print(f"[OK] {name:<32} {count:>4} записей  {size / 1024:>7.1f} KB")

    duplicates = sorted({item for item in all_ids if all_ids.count(item) > 1})
    if duplicates:
        print("\n[WARN] Найдены повторяющиеся id — ссылки на них будут неоднозначными:")
        for item in duplicates:
            print(f"       - {item}")
    else:
        print(f"\n[ID] Уникальных идентификаторов: {len(all_ids)}. Коллизий нет.")

    content = HEADER + ",\n".join(entries) + "\n};\n"

    try:
        os.makedirs(os.path.dirname(OUTPUT_JS), exist_ok=True)
        with open(OUTPUT_JS, "w", encoding="utf-8") as handle:
            handle.write(content)
    except OSError as error:
        print(f"[ERROR] Не удалось записать '{OUTPUT_JS}': {error}")
        return 1

    print(f"\n[DONE] {OUTPUT_JS} пересобран: {len(entries)} манифестов, {total_bytes / 1024:.1f} KB исходных данных.")
    print("       Режимы file:// и http:// теперь идентичны — ссылки совпадают.")
    return 0


if __name__ == "__main__":
    sys.exit(build())