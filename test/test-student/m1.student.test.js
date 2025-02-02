/*
    In this file, add your own test cases that correspond to functionality introduced for each milestone.
    You should fill out each test case so it adequately tests the functionality you implemented.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/

const distribution = require('../../config.js');
const util = distribution.util;

test('(1 pts) student test', () => {
expect(util.deserialize(util.serialize(55))).toBe(55);
  expect(util.deserialize(util.serialize(0.5))).toBe(0.5);
});


test('(1 pts) student test', () => {
  expect(util.deserialize(util.serialize(true))).toBe(true);
  expect(util.deserialize(util.serialize(false))).toBe(false);
});


test('(1 pts) student test', () => {
  expect(util.deserialize(util.serialize(null))).toBe(null);
});

test('(1 pts) student test', () => {
  expect(util.deserialize(util.serialize("hello"))).toBe("hello");
  expect(util.deserialize(util.serialize(""))).toBe("");
});

test('(1 pts) student test', () => {
  expect(util.deserialize(util.serialize(undefined))).toBe(undefined);
});

test('(1 pts) student test', () => {
  const original = [1, 'two', true, null, undefined];
  const serialized = util.serialize(original);
  expect(original).toEqual(util.deserialize(serialized));
});

test('(1 pts) student test', () => {
  const original = { key: 'value', num: 42, flag: true };
  const serialized = util.serialize(original);
  expect(original).toEqual(util.deserialize(serialized));
});

test('(1 pts) student test', () => {
  const original = { outer: { inner: { key: 'value' } }, array: [1, 2, 3] };
  const serialized = util.serialize(original);
  expect(original).toEqual(util.deserialize(serialized));
});

test('(1 pts) student test', () => {
  const original = 'Special characters: \n\t\r\b\f';
  const serialized = util.serialize(original);
  expect(original).toEqual(util.deserialize(serialized));
});

test('(1 pts) student test', () => {
  const original = ['line\nbreak', 'tab\tcharacter', 'carriage\rreturn'];
  const serialized = util.serialize(original);
  expect(original).toEqual(util.deserialize(serialized));
});

test('(1 pts) student test', () => {
  const original = [{ key: 'value' }, [1, 2], new Date()];
  const serialized = util.serialize(original);
  expect(original).toEqual(util.deserialize(serialized));
});

test('(1 pts) student test', () => {
  const original = [[1, 2], [3, [4, 5]], []];
  const serialized = util.serialize(original);
  expect(original).toEqual(util.deserialize(serialized));
});

test('(1 pts) student test', () => {
  const original = {
    level1: {
      level2: {
        level3: {
          level4: {
            level5: {
              key: 'deeply nested value',
            },
          },
          anotherKey: 'another value at level 3',
        },
      },
      arrayAtLevel2: [1, 2, 3, { nestedArrayKey: 'value in array' }],
    },
    topKey: 'value at the top level',
  };;
  const serialized = util.serialize(original);
  expect(original).toEqual(util.deserialize(serialized));
});