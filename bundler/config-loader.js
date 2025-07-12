const path = require("path");
const fs = require("fs");

 module.exports = function loadConfig() {
  const configPath = path.resolve(process.cwd(), "bundler.config.js");

  if (!fs.existsSync(configPath)) {
    throw new Error("Конфиг не найден: bundler.config.js");
  }

  const userConfig = require(configPath);

  // Стандартные значения, если не заданы
  const defaultConfig = {
    entry: "./src/index.js",
    output: "./dist/bundle.js",
    minify: false,
    alias: {},
  };

  return { ...defaultConfig, ...userConfig }; // Объединяем с дефолтными
}