#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { count } from "./count.js";

const USAGE = "Usage: wordcount <file>";

async function main() {
  const filePath = process.argv[2];

  if (!filePath) {
    console.error(USAGE);
    process.exitCode = 1;
    return;
  }

  let text;
  try {
    text = await readFile(filePath, "utf-8");
  } catch (err) {
    console.error(`Error: cannot read '${filePath}': ${err.message}`);
    process.exitCode = 1;
    return;
  }

  const { lines, words, characters } = count(text);

  console.log(`Lines: ${lines}`);
  console.log(`Words: ${words}`);
  console.log(`Characters: ${characters}`);
}

main();
