import os

# --- НАСТРОЙКИ ---

# Имя итогового файла
OUTPUT_FILE = 'merged_project_for_llm.txt'

# Папки, которые нужно игнорировать (чтобы не засунуть в нейросеть виртуальное окружение или git)
IGNORE_DIRS = {
    '.git', '.idea', '.vscode', '__pycache__', 'venv', 'env', 
    'node_modules', 'dist', 'build', '.next', 'migrations'
}

# Расширения файлов, которые нужно игнорировать (картинки, бинарники и т.д.)
IGNORE_EXTENSIONS = {
    '.pyc', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', 
    '.zip', '.tar', '.gz', '.mp4', '.sqlite3', '.exe', '.dll', '.so'
}

# Конкретные файлы, которые не нужно читать
IGNORE_FILES = {
    OUTPUT_FILE, 
    'merge_to_single_file.py', 
    'poetry.lock', 
    'package-lock.json', 
    '.DS_Store'
}

def merge_project(root_dir='.'):
    merged_content = []
    
    for root, dirs, files in os.walk(root_dir):
        # Удаляем из обхода игнорируемые директории
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        
        for file in files:
            # Пропускаем игнорируемые файлы
            if file in IGNORE_FILES:
                continue
                
            # Пропускаем игнорируемые расширения
            _, ext = os.path.splitext(file)
            if ext.lower() in IGNORE_EXTENSIONS:
                continue
                
            file_path = os.path.join(root, file)
            rel_path = os.path.relpath(file_path, root_dir)
            
            try:
                # Пытаемся прочитать файл как текст (UTF-8)
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                # Формируем красивый разделитель для нейросети
                separator = f"\n\n{'='*80}\n"
                header = f"File: {rel_path}\n"
                separator2 = f"{'='*80}\n\n"
                
                merged_content.append(separator + header + separator2 + content)
                print(f"Добавлен: {rel_path}")
                
            except UnicodeDecodeError:
                # Если файл бинарный (но с текстовым расширением), пропускаем его
                print(f"Пропущен (не текст): {rel_path}")
            except Exception as e:
                print(f"Ошибка чтения {rel_path}: {e}")

    # Записываем всё в один файл
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as out_f:
        out_f.write("".join(merged_content))

if __name__ == '__main__':
    print(f"Начинаю сборку файлов в {OUTPUT_FILE}...")
    merge_project()
    print(f"\nГотово! Результат сохранен в файл: {OUTPUT_FILE}")