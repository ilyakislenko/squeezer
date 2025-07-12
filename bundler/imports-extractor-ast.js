// Финальная версия экстрактора импортов без regex
// Более надежная альтернатива регулярным выражениям

function extractImports(code) {
  const imports = [];
  const lines = code.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Пропускаем комментарии и пустые строки
    if (line.startsWith('//') || line.startsWith('/*') || line === '') {
      continue;
    }
    
    // Ищем import statements
    if (/^import\s/.test(line)) {
      // Обрабатываем многострочные импорты
      let fullImportLine = line;
      let braceCount = 0;
      let inImport = false;
      
      // Подсчитываем фигурные скобки в текущей строке
      for (let char of line) {
        if (char === '{') {
          braceCount++;
          inImport = true;
        } else if (char === '}') {
          braceCount--;
        }
      }
      
      // Если есть открытые скобки, ищем закрывающие в следующих строках
      if (inImport && braceCount > 0) {
        for (let j = i + 1; j < lines.length; j++) {
          const nextLine = lines[j];
          fullImportLine += ' ' + nextLine.trim();
          
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
      
      const importMatch = parseImportStatement(fullImportLine);
      if (importMatch) {
        imports.push(importMatch);
      }
    }
  }
  
  return imports;
}

// Парсинг import statement
function parseImportStatement(line) {
  // Убираем 'import ' с начала
  let content = line.substring(7).trim();
  
  // Ищем 'from' (учитываем возможные пробелы)
  const fromMatch = content.match(/\s+from\s+/);
  if (!fromMatch) return null;
  
  const fromIndex = fromMatch.index;
  const importPart = content.substring(0, fromIndex).trim();
  const pathPart = content.substring(fromIndex + fromMatch[0].length).trim();
  
  // Извлекаем путь (убираем кавычки и точку с запятой)
  const path = pathPart.replace(/^['"`]|['"`];?$/g, '');
  
  // Парсим импорты
  const imports = parseImportClause(importPart);
  
  return {
    ...imports,
    path
  };
}

// Парсинг части импорта (default и named imports)
function parseImportClause(clause) {
  const result = {
    defaultImport: null,
    namedImports: [],
    namespaceImport: null
  };
  
  // Проверяем на namespace import (* as name)
  if (clause.startsWith('* as ')) {
    result.namespaceImport = clause.substring(5).trim();
    return result;
  }
  
  // Проверяем на default import
  if (!clause.startsWith('{')) {
    // Есть default import
    const commaIndex = clause.indexOf(',');
    if (commaIndex !== -1) {
      result.defaultImport = clause.substring(0, commaIndex).trim();
      const namedPart = clause.substring(commaIndex + 1).trim();
      if (namedPart.startsWith('{') && namedPart.endsWith('}')) {
        result.namedImports = parseNamedImports(namedPart);
      }
    } else {
      result.defaultImport = clause.trim();
    }
  } else {
    // Только named imports
    result.namedImports = parseNamedImports(clause);
  }
  
  return result;
}

// Парсинг named imports
function parseNamedImports(namedPart) {
  // Убираем фигурные скобки
  const content = namedPart.substring(1, namedPart.length - 1);
  
  if (!content.trim()) return [];
  
  // Разбиваем по запятой и обрабатываем каждый импорт
  return content.split(',')
    .map(item => item.trim())
    .filter(item => item.length > 0)
    .map(item => {
      // Обрабатываем alias (import { name as alias })
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

// Дополнительные утилиты для работы с импортами
function formatImport(importInfo) {
  let result = 'import ';
  
  if (importInfo.namespaceImport) {
    result += `* as ${importInfo.namespaceImport}`;
  } else {
    if (importInfo.defaultImport) {
      result += importInfo.defaultImport;
    }
    
    if (importInfo.namedImports.length > 0) {
      if (importInfo.defaultImport) {
        result += ', ';
      }
      result += '{ ' + importInfo.namedImports.map(imp => 
        imp.alias ? `${imp.name} as ${imp.alias}` : imp.name
      ).join(', ') + ' }';
    }
  }
  
  result += ` from '${importInfo.path}'`;
  return result;
}

function transformImportsToCommonJS(code) {
  const imports = extractImports(code);
  const lines = code.split('\n');
  const resultLines = [];
  let i = 0;
  while (i < lines.length) {
    let line = lines[i].trim();
    if (line.startsWith('import ')) {
      // Многострочный импорт
      let fullImportLine = line;
      let braceCount = 0;
      let inImport = false;
      for (let char of line) {
        if (char === '{') { braceCount++; inImport = true; }
        else if (char === '}') { braceCount--; }
      }
      if (inImport && braceCount > 0) {
        for (let j = i + 1; j < lines.length; j++) {
          const nextLine = lines[j];
          fullImportLine += ' ' + nextLine.trim();
          for (let char of nextLine) {
            if (char === '{') braceCount++;
            else if (char === '}') braceCount--;
          }
          if (braceCount === 0) { i = j; break; }
        }
      }
      const imp = parseImportStatement(fullImportLine);
      if (imp) {
        // Генерируем require
        if (imp.namespaceImport) {
          resultLines.push(`const ${imp.namespaceImport} = require('${imp.path}');`);
        } else {
          let requireLine = '';
          if (imp.defaultImport && imp.namedImports.length === 0) {
            requireLine = `const ${imp.defaultImport} = require('${imp.path}').default;`;
          } else if (imp.defaultImport && imp.namedImports.length > 0) {
            requireLine = `const ${imp.defaultImport} = require('${imp.path}').default;`;
            const named = imp.namedImports.map(x => x.alias && x.alias !== x.name ? `${x.name}: ${x.alias}` : x.name).join(', ');
            requireLine += `\nconst { ${named} } = require('${imp.path}');`;
          } else if (imp.namedImports.length > 0) {
            const named = imp.namedImports.map(x => x.alias && x.alias !== x.name ? `${x.name}: ${x.alias}` : x.name).join(', ');
            requireLine = `const { ${named} } = require('${imp.path}');`;
          }
          if (requireLine) resultLines.push(requireLine);
        }
      }
      i++;
      continue;
    }
    resultLines.push(lines[i]);
    i++;
  }
  return resultLines.join('\n');
}

// Экспортируем основную функцию и утилиты
module.exports = {
  extractImports,
  transformImportsToCommonJS,
  formatImport,
  parseImportStatement,
  parseImportClause,
  parseNamedImports
}; 