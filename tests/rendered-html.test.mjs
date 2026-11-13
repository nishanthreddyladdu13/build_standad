import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("renders the BuiltStandard landing page", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  const html = await response.text();
  assert.match(html, /BuiltStandard/);
  assert.match(html, /Explore residential standards/);
  assert.match(html, /Residential prototype available now/);
});

test("ships the approved KIT-D01 source-separated diagram", async () => {
  const diagram = await readFile(
    new URL("../public/kit-d01-room-vs-furniture.svg", import.meta.url),
    "utf8",
  );

  assert.match(diagram, /Regulatory room envelope versus functional furniture envelope/);
  assert.match(diagram, /SP 73:2023/);
  assert.match(diagram, /NKBA/);
});
