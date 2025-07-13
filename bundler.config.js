module.exports = {
    entry: "./src/index.js",    // Входной файл
    output: "./dist/bundle.js", // Выходной файл
    html: "./src/index.html",   // HTML файл для обработки
    minify: true,               // Включить минификацию
    minifyOptions: {
        removeComments: true,   // Удалять комментарии
        removeWhitespace: true, // Удалять лишние пробелы
        minifyNames: true       // Сжимать имена переменных
    },
    alias: {
      "@utils": "./src/utils"   // Алиас для удобства
    }
  };