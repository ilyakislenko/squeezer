const { transformExportsToCommonJS } = require('./exports-extractor-ast.js');
const { transformImportsToCommonJS } = require('./imports-extractor-ast.js');
const path = require('path');

module.exports = function generateBundle(graph) {
    let modules = '';
    let moduleMap = {};
  
    // Простой ID модуля
    graph.forEach((module, idx) => {
      moduleMap[module.file] = idx;
    });
  
    graph.forEach((module, idx) => {
      const id = idx;
      let transformedCode = module.code;
      const imports = module.imports || [];
      imports.forEach(imp => {
        const importPath = imp.path;
        const targetFile = path.resolve(path.dirname(module.file), importPath + (importPath.endsWith('.js') ? '' : '.js'));
        const targetId = moduleMap[targetFile];
        if (targetId !== undefined) {
          // import default, { named } from '...'
          if (imp.defaultImport && imp.namedImports.length > 0) {
            const importRegex = new RegExp(`[ \t]*import\\s+${imp.defaultImport}\\s*,\\s*{[^}]*}\\s*from\\s+['\"]${importPath.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}['\"];?`, 'g');
            const named = imp.namedImports.map(x => x.name).join(', ');
            const requireCode = `const ${imp.defaultImport} = require(${targetId});\nconst { ${named} } = require(${targetId});`;
            transformedCode = transformedCode.replace(importRegex, requireCode);
          } else if (imp.defaultImport) {
            const importRegex = new RegExp(`[ \t]*import\\s+${imp.defaultImport}\\s*from\\s+['\"]${importPath.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}['\"];?`, 'g');
            const requireCode = `const ${imp.defaultImport} = require(${targetId});`;
            transformedCode = transformedCode.replace(importRegex, requireCode);
          } else if (imp.namedImports.length > 0) {
            const importRegex = new RegExp(`[ \t]*import\\s*{[^}]*}\\s*from\\s+['\"]${importPath.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}['\"];?`, 'g');
            const named = imp.namedImports.map(x => x.name).join(', ');
            const requireCode = `const { ${named} } = require(${targetId});`;
            transformedCode = transformedCode.replace(importRegex, requireCode);
          } else if (imp.namespaceImport) {
            const importRegex = new RegExp(`[ \t]*import\\s+\\*\\s+as\\s+${imp.namespaceImport}\\s*from\\s+['\"]${importPath.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}['\"];?`, 'g');
            const requireCode = `const ${imp.namespaceImport} = require(${targetId});`;
            transformedCode = transformedCode.replace(importRegex, requireCode);
          }
        }
      });
      // Сохраним имена всех экспортируемых функций
      let exportedNames = [];
      let defaultExportValue = null;
      transformedCode = transformedCode.replace(/export\s+function\s+(\w+)/g, (m, fn) => {
        exportedNames.push(fn);
        return `function ${fn}`;
      });
      // export default ...
      transformedCode = transformedCode.replace(/export\s+default\s+(.+?);?$/gm, (m, val) => {
        defaultExportValue = val;
        return '';
      });
      transformedCode = transformedCode.replace(/export\s+{\s*([^}]+)\s*};?/g, (match, exports) => {
        const exportNames = exports.split(',').map(e => e.trim());
        exportNames.forEach(name => {
          if (!exportedNames.includes(name)) exportedNames.push(name);
        });
        return '';
      });
      // Вставим экспорты в конец
      if (defaultExportValue && exportedNames.length > 0) {
        transformedCode += `\nmodule.exports = { default: ${defaultExportValue}, ${exportedNames.join(', ')} };`;
      } else if (defaultExportValue) {
        transformedCode += `\nmodule.exports = ${defaultExportValue};`;
      } else if (exportedNames.length > 0) {
        transformedCode += '\n' + exportedNames.map(name => `module.exports.${name} = ${name};`).join('\n');
      }
      modules += `
        ${id}: function(module, exports, require) {
          ${transformedCode}
        },
      `;
    });
  
    const runtime = `
      (function(modules) {
        const cache = {};
        function require(moduleId) {
          if (cache[moduleId]) return cache[moduleId].exports;
          const module = { exports: {} };
          modules[moduleId](module, module.exports, require);
          cache[moduleId] = module;
          return module.exports;
        }
        require(0);
      })({ ${modules} });
    `;
  
    return runtime;
}