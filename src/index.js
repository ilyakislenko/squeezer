// index.js

import message, { sum, isEven } from './utils.js';
import App from './app.js';

console.log(message);

const result = sum(5, 3);
console.log(`5 + 3 = ${result}`);

console.log(`Is 10 even? ${isEven(10)}`);
console.log(`Is 7 even? ${isEven(7)}`);

const app = new App();
console.log('App initialized:', app.name);

if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        document.body.innerHTML = app.render();
        console.log('App rendered to DOM');
    });
}