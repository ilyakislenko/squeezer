module.exports = function minify(code) {
    return code
      .replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '') // Удаляем комментарии
      .replace(/\s+/g, ' ')                    // Сжимаем пробелы
      .replace(/;\s+/g, ';')                   // Удаляем лишние пробелы после ;
  }