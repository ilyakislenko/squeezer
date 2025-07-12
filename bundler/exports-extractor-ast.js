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

function isValidIdentifier(name) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name);
}

// Преобразование ES6 экспортов в CommonJS
function transformExportsToCommonJS(code) {
    const exports = extractExports(code);
    let transformedCode = code;
    
    const requires = [];
    const moduleExports = [];
    
    for (const exportInfo of exports) {
        if (exportInfo.namespaceExport) {
            requires.push(`const ${exportInfo.namespaceExport} = require('${exportInfo.path}');`);
        } else {
            let requireStatement = 'const { ';
            const namedExports = [];
            let hasDefaultAlias = false;
            
            if (exportInfo.namedExports.length > 0) {
                for (const exp of exportInfo.namedExports) {
                    if (exp.name === 'default' && exp.alias) {
                        if (isValidIdentifier(exp.alias)) {
                            requires.push(`const ${exp.alias} = require('${exportInfo.path}').default;`);
                            moduleExports.push(`module.exports.${exp.alias} = ${exp.alias};`);
                        } else {
                            moduleExports.push(`module.exports[${JSON.stringify(exp.alias)}] = require('${exportInfo.path}').default;`);
                        }
                        hasDefaultAlias = true;
                    } else if (exp.alias) {
                        namedExports.push(`${exp.name}: ${exp.alias}`);
                    } else {
                        namedExports.push(exp.name);
                    }
                }
            }
            
            if (exportInfo.defaultExport) {
                if (namedExports.length > 0) {
                    requireStatement += `default: ${exportInfo.defaultExport}, `;
                } else {
                    if (isValidIdentifier(exportInfo.defaultExport)) {
                        requireStatement = `const ${exportInfo.defaultExport} = require('${exportInfo.path}').default;`;
                        requires.push(requireStatement);
                        moduleExports.push(`module.exports.${exportInfo.defaultExport} = ${exportInfo.defaultExport};`);
                    } else {
                        moduleExports.push(`module.exports[${JSON.stringify(exportInfo.defaultExport)}] = require('${exportInfo.path}').default;`);
                    }
                    continue;
                }
            }
            
            if (namedExports.length > 0) {
                requireStatement += namedExports.join(', ') + ' } = require(\'' + exportInfo.path + '\');';
                requires.push(requireStatement);
                for (const exp of exportInfo.namedExports) {
                    if (!(exp.name === 'default' && exp.alias)) {
                        const exportName = exp.alias || exp.name;
                        const variableName = exp.alias || exp.name;
                        if (isValidIdentifier(exportName)) {
                            moduleExports.push(`module.exports.${exportName} = ${variableName};`);
                        } else {
                            moduleExports.push(`module.exports[${JSON.stringify(exportName)}] = ${variableName};`);
                        }
                    }
                }
            }
            if (exportInfo.defaultExport && namedExports.length > 0) {
                if (isValidIdentifier(exportInfo.defaultExport)) {
                    moduleExports.push(`module.exports.${exportInfo.defaultExport} = ${exportInfo.defaultExport};`);
                } else {
                    moduleExports.push(`module.exports[${JSON.stringify(exportInfo.defaultExport)}] = ${exportInfo.defaultExport};`);
                }
            }
        }
        if (exportInfo.namespaceExport) {
            moduleExports.push(`module.exports.${exportInfo.namespaceExport} = ${exportInfo.namespaceExport};`);
        }
    }
    
    const lines = code.split('\n');
    const filteredLines = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('export ')) {
            let braceCount = 0;
            let inExport = false;
            for (let char of line) {
                if (char === '{') {
                    braceCount++;
                    inExport = true;
                } else if (char === '}') {
                    braceCount--;
                }
            }
            if (inExport && braceCount > 0) {
                for (let j = i + 1; j < lines.length; j++) {
                    const nextLine = lines[j];
                    for (let char of nextLine) {
                        if (char === '{') {
                            braceCount++;
                        } else if (char === '}') {
                            braceCount--;
                        }
                    }
                    if (braceCount === 0) {
                        i = j;
                        break;
                    }
                }
            }
            continue;
        }
        filteredLines.push(lines[i]);
    }
    const result = [...requires, '', ...filteredLines];
    if (moduleExports.length > 0) {
        result.push('', ...moduleExports);
    }
    return result.join('\n');
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