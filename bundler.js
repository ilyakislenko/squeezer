const loadConfig = require('./config-loader');
const { resolveDependencies, resolvePath } = require('./resolvers');
const generateBundle = require('./bundle-generator');
const minify = require('./minifyer');

const fs = require('fs');
const path = require('path');

const config = loadConfig();

const graph = resolveDependencies(config.entry, config.alias);
let bundle = generateBundle(graph);

if (config.minify) {
  bundle = minify(bundle);
}

fs.mkdirSync(path.dirname(config.output), { recursive: true });
fs.writeFileSync(config.output, bundle);

console.log('✅ Бандл собран!');