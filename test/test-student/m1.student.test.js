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
