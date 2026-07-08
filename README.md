# deeplearningrtp.github.io

The website for the **[Deep Learning RTP](https://www.meetup.com/deep-learning-rtp/)** study
group — live at **https://deeplearningrtp.github.io/**.

A single static `index.html`: modern SPA, no build step, no framework, no backend. Its centerpiece
is machine learning running **entirely in the visitor's browser** (fitting for a deep-learning group):

- **Sentiment analysis** & **image classification** via [Transformers.js](https://huggingface.co/docs/transformers.js) (WASM/WebGPU — works in every browser).
- **Local LLM chat** via [WebLLM](https://webllm.mlc.ai/) (WebGPU — Chrome/Edge/Safari 26+).

Libraries are lazy-imported from CDN only when a demo is clicked, so the page itself loads instantly
and no model weights download until a visitor opts in. Nothing is ever sent to a server.

## Run locally
```bash
python3 -m http.server 8000   # then open http://localhost:8000
```
(Any static server works — the demos need `https://` or `localhost` for WebGPU.)

## Deploy
GitHub Pages serves the `master` branch as-is (`.nojekyll` disables Jekyll). Merge to `master` → live.

## Edit
Everything is in `index.html` — content, inline CSS, and one `<script type="module">`. The upcoming-events
list and the two `// ponytail:`-marked model ids are the bits most likely to need updating.
