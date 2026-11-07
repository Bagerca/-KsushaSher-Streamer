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
            
            # Гарантируем наличие width, height и currentColor
            if 'width=' not in svg_content:
                svg_content = svg_content.replace('<svg ', '<svg width="1em" height="1em" ')
            else:
                svg_content = re.sub(r'width="[^"]+"', 'width="1em"', svg_content)
                svg_content = re.sub(r'height="[^"]+"', 'height="1em"', svg_content)
            
            if 'fill=' not in svg_content:
                svg_content = svg_content.replace('<svg ', '<svg fill="currentColor" ')
            else:
                svg_content = re.sub(r'fill="[^"]+"', 'fill="currentColor"', svg_content)

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

    print("\nБандл успешно пересобран!")

if __name__ == "__main__":
    bundle_icons()