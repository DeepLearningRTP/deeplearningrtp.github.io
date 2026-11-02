// Builds demos/archive-index.json: one embedding per meeting in /history/, for the
// "Search the archive" demo. Must use the same model + dtype as app.js so query
// vectors and index vectors live in the same space.
//
// Run from a folder where @huggingface/transformers@4.2.0 is installed:
//   npm i --no-save @huggingface/transformers@4.2.0
//   node /path/to/scripts/build-archive-index.mjs /path/to/site-repo
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const MODEL = "Xenova/all-MiniLM-L6-v2"; // keep in sync with app.js
const DTYPE = "q8";
const repo = process.argv[2] ?? ".";

const req = createRequire(join(process.cwd(), "noop.js"));
const { pipeline } = await import(
  pathToFileURL(req.resolve("@huggingface/transformers")).href
);

const html = readFileSync(join(repo, "history/index.html"), "utf8");
const m = html.match(/const EVENTS = (\[.*?\]);\n/s);
if (!m) throw new Error("EVENTS array not found in history/index.html");
const events = JSON.parse(m[1]).filter((e) => e.c !== "canceled");

const embed = await pipeline("feature-extraction", MODEL, { dtype: DTYPE });
const dim = 384;
const q = new Int8Array(events.length * dim);
for (let i = 0; i < events.length; i++) {
  const e = events[i];
  const text = `${e.t}. ${(e.x || "").slice(0, 400)}`;
  const v = (await embed(text, { pooling: "mean", normalize: true })).data;
  // normalized vectors sit in [-1, 1]; int8 keeps ranking intact at 1/4 the size
  for (let j = 0; j < dim; j++) q[i * dim + j] = Math.round(v[j] * 127);
}

const items = events.map((e) => ({
  d: e.d,
  t: e.t,
  c: e.c,
  x: (e.x || "").replace(/\s+/g, " ").slice(0, 160),
}));
mkdirSync(join(repo, "demos"), { recursive: true });
writeFileSync(
  join(repo, "demos/archive-index.json"),
  JSON.stringify({
    model: MODEL,
    dtype: DTYPE,
    dim,
    items,
    vecs: Buffer.from(q.buffer).toString("base64"),
  }),
);
console.log(`indexed ${events.length} meetings`);
