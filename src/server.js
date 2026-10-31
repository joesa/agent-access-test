#!/usr/bin/env node
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { count } from "./count.js";

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "0.0.0.0";
const PUBLIC_DIR = join(fileURLToPath(new URL(".", import.meta.url)), "public");
const MAX_BODY_BYTES = 5 * 1024 * 1024;

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body)
  });
  res.end(body);
}

async function readBody(req) {
  const chunks = [];
  let size = 0;

  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      throw Object.assign(new Error("payload too large"), { status: 413 });
    }
    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString("utf-8");
}

async function serveStatic(req, res, pathname) {
  const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const filePath = normalize(join(PUBLIC_DIR, relative));

  if (!filePath.startsWith(PUBLIC_DIR + "/")) {
    sendJson(res, 404, { error: "not found" });
    return;
  }

  let body;
  try {
    body = await readFile(filePath);
  } catch {
    sendJson(res, 404, { error: "not found" });
    return;
  }

  res.writeHead(200, {
    "content-type": CONTENT_TYPES[extname(filePath)] || "application/octet-stream",
    "content-length": body.length
  });
  res.end(req.method === "HEAD" ? undefined : body);
}

async function handle(req, res) {
  const { pathname } = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (pathname === "/api/health") {
    sendJson(res, 200, { status: "ok" });
    return;
  }

  if (pathname === "/api/count") {
    if (req.method !== "POST") {
      sendJson(res, 405, { error: "method not allowed" });
      return;
    }

    const raw = await readBody(req);
    let text = raw;

    if ((req.headers["content-type"] || "").includes("application/json")) {
      try {
        text = JSON.parse(raw || "{}").text ?? "";
      } catch {
        sendJson(res, 400, { error: "invalid JSON body" });
        return;
      }
    }

    sendJson(res, 200, count(String(text)));
    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    sendJson(res, 404, { error: "not found" });
    return;
  }

  await serveStatic(req, res, pathname);
}

export function createServerInstance() {
  return createServer((req, res) => {
    handle(req, res).catch((err) => {
      const status = err.status && err.status < 500 ? err.status : 500;
      if (!res.headersSent) {
        sendJson(res, status, { error: err.message });
      } else {
        res.end();
      }
    });
  });
}

export function startServer({ port = PORT, host = HOST } = {}) {
  const server = createServerInstance();

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => resolve(server));
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startServer()
    .then((server) => {
      const { port, address } = server.address();
      console.log(`wordcount web app listening on http://${address}:${port}`);

      for (const signal of ["SIGINT", "SIGTERM"]) {
        process.on(signal, () => {
          server.close(() => process.exit(0));
        });
      }
    })
    .catch((err) => {
      console.error(`Error: cannot start server: ${err.message}`);
      process.exitCode = 1;
    });
}

