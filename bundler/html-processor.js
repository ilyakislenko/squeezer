const fs = require('fs');
const path = require('path');

class HtmlProcessor {
    constructor() {
        this.scriptTag = '<script src="bundle.js"></script>';
    }

    processHtml(htmlPath, bundlePath, outputPath) {
        try {
            // Читаем HTML файл
            const htmlContent = fs.readFileSync(htmlPath, 'utf8');
            
            // Проверяем, есть ли уже подключенный скрипт
            if (htmlContent.includes('bundle.js')) {
                console.log('✅ JavaScript уже подключен в HTML');
                return htmlContent;
            }

            // Ищем тег </body> для вставки скрипта
            const bodyEndIndex = htmlContent.lastIndexOf('</body>');
            
            if (bodyEndIndex === -1) {
                console.log('⚠️ Тег </body> не найден, добавляем в конец файла');
                return htmlContent + '\n    ' + this.scriptTag + '\n</body></html>';
            }

            // Вставляем скрипт перед закрывающим тегом body
            const processedHtml = 
                htmlContent.slice(0, bodyEndIndex) + 
                '    ' + this.scriptTag + '\n' +
                htmlContent.slice(bodyEndIndex);

            console.log('✅ JavaScript подключен в HTML');
            return processedHtml;

        } catch (error) {
            console.error('❌ Ошибка обработки HTML:', error.message);
            return null;
        }
    }

    copyHtmlToDist(htmlPath, outputDir) {
        try {
            const fileName = path.basename(htmlPath);
            const outputPath = path.join(outputDir, fileName);
            
            // Копируем HTML файл в dist
            fs.copyFileSync(htmlPath, outputPath);
            console.log(`✅ HTML файл скопирован: ${outputPath}`);
            
            return outputPath;
        } catch (error) {
            console.error('❌ Ошибка копирования HTML:', error.message);
            return null;
        }
    }

    processHtmlFile(htmlPath, bundlePath, outputDir) {
        // Копируем HTML в dist
        const distHtmlPath = this.copyHtmlToDist(htmlPath, outputDir);
        
        if (!distHtmlPath) {
            return false;
        }

        // Обрабатываем HTML для подключения бандла
        const processedHtml = this.processHtml(htmlPath, bundlePath, distHtmlPath);
        
        if (processedHtml) {
            // Записываем обработанный HTML
            fs.writeFileSync(distHtmlPath, processedHtml, 'utf8');
            console.log('✅ HTML файл обработан и сохранен');
            return true;
        }

        return false;
    }

    findHtmlFiles(srcDir) {
        const htmlFiles = [];
        
        function scanDirectory(dir) {
            const items = fs.readdirSync(dir);
            
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    scanDirectory(fullPath);
                } else if (item.endsWith('.html')) {
                    htmlFiles.push(fullPath);
                }
            }
        }
        
        scanDirectory(srcDir);
        return htmlFiles;
    }
}

module.exports = HtmlProcessor; 