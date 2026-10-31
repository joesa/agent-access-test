import { after, test } from "node:test";
import assert from "node:assert/strict";

import { startServer } from "../src/server.js";

const server = await startServer({ port: 0, host: "127.0.0.1" });
const origin = `http://127.0.0.1:${server.address().port}`;

after(() => {
  server.close();
});

test("serves the web page", async () => {
  const res = await fetch(`${origin}/`);
  const html = await res.text();

  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type"), /^text\/html/);
  assert.match(html, /<h1>Checked by Plumb<\/h1>/);
});

test("serves static assets", async () => {
  for (const path of ["/styles.css", "/app.js"]) {
    const res = await fetch(`${origin}${path}`);
    assert.equal(res.status, 200, path);
  }
});

test("health endpoint reports ok", async () => {
  const res = await fetch(`${origin}/api/health`);

  assert.equal(res.status, 200);
  assert.deepStrictEqual(await res.json(), { status: "ok" });
});

test("count endpoint uses the shared counting rules", async () => {
  const res = await fetch(`${origin}/api/count`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text: "Hello\nWorld\n" })
  });

  assert.equal(res.status, 200);
  assert.deepStrictEqual(await res.json(), { lines: 2, words: 2, characters: 12 });
});

test("count endpoint rejects invalid JSON", async () => {
  const res = await fetch(`${origin}/api/count`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{not json"
  });

  assert.equal(res.status, 400);
});

test("unknown paths and traversal are not served", async () => {
  for (const path of ["/nope", "/../package.json"]) {
    const res = await fetch(new URL(path, origin));
    assert.equal(res.status, 404, path);
  }
});
