const NameMinifier = require('./name-minifier');

module.exports = function minify(code, options = {}) {
    const { 
        removeComments = true, 
        removeWhitespace = true, 
        minifyNames = true
    } = options;

    let result = code;

    // Сжатие имен переменных
    if (minifyNames) {
        const nameMinifier = new NameMinifier();
        result = nameMinifier.minifyBundle(result);
    }

    // Удаление комментариев
    if (removeComments) {
        result = result
            .replace(/\/\*[\s\S]*?\*\//g, '')           // Удаляем многострочные комментарии
        
        // Безопасное удаление однострочных комментариев
        const lines = result.split('\n');
        const processedLines = lines.map(line => {
            let inString = false;
            let stringChar = null;
            let result = '';
            
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                const nextChar = line[i + 1];
                
                if (!inString && char === '/' && nextChar === '/') {
                    break;
                }
                
                if (!inString && (char === '"' || char === "'" || char === '`')) {
                    inString = true;
                    stringChar = char;
                } else if (inString && char === stringChar) {
                    if (line[i - 1] !== '\\') {
                        inString = false;
                        stringChar = null;
                    }
                }
                
                result += char;
            }
            
            return result;
        });
        
        result = processedLines.join('\n');
    }

    // Удаление лишних пробелов и переносов строк
    if (removeWhitespace) {
        // Сначала убираем все переносы строк
        result = result.replace(/\n+/g, ' ');
        
        // Минификация пробелов вне строк и шаблонных литералов
        let inString = false;
        let stringChar = null;
        let inTemplate = false;
        let processed = '';
        for (let i = 0; i < result.length; i++) {
            const char = result[i];
            // Обработка строк
            if (!inTemplate && !inString && (char === '"' || char === "'")) {
                inString = true;
                stringChar = char;
                processed += char;
                continue;
            }
            if (inString && char === stringChar) {
                if (result[i - 1] !== '\\') {
                    inString = false;
                    stringChar = null;
                }
                processed += char;
                continue;
            }
            // Обработка шаблонных литералов
            if (!inString && !inTemplate && char === '`') {
                inTemplate = true;
                processed += char;
                continue;
            }
            if (inTemplate && char === '`') {
                inTemplate = false;
                processed += char;
                continue;
            }
            // Если мы внутри строки или шаблона, сохраняем символ как есть
            if (inString || inTemplate) {
                processed += char;
                continue;
            }
            processed += char;
        }
        result = processed;
        // Удаляем пробелы только вокруг операторов и знаков препинания вне строк/шаблонов
        result = result
            .replace(/\s*([=+\-*/%<>&|^~!?:;,\.\(\)\[\]\{\}])\s*/g, '$1')
            // Удаляем множественные пробелы
            .replace(/ +/g, ' ')
            .trim();
    }
    
    return result;
}