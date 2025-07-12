const { transformExportsToCommonJS } = require('./exports-extractor-ast.js');
const { transformImportsToCommonJS } = require('./imports-extractor-ast.js');

module.exports = function generateBundle(graph) {
    let modules = '';
    let moduleMap = {};
  
    graph.forEach((module, idx) => {
      const id = idx; // Простой ID модуля
      moduleMap[module.file] = id;
      // Сначала преобразуем импорты, затем экспорты
      const codeWithRequires = transformImportsToCommonJS(module.code);
      const transformedCode = transformExportsToCommonJS(codeWithRequires);
      modules += `
        ${id}: function(module, exports) {
          ${transformedCode}
        },
      `;
    });
  
    // Заменяем импорты на require()
    const runtime = `
      (function(modules) {
        const cache = {};
        function require(moduleId) {
          if (cache[moduleId]) return cache[moduleId].exports;
          const module = { exports: {} };
          modules[moduleId](module, module.exports);
          cache[moduleId] = module;
          return module.exports;
        }
        require(0); // Запускаем entry-модуль (index.js)
      })({ ${modules} });
    `;
  
    return runtime;
}