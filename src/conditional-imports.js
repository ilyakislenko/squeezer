let mathUtils, stringUtils, helpers;

if (process.env.NODE_ENV === 'development') {
    mathUtils = require('./utils/math.js');
    stringUtils = require('./utils/string.js');
    helpers = require('./utils/helpers.js');
} else {
    mathUtils = require('./utils/math.min.js');
    stringUtils = require('./utils/string.min.js');
    helpers = require('./utils/helpers.min.js');
}

export function getUtils() {
    return {
        math: mathUtils,
        string: stringUtils,
        helpers: helpers
    };
}

export function conditionalImport(condition) {
    if (condition === 'math') {
        return import('./utils/math.js');
    } else if (condition === 'string') {
        return import('./utils/string.js');
    } else if (condition === 'helpers') {
        return import('./utils/helpers.js');
    } else {
        return import('./utils/index.js');
    }
}

export default {
    getUtils,
    conditionalImport
}; 