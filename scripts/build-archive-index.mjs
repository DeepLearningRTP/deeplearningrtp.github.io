// Builds demos/archive-index.json: one embedding per meeting, for the "Search the
// archive" demo. Sources: the frozen 2017–2024 record in /history/, plus every past
// Meetup session after it (fetched live, so rerun after new sessions).
// Must use the same model + dtype as app.js so query and index vectors share a space.
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
const lastFrozen = events.reduce((a, e) => (e.d > a ? e.d : a), "");
events.push(...(await meetupSince(lastFrozen)));
events.sort((a, b) => a.d.localeCompare(b.d));

// Meetup's public GraphQL (what its own events page uses); newest first, so stop at the cutoff.
async function meetupSince(cutoff) {
  const query = `query($u:String!,$after:String){ groupByUrlname(urlname:$u){
    events(filter:{status:[PAST]}, first:50, after:$after, sort:DESC){
      pageInfo{hasNextPage endCursor} edges{node{ title dateTime description eventUrl }}}}}`;
  const out = [];
  for (let after = null; ;) {
    const r = await fetch("https://www.meetup.com/gql2", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "Mozilla/5.0",
      },
      body: JSON.stringify({
        query,
        variables: { u: "deep-learning-rtp", after },
      }),
    });
    const j = await r.json();
    if (!r.ok || j.errors)
      throw new Error(
        "Meetup fetch failed: " + JSON.stringify(j.errors ?? r.status),
      );
    const { pageInfo, edges } = j.data.groupByUrlname.events;
    for (const { node: n } of edges) {
      const d = n.dateTime.slice(0, 10);
      if (d <= cutoff) return out;
      // flatten markdown links/emphasis so excerpts and embeddings see plain text
      const x = (n.description || "")
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
        .replace(/[*_#]/g, "");
      out.push({ d, t: n.title, c: "session", x, u: n.eventUrl });
    }
    if (!pageInfo.hasNextPage) return out;
    after = pageInfo.endCursor;
  }
}

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
  ...(e.u && { u: e.u }),
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
console.log(
  `indexed ${events.length} meetings, ${events[0].d} to ${events.at(-1).d}`,
);
