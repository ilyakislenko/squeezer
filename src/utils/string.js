export function capitalize(str) {
    if (typeof str !== 'string') return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function reverse(str) {
    if (typeof str !== 'string') return str;
    return str.split('').reverse().join('');
}

export function truncate(str, length) {
    if (typeof str !== 'string') return str;
    if (str.length <= length) return str;
    return str.slice(0, length) + '...';
}

export function slugify(str) {
    if (typeof str !== 'string') return str;
    return str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

export function countWords(str) {
    if (typeof str !== 'string') return 0;
    return str.trim().split(/\s+/).length;
}

export const StringUtils = {
    capitalize,
    reverse,
    truncate,
    slugify,
    countWords
};

export default StringUtils; 