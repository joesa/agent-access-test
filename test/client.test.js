import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";

import { count } from "../src/count.js";

const APP_SOURCE = readFileSync(new URL("../src/public/app.js", import.meta.url), "utf-8");

function loadPage({ firstResponseDelay = 5 } = {}) {
  const nodes = new Map();
  const nodeFor = (id) => {
    if (!nodes.has(id)) {
      nodes.set(id, {
        textContent: "",
        value: "",
        listeners: {},
        classList: { toggle() {} },
        addEventListener(type, handler) {
          this.listeners[type] = handler;
        }
      });
    }
    return nodes.get(id);
  };

  const timers = new Map();
  const requests = [];
  let nextTimer = 1;
  let inflight = 0;
  let controllers = 0;

  const sandbox = {
    document: { getElementById: nodeFor },
    setTimeout(fn, ms) {
      const id = nextTimer++;
      timers.set(id, fn);
      setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      return id;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
    AbortController: class {
      constructor() {
        controllers += 1;
        this.signal = { aborted: false };
      }

      abort() {
        this.signal.aborted = true;
      }
    },
    fetch(url, init) {
      requests.push({ url, init });
      inflight += 1;
      const delay = requests.length === 1 ? firstResponseDelay : 5;

      return new Promise((resolve) => {
        setTimeout(() => {
          inflight -= 1;
          resolve({
            ok: true,
            status: 200,
            json: async () => count(JSON.parse(init.body).text)
          });
        }, delay);
      });
    },
    console
  };

  vm.createContext(sandbox);
  vm.runInContext(APP_SOURCE, sandbox);

  const idle = async () => {
    while (inflight > 0 || timers.size > 0) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  };

  return {
    nodes,
    requests,
    cancelled: () => controllers,
    type(text) {
      nodeFor("text").value = text;
      nodeFor("counter").listeners.input();
    },
    rendered: () => ({
      lines: Number(nodeFor("lines").textContent),
      words: Number(nodeFor("words").textContent),
      characters: Number(nodeFor("characters").textContent)
    }),
    status: () => nodeFor("status").textContent,
    idle
  };
}

test("the page counts the text it is loaded with", async () => {
  const page = loadPage();
  await page.idle();

  assert.equal(page.requests.length, 1);
  assert.equal(page.requests[0].url, "/api/count");
  assert.equal(page.requests[0].init.method, "POST");
  assert.deepStrictEqual(JSON.parse(page.requests[0].init.body), { text: "" });
  assert.deepStrictEqual(page.rendered(), count(""));
});

test("no count request is ever cancelled", async () => {
  const page = loadPage();
  for (const text of ["a", "a b", "a b\nc d\n"]) {
    page.type(text);
    await page.idle();
  }

  assert.equal(page.requests.length, 4);
  assert.equal(page.cancelled(), 0);
  for (const request of page.requests) {
    assert.equal(request.init.signal, undefined);
  }
  assert.deepStrictEqual(page.rendered(), count("a b\nc d\n"));
});

test("an answer to a superseded request does not overwrite the latest one", async () => {
  const page = loadPage({ firstResponseDelay: 400 });

  page.type("first line\nsecond line\n");
  await page.idle();

  assert.equal(page.requests.length, 2);
  assert.deepStrictEqual(page.rendered(), count("first line\nsecond line\n"));
  assert.equal(page.status(), "Counted by the same rules the CLI uses.");
});
