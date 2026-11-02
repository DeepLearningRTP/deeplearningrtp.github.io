const $ = (s) => document.querySelector(s);
// escape third-party strings (model labels come from CDN-hosted config) before innerHTML
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

/* ---------- Transformers.js (lazy) ---------- */
// ponytail: model ids below are the only tuning knobs; swap for other ONNX-ported HF models.
let _tf;
const transformers = () =>
  (_tf ??=
    import("https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0").then(
      (m) => {
        m.env.allowLocalModels = false; // skip the doomed /models/... probe on this static site
        return m;
      },
    ));

// network failures surface as "Failed to fetch" — say what actually went wrong
const errMsg = (e) =>
  /fetch|network/i.test(e.message)
    ? "Couldn't download the model — check your connection and try again."
    : e.message;

/* ---------- Next-token explorer ---------- */
// prototype pages share this file but not every demo's markup
if ($("#nt-in")) {
  const LM_ID = "HuggingFaceTB/SmolLM2-135M-Instruct";
  let _lm;
  const getLM = async () => {
    const { AutoTokenizer, AutoModelForCausalLM } = await transformers();
    return (_lm ??= Promise.all([
      AutoTokenizer.from_pretrained(LM_ID),
      AutoModelForCausalLM.from_pretrained(LM_ID, { dtype: "q8" }),
    ]));
  };
  const ntIn = $("#nt-in"),
    ntOut = $("#nt-out"),
    ntRun = $("#nt-run"),
    ntSample = $("#nt-sample"),
    ntTemp = $("#nt-temp");
  let ntLast = null; // {tok, logits (Float32Array of last position), ms}
  const showTok = (s) => s.replace(/\n/g, "↵").replace(/^ /, "␣");

  function softmaxTop(logits, temp, k) {
    let mx = -Infinity;
    for (const x of logits) if (x > mx) mx = x;
    const p = new Float32Array(logits.length);
    let z = 0;
    for (let i = 0; i < logits.length; i++)
      z += p[i] = Math.exp((logits[i] - mx) / temp);
    for (let i = 0; i < p.length; i++) p[i] /= z;
    // partial top-k: one pass keeping a small sorted list beats sorting 49k entries
    const top = [];
    for (let i = 0; i < p.length; i++) {
      if (top.length < k || p[i] > p[top[top.length - 1]]) {
        top.push(i);
        top.sort((a, b) => p[b] - p[a]);
        if (top.length > k) top.pop();
      }
    }
    return { p, top };
  }

  function renderCands() {
    if (!ntLast) return;
    const temp = +ntTemp.value;
    const { p, top } = softmaxTop(ntLast.logits, temp, 8);
    ntOut.innerHTML =
      top
        .map((i) => {
          const pct = (p[i] * 100).toFixed(1);
          return `<button class="cand" data-id="${i}"><code>${esc(showTok(ntLast.tok.decode([i])))}</code><span class="bar-meter"><i style="width:${pct}%"></i></span><b>${pct}%</b></button>`;
        })
        .join("") +
      `<div class="note" style="margin-top:8px">One forward pass: ${ntLast.ms} ms, locally in this tab. Click a token to append it.</div>`;
  }

  function append(id) {
    ntIn.value += ntLast.tok.decode([id]);
    predict();
  }

  async function predict() {
    const text = ntIn.value;
    if (!text.trim()) {
      ntOut.textContent = "Type a prompt first.";
      return;
    }
    ntRun.disabled = ntSample.disabled = true;
    if (!_lm) ntOut.textContent = "Downloading the model (first time only)…";
    try {
      const [tok, model] = await getLM();
      const ids = tok.encode(text);
      $("#nt-toks").innerHTML =
        ids
          .map((i) => `<span>${esc(showTok(tok.decode([i])))}</span>`)
          .join("") +
        `<span class="note" style="border:0;background:none">${ids.length} tokens</span>`;
      const t0 = performance.now();
      const { logits } = await model(tok(text));
      const [, n, V] = logits.dims;
      ntLast = {
        tok,
        logits: logits.data.slice((n - 1) * V, n * V),
        ms: Math.round(performance.now() - t0),
      };
      renderCands();
    } catch (e) {
      ntOut.textContent = "Error: " + errMsg(e);
    } finally {
      ntRun.disabled = false;
      ntSample.disabled = !ntLast;
    }
  }

  ntRun.onclick = predict;
  ntOut.addEventListener("click", (e) => {
    const b = e.target.closest(".cand");
    if (b) append(+b.dataset.id);
  });
  ntSample.onclick = () => {
    const { p } = softmaxTop(ntLast.logits, +ntTemp.value, 1);
    let r = Math.random(),
      i = 0;
    while ((r -= p[i]) > 0 && i < p.length - 1) i++;
    append(i);
  };
  ntTemp.oninput = () => {
    $("#nt-temp-v").textContent = (+ntTemp.value).toFixed(1);
    renderCands();
  };
}

/* ---------- KV-cache calculator (pure arithmetic) ---------- */
// prototype pages share this file but not every demo's markup
if ($("#kv-model")) {
  // kv: cached values per token per layer; mha: what full multi-head attention would cache.
  // Params in billions; MoE models list total and active.
  const MODELS = {
    "Llama 2 7B · multi-head": {
      maxCtx: 4096,
      layers: 32,
      kv: 2 * 32 * 128,
      mha: 2 * 32 * 128,
      total: 6.7,
      active: 6.7,
    },
    "Llama 3.1 8B · grouped-query": {
      maxCtx: 131072,
      layers: 32,
      kv: 2 * 8 * 128,
      mha: 2 * 32 * 128,
      total: 8.0,
      active: 8.0,
    },
    "Llama 3.1 70B · grouped-query": {
      maxCtx: 131072,
      layers: 80,
      kv: 2 * 8 * 128,
      mha: 2 * 64 * 128,
      total: 70.6,
      active: 70.6,
    },
    "Mixtral 8x7B · MoE + grouped-query": {
      maxCtx: 32768,
      layers: 32,
      kv: 2 * 8 * 128,
      mha: 2 * 32 * 128,
      total: 46.7,
      active: 12.9,
    },
    // MLA caches a 512-dim latent + 64-dim RoPE key; full MHA would be 128 heads × (192 key + 128 value)
    "DeepSeek-V3 · MoE + latent attention": {
      maxCtx: 131072,
      layers: 61,
      kv: 512 + 64,
      mha: 128 * (192 + 128),
      total: 671,
      active: 37,
    },
  };
  const kvSel = $("#kv-model");
  kvSel.innerHTML = Object.keys(MODELS)
    .map((k) => `<option>${k}</option>`)
    .join("");
  const GB = 1e9;
  const fmt = (b) =>
    b >= GB
      ? (b / GB).toFixed(b >= 10 * GB ? 0 : 1) + " GB"
      : (b / 1e6).toFixed(b >= 1e7 ? 0 : 1) + " MB";

  function kvCalc() {
    const m = MODELS[kvSel.value];
    const ctx = +$("#kv-ctx").value,
      batch = +$("#kv-batch").value,
      wb = +$("#kv-wbytes").value,
      cb = +$("#kv-cbytes").value,
      gpu = +$("#kv-gpu").value * GB;
    const perTok = m.layers * m.kv * cb;
    const cache = perTok * ctx * batch;
    const weights = m.total * GB * wb;
    const used = weights + cache;
    const fitCtx = Math.min(
      m.maxCtx,
      Math.floor((gpu - weights) / (perTok * batch)),
    );
    const w = Math.min(100, (weights / gpu) * 100);
    const c = Math.min(100 - w, (cache / gpu) * 100);
    const ratio = m.mha / m.kv;
    $("#kv-out").innerHTML = `
    <div class="stack${used > gpu ? " over" : ""}"><i class="w" style="width:${w}%"></i><i class="c" style="width:${c}%"></i></div>
    <div class="legend"><span><i style="background:var(--accent)"></i>weights ${fmt(weights)}</span><span><i style="background:var(--muted)"></i>KV cache ${fmt(cache)}</span><span>of ${fmt(gpu)}</span></div>
    ${ctx > m.maxCtx ? `<p class="note neg" style="margin:8px 0 0">This model only supports ${m.maxCtx.toLocaleString()} tokens of context; the math below is hypothetical.</p>` : ""}
    <div class="resultline"><span>${used > gpu ? '<span class="neg">Doesn\'t fit.</span>' : '<span class="pos">Fits.</span>'} Longest context that fits at this many users</span><b>${fitCtx > 0 ? fitCtx.toLocaleString() + (fitCtx === m.maxCtx ? " (the model's max)" : " tokens") : "none: weights alone overflow"}</b></div>
    <div class="resultline"><span>Cache per token</span><b>${(perTok / 1024).toFixed(0)} KB</b></div>
    <div class="resultline"><span>vs. full multi-head attention</span><b>${ratio > 1 ? ratio.toFixed(0) + "× smaller" : "same (this is full MHA)"}</b></div>
    <div class="resultline"><span>Compute per generated token</span><b>~${Math.round(2 * m.active)} GFLOP${m.active < m.total ? ` (${m.active}B of ${m.total}B params active)` : ""}</b></div>`;
  }
  document
    .querySelectorAll("#kv-model, .kv-grid select")
    .forEach((s) => (s.onchange = kvCalc));
  kvCalc();
}

/* ---------- Archive search (precomputed embeddings, see scripts/build-archive-index.mjs) ---------- */
// prototype pages share this file but not every demo's markup
if ($("#arc-in")) {
  let _arc;
  const getArchive = () =>
    (_arc ??= (async () => {
      const r = await fetch("/demos/archive-index.json");
      if (!r.ok) throw new Error("Couldn't load the archive index.");
      const ix = await r.json();
      const { pipeline } = await transformers();
      const embed = await pipeline("feature-extraction", ix.model, {
        dtype: ix.dtype,
      });
      const vecs = new Int8Array(
        Uint8Array.from(atob(ix.vecs), (c) => c.charCodeAt(0)).buffer,
      );
      return { ix, vecs, embed };
    })().catch((e) => {
      _arc = null; // allow retry after a network blip
      throw e;
    }));

  async function search() {
    const q = $("#arc-in").value.trim(),
      out = $("#arc-out"),
      btn = $("#arc-run");
    if (!q) {
      out.textContent = "Type a topic first.";
      return;
    }
    btn.disabled = true;
    if (!_arc)
      out.textContent =
        "Loading the index and embedding model (first time only)…";
    try {
      const { ix, vecs, embed } = await getArchive();
      const t0 = performance.now();
      const v = (await embed(q, { pooling: "mean", normalize: true })).data;
      const scored = ix.items.map((it, i) => {
        let d = 0;
        for (let j = 0; j < ix.dim; j++) d += v[j] * vecs[i * ix.dim + j];
        return [d / 127, it];
      });
      scored.sort((a, b) => b[0] - a[0]);
      const ms = Math.round(performance.now() - t0);
      out.innerHTML =
        scored
          .slice(0, 6)
          .map(
            ([s, it]) =>
              `<div class="hit"><div class="meta">${esc(it.d)} · ${esc(it.c)} · similarity ${s.toFixed(2)}</div><div class="t">${esc(it.t)}</div>${it.x ? `<p>${esc(it.x)}…</p>` : ""}</div>`,
          )
          .join("") +
        `<div class="note" style="margin-top:8px">Embedded your query and ranked ${ix.items.length} meetings in ${ms} ms, locally in this tab. <a href="/history/">Browse the full record →</a></div>`;
    } catch (e) {
      out.textContent = "Error: " + errMsg(e);
    } finally {
      btn.disabled = false;
    }
  }
  $("#arc-run").onclick = search;
  $("#arc-in").addEventListener("keydown", (e) => {
    if (e.key === "Enter") search();
  });
}

/* ---------- WebLLM (lazy, WebGPU-gated) ---------- */
let engine,
  history = [];
const status = $("#llm-status"),
  chat = $("#llm-chat"),
  log = $("#llm-log"),
  prog = $("#llm-progress"),
  progBar = prog.querySelector("i"),
  speed = $("#llm-speed");

function addMsg(cls, text) {
  const d = document.createElement("div");
  d.className = "msg " + cls;
  d.textContent = text;
  log.appendChild(d);
  log.scrollTop = log.scrollHeight;
  return d;
}

$("#llm-launch").onclick = async () => {
  if (!navigator.gpu) {
    status.innerHTML = `<span class="neg">WebGPU not available.</span> This demo needs Chrome, Edge, or Safari 26+ (Firefox: enable <code>dom.webgpu.enabled</code>). The demos above still work everywhere.`;
    return;
  }
  const modelId = $("#llm-model").value; // ponytail: default model = fastest small instruct; swap freely.
  $("#llm-launch").disabled = true;
  status.textContent = "";
  chat.classList.add("on");
  prog.style.display = "block";
  addMsg(
    "sys",
    "Downloading & compiling the model — first time only, then it's cached.",
  );
  try {
    // direct jsdelivr URL (not esm.run) so the import stays inside the CSP allowlist
    const { CreateMLCEngine } =
      await import("https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.84/+esm");
    engine = await CreateMLCEngine(modelId, {
      initProgressCallback: (r) => {
        progBar.style.width = Math.round((r.progress || 0) * 100) + "%";
      },
    });
    prog.style.display = "none";
    addMsg("sys", "Ready. Ask it anything.");
  } catch (e) {
    prog.style.display = "none";
    addMsg("sys", "Failed to load: " + e.message);
    $("#llm-launch").disabled = false;
  }
};

async function send() {
  const input = $("#llm-in"),
    text = input.value.trim();
  if (!text) return;
  if (!engine) {
    status.textContent =
      "Launch the model first — the button above downloads it to your browser.";
    return;
  }
  input.value = "";
  addMsg("user", text);
  history.push({ role: "user", content: text });
  // ponytail: naive sliding window so long chats don't overflow the model context; summarize-and-continue if it matters.
  if (history.length > 20) history = history.slice(-20);
  const bot = addMsg("bot", "");
  try {
    const chunks = await engine.chat.completions.create({
      messages: history,
      stream: true,
    });
    let reply = "",
      n = 0;
    const t0 = performance.now();
    for await (const c of chunks) {
      reply += c.choices[0]?.delta?.content || "";
      n++;
      bot.textContent = reply;
      log.scrollTop = log.scrollHeight;
    }
    history.push({ role: "assistant", content: reply });
    const secs = (performance.now() - t0) / 1000;
    if (secs > 0.2)
      speed.textContent = `~${Math.round(n / secs)} tokens/sec, generated on your hardware`;
  } catch (e) {
    bot.textContent = "Error: " + e.message;
  }
}
$("#llm-send").onclick = send;
$("#llm-in").addEventListener("keydown", (e) => {
  if (e.key === "Enter") send();
});
