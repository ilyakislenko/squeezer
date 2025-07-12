// index.js

import message, { sum, isEven } from './utils.js';

console.log(message); // "Hello from utils!"

const result = sum(5, 3);
console.log(`5 + 3 = ${result}`); // 8

console.log(`Is 10 even? ${isEven(10)}`); // true
console.log(`Is 7 even? ${isEven(7)}`);   // false