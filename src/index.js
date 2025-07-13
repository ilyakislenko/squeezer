// index.js

import { sum, isEven } from './utils.js';
import App from './app.js';

// Тестируем утилиты
console.log({ sum, isEven });
const result = sum(5, 3);
console.log(`5 + 3 = ${result}`);
console.log(`Is 10 even? ${isEven(10)}`);
console.log(`Is 7 even? ${isEven(7)}`);

// Создаем приложение
const app = new App();
console.log('App initialized:', app.name);

// Делаем приложение доступным глобально для HTML
if (typeof window !== 'undefined') {
    window.app = app;
    
    // Ждем загрузки DOM
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM loaded, app ready!');
    });
}