const fs = require('fs');
const path = require('path');

function loadEnv(envPath = '.env') {
    const absPath = path.resolve(process.cwd(), envPath);
    if (!fs.existsSync(absPath)) return;
    const lines = fs.readFileSync(absPath, 'utf-8').split('\n');
    lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) return;
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim();
        if (!(key in process.env)) process.env[key] = value;
    });
}

module.exports = loadEnv; 