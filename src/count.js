/**
 * Counts lines, words and characters in a string.
 *
 * - lines: the number of lines. A single trailing newline does not start a new
 *   line, so "Hello\n" is one line and "" is zero lines.
 * - words: runs of non-whitespace separated by any whitespace.
 * - characters: every character in the string, newlines included.
 *
 * @param {string} [text]
 * @returns {{lines: number, words: number, characters: number}}
 */
export function count(text = "") {
  if (typeof text !== "string") {
    throw new TypeError(
      `count() expects a string, received ${text === null ? "null" : typeof text}`
    );
  }

  const trimmed = text.trim();

  return {
    lines: countLines(text),
    words: trimmed === "" ? 0 : trimmed.split(/\s+/).length,
    characters: text.length
  };
}

function countLines(text) {
  if (text === "") {
    return 0;
  }

  return text.replace(/\r?\n$/, "").split("\n").length;
}
