# agent-access-test

A small command-line tool that counts the lines, words and characters in a file.

## Requirements

Node.js 18 or newer. There are no runtime dependencies.

## How to Use

```sh
node src/cli.js <file>
```

or, through npm:

```sh
npm start -- <file>
```

Example:

```sh
$ node src/cli.js src/count.js
Lines: 34
Words: 138
Characters: 909
```

A missing file argument prints a usage message; an unreadable path prints an
error. Both exit with status `1`.

### Counting rules

- **Lines** &mdash; a single trailing newline does not start a new line, so `Hello\n` is one line and an empty file is zero lines.
- **Words** &mdash; runs of non-whitespace characters, separated by any amount of whitespace.
- **Characters** &mdash; every character in the file, newlines included.

## Tests

```sh
npm test
```
