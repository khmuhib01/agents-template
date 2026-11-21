import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluate } from '../src/evaluate.js';

const values = [
  ["1+2", 3],
  ["2*3+4", 10],
  ["2+3*4", 14],
  ["(2+3)*4", 20],
  ["10/4", 2.5],
  ["10-2-3", 5],
  ["100/10/5", 2],
  ["2^10", 1024],
  ["2^3^2", 512],
  ["-2^2", -4],
  ["(-2)^2", 4],
  ["2*-3", -6],
  ["2^-1", 0.5],
  ["--2", 2],
  [" 1 +  2 ", 3],
  [".5+.5", 1],
  ["((1+2)*(3+4))", 21],
  ["1-(2-3)", 2],
  ["8/2*4", 16],
  ["2*3^2", 18],
  ["-(3)", -3],
];
for (const [expr, want] of values) test(`evaluate(${JSON.stringify(expr)}) = ${want}`, () => assert.equal(evaluate(expr), want));

const errors = [
  ["", "SyntaxError"],
  ["2+", "SyntaxError"],
  ["(2", "SyntaxError"],
  ["2 3", "SyntaxError"],
  ["2)", "SyntaxError"],
  ["*2", "SyntaxError"],
  ["1/0", "RangeError"],
  ["0/0", "RangeError"],
];
for (const [expr, type] of errors) test(`evaluate(${JSON.stringify(expr)}) throws ${type}`, () => assert.throws(() => evaluate(expr), { name: type }));
