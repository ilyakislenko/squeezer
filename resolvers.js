const fs = require('fs');
const path = require('path');
const { extractImports, formatImport } = require('./imports-extractor-ast.js');
function resolveDependencies(entryFile) {
  const visited = new Set();
  const graph = [];

  function walk(file) {
    if (visited.has(file)) return;
    visited.add(file);

    const dir = path.dirname(file);
    const code = fs.readFileSync(file, 'utf-8');
    const imports = extractImports(code);

    graph.push({ file, code, imports });

    for (const imp of imports) {
      const absolutePath = path.resolve(dir, imp.path + (imp.path.endsWith('.js') ? '' : '.js'));
      walk(absolutePath);
    }
  }

  walk(path.resolve(entryFile));
  return graph;
}

function resolvePath(importPath, currentDir, alias) {
  for (const [a, aPath] of Object.entries(alias)) {
    if (importPath.startsWith(a)) {
      return path.resolve(aPath, importPath.slice(a.length));
    }
  }
  return path.resolve(currentDir, importPath);
}

module.exports = {
  resolveDependencies,
  resolvePath
};
