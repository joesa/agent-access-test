# agent-access-test

A small command-line tool that counts the lines, words and characters in a file.

## Requirements

Node.js 18 or newer (`node --version` to check). There are no runtime
dependencies, so no install step is needed.

```sh
npm install   # optional: nothing to fetch, but validates package.json
```

## How to Use

Run the CLI directly from a clone of this repository (`src/cli.js` is
executable and has a `#!/usr/bin/env node` shebang):

```sh
./src/cli.js <file>
# or, without the executable bit:
node src/cli.js <file>
```

or, through npm:

```sh
npm start -- <file>
```

To get a `wordcount` command on your `PATH`, link the package once (this writes
to the global npm prefix, so it may require admin rights):

```sh
npm link
wordcount <file>
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

The suite uses the built-in Node test runner (`node --test`). To run one file:

```sh
node --test test/count.test.js
```
