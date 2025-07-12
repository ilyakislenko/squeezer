// Альтернативная версия с использованием Babel parser
// Для использования нужно установить: npm install @babel/parser

function extractImportsWithBabel(code) {
  try {
    // Проверяем, доступен ли @babel/parser
    const parser = require('@babel/parser');
    
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx'] // если нужна поддержка JSX
    });
    
    const imports = [];
    
    // Ищем импорты в корне программы
    ast.program.body.forEach(node => {
      if (node.type === 'ImportDeclaration') {
        const importInfo = {
          path: node.source.value,
          defaultImport: null,
          namedImports: [],
          namespaceImport: null
        };
        
        // Обрабатываем specifiers
        node.specifiers.forEach(specifier => {
          if (specifier.type === 'ImportDefaultSpecifier') {
            importInfo.defaultImport = specifier.local.name;
          } else if (specifier.type === 'ImportSpecifier') {
            importInfo.namedImports.push({
              name: specifier.imported ? specifier.imported.name : specifier.local.name,
              alias: specifier.local.name
            });
          } else if (specifier.type === 'ImportNamespaceSpecifier') {
            importInfo.namespaceImport = specifier.local.name;
          }
        });
        
        imports.push(importInfo);
      }
    });
    
    return imports;
    
  } catch (error) {
    console.warn('Babel parser error:', error.message);
    return extractImportsFallback(code);
  }
}

// Fallback парсер (улучшенная версия без regex)
function extractImportsFallback(code) {
  const imports = [];
  const lines = code.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Пропускаем комментарии и пустые строки
    if (line.startsWith('//') || line.startsWith('/*') || line === '') {
      continue;
    }
    
    // Ищем import statements
    if (line.startsWith('import ')) {
      const importMatch = parseImportStatement(line);
      if (importMatch) {
        imports.push(importMatch);
      }
    }
  }
  
  return imports;
}

// Парсинг import statement (улучшенная версия)
function parseImportStatement(line) {
  // Убираем 'import ' с начала
  let content = line.substring(7).trim();
  
  // Ищем 'from' (учитываем возможные пробелы)
  const fromMatch = content.match(/\s+from\s+/);
  if (!fromMatch) return null;
  
  const fromIndex = fromMatch.index;
  const importPart = content.substring(0, fromIndex).trim();
  const pathPart = content.substring(fromIndex + fromMatch[0].length).trim();
  
  // Извлекаем путь (убираем кавычки)
  const path = pathPart.replace(/^['"`]|['"`]$/g, '');
  
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
    namedImports: []
  };
  
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

module.exports = extractImportsWithBabel; 