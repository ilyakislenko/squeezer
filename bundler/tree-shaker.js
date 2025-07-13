const { extractExports } = require('./exports-extractor-ast');

// Анализирует использование экспортов в графе зависимостей
function analyzeUsage(graph) {
    const usedExports = new Map(); // modulePath -> Set of used export names
    const sideEffects = new Set(); // модули с side effects
    
    // Инициализируем карту для всех модулей
    graph.forEach(module => {
        usedExports.set(module.file, new Set());
    });
    
    // Проходим по всем импортам и собираем используемые экспорты
    graph.forEach(module => {
        const imports = module.imports || [];
        imports.forEach(imp => {
            const targetModule = graph.find(m => m.file.endsWith(imp.path + '.js') || m.file.endsWith(imp.path));
            if (!targetModule) return;
            
            const targetPath = targetModule.file;
            if (!usedExports.has(targetPath)) {
                usedExports.set(targetPath, new Set());
            }
            
            // Обрабатываем default import
            if (imp.defaultImport) {
                usedExports.get(targetPath).add('default');
            }
            
            // Обрабатываем named imports
            imp.namedImports.forEach(named => {
                usedExports.get(targetPath).add(named.name);
            });
            
            // Обрабатываем namespace import (использует все экспорты)
            if (imp.namespaceImport) {
                const exports = extractExports(targetModule.code);
                exports.forEach(exp => {
                    if (exp.type === 'named') {
                        usedExports.get(targetPath).add(exp.name);
                    } else if (exp.type === 'default') {
                        usedExports.get(targetPath).add('default');
                    }
                });
            }
        });
    });
    
    // Проверяем side effects (код, который выполняется при загрузке модуля)
    graph.forEach(module => {
        if (hasSideEffects(module.code)) {
            sideEffects.add(module.file);
        }
    });
    
    return { usedExports, sideEffects };
}

// Проверяет есть ли в модуле side effects
function hasSideEffects(code) {
    const sideEffectPatterns = [
        /console\.(log|warn|error|info)/,
        /window\./,
        /document\./,
        /process\./,
        /setTimeout\(/,
        /setInterval\(/,
        /addEventListener\(/,
        /new\s+\w+\(/,
        /\(\s*function\s*\(/,
        /\(\s*\(\)\s*=>/,
        /import\s*\(/,
        /require\s*\(/
    ];
    
    return sideEffectPatterns.some(pattern => pattern.test(code));
}

// Удаляет неиспользуемые экспорты из кода модуля
function removeUnusedExports(code, usedExports, modulePath) {
    const exports = extractExports(code);
    let modifiedCode = code;
    
    // Удаляем неиспользуемые именованные экспорты
    exports.forEach(exp => {
        if (exp.type === 'named' && !usedExports.has(exp.name)) {
            // Удаляем объявление переменной/функции/класса если оно не используется
            const declarationPattern = new RegExp(
                `(export\\s+)?(const|let|var|function|class)\\s+${exp.name}\\b[^;]*;?`,
                'g'
            );
            modifiedCode = modifiedCode.replace(declarationPattern, '');
            
            // Удаляем из exports
            const exportPattern = new RegExp(
                `exports\\.${exp.name}\\s*=\\s*${exp.name}\\s*;?`,
                'g'
            );
            modifiedCode = modifiedCode.replace(exportPattern, '');
        }
    });
    
    // Удаляем неиспользуемые default экспорты
    const defaultExport = exports.find(exp => exp.type === 'default');
    if (defaultExport && !usedExports.has('default')) {
        // Удаляем default export
        const defaultPattern = /module\.exports\s*=\s*[^;]+;?/g;
        modifiedCode = modifiedCode.replace(defaultPattern, '');
    }
    
    // Очищаем пустые строки и лишние точки с запятой
    modifiedCode = modifiedCode
        .replace(/;\s*;/g, ';')
        .replace(/\n\s*\n/g, '\n')
        .trim();
    
    return modifiedCode;
}

// Основная функция tree shaking
function shakeTree(graph) {
    console.log('🌳 Анализируем использование экспортов...');
    
    const { usedExports, sideEffects } = analyzeUsage(graph);
    
    console.log('📊 Найдены используемые экспорты:');
    usedExports.forEach((exports, modulePath) => {
        const moduleName = modulePath.split('/').pop();
        console.log(`  ${moduleName}: [${Array.from(exports).join(', ')}]`);
    });
    
    if (sideEffects.size > 0) {
        console.log('⚠️ Модули с side effects (не удаляются):');
        sideEffects.forEach(modulePath => {
            const moduleName = modulePath.split('/').pop();
            console.log(`  ${moduleName}`);
        });
    }
    
    // Применяем tree shaking к каждому модулю
    const shakenGraph = graph.map(module => {
        const moduleUsedExports = usedExports.get(module.file) || new Set();
        
        // Не удаляем код из модулей с side effects
        if (sideEffects.has(module.file)) {
            console.log(`🔄 Пропускаем ${module.file.split('/').pop()} (side effects)`);
            return module;
        }
        
        const originalSize = module.code.length;
        const shakenCode = removeUnusedExports(module.code, moduleUsedExports, module.file);
        const newSize = shakenCode.length;
        const saved = originalSize - newSize;
        
        if (saved > 0) {
            console.log(`✂️ ${module.file.split('/').pop()}: удалено ${saved} символов`);
        }
        
        return {
            ...module,
            code: shakenCode
        };
    });
    
    return shakenGraph;
}

module.exports = {
    shakeTree,
    analyzeUsage,
    removeUnusedExports,
    hasSideEffects
}; 