# 1_fetch_icons.py
"""
РАЗБОРЩИК БАНДЛА ИКОНОК
=======================
Единственная задача: взять js/utils/icons.js и создать из него
отдельные .svg файлы — по одному на каждую иконку.

Чего скрипт НЕ делает (принципиально):
  * не лезет в интернет и ничего не скачивает;
  * не перезаписывает существующие SVG (только по явному --force);
  * не удаляет, не переименовывает и не переносит файлы;
  * не пересобирает бандл (это работа 2_bundle_icons.py).

По умолчанию создаются ТОЛЬКО недостающие иконки. Если файл с таким
именем уже есть где-то внутри assets/icons/ (в любой полке) — он
остаётся нетронутым, дубликат не создаётся.

Запуск:
  python 1_fetch_icons.py                  # создать недостающие SVG
  python 1_fetch_icons.py --dry-run        # просто показать список
  python 1_fetch_icons.py --out icons_raw  # выгрузить всё в отдельную папку
  python 1_fetch_icons.py --force          # перезаписать существующие
"""
import os
import re
import sys
import argparse

BUNDLE_JS = os.path.join("js", "utils", "icons.js")
ICONS_DIR = os.path.join("assets", "icons")

# Ключ объекта Icons: 'name': ` ... `  (допускаются и двойные кавычки)
ENTRY_RE = re.compile(r"""['"]([\w-]+)['"]\s*:\s*`""")


def read_template(text, start):
    """
    Читает template literal, начиная с позиции ПОСЛЕ открывающей `.
    Возвращает (содержимое, позиция_после_закрывающей_`) или (None, start).
    Учитывает экранирование: \` \\ \$ (сборщик экранирует именно их).
    """
    buf = []
    i = start
    length = len(text)
    while i < length:
        ch = text[i]
        if ch == "\\":
            nxt = text[i + 1] if i + 1 < length else ""
            if nxt in ("`", "\\", "$"):
                buf.append(nxt)
                i += 2
                continue
            buf.append(ch)
            i += 1
            continue
        if ch == "`":
            return "".join(buf), i + 1
        buf.append(ch)
        i += 1
    return None, start


def slice_icons_object(text):
    """Вырезает тело объекта Icons, чтобы не цеплять код ниже (replaceIcons)."""
    anchor = text.find("export const Icons")
    if anchor == -1:
        anchor = text.find("const Icons")
    if anchor == -1:
        return None
    brace = text.find("{", anchor)
    if brace == -1:
        return None
    end = text.find("\n};", brace)
    if end == -1:
        end = len(text)
    return text[brace + 1:end]


def iter_icons(body):
    """Итерирует пары (имя, svg) по телу объекта Icons."""
    pos = 0
    while True:
        match = ENTRY_RE.search(body, pos)
        if not match:
            return
        name = match.group(1)
        svg, end = read_template(body, match.end())
        if svg is None:
            print(f"[WARN] {name}: незакрытый шаблон, пропуск.")
            pos = match.end()
            continue
        pos = end
        yield name, svg.strip()


def collect_existing(root):
    """Рекурсивно собирает существующие SVG: name -> путь (первый найденный)."""
    found = {}
    if not os.path.isdir(root):
        return found
    for dirpath, _dirs, files in os.walk(root):
        for filename in files:
            if filename.lower().endswith(".svg"):
                name = os.path.splitext(filename)[0]
                found.setdefault(name, os.path.join(dirpath, filename))
    return found


def main():
    parser = argparse.ArgumentParser(
        description="Раскладывает js/utils/icons.js на отдельные SVG-файлы."
    )
    parser.add_argument("--out", default=ICONS_DIR,
                        help=f"куда класть новые SVG (по умолчанию {ICONS_DIR})")
    parser.add_argument("--force", action="store_true",
                        help="перезаписать существующие файлы (по умолчанию НЕ трогаем)")
    parser.add_argument("--dry-run", action="store_true",
                        help="ничего не писать, только показать план")
    args = parser.parse_args()

    print("=" * 56)
    print("РАЗБОРЩИК ИКОНОК: icons.js -> отдельные SVG")
    print("=" * 56)

    try:
        with open(BUNDLE_JS, "r", encoding="utf-8") as handle:
            text = handle.read()
    except OSError as error:
        print(f"[ERROR] Не удалось прочитать '{BUNDLE_JS}': {error}")
        print("        Запустите скрипт из корня проекта.")
        return 1

    body = slice_icons_object(text)
    if body is None:
        print(f"[ERROR] В '{BUNDLE_JS}' не найден объект Icons.")
        return 1

    icons = {}
    for name, svg in iter_icons(body):
        if not svg.lower().startswith("<svg"):
            print(f"[SKIP] {name}: содержимое не похоже на SVG.")
            continue
        if name in icons:
            print(f"[WARN] {name}: дубликат в бандле, оставлен первый.")
            continue
        icons[name] = svg

    if not icons:
        print("[ERROR] Иконки не распознаны. Ничего не записано.")
        return 1

    print(f"[READ] Распознано иконок: {len(icons)}")

    target_root = args.out
    existing = collect_existing(target_root)
    print(f"[SCAN] Найдено существующих SVG в '{target_root}': {len(existing)}")

    created = []
    overwritten = []
    skipped = []
    failed = []

    for name in sorted(icons):
        svg = icons[name]
        current = existing.get(name)

        if current and not args.force:
            skipped.append(name)
            continue

        dest = current if current else os.path.join(target_root, f"{name}.svg")
        action = "OVERWRITE" if current else "CREATE"

        if args.dry_run:
            (overwritten if current else created).append(name)
            print(f"[PLAN:{action}] {dest}")
            continue

        try:
            folder = os.path.dirname(dest)
            if folder:
                os.makedirs(folder, exist_ok=True)
            with open(dest, "w", encoding="utf-8", newline="\n") as handle:
                handle.write(svg + "\n")
            (overwritten if current else created).append(name)
            print(f"[{action}] {dest}")
        except OSError as error:
            failed.append(name)
            print(f"[ERROR] {name}: не удалось записать — {error}")

    print("-" * 56)
    prefix = "БУДЕТ СОЗДАНО" if args.dry_run else "СОЗДАНО"
    print(f"{prefix}: {len(created)}")
    print(f"{'БУДЕТ ПЕРЕЗАПИСАНО' if args.dry_run else 'ПЕРЕЗАПИСАНО'}: {len(overwritten)}")
    print(f"ПРОПУЩЕНО (уже есть, не тронуты): {len(skipped)}")
    if failed:
        print(f"ОШИБКИ: {len(failed)} ({', '.join(failed)})")
    print("-" * 56)

    if skipped and not args.force:
        print("[INFO] Существующие файлы не изменялись. Нужна перезапись — флаг --force.")
    if args.dry_run:
        print("[INFO] Режим --dry-run: на диск ничего не записано.")

    print("[DONE] Готово.")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())