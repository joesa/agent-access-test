import { test } from "node:test";
import assert from "node:assert/strict";

import { count } from "../src/count.js";

test("empty string", () => {
  assert.deepStrictEqual(count(""), { lines: 0, words: 0, characters: 0 });
});

test("no argument", () => {
  assert.deepStrictEqual(count(), { lines: 0, words: 0, characters: 0 });
});

test("whitespace only", () => {
  assert.deepStrictEqual(count("   \n\t "), { lines: 2, words: 0, characters: 6 });
});

test("single line with trailing newline", () => {
  assert.deepStrictEqual(count("Hello\n"), { lines: 1, words: 1, characters: 6 });
});

test("single line without trailing newline", () => {
  assert.deepStrictEqual(count("Hello"), { lines: 1, words: 1, characters: 5 });
});

test("multiple lines with trailing newline", () => {
  assert.deepStrictEqual(count("Hello\nWorld\n"), {
    lines: 2,
    words: 2,
    characters: 12
  });
});

test("multiple lines without trailing newline", () => {
  assert.deepStrictEqual(count("Hello\nWorld"), {
    lines: 2,
    words: 2,
    characters: 11
  });
});

test("blank lines in the middle are counted as lines", () => {
  assert.deepStrictEqual(count("a\n\nb\n"), { lines: 3, words: 2, characters: 5 });
});

test("runs of whitespace separate exactly one word", () => {
  assert.deepStrictEqual(count("a  b\tc\nd\n"), { lines: 2, words: 4, characters: 9 });
});

test("windows line endings", () => {
  assert.deepStrictEqual(count("a\r\nb\r\n"), { lines: 2, words: 2, characters: 6 });
});

test("non-string input throws", () => {
  assert.throws(() => count(null), TypeError);
  assert.throws(() => count(42), TypeError);
  assert.throws(() => count(["a"]), TypeError);
});
