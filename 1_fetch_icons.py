# 1_fetch_icons.py
import os
import re
import urllib.request
import urllib.error

ICONS_DIR = os.path.join("assets", "icons")
os.makedirs(ICONS_DIR, exist_ok=True)

BASE_URL = "https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/{style}/{name}.svg"

ICONS_TO_FETCH = {
    "brands": [
        "twitch", "youtube", "telegram", "vk", "discord", "tiktok", "steam", "google"
    ],
    "regular": [
        "copy", "handshake", "clock"
    ],
    "solid": [
        "play", "pause", "forward-step", "backward-step", 
        ("volume-up", "volume-high"), 
        "music", "terminal", "video", "users", "comment-dots", "quote-left", 
        "satellite-dish", "circle-notch", "star", "folder-open", "list", 
        ("search", "magnifying-glass"), 
        ("sort-alpha-down", "arrow-down-a-z"), 
        ("sort-alpha-up", "arrow-up-a-z"), 
        ("sort-numeric-down-alt", "arrow-down-1-9"), 
        ("sort-numeric-up-alt", "arrow-up-1-9"), 
        ("th-large", "table-cells-large"), ("th", "table-cells"), 
        ("trash-alt", "trash-can"), 
        "chevron-up", "chevron-down", "chevron-right", "database", 
        ("times", "xmark"), ("cog", "gear"), "skull", "eye", "headphones", 
        ("sync-alt", "rotate-right"), "heart", "arrow-up", "sack-dollar", 
        "ghost", "bolt", "microchip", "desktop", "memory", "microphone-lines", 
        ("hard-hat", "helmet-safety"), ("broadcast-tower", "tower-broadcast"), 
        ("history", "clock-rotate-left"), "grip-vertical", "plus", "file-code", 
        "camera", "pen", "gamepad", "film", ("calendar-times", "calendar-xmark"), 
        "laptop-code", "code", "sun", "wave-square", "dragon", "fire", 
        ("beer", "beer-mug-empty"), "medal", "tree", "campground", "city", 
        ("user-friends", "user-group"), ("map-marker-alt", "location-dot"), 
        "hammer", "user", "fish", "water" # Добавлены fish и water для Tetlabot
    ]
}

def fetch_icons():
    print(f"Перезагрузка полноценных SVG в {ICONS_DIR}...\n")
    
    for style, icons in ICONS_TO_FETCH.items():
        for icon in icons:
            if isinstance(icon, tuple):
                save_name, fetch_name = icon
            else:
                save_name, fetch_name = icon, icon

            url = BASE_URL.format(style=style, name=fetch_name)
            filepath = os.path.join(ICONS_DIR, f"{save_name}.svg")

            try:
                req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req) as response:
                    svg_content = response.read().decode('utf-8')
                    
                    # ПРАВИЛЬНОЕ удаление комментариев без повреждения тега <svg>
                    svg_content = re.sub(r'<!--.*?-->', '', svg_content, flags=re.DOTALL).strip()

                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(svg_content)
                
                print(f"[OK] {save_name}.svg")
            except Exception as e:
                print(f"[ERROR] Не удалось скачать {save_name}: {e}")

if __name__ == "__main__":
    fetch_icons()
    print("\nГотово! Теперь запустите 2_bundle_icons.py")