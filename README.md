# deeplearningrtp.github.io

The website for the **[Deep Learning RTP](https://www.meetup.com/deep-learning-rtp/)** study
group — live at **https://deeplearningrtp.github.io/**.

A single static `index.html`: modern SPA, no build step, no framework, no backend. Its centerpiece
is machine learning running **entirely in the visitor's browser** (fitting for a deep-learning group):

- **Next-token explorer** & **archive search** via [Transformers.js](https://huggingface.co/docs/transformers.js) (WASM/WebGPU — works in every browser).
- **Local LLM chat** via [WebLLM](https://webllm.mlc.ai/) (WebGPU — Chrome/Edge/Safari 26+).

Libraries are lazy-imported from CDN only when a demo is clicked, so the page itself loads instantly
and no model weights download until a visitor opts in. Nothing is ever sent to a server.
A **KV-cache calculator** needs no model at all.

## Run locally
```bash
python3 -m http.server 8000   # then open http://localhost:8000
```
(Any static server works — the demos need `https://` or `localhost` for WebGPU.)

## Deploy
GitHub Pages serves the `main` branch as-is (`.nojekyll` disables Jekyll). Merge to `main` → live.

## Edit
Everything is in `index.html` — content, inline CSS, and one `<script type="module">`. Two regions are
**generated, not hand-edited**: the upcoming-meetings list and the JSON-LD block, both fenced by
`<!-- generated:*:start/end -->` markers and overwritten by the dlrtp-ops `site` workflow on every
ops push (same job that publishes `/events/`). Edit event YAMLs in dlrtp-ops instead. The two
`// ponytail:`-marked model ids in `app.js` remain the likeliest hand edits.

## Demos
Three live demos in `app.js`: next-token explorer (SmolLM2-135M), KV-cache calculator (plain
arithmetic, presets in `MODELS`), and archive search (MiniLM). Archive search reads precomputed
embeddings from `demos/archive-index.json`; if `history/` ever changes, rebuild it with
`scripts/build-archive-index.mjs` (instructions at the top of that file). The model and dtype must match `app.js`.

**Backlog (agreed 2026-11-02, not built yet):**
- **Harness in 50 lines.** Turn the WebLLM chat into a small agent that can call a calculator
  and the archive search, showing each plan → tool call → answer step. Ties to the Oct 28 Pi session.
- **Protein masked-residue guessing.** Paste a protein sequence, hide one residue, and see what
  ESM-2 (`Xenova/esm2_t6_8M_UR50D`) predicts. Ties to the fall drug-discovery series.
