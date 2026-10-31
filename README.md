# Checked by Plumb

A small web app and command-line tool that count the lines, words and characters
in text. Both share the same counting rules (`src/count.js`).

## Requirements

Node.js 18 or newer (`node --version` to check). There are no runtime
dependencies, so no install step is needed.

```sh
npm install   # optional: nothing to fetch, but validates package.json
```

## How to Use

Start the web server and open it in a browser:

```sh
npm start          # http://localhost:3000
# `npm run dev` does the same thing
PORT=8080 npm start  # pick another port
```

Type or paste text into the page and the line, word and character totals update
as you type. The page is served from `src/public/` and the counts come from
`POST /api/count`, which answers with JSON such as
`{"lines":2,"words":2,"characters":12}`. `GET /api/health` reports whether the
server is up. The server keeps running until you stop it with `Ctrl-C`.

### Command line

Run the CLI directly from a clone of this repository (`src/cli.js` is
executable and has a `#!/usr/bin/env node` shebang):

```sh
./src/cli.js <file>
# or, without the executable bit:
node src/cli.js <file>
```

or, through npm:

```sh
npm run cli -- <file>
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
