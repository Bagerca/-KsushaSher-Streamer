/* js/services/SearchEngine.js */

/**
 * Изолированный движок поиска.
 * Отвечает за транслитерацию, исправление раскладки (QWERTY/ЙЦУКЕН)
 * и нечеткий поиск (Fuzzy Match) с использованием триграмм.
 */

const EN_TO_RU = {'q':'й', 'w':'ц', 'e':'у', 'r':'к', 't':'е', 'y':'н', 'u':'г', 'i':'ш', 'o':'щ', 'p':'з', '[':'х', ']':'ъ', 'a':'ф', 's':'ы', 'd':'в', 'f':'а', 'g':'п', 'h':'р', 'j':'о', 'k':'л', 'l':'д', ';':'ж', "'":'э', 'z':'я', 'x':'ч', 'c':'с', 'v':'м', 'b':'и', 'n':'т', 'm':'ь', ',':'б', '.':'ю'};
const RU_TO_EN = {};
for (let k in EN_TO_RU) RU_TO_EN[EN_TO_RU[k]] = k;

const RU_TO_EN_PHONETIC = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'c',
    'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
};

export class SearchEngine {
    
    /**
     * Исправление неправильной раскладки (ghbdtn -> привет)
     */
    static switchLayout(str) {
        let res = '';
        for(let char of str) {
            if(EN_TO_RU[char]) res += EN_TO_RU[char];
            else if(RU_TO_EN[char]) res += RU_TO_EN[char];
            else res += char;
        }
        return res;
    }

    /**
     * Превращение русского текста в английский по звучанию (сталкер -> stalker)
     */
    static transliterate(str) {
        return str.toLowerCase().split('').map(char => RU_TO_EN_PHONETIC[char] || char).join('');
    }

    /**
     * Алгоритм триграмм: вычисляет коэффициент сходства двух строк (от 0 до 1)
     */
    static calculateSimilarity(str1, str2) {
        if (!str1 || !str2) return 0;
        if (str1.toLowerCase().includes(str2.toLowerCase())) return 1.0;
        
        const set1 = this._getTrigrams(str1);
        const set2 = this._getTrigrams(str2);
        
        let matches = 0;
        for (const trigram of set2) { if (set1.includes(trigram)) matches++; }
        
        return (2.0 * matches) / (set1.length + set2.length);
    }

    static _getTrigrams(text) {
        if (!text) return [];
        const cleanText = text.toLowerCase().replace(/[^\wа-яё0-9]/gi, '');
        if (cleanText.length < 3) return [cleanText];
        
        const trigrams = [];
        for (let i = 0; i < cleanText.length - 2; i++) {
            trigrams.push(cleanText.substring(i, i + 3));
        }
        return trigrams;
    }

    /**
     * Главный метод оценки. Возвращает вес совпадения (Score) от 0 до 100.
     * Используется для выпадающих подсказок.
     */
    static scoreItemForSuggestions(title, query) {
        if (!title) return 0;
        
        const cleanQuery = query.toLowerCase().trim();
        const cleanTitle = title.toLowerCase();
        
        const layoutSwitched = this.switchLayout(cleanQuery);
        const translitQuery = this.transliterate(cleanQuery);

        let score = 0;

        // 1. Прямое совпадение
        if (cleanTitle === cleanQuery) score = 100;
        else if (cleanTitle.startsWith(cleanQuery)) score = 80;
        else if (cleanTitle.includes(` ${cleanQuery}`)) score = 65;
        else if (cleanTitle.includes(cleanQuery)) score = 50;

        // 2. Ошибка раскладки
        if (score === 0) {
            if (cleanTitle === layoutSwitched) score = 90;
            else if (cleanTitle.startsWith(layoutSwitched)) score = 70;
            else if (cleanTitle.includes(layoutSwitched)) score = 45;
        }

        // 3. Фонетическое совпадение (Транслит)
        if (score === 0 && translitQuery !== cleanQuery) {
            if (cleanTitle === translitQuery) score = 85;
            else if (cleanTitle.startsWith(translitQuery)) score = 65;
            else if (cleanTitle.includes(translitQuery)) score = 40;
        }

        // 4. Нечеткий поиск (Опечатки) - только если слово длиннее 2 символов
        if (score === 0 && cleanQuery.length > 2) {
            const fuzzyOriginal = this.calculateSimilarity(cleanTitle, cleanQuery);
            const fuzzyTranslit = this.calculateSimilarity(cleanTitle, translitQuery);
            const bestFuzzy = Math.max(fuzzyOriginal, fuzzyTranslit);
            
            if (bestFuzzy > 0.35) score = bestFuzzy * 40; 
        }

        return score;
    }

    /**
     * Метод оценки для сетки грида (возвращает коэффициент от 0.0 до 1.0)
     */
    static scoreItemForGrid(textToSearch, title, query) {
        const cleanQuery = query.toLowerCase().trim();
        const layoutSwitched = this.switchLayout(cleanQuery);
        const translitQuery = this.transliterate(cleanQuery);
        
        let matchScore = 0;

        if (textToSearch.includes(cleanQuery)) {
            matchScore = (title && title.toLowerCase().startsWith(cleanQuery)) ? 0.9 : 0.6;
        } else if (textToSearch.includes(layoutSwitched)) {
            matchScore = 0.5;
        } else if (textToSearch.includes(translitQuery) && translitQuery !== cleanQuery) {
            matchScore = 0.45;
        } else {
            const fuzzyOriginal = this.calculateSimilarity(title, cleanQuery);
            const fuzzyTranslit = this.calculateSimilarity(title, translitQuery);
            const bestFuzzy = Math.max(fuzzyOriginal, fuzzyTranslit);
            matchScore = bestFuzzy > 0.35 ? bestFuzzy : 0;
        }

        return matchScore;
    }
}