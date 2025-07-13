const privateVar = 'private';
let mutableVar = 'mutable';

export const CONSTANT = 'CONSTANT_VALUE';
export let mutableExport = 'mutable_export';

export function namedFunction() {
    return 'named function';
}

export class NamedClass {
    constructor() {
        this.name = 'NamedClass';
    }
}

export const namedObject = {
    prop: 'value',
    method() {
        return 'method';
    }
};

export default function defaultFunction() {
    return 'default function';
}

export { privateVar as publicVar };

export * from './utils/math.js';
export { add as mathAdd } from './utils/math.js';
export { capitalize as stringCapitalize } from './utils/string.js';

const internalFunction = () => 'internal';

export { internalFunction as exportedInternal }; 