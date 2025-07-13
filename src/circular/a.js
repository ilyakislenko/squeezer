import { b } from './b.js';

export function a() {
    console.log('Function a called');
    return 'a' + b();
}

export const aValue = 'a-value'; 