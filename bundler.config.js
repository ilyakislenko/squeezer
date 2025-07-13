module.exports = {
    entry: "./src/index.js",    // Входной файл
    output: "./dist/bundle.js", // Выходной файл
    html: "./src/index.html",   // HTML файл для обработки
    minify: true,               // Включить минификацию
    treeShake: true,            // Включить tree shaking
    minifyOptions: {
        removeComments: true,   // Удалять комментарии
        removeWhitespace: true, // Удалять лишние пробелы
        minifyNames: true       // Минифицировать имена переменных
    },
    alias: {
      "@utils": "./src/utils"   // Алиас для удобства
    }
  };