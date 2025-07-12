module.exports = {
    entry: "./src/index.js",    // Входной файл
    output: "./dist/bundle.js", // Куда сохранять бандл
    minify: true,               // Включить минификацию
    alias: {
      "@utils": "./src/utils"   // Алиас для удобства
    }
  };