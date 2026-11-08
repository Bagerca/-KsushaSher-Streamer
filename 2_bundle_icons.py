# 2_bundle_icons.py
import os
import glob
import re

ICONS_DIR = os.path.join("assets", "icons")
OUTPUT_JS = os.path.join("js", "utils", "icons.js")

def bundle_icons():
    os.makedirs(os.path.dirname(OUTPUT_JS), exist_ok=True)
    svg_files = glob.glob(os.path.join(ICONS_DIR, "*.svg"))
    
    if not svg_files:
        print(f"Иконки не найдены в {ICONS_DIR}. Сначала запустите 1_fetch_icons.py")
        return

    icons_dict = []
    print(f"Сборка {len(svg_files)} иконок в {OUTPUT_JS}...")

    for filepath in svg_files:
        filename = os.path.basename(filepath)
        icon_name = os.path.splitext(filename)[0]

        with open(filepath, 'r', encoding='utf-8') as f:
            svg_content = f.read().strip()
            
            # Работаем ТОЛЬКО с открывающим тегом <svg ... > чтобы не сломать внутренние контуры
            match = re.search(r'<svg([^>]+)>', svg_content)
            if match:
                attrs = match.group(1)
                
                # Удаляем старые width, height, fill чтобы не было дублей в корне
                attrs = re.sub(r'\s+width="[^"]+"', '', attrs)
                attrs = re.sub(r'\s+height="[^"]+"', '', attrs)
                attrs = re.sub(r'\s+fill="[^"]+"', '', attrs)
                
                # Принудительно задаем правильные базовые атрибуты
                attrs += ' width="1em" height="1em" fill="currentColor"'
                
                # Собираем тег обратно
                new_svg = f'<svg{attrs}>'
                svg_content = svg_content[:match.start()] + new_svg + svg_content[match.end():]

            svg_content = svg_content.replace('`', '\\`')
            icons_dict.append(f"    '{icon_name}': `{svg_content}`")

    js_content = """/* js/utils/icons.js */
/* АВТОГЕНЕРАЦИЯ: Не редактировать вручную. Используйте 2_bundle_icons.py */

export const Icons = {
""" + ",\n".join(icons_dict) + """
};

/**
 * Ищет все теги <i> с классами FontAwesome и вставляет внутрь полноценный SVG
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
    with open(OUTPUT_JS, 'w', encoding='utf-8') as f:
        f.write(js_content)

    print("\nБандл успешно пересобран. Баги с заливкой и артефактами устранены!")

if __name__ == "__main__":
    bundle_icons()