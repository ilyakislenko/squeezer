const loadEnv = require('./env-loader');
loadEnv();

const loadConfig = require('./config-loader');
const { resolveDependencies, resolvePath } = require('./resolvers');
const generateBundle = require('./bundle-generator');
const minify = require('./minifyer');
const HtmlProcessor = require('./html-processor');
const processEnvReplacer = require('./process-env-replacer');
const { shakeTree } = require('./tree-shaker');
const path = require('path');
const fs = require('fs');

const config = loadConfig();

const graph = resolveDependencies(config.entry, config.alias);

// Применяем tree shaking если включен
let bundle;
if (config.treeShake !== false) {
    console.log('🌳 Применяем tree shaking...');
    const shakenGraph = shakeTree(graph);
    bundle = generateBundle(shakenGraph);
} else {
    bundle = generateBundle(graph);
}

// Заменяем process.env.* на значения из .env/окружения
bundle = processEnvReplacer(bundle, config);

if (config.minify) {
  const minifyOptions = {
    removeComments: config.minifyOptions?.removeComments !== false,
    removeWhitespace: config.minifyOptions?.removeWhitespace !== false,
    minifyNames: config.minifyOptions?.minifyNames !== false
  };
  
  bundle = minify(bundle, minifyOptions);
}

// Создаем директорию dist если её нет
fs.mkdirSync(path.dirname(config.output), { recursive: true });
fs.writeFileSync(config.output, bundle);

console.log('✅ Бандл собран!');

// Обрабатываем HTML файл если указан
if (config.html) {
  const htmlProcessor = new HtmlProcessor();
  const outputDir = path.dirname(config.output);
  
  if (fs.existsSync(config.html)) {
    const success = htmlProcessor.processHtmlFile(config.html, config.output, outputDir);
    if (success) {
      console.log('✅ HTML файл обработан!');
    } else {
      console.log('❌ Ошибка обработки HTML файла');
    }
  } else {
    console.log(`⚠️ HTML файл не найден: ${config.html}`);
  }
}