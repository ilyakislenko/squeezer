const fs = require('fs');
const path = require('path');

function loadEnvFile(envPath) {
    const env = {};
    if (!fs.existsSync(envPath)) return env;
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        let value = trimmed.slice(eqIdx + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        env[key] = value;
    }
    return env;
}

function processEnvReplace(code, envObj) {
    return code.replace(/process\.env\.([a-zA-Z0-9_]+)/g, (match, varName) => {
        if (envObj[varName] !== undefined) {
            return JSON.stringify(envObj[varName]);
        }
        // Если переменной нет — заменяем на undefined
        return 'undefined';
    });
}

module.exports = function processEnvReplacer(code, config) {
    // 1. Загружаем .env
    const envPath = path.resolve(process.cwd(), '.env');
    const envFileVars = loadEnvFile(envPath);
    // 2. Берём переменные окружения Node.js
    const nodeEnvVars = process.env;
    // 3. Объединяем (приоритет .env)
    const env = { ...nodeEnvVars, ...envFileVars };
    // 4. Заменяем process.env.*
    return processEnvReplace(code, env);
}; 