import { a } from './a.js';

export function b() {
    console.log('Function b called');
    return 'b' + a();
}

export const bValue = 'b-value'; 