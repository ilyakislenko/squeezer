const fs = require('fs');
const path = require('path');

class NameMinifier {
    constructor() {
        this.variableMap = new Map();
        this.nameCounter = 0;
        this.reservedNames = new Set([
            'require', 'module', 'exports', 'console', 'window', 'document',
            'process', 'env', 'log', 'fetch', 'JSON', 'Promise', 'Array', 'Object', 'String', 'Number',
            'Boolean', 'Date', 'Math', 'RegExp', 'Error', 'Function', 'Map',
            'Set', 'WeakMap', 'WeakSet', 'Symbol', 'Proxy', 'Reflect',
            'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'encodeURI',
            'decodeURI', 'encodeURIComponent', 'decodeURIComponent',
            'escape', 'unescape', 'eval', 'setTimeout', 'setInterval',
            'clearTimeout', 'clearInterval', 'requestAnimationFrame',
            'cancelAnimationFrame', 'addEventListener', 'removeEventListener',
            'getElementById', 'getElementsByClassName', 'getElementsByTagName',
            'querySelector', 'querySelectorAll', 'createElement', 'appendChild',
            'removeChild', 'replaceChild', 'insertBefore', 'cloneNode',
            'getAttribute', 'setAttribute', 'removeAttribute', 'hasAttribute',
            'classList', 'dataset', 'innerHTML', 'outerHTML', 'textContent',
            'innerText', 'outerText', 'style', 'className', 'id', 'tagName',
            'nodeType', 'nodeName', 'nodeValue', 'parentNode', 'childNodes',
            'firstChild', 'lastChild', 'nextSibling', 'previousSibling',
            'children', 'firstElementChild', 'lastElementChild',
            'nextElementSibling', 'previousElementSibling', 'length',
            'push', 'pop', 'shift', 'unshift', 'splice', 'slice', 'concat',
            'join', 'reverse', 'sort', 'indexOf', 'lastIndexOf', 'includes',
            'forEach', 'map', 'filter', 'reduce', 'reduceRight', 'some',
            'every', 'find', 'findIndex', 'keys', 'values', 'entries',
            'has', 'get', 'set', 'delete', 'clear', 'size', 'add', 'forEach',
            'toString', 'valueOf', 'hasOwnProperty', 'isPrototypeOf',
            'propertyIsEnumerable', 'constructor', 'prototype', '__proto__',
            'arguments', 'caller', 'length', 'name', 'apply', 'call', 'bind',
            'this', 'super', 'new', 'typeof', 'instanceof', 'delete', 'void',
            'in', 'of', 'yield', 'await', 'async', 'function', 'class',
            'const', 'let', 'var', 'if', 'else', 'switch', 'case', 'default',
            'for', 'while', 'do', 'break', 'continue', 'return', 'throw',
            'try', 'catch', 'finally', 'import', 'export', 'from', 'as',
            'static', 'extends', 'implements', 'interface', 'package',
            'private', 'protected', 'public', 'enum', 'debugger', 'with',
            'null', 'undefined', 'true', 'false', 'Infinity', 'NaN'
        ]);
        
        // Строки, которые нельзя минифицировать (в console.log, alert и т.д.)
        this.stringLiterals = new Set();
    }

    generateShortName() {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$';
        let name = '';
        
        do {
            name = '';
            let num = this.nameCounter++;
            
            if (num === 0) {
                name = 'a';
            } else {
                while (num > 0) {
                    name = chars[num % chars.length] + name;
                    num = Math.floor(num / chars.length);
                }
            }
        } while (this.reservedNames.has(name) || this.variableMap.has(name));
        
        return name;
    }

    extractStringLiterals(code) {
        // Извлекаем все строковые литералы из кода
        const stringRegex = /(["'`])((?:(?!\1)[^\\]|\\.)*)\1/g;
        let match;
        
        while ((match = stringRegex.exec(code)) !== null) {
            const fullString = match[0];
            const stringContent = match[2];
            
            // Ищем имена переменных/функций в строковых литералах
            const nameRegex = /\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g;
            let nameMatch;
            
            while ((nameMatch = nameRegex.exec(stringContent)) !== null) {
                this.stringLiterals.add(nameMatch[0]);
            }
        }
    }

    parseCode(code) {
        const variables = new Set();
        const functions = new Set();
        const classes = new Set();
        
        // Сначала извлекаем строковые литералы
        this.extractStringLiterals(code);
        
        // Улучшенный парсер для поиска объявлений переменных и функций
        const patterns = [
            // var/let/const declarations
            /(?:var|let|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
            // function declarations
            /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g,
            // function expressions
            /const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*function/g,
            /let\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*function/g,
            /var\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*function/g,
            // arrow functions
            /const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*\(/g,
            /let\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*\(/g,
            /var\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*\(/g,
            // class declarations
            /class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
            // method declarations
            /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*{/g,
            // parameter names
            /function\s*\(([^)]*)\)/g,
            /\(([^)]*)\)\s*=>/g,
            // destructuring
            /const\s*{([^}]+)}/g,
            /let\s*{([^}]+)}/g,
            /var\s*{([^}]+)}/g,
            /const\s*\[([^\]]+)\]/g,
            /let\s*\[([^\]]+)\]/g,
            /var\s*\[([^\]]+)\]/g,
            // object property assignments
            /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g,
            // variable assignments
            /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g,
            // function calls
            /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g,
            // property access
            /\.([a-zA-Z_$][a-zA-Z0-9_$]*)/g
        ];

        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(code)) !== null) {
                if (match[1]) {
                    const names = match[1].split(',').map(name => name.trim());
                    names.forEach(name => {
                        if (name && /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name)) {
                            if (pattern.source.includes('class')) {
                                classes.add(name);
                            } else if (pattern.source.includes('function') || pattern.source.includes('=>')) {
                                functions.add(name);
                            } else {
                                variables.add(name);
                            }
                        }
                    });
                }
            }
        });

        return { variables, functions, classes };
    }

    shouldPreserveName(name) {
        // Не минифицируем зарезервированные имена
        if (this.reservedNames.has(name)) return true;
        
        // Не минифицируем слишком короткие имена (меньше 3 символов)
        if (name.length < 3) return true;
        
        // Не минифицируем константы (все заглавные с подчеркиваниями)
        if (/^[A-Z_][A-Z0-9_]*$/.test(name)) return true;
        
        // Не минифицируем конструкторы (начинаются с заглавной буквы)
        if (/^[A-Z][a-zA-Z0-9]*$/.test(name)) return true;
        
        // Не минифицируем имена, которые встречаются в строковых литералах
        if (this.stringLiterals.has(name)) return true;
        
        // Не минифицируем глобальные объекты и методы
        const globalNames = [
            'window', 'document', 'console', 'Math', 'JSON', 'Promise',
            'Array', 'Object', 'String', 'Number', 'Boolean', 'Date',
            'RegExp', 'Error', 'Function', 'Map', 'Set', 'WeakMap', 'WeakSet',
            'Symbol', 'Proxy', 'Reflect', 'parseInt', 'parseFloat', 'isNaN',
            'isFinite', 'encodeURI', 'decodeURI', 'encodeURIComponent',
            'decodeURIComponent', 'escape', 'unescape', 'eval', 'setTimeout',
            'setInterval', 'clearTimeout', 'clearInterval', 'requestAnimationFrame',
            'cancelAnimationFrame', 'addEventListener', 'removeEventListener',
            'getElementById', 'getElementsByClassName', 'getElementsByTagName',
            'querySelector', 'querySelectorAll', 'createElement', 'appendChild',
            'removeChild', 'replaceChild', 'insertBefore', 'cloneNode',
            'getAttribute', 'setAttribute', 'removeAttribute', 'hasAttribute',
            'classList', 'dataset', 'innerHTML', 'outerHTML', 'textContent',
            'innerText', 'outerText', 'style', 'className', 'id', 'tagName',
            'nodeType', 'nodeName', 'nodeValue', 'parentNode', 'childNodes',
            'firstChild', 'lastChild', 'nextSibling', 'previousSibling',
            'children', 'firstElementChild', 'lastElementChild',
            'nextElementSibling', 'previousElementSibling', 'length',
            'push', 'pop', 'shift', 'unshift', 'splice', 'slice', 'concat',
            'join', 'reverse', 'sort', 'indexOf', 'lastIndexOf', 'includes',
            'forEach', 'map', 'filter', 'reduce', 'reduceRight', 'some',
            'every', 'find', 'findIndex', 'keys', 'values', 'entries',
            'has', 'get', 'set', 'delete', 'clear', 'size', 'add',
            'toString', 'valueOf', 'hasOwnProperty', 'isPrototypeOf',
            'propertyIsEnumerable', 'constructor', 'prototype', '__proto__',
            'arguments', 'caller', 'apply', 'call', 'bind'
        ];
        
        if (globalNames.includes(name)) return true;
        
        // Не минифицируем стандартные методы console
        const consoleMethods = ['log', 'error', 'warn', 'info', 'debug', 'trace', 'time', 'timeEnd', 'group', 'groupEnd', 'table', 'clear', 'count', 'countReset', 'dir', 'dirxml', 'profile', 'profileEnd', 'timeLog'];
        if (consoleMethods.includes(name)) return true;
        
        // Не минифицируем стандартные методы JSON
        const jsonMethods = ['parse', 'stringify'];
        if (jsonMethods.includes(name)) return true;
        
        // Не минифицируем стандартные методы Math
        const mathMethods = ['abs', 'acos', 'acosh', 'asin', 'asinh', 'atan', 'atan2', 'atanh', 'cbrt', 'ceil', 'clz32', 'cos', 'cosh', 'exp', 'expm1', 'floor', 'fround', 'hypot', 'imul', 'log', 'log1p', 'log2', 'log10', 'max', 'min', 'pow', 'random', 'round', 'sign', 'sin', 'sinh', 'sqrt', 'tan', 'tanh', 'trunc'];
        if (mathMethods.includes(name)) return true;
        
        // Не минифицируем стандартные методы Date
        const dateMethods = ['getTime', 'getDate', 'getDay', 'getFullYear', 'getHours', 'getMilliseconds', 'getMinutes', 'getMonth', 'getSeconds', 'getTimezoneOffset', 'getUTCDate', 'getUTCDay', 'getUTCFullYear', 'getUTCHours', 'getUTCMilliseconds', 'getUTCMinutes', 'getUTCMonth', 'getUTCSeconds', 'setDate', 'setFullYear', 'setHours', 'setMilliseconds', 'setMinutes', 'setMonth', 'setSeconds', 'setTime', 'setUTCDate', 'setUTCFullYear', 'setUTCHours', 'setUTCMilliseconds', 'setUTCMinutes', 'setUTCMonth', 'setUTCSeconds', 'toDateString', 'toISOString', 'toJSON', 'toLocaleDateString', 'toLocaleString', 'toLocaleTimeString', 'toString', 'toTimeString', 'toUTCString', 'valueOf'];
        if (dateMethods.includes(name)) return true;
        
        // Не минифицируем стандартные методы Array
        const arrayMethods = ['concat', 'copyWithin', 'entries', 'every', 'fill', 'filter', 'find', 'findIndex', 'flat', 'flatMap', 'forEach', 'includes', 'indexOf', 'join', 'keys', 'lastIndexOf', 'map', 'pop', 'push', 'reduce', 'reduceRight', 'reverse', 'shift', 'slice', 'some', 'sort', 'splice', 'toLocaleString', 'toString', 'unshift', 'values'];
        if (arrayMethods.includes(name)) return true;
        
        // Не минифицируем стандартные методы Object
        const objectMethods = ['assign', 'create', 'defineProperty', 'defineProperties', 'entries', 'freeze', 'fromEntries', 'getOwnPropertyDescriptor', 'getOwnPropertyDescriptors', 'getOwnPropertyNames', 'getOwnPropertySymbols', 'getPrototypeOf', 'hasOwn', 'is', 'isExtensible', 'isFrozen', 'isSealed', 'keys', 'preventExtensions', 'seal', 'setPrototypeOf', 'values'];
        if (objectMethods.includes(name)) return true;
        
        // Не минифицируем стандартные методы String
        const stringMethods = ['anchor', 'big', 'blink', 'bold', 'charAt', 'charCodeAt', 'codePointAt', 'concat', 'endsWith', 'fixed', 'fontcolor', 'fontsize', 'includes', 'indexOf', 'italics', 'lastIndexOf', 'link', 'localeCompare', 'match', 'matchAll', 'normalize', 'padEnd', 'padStart', 'repeat', 'replace', 'replaceAll', 'search', 'slice', 'small', 'split', 'startsWith', 'strike', 'sub', 'substr', 'substring', 'sup', 'toLocaleLowerCase', 'toLocaleUpperCase', 'toLowerCase', 'toString', 'toUpperCase', 'trim', 'trimEnd', 'trimLeft', 'trimRight', 'trimStart', 'valueOf'];
        if (stringMethods.includes(name)) return true;
        
        // Не минифицируем стандартные методы Number
        const numberMethods = ['toExponential', 'toFixed', 'toLocaleString', 'toPrecision', 'toString', 'valueOf'];
        if (numberMethods.includes(name)) return true;
        
        // Не минифицируем стандартные методы Boolean
        const booleanMethods = ['toString', 'valueOf'];
        if (booleanMethods.includes(name)) return true;
        
        // Не минифицируем стандартные методы RegExp
        const regexpMethods = ['exec', 'test', 'toString'];
        if (regexpMethods.includes(name)) return true;
        
        // Не минифицируем стандартные методы Error
        const errorMethods = ['toString', 'valueOf'];
        if (errorMethods.includes(name)) return true;
        
        // Не минифицируем стандартные методы Function
        const functionMethods = ['apply', 'bind', 'call', 'toString'];
        if (functionMethods.includes(name)) return true;
        
        // Не минифицируем стандартные методы Map
        const mapMethods = ['clear', 'delete', 'entries', 'forEach', 'get', 'has', 'keys', 'set', 'size', 'values'];
        if (mapMethods.includes(name)) return true;
        
        // Не минифицируем стандартные методы Set
        const setMethods = ['add', 'clear', 'delete', 'entries', 'forEach', 'has', 'keys', 'size', 'values'];
        if (setMethods.includes(name)) return true;
        
        // Не минифицируем стандартные методы WeakMap
        const weakMapMethods = ['delete', 'get', 'has', 'set'];
        if (weakMapMethods.includes(name)) return true;
        
        // Не минифицируем стандартные методы WeakSet
        const weakSetMethods = ['add', 'delete', 'has'];
        if (weakSetMethods.includes(name)) return true;
        
        // Не минифицируем стандартные методы Symbol
        const symbolMethods = ['toString', 'valueOf'];
        if (symbolMethods.includes(name)) return true;
        
        // Не минифицируем стандартные методы Proxy
        const proxyMethods = ['revocable'];
        if (proxyMethods.includes(name)) return true;
        
        // Не минифицируем стандартные методы Reflect
        const reflectMethods = ['apply', 'construct', 'defineProperty', 'deleteProperty', 'get', 'getOwnPropertyDescriptor', 'getPrototypeOf', 'has', 'isExtensible', 'ownKeys', 'preventExtensions', 'set', 'setPrototypeOf'];
        if (reflectMethods.includes(name)) return true;
        
        // Минифицируем остальные имена
        return false;
    }

    minifyNames(code) {
        const { variables, functions, classes } = this.parseCode(code);
        let result = code;

        // Создаем карту замен для переменных
        const allNames = new Set([...variables, ...functions, ...classes]);
        
        console.log('🔍 Найденные имена:');
        console.log('Переменные:', Array.from(variables));
        console.log('Функции:', Array.from(functions));
        console.log('Классы:', Array.from(classes));
        console.log('Строковые литералы:', Array.from(this.stringLiterals));
        
        allNames.forEach(name => {
            if (!this.shouldPreserveName(name)) {
                const shortName = this.generateShortName();
                this.variableMap.set(name, shortName);
                console.log(`🔄 ${name} → ${shortName}`);
            } else {
                console.log(`⏭️ Пропускаем ${name} (зарезервировано или слишком короткое)`);
            }
        });

        // Применяем замены
        this.variableMap.forEach((shortName, originalName) => {
            // Используем word boundaries для точной замены
            const regex = new RegExp(`\\b${originalName}\\b`, 'g');
            result = result.replace(regex, shortName);
        });

        return result;
    }

    minifyBundle(bundleCode) {
        // Разбираем бандл на модули
        const moduleMatch = bundleCode.match(/\(function\(modules\)\s*{([\s\S]*?)}\s*\(\s*{([\s\S]*?)}\s*\)\s*\)/);
        
        if (!moduleMatch) {
            return this.minifyNames(bundleCode);
        }

        const [, wrapperCode, modulesCode] = moduleMatch;
        
        // Минифицируем wrapper код
        const minifiedWrapper = this.minifyNames(wrapperCode);
        
        // Разбираем и минифицируем каждый модуль
        const moduleRegex = /(\d+):\s*function\([^)]*\)\s*{([\s\S]*?)},/g;
        let minifiedModules = modulesCode;
        
        let moduleMatch2;
        while ((moduleMatch2 = moduleRegex.exec(modulesCode)) !== null) {
            const [, moduleId, moduleCode] = moduleMatch2;
            const minifiedModuleCode = this.minifyNames(moduleCode);
            minifiedModules = minifiedModules.replace(moduleCode, minifiedModuleCode);
        }

        // Собираем минифицированный бандл
        return `(function(modules){${minifiedWrapper}})({${minifiedModules}})`;
    }
}

module.exports = NameMinifier; 