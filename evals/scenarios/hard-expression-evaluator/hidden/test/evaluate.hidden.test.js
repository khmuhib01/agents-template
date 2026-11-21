import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluate } from '../src/evaluate.js';

for (const [expr, want] of [
  ["1+2*3-4/2", 5],
  ["-2*-2", 4],
  ["2--2", 4],
  ["2+-2", 0],
  ["2^(1+1)", 4],
  ["((2))", 2],
  ["1.5*2", 3],
  ["2*(3+(4-1))^2/9", 8],
]) test(`hidden ${JSON.stringify(expr)}`, () => assert.equal(evaluate(expr), want));
for (const [expr, type] of [
  ["10%3", "SyntaxError"],
  ["abc", "SyntaxError"],
  ["1e3", "SyntaxError"],
  ["2^", "SyntaxError"],
  ["()", "SyntaxError"],
]) test(`hidden ${JSON.stringify(expr)} throws ${type}`, () => assert.throws(() => evaluate(expr), { name: type }));
