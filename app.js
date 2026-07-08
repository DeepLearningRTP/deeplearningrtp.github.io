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
    import("https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0"));

// sentiment
let _sent;
const getSentiment = async () => {
  const { pipeline } = await transformers();
  return (_sent ??= pipeline(
    "sentiment-analysis",
    "Xenova/distilbert-base-uncased-finetuned-sst-2-english",
  ));
};
$("#sent-run").onclick = async () => {
  const text = $("#sent-in").value.trim();
  const out = $("#sent-out");
  if (!text) {
    out.textContent = "Type something first.";
    return;
  }
  out.textContent = "Loading model & running…";
  try {
    const clf = await getSentiment();
    const t0 = performance.now();
    const [r] = await clf(text);
    const ms = Math.round(performance.now() - t0);
    const pct = (r.score * 100).toFixed(1);
    const cls = r.label === "POSITIVE" ? "pos" : "neg";
    out.innerHTML = `<span class="${cls}">${esc(r.label)}</span> · ${pct}%
      <div class="bar-meter"><i style="width:${pct}%"></i></div>
      <div class="note">inference: ${ms} ms, locally in this tab</div>`;
  } catch (e) {
    out.textContent = "Error: " + e.message;
  }
};

// image classification
let _img;
const getImageClf = async () => {
  const { pipeline } = await transformers();
  return (_img ??= pipeline(
    "image-classification",
    "Xenova/vit-base-patch16-224",
  ));
};
const drop = $("#img-drop"),
  file = $("#img-file"),
  imgOut = $("#img-out");
drop.onclick = () => file.click();
["dragover", "dragenter"].forEach((ev) =>
  drop.addEventListener(ev, (e) => {
    e.preventDefault();
    drop.classList.add("hover");
  }),
);
["dragleave", "drop"].forEach((ev) =>
  drop.addEventListener(ev, (e) => {
    e.preventDefault();
    drop.classList.remove("hover");
  }),
);
drop.addEventListener("drop", (e) => {
  if (e.dataTransfer.files[0]) classify(e.dataTransfer.files[0]);
});
file.onchange = () => file.files[0] && classify(file.files[0]);
let prevUrl;
async function classify(f) {
  if (prevUrl) URL.revokeObjectURL(prevUrl);
  const url = (prevUrl = URL.createObjectURL(f));
  drop.innerHTML = `<span>Change image</span><img src="${url}" alt="uploaded preview">`;
  imgOut.textContent = "Loading model & running…";
  try {
    const clf = await getImageClf();
    const t0 = performance.now();
    const results = await clf(url, { topk: 4 });
    const ms = Math.round(performance.now() - t0);
    imgOut.innerHTML =
      results
        .map(
          (r) =>
            `<div class="resultline"><span>${esc(r.label)}</span><b>${(r.score * 100).toFixed(1)}%</b></div>`,
        )
        .join("") +
      `<div class="note">inference: ${ms} ms, locally in this tab</div>`;
  } catch (e) {
    imgOut.textContent = "Error: " + e.message;
  }
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
    status.innerHTML = `<span class="neg">WebGPU not available.</span> This demo needs Chrome, Edge, or Safari 26+ (Firefox: enable <code>dom.webgpu.enabled</code>). The two demos above still work everywhere.`;
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
  if (!text || !engine) return;
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
