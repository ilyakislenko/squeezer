export { sum, isEven } from '../utils.js';
export * from './helpers.js';
export * from './math.js';
export * from './string.js';

import { debounce, throttle } from './helpers.js';
import { add, multiply } from './math.js';
import { capitalize, reverse } from './string.js';

export const combinedUtils = {
    debounce,
    throttle,
    add,
    multiply,
    capitalize,
    reverse
};

export default combinedUtils; 