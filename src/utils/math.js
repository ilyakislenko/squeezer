export function add(a, b) {
    return a + b;
}

export function subtract(a, b) {
    return a - b;
}

export function multiply(a, b) {
    return a * b;
}

export function divide(a, b) {
    if (b === 0) {
        throw new Error('Division by zero');
    }
    return a / b;
}

export function power(base, exponent) {
    return Math.pow(base, exponent);
}

export function sqrt(value) {
    if (value < 0) {
        throw new Error('Cannot calculate square root of negative number');
    }
    return Math.sqrt(value);
}

export const MathUtils = {
    add,
    subtract,
    multiply,
    divide,
    power,
    sqrt
};

export default MathUtils; 