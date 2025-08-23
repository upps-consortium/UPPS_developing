import deepMerge from './deepMerge.js';

describe('deepMerge', () => {
    test('merges nested objects', () => {
        const target = { a: { b: 1, c: { d: 2 } } };
        const source = { a: { e: 3, c: { f: 4 } }, g: 5 };
        const result = deepMerge(target, source);
        expect(result).toEqual({ a: { b: 1, c: { d: 2, f: 4 }, e: 3 }, g: 5 });
    });

    test('overwrites primitive values', () => {
        const target = { a: { b: 1 } };
        const source = { a: 2 };
        const result = deepMerge(target, source);
        expect(result).toEqual({ a: 2 });
    });

    test('merges multiple levels', () => {
        const target = { a: { b: { c: 1 } } };
        const source = { a: { b: { d: 2 } } };
        const result = deepMerge(target, source);
        expect(result).toEqual({ a: { b: { c: 1, d: 2 } } });
    });
});
