# 2_bundle_icons.py
"""
СБОРЩИК БАНДЛА ИКОНОК — РЕКУРСИВНЫЙ, ПО ПАПКАМ
==============================================
Читает SVG из assets/icons/<папка>/*.svg и собирает плоский js/utils/icons.js.

Физическая раскладка по папкам НЕ ломает runtime: объект Icons остаётся
плоским (имя -> SVG), а replaceIcons() ищет иконку по классу fa-xxx.
Папки нужны только человеку для удобной навигации по исходникам.

Коллизия имён между папками — жёсткая ошибка (иначе одна иконка молча
затёрла бы другую). Запускать после 1_fetch_icons.py.

Запуск:  python 2_bundle_icons.py
"""
import os
import glob
import re
import sys

ICONS_DIR = os.path.join("assets", "icons")
OUTPUT_JS = os.path.join("js", "utils", "icons.js")

REPLACE_ICONS_FN = """/**
 * Ищет все теги <i> с классами FontAwesome и вставляет внутрь полноценный SVG.
 * Поиск идёт по имени иконки, поэтому папка исходника не важна.
 */
export function replaceIcons(root = document) {
    const iconEls = root.querySelectorAll('i[class*="fa-"]:not(.icon-replaced)');
    iconEls.forEach(el => {
        el.classList.add('icon-replaced');
        const classes = Array.from(el.classList);
        const faClass = classes.find(c => c.startsWith('fa-') && !['fa-spin', 'fa-pulse', 'fa-fw'].includes(c));
        if (!faClass) return;
        const iconName = faClass.replace('fa-', '');
        const svgString = Icons[iconName];
        if (svgString) {
            el.innerHTML = svgString;
            if (classes.includes('fa-spin')) {
                el.classList.add('icon-spin');
            }
        }
    });
}
"""


def clean_svg(svg_content):
    """Нормализует корневой тег <svg>, не трогая внутренние контуры."""
    match = re.search(r"<svg([^>]+)>", svg_content)
    if not match:
        return None
    attrs = match.group(1)
    for attr in ("width", "height", "fill"):
        attrs = re.sub(rf'\s+{attr}="[^"]*"', "", attrs)
        attrs = re.sub(rf"\s+{attr}='[^']*'", "", attrs)
    attrs += ' width="1em" height="1em" fill="currentColor"'
    new_svg = f"<svg{attrs}>"
    return svg_content[:match.start()] + new_svg + svg_content[match.end():]


def escape_template(text):
    return text.replace("\\", "\\\\").replace("`", "\\`").replace("${", "\\${")


def bundle_icons():
    os.makedirs(os.path.dirname(OUTPUT_JS), exist_ok=True)
    svg_files = sorted(glob.glob(os.path.join(ICONS_DIR, "**", "*.svg"), recursive=True))
    if not svg_files:
        print(f"[ERROR] Иконки не найдены в {ICONS_DIR}. Сначала запустите 1_fetch_icons.py")
        return 1

    # Группируем по папкам и ловим коллизии имён.
    by_folder = {}
    seen = {}
    for filepath in svg_files:
        rel = os.path.relpath(filepath, ICONS_DIR)
        parts = rel.split(os.sep)
        folder = parts[0] if len(parts) > 1 else "(root)"
        name = os.path.splitext(parts[-1])[0]
        if name in seen:
            print(f"[ERROR] Коллизия имени '{name}':")
            print(f"        {seen[name]}")
            print(f"        {filepath}")
            print("        Оставьте иконку только в одной папке.")
            return 1
        seen[name] = filepath
        by_folder.setdefault(folder, []).append((name, filepath))

    icons_dict = []
    skipped = []
    total = 0
    print(f"Сборка {len(svg_files)} иконок из {len(by_folder)} папок в {OUTPUT_JS}...")

    for folder in sorted(by_folder):
        for name, filepath in sorted(by_folder[folder]):
            with open(filepath, "r", encoding="utf-8") as handle:
                svg_content = handle.read().strip()
            cleaned = clean_svg(svg_content)
            if cleaned is None:
                skipped.append(name)
                print(f"[SKIP] {folder}/{name}: не найден корневой тег <svg>")
                continue
            icons_dict.append(f"    '{name}': `{escape_template(cleaned)}`")
            total += 1
            print(f"[OK] {folder}/{name}")

    # Человекочитаемая карта полок в шапке сгенерированного файла.
    source_lines = ["/* ИСТОЧНИКИ (assets/icons/):"]
    for folder in sorted(by_folder):
        names = ", ".join(sorted(n for n, _ in by_folder[folder]))
        source_lines.append(f"   {folder + '/':<12} {names}")
    source_lines.append("*/")
    source_header = "\n".join(source_lines)

    js_content = (
        "/* js/utils/icons.js */\n"
        "/* АВТОГЕНЕРАЦИЯ: Не редактировать вручную. Используйте 2_bundle_icons.py */\n"
        f"{source_header}\n"
        "export const Icons = {\n"
        + ",\n".join(icons_dict)
        + "\n};\n\n"
        + REPLACE_ICONS_FN
    )

    with open(OUTPUT_JS, "w", encoding="utf-8") as handle:
        handle.write(js_content)

    print("\n" + "=" * 56)
    for folder in sorted(by_folder):
        print(f"  {folder + '/':<12} {len(by_folder[folder]):>3} иконок")
    print("-" * 56)
    print(f"Бандл пересобран: {total} иконок.")
    if skipped:
        print(f"Пропущено (битые SVG): {', '.join(skipped)}")
    print("=" * 56)
    return 0


if __name__ == "__main__":
    sys.exit(bundle_icons())