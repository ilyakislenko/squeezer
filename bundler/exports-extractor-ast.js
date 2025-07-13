// Финальная версия экстрактора экспортов без regex
// Более надежная альтернатива регулярным выражениям

function extractExports(code) {
    const exports = [];
    const lines = code.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Пропускаем комментарии и пустые строки
      if (line.startsWith('//') || line.startsWith('/*') || line === '') {
        continue;
      }
      
      // Ищем export statements
      if (line.startsWith('export ')) {
        // Обрабатываем многострочные экспорты
        let fullExportLine = line;
        let braceCount = 0;
        let inExport = false;
        
        // Подсчитываем фигурные скобки в текущей строке
        for (let char of line) {
          if (char === '{') {
            braceCount++;
            inExport = true;
          } else if (char === '}') {
            braceCount--;
          }
        }
        
        // Если есть открытые скобки, ищем закрывающие в следующих строках
        if (inExport && braceCount > 0) {
          for (let j = i + 1; j < lines.length; j++) {
            const nextLine = lines[j];
            fullExportLine += ' ' + nextLine.trim();
            
            for (let char of nextLine) {
              if (char === '{') {
                braceCount++;
              } else if (char === '}') {
                braceCount--;
              }
            }
            
            if (braceCount === 0) {
              break;
            }
          }
        }
        
        const exportMatch = parseExportStatement(fullExportLine);
        if (exportMatch) {
          exports.push(exportMatch);
        }
      }
    }
    
    return exports;
  }

function extractLocalExports(code) {
    const localExports = [];
    const lines = code.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.startsWith('//') || line.startsWith('/*') || line === '') {
            continue;
        }
        
        if (line.startsWith('export ')) {
            // Handle export default
            if (line.startsWith('export default')) {
                const defaultContent = line.substring(13).trim();
                if (defaultContent.includes('{')) {
                    // Multi-line object literal
                    let objectContent = defaultContent;
                    let braceCount = 0;
                    let inObject = false;
                    
                    for (let char of defaultContent) {
                        if (char === '{') {
                            braceCount++;
                            inObject = true;
                        } else if (char === '}') {
                            braceCount--;
                        }
                    }
                    
                    if (inObject && braceCount > 0) {
                        for (let j = i + 1; j < lines.length; j++) {
                            const nextLine = lines[j];
                            objectContent += ' ' + nextLine.trim();
                            
                            for (let char of nextLine) {
                                if (char === '{') {
                                    braceCount++;
                                } else if (char === '}') {
                                    braceCount--;
                                }
                            }
                            
                            if (braceCount === 0) {
                                break;
                            }
                        }
                    }
                    
                    localExports.push({
                        type: 'default',
                        value: objectContent
                    });
                } else {
                    localExports.push({
                        type: 'default',
                        value: defaultContent
                    });
                }
            } else if (line.startsWith('export class ') || line.startsWith('export const ') || line.startsWith('export function ')) {
                // Extract the name of the exported item
                const match = line.match(/export (class|const|function) (\w+)/);
                if (match) {
                    localExports.push({
                        type: 'named',
                        name: match[2]
                    });
                }
            }
        }
    }
    
    return localExports;
}

function isValidIdentifier(name) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name);
}

// Преобразование ES6 экспортов в CommonJS
function transformExportsToCommonJS(code) {
    // Принудительно вставляем переносы строк перед export statements
    code = code.replace(/([^;\n])\s*\n\s*export/g, '$1;\n\nexport');
    code = code.replace(/([^;\n])\s*export/g, '$1;\n\nexport');

    // Разбиваем по ;, \nexport и \n, чтобы каждое объявление было отдельной строкой
    let lines = code
        .replace(/;/g, ';\n')
        .replace(/\n(?=export )/g, '\n\n')
        .split('\n');

    // Прямой фикс: перед каждой export строкой добавляем ; к предыдущей строке если её нет
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (/^export\s+(default|const|let|var|class|function)/.test(line)) {
            // Ищем предыдущую непустую некомментированную строку
            let j = i - 1;
            while (j >= 0 && (lines[j].trim() === '' || lines[j].trim().startsWith('//'))) {
                j--;
            }
            if (j >= 0) {
                const prev = lines[j].trim();
                // Если предыдущая строка не заканчивается на ;, добавляем ;
                if (prev && !prev.endsWith(';')) {
                    lines[j] = lines[j] + ';';
                }
            }
        }
    }

    let hasDefault = false;
    let defaultExport = '';
    let defaultStart = -1;
    let defaultEnd = -1;
    let namedExports = [];
    let output = [];
    let exportLines = [];

    // 1. Найти default export (и его диапазон)
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('export default')) {
            hasDefault = true;
            defaultStart = i;
            // Многострочный объект
            if (line.includes('{')) {
                let braceCount = 0;
                let content = '';
                let j = i;
                for (let c of line) {
                    if (c === '{') braceCount++;
                    if (c === '}') braceCount--;
                }
                content = line.replace(/^export default\s*/, '');
                while (braceCount > 0 && j + 1 < lines.length) {
                    j++;
                    const nextLine = lines[j];
                    content += '\n' + nextLine;
                    for (let c of nextLine) {
                        if (c === '{') braceCount++;
                        if (c === '}') braceCount--;
                    }
                }
                defaultExport = content.replace(/;\s*$/, '');
                defaultEnd = j;
                i = j;
            } else {
                // Одна строка
                defaultExport = line.replace(/^export default\s*/, '').replace(/;\s*$/, '');
                defaultEnd = i;
            }
        } else if (/^export\s+(const|let|var|class|function)\s+(\w+)/.test(line)) {
            const match = line.match(/^export\s+(const|let|var|class|function)\s+(\w+)/);
            namedExports.push({
                name: match[2],
                type: match[1],
                line: i
            });
        }
    }

    // 2. Если есть только default
    if (hasDefault && namedExports.length === 0) {
        for (let i = 0; i < lines.length; i++) {
            if (i === defaultStart) {
                output.push('module.exports = ' + defaultExport + ';');
                i = defaultEnd;
            } else if (!lines[i].trim().startsWith('export ')) {
                output.push(lines[i]);
            }
        }
        return output.join('\n');
    }

    // 3. Если есть и default, и именованные
    for (let i = 0; i < lines.length; i++) {
        // Default export
        if (i === defaultStart) {
            exportLines.push('exports.default = ' + defaultExport + ';');
            i = defaultEnd;
            continue;
        }
        const line = lines[i];
        // Named export: const/let/var/class/function
        if (/^export\s+(const|let|var|class|function)\s+(\w+)/.test(line)) {
            const match = line.match(/^export\s+(const|let|var|class|function)\s+(\w+)/);
            // Удаляем только export в начале строки
            output.push(line.replace(/^export\s+/, ''));
            exportLines.push('exports.' + match[2] + ' = ' + match[2] + ';');
        } else if (!line.trim().startsWith('export ')) {
            output.push(line);
        }
    }
    // Добавляем экспорты в конец
    output = output.concat(exportLines);
    // Убираем лишние пустые строки
    return output.filter(l => l.trim().length > 0).join('\n');
}
  
  // Парсинг export statement
  function parseExportStatement(line) {
    // Убираем 'export ' с начала
    let content = line.substring(7).trim();
    
    // Ищем 'from' (учитываем возможные пробелы)
    const fromMatch = content.match(/\s+from\s+/);
    if (!fromMatch) return null;
    
    const fromIndex = fromMatch.index;
    const exportPart = content.substring(0, fromIndex).trim();
    const pathPart = content.substring(fromIndex + fromMatch[0].length).trim();
    
    // Извлекаем путь (убираем кавычки и точку с запятой)
    const path = pathPart.replace(/^['"`]|['"`];?$/g, '');
    
    // Парсим экспорты
    const exports = parseExportClause(exportPart);
    
    return {
      ...exports,
      path
    };
  }
  
  // Парсинг части экспорта (default и named exports)
  function parseExportClause(clause) {
    const result = {
      defaultExport: null,
      namedExports: [],
      namespaceExport: null
    };
    
    // Проверяем на namespace export (* as name)
    if (clause.startsWith('* as ')) {
      result.namespaceExport = clause.substring(5).trim();
      return result;
    }
    
    // Проверяем на default export
    if (!clause.startsWith('{')) {
      // Есть default export
      const commaIndex = clause.indexOf(',');
      if (commaIndex !== -1) {
        result.defaultExport = clause.substring(0, commaIndex).trim();
        const namedPart = clause.substring(commaIndex + 1).trim();
        if (namedPart.startsWith('{') && namedPart.endsWith('}')) {
          result.namedExports = parseNamedExports(namedPart);
        }
      } else {
        // Убираем ключевое слово 'default' если оно есть
        let defaultExport = clause.trim();
        if (defaultExport.startsWith('default ')) {
          defaultExport = defaultExport.substring(8).trim();
        }
        result.defaultExport = defaultExport;
      }
    } else {
      // Только named exports
      result.namedExports = parseNamedExports(clause);
    }
    
    return result;
  }
  
  // Парсинг named exports
  function parseNamedExports(namedPart) {
    // Убираем фигурные скобки
    const content = namedPart.substring(1, namedPart.length - 1);
    
    if (!content.trim()) return [];
    
    // Разбиваем по запятой и обрабатываем каждый экспорт
    return content.split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0)
      .map(item => {
        // Обрабатываем alias (export { name as alias })
        const asIndex = item.indexOf(' as ');
        if (asIndex !== -1) {
          return {
            name: item.substring(0, asIndex).trim(),
            alias: item.substring(asIndex + 4).trim()
          };
        }
        return { name: item };
      });
  }     
  
  // Дополнительные утилиты для работы с экспортами
  function formatExport(exportInfo) {
    let result = 'export ';
    if (exportInfo.namespaceExport) {
      result += `* as ${exportInfo.namespaceExport}`;
    } else {
      if (exportInfo.defaultExport) {
        result += exportInfo.defaultExport;
      }
      if (exportInfo.namedExports.length > 0) {
        if (exportInfo.defaultExport) {
          result += ', ';
        }
        result += '{ ' + exportInfo.namedExports.map(exp => 
          exp.alias ? `${exp.name} as ${exp.alias}` : exp.name
        ).join(', ') + ' }';
      }
    }
    result += ` from '${exportInfo.path}'`;
    return result;
}

// Экспортируем основную функцию и утилиты
module.exports = {
  extractExports,
  transformExportsToCommonJS,
  formatExport,
  parseExportStatement,
  parseExportClause,
  parseNamedExports
};