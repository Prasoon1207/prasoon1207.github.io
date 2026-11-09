(function () {
  "use strict";

  // -------------------------------------------------------------------------
  // 1. Complete EMNLP 2026 Benchmark Data (20 Models x 3 Benchmarks)
  // -------------------------------------------------------------------------
  var MODELS = [
    { id: "gemini-3-flash", slug: "3-flash", name: "Gemini-3-Flash", family: "Gemini", cutoff: "2025-01" },
    { id: "gemini-3-flash-low", slug: "3-flash-low", name: "Gemini-3-Flash (Low)", family: "Gemini", cutoff: "2025-01" },
    { id: "gemini-3-flash-minimal", slug: "3-flash-minimal", name: "Gemini-3-Flash (Minimal)", family: "Gemini", cutoff: "2025-01" },
    { id: "gemini-2.5-flash", slug: "2-5-flash", name: "Gemini-2.5-Flash", family: "Gemini", cutoff: "2025-01" },
    { id: "gemini-2.5-flash-thinking-off", slug: "2-5-flash-no-thinking", name: "Gemini-2.5-Flash (No-Think)", family: "Gemini", cutoff: "2025-01" },
    { id: "gpt-oss-120b", slug: "gpt-oss-120b", name: "GPT-OSS-120B", family: "GPT-OSS", cutoff: "2024-06" },
    { id: "gpt-oss-20b", slug: "gpt-oss-20b", name: "GPT-OSS-20B", family: "GPT-OSS", cutoff: "2024-06" },
    { id: "claude-sonnet-4.6", slug: "claude-sonnet-4-6", name: "Claude-Sonnet-4.6", family: "Claude", cutoff: "2025-05" },
    { id: "claude-opus-4.7", slug: "claude-opus-4-7", name: "Claude-Opus-4.7", family: "Claude", cutoff: "2026-01" },
    { id: "claude-haiku-4.5", slug: "claude-haiku-4-5", name: "Claude-Haiku-4.5", family: "Claude", cutoff: "2025-02" },
    { id: "gemma-4-31b-it", slug: "gemma-4-31b-it", name: "Gemma-4-31B-IT", family: "Gemma 4", cutoff: "2025-01" },
    { id: "gemma-4-26b-a4b-it", slug: "gemma-4-26b-a4b-it", name: "Gemma-4-26B-A4B-IT", family: "Gemma 4", cutoff: "2025-01" },
    { id: "gemma-4-e4b-it", slug: "gemma4-e4b-it", name: "Gemma-4-E4B-IT", family: "Gemma 4", cutoff: "2025-01" },
    { id: "gemma-4-e2b-it", slug: "gemma4-e2b-it", name: "Gemma-4-E2B-IT", family: "Gemma 4", cutoff: "2025-01" },
    { id: "qwen-3-30b-a3b", slug: "qwen-3-30b-a3b-it", name: "Qwen-3-30B-A3B", family: "Qwen 3", cutoff: "2024-11" },
    { id: "qwen-3-4b", slug: "qwen-3-4b-it", name: "Qwen-3-4B", family: "Qwen 3", cutoff: "2024-11" },
    { id: "gemma-3-27b", slug: "gemma-3-27b", name: "Gemma-3-27B", family: "Gemma 3", cutoff: "2024-08" },
    { id: "gemma-3-12b", slug: "gemma-3-12b", name: "Gemma-3-12B", family: "Gemma 3", cutoff: "2024-08" },
    { id: "gemma-3-4b", slug: "gemma-3-4b", name: "Gemma-3-4B", family: "Gemma 3", cutoff: "2024-08" },
    { id: "gemma-3-1b", slug: "gemma-3-1b", name: "Gemma-3-1B", family: "Gemma 3", cutoff: "2024-08" }
  ];

  var BENCHMARKS = {
    eclektic: {
      label: "ECLeKTic",
      filePrefix: "eclektic",
      hasTransferScore: true,
      rows: {
        "gemini-2.5-flash": { src: 50.9, tgt: 44.5, gap: 6.4, ts: 66.0, hat: 81.7, ci: [78.6, 84.7] },
        "gemini-2.5-flash-thinking-off": { src: 42.8, tgt: 29.4, gap: 13.3, ts: 44.9, hat: 60.4, ci: [55.9, 64.8] },
        "gemini-3-flash": { src: 68.4, tgt: 60.5, gap: 8.0, ts: 78.0, hat: 84.6, ci: [82.1, 87.1] },
        "gemini-3-flash-low": { src: 69.1, tgt: 60.2, gap: 8.9, ts: 76.2, hat: 84.0, ci: [81.6, 86.7] },
        "gemini-3-flash-minimal": { src: 65.7, tgt: 52.3, gap: 13.4, ts: 68.0, hat: 74.2, ci: [70.9, 77.5] },
        "gemma-3-1b": { src: 5.4, tgt: 4.6, gap: 0.8, ts: 32.1, hat: 48.2, ci: [34.9, 61.0] },
        "gemma-3-4b": { src: 11.5, tgt: 9.6, gap: 1.9, ts: 45.8, hat: 56.4, ci: [47.0, 65.9] },
        "gemma-3-12b": { src: 17.3, tgt: 15.2, gap: 2.1, ts: 56.2, hat: 64.1, ci: [56.8, 71.4] },
        "gemma-3-27b": { src: 26.4, tgt: 19.8, gap: 6.5, ts: 58.8, hat: 63.8, ci: [58.4, 69.6] },
        "qwen-3-4b": { src: 13.8, tgt: 10.8, gap: 2.9, ts: 38.8, hat: 56.5, ci: [47.8, 64.9] },
        "qwen-3-30b-a3b": { src: 19.4, tgt: 16.6, gap: 2.8, ts: 48.9, hat: 65.9, ci: [59.7, 72.6] },
        "gpt-oss-20b": { src: 19.7, tgt: 18.0, gap: 1.6, ts: 53.5, hat: 80.1, ci: [74.7, 85.3] },
        "gpt-oss-120b": { src: 27.9, tgt: 25.4, gap: 2.4, ts: 61.0, hat: 82.2, ci: [77.9, 86.1] },
        "gemma-4-e2b-it": { src: 11.9, tgt: 9.0, gap: 2.8, ts: 39.0, hat: 51.8, ci: [42.4, 61.3] },
        "gemma-4-e4b-it": { src: 15.7, tgt: 10.7, gap: 5.0, ts: 43.9, hat: 58.4, ci: [51.2, 65.7] },
        "gemma-4-26b-a4b-it": { src: 26.0, tgt: 20.3, gap: 5.7, ts: 55.2, hat: 63.9, ci: [57.9, 69.6] },
        "gemma-4-31b-it": { src: 28.2, tgt: 22.6, gap: 5.5, ts: 55.3, hat: 68.6, ci: [62.9, 74.1] },
        "claude-haiku-4.5": { src: 29.3, tgt: 20.8, gap: 8.4, ts: 51.1, hat: 59.8, ci: [53.8, 65.7] },
        "claude-sonnet-4.6": { src: 52.9, tgt: 44.1, gap: 8.7, ts: 70.0, hat: 74.7, ci: [70.9, 78.5] },
        "claude-opus-4.7": { src: 55.6, tgt: 45.2, gap: 10.3, ts: 67.0, hat: 73.5, ci: [69.7, 77.2] }
      }
    },
    mmlu_prox_lite: {
      label: "MMLU-ProX-Lite",
      filePrefix: "mmlu-prox-lite",
      hasTransferScore: false,
      rows: {
        "gemini-2.5-flash": { src: 72.0, tgt: 73.4, gap: -1.9, hat: 97.5, ci: [96.2, 98.8] },
        "gemini-2.5-flash-thinking-off": { src: 67.5, tgt: 61.6, gap: 5.9, hat: 88.9, ci: [87.1, 90.3] },
        "gemini-3-flash": { src: 80.8, tgt: 82.1, gap: -1.4, hat: 98.8, ci: [97.8, 99.9] },
        "gemini-3-flash-low": { src: 82.2, tgt: 83.0, gap: -0.8, hat: 98.3, ci: [97.3, 99.3] },
        "gemini-3-flash-minimal": { src: 80.4, tgt: 77.2, gap: 3.2, hat: 93.5, ci: [92.1, 94.8] },
        "gemma-3-1b": { src: 17.0, tgt: 14.2, gap: 2.7, hat: 58.4, ci: [52.3, 64.1] },
        "gemma-3-4b": { src: 28.2, tgt: 24.6, gap: 3.6, hat: 67.5, ci: [63.1, 71.7] },
        "gemma-3-12b": { src: 42.0, tgt: 34.9, gap: 7.0, hat: 71.6, ci: [68.2, 74.7] },
        "gemma-3-27b": { src: 45.7, tgt: 39.4, gap: 6.4, hat: 77.2, ci: [74.4, 80.1] },
        "qwen-3-4b": { src: 40.8, tgt: 32.7, gap: 8.1, hat: 69.3, ci: [65.8, 72.6] },
        "qwen-3-30b-a3b": { src: 53.9, tgt: 43.4, gap: 10.5, hat: 74.8, ci: [71.9, 77.6] },
        "gpt-oss-20b": { src: 74.0, tgt: 66.3, gap: 7.7, hat: 88.9, ci: [87.6, 90.3] },
        "gpt-oss-120b": { src: 79.0, tgt: 72.3, gap: 6.6, hat: 90.6, ci: [89.2, 92.0] },
        "gemma-4-e2b-it": { src: 31.8, tgt: 26.1, gap: 5.7, hat: 59.3, ci: [54.7, 63.5] },
        "gemma-4-e4b-it": { src: 42.9, tgt: 35.8, gap: 7.1, hat: 74.8, ci: [71.6, 77.8] },
        "gemma-4-26b-a4b-it": { src: 53.6, tgt: 48.7, gap: 4.8, hat: 78.7, ci: [76.2, 81.1] },
        "gemma-4-31b-it": { src: 64.1, tgt: 59.4, gap: 4.8, hat: 84.7, ci: [82.5, 86.7] },
        "claude-haiku-4.5": { src: 45.2, tgt: 44.6, gap: 0.6, hat: 76.5, ci: [73.5, 79.2] },
        "claude-sonnet-4.6": { src: 66.8, tgt: 59.5, gap: 7.4, hat: 85.4, ci: [83.6, 87.3] },
        "claude-opus-4.7": { src: 82.5, tgt: 76.7, gap: 5.8, hat: 89.3, ci: [87.8, 90.9] }
      }
    },
    mgsmv2: {
      label: "MGSMv2",
      filePrefix: "mgsm2",
      hasTransferScore: false,
      rows: {
        "gemini-2.5-flash": { src: 99.5, tgt: 98.2, gap: 1.3, hat: 98.7, ci: [98.1, 99.2] },
        "gemini-2.5-flash-thinking-off": { src: 58.4, tgt: 55.6, gap: 2.8, hat: 89.8, ci: [86.9, 92.4] },
        "gemini-3-flash": { src: 99.8, tgt: 99.3, gap: 0.4, hat: 99.6, ci: [99.3, 99.9] },
        "gemini-3-flash-low": { src: 99.9, tgt: 99.4, gap: 0.5, hat: 99.5, ci: [99.1, 99.8] },
        "gemini-3-flash-minimal": { src: 86.9, tgt: 86.5, gap: 0.4, hat: 96.2, ci: [94.8, 97.5] },
        "gemma-3-1b": { src: 50.7, tgt: 25.9, gap: 24.7, hat: 47.7, ci: [43.7, 51.8] },
        "gemma-3-4b": { src: 86.3, tgt: 72.9, gap: 13.4, hat: 82.6, ci: [80.3, 85.0] },
        "gemma-3-12b": { src: 96.0, tgt: 88.1, gap: 7.9, hat: 91.3, ci: [89.7, 92.8] },
        "gemma-3-27b": { src: 97.4, tgt: 93.3, gap: 4.1, hat: 95.3, ci: [94.0, 96.5] },
        "qwen-3-4b": { src: 97.4, tgt: 79.4, gap: 18.1, hat: 81.3, ci: [79.4, 83.2] },
        "qwen-3-30b-a3b": { src: 98.4, tgt: 88.6, gap: 9.8, hat: 89.8, ci: [88.4, 91.3] },
        "gpt-oss-20b": { src: 99.0, tgt: 95.2, gap: 3.8, hat: 96.1, ci: [95.4, 96.9] },
        "gpt-oss-120b": { src: 99.6, tgt: 97.0, gap: 2.6, hat: 97.4, ci: [96.8, 98.0] },
        "gemma-4-e2b-it": { src: 18.0, tgt: 13.0, gap: 5.0, hat: 53.7, ci: [45.1, 62.6] },
        "gemma-4-e4b-it": { src: 21.9, tgt: 17.5, gap: 4.4, hat: 68.0, ci: [60.3, 74.1] },
        "gemma-4-26b-a4b-it": { src: 99.5, tgt: 96.5, gap: 3.0, hat: 96.8, ci: [95.7, 97.7] },
        "gemma-4-31b-it": { src: 99.6, tgt: 98.3, gap: 1.4, hat: 98.4, ci: [97.8, 99.0] },
        "claude-haiku-4.5": { src: 52.8, tgt: 54.0, gap: -1.3, hat: 86.0, ci: [82.1, 89.6] },
        "claude-sonnet-4.6": { src: 96.1, tgt: 98.7, gap: -2.6, hat: 99.4, ci: [98.7, 100.0] },
        "claude-opus-4.7": { src: 89.4, tgt: 90.4, gap: -1.0, hat: 97.3, ci: [96.0, 98.4] }
      }
    }
  };

  // -------------------------------------------------------------------------
  // 2. Interactive HAT Simulator (Canvas)
  // -------------------------------------------------------------------------
  var simCanvas = document.getElementById("hat-sim-canvas");
  var sliderSource = document.getElementById("slider-source-shift");
  var sliderSlope = document.getElementById("slider-transfer-slope");

  function betaWeights(meanS, nBins) {
    // Smooth unimodal/bimodal mixture over [0, 1] controlled by meanS in [0.15, 0.88]
    var weights = [];
    var sum = 0;
    var concentration = 4.2;
    var a = Math.max(0.45, meanS * concentration);
    var b = Math.max(0.45, (1.0 - meanS) * concentration);
    for (var i = 0; i < nBins; i++) {
      var s = (i + 0.5) / nBins;
      var w = Math.pow(s, a - 1.0) * Math.pow(1.0 - s, b - 1.0);
      weights.push(w);
      sum += w;
    }
    for (var j = 0; j < nBins; j++) {
      weights[j] /= sum;
    }
    return weights;
  }

  function updateSimulator() {
    if (!simCanvas || !sliderSource || !sliderSlope) return;
    var meanS = parseFloat(sliderSource.value);
    var slopeM = parseFloat(sliderSlope.value);

    document.getElementById("val-source-shift").textContent = Math.round(meanS * 100) + "%";
    document.getElementById("val-transfer-slope").textContent = slopeM.toFixed(2);

    var nBins = 20;
    var weights = betaWeights(meanS, nBins);
    var expSrc = 0;
    var expTgt = 0;
    var tsNumer = 0;
    var tsDenom = 0;

    for (var i = 0; i < nBins; i++) {
      var s = (i + 0.5) / nBins;
      var tCond = slopeM * s;
      var p = weights[i];
      expSrc += s * p;
      expTgt += tCond * p;
      tsNumer += s * tCond * p;
      tsDenom += s * p;
    }

    var xltGapVal = expSrc - expTgt;
    var tsVal = tsDenom > 1e-9 ? tsNumer / tsDenom : 0;
    var hatVal = slopeM;

    document.getElementById("sim-out-src").textContent = (expSrc * 100).toFixed(1) + "%";
    document.getElementById("sim-out-tgt").textContent = (expTgt * 100).toFixed(1) + "%";
    document.getElementById("sim-out-gap").textContent = (xltGapVal * 100).toFixed(1) + "%";
    document.getElementById("sim-out-ts").textContent = (tsVal * 100).toFixed(1) + "%";
    document.getElementById("sim-out-hat").textContent = (hatVal * 100).toFixed(1);

    // Draw Canvas
    var dpr = window.devicePixelRatio || 1;
    var cssW = 460;
    var cssH = 360;
    simCanvas.width = cssW * dpr;
    simCanvas.height = cssH * dpr;
    var ctx = simCanvas.getContext("2d");
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, cssW, cssH);

    var padL = 52, padR = 22, padT = 24, padB = 44;
    var plotW = cssW - padL - padR;
    var plotH = cssH - padT - padB;

    function toX(s) { return padL + s * plotW; }
    function toY(t) { return padT + (1.0 - t) * plotH; }

    // Gridlines
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    for (var g = 0; g <= 5; g++) {
      var gv = g / 5.0;
      ctx.beginPath();
      ctx.moveTo(toX(gv), padT);
      ctx.lineTo(toX(gv), padT + plotH);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(padL, toY(gv));
      ctx.lineTo(padL + plotW, toY(gv));
      ctx.stroke();
    }

    // Source density histogram p_S(s | M) along bottom
    var maxW = Math.max.apply(null, weights);
    ctx.fillStyle = "rgba(37, 99, 235, 0.16)";
    ctx.strokeStyle = "rgba(37, 99, 235, 0.42)";
    ctx.lineWidth = 1;
    for (var bIdx = 0; bIdx < nBins; bIdx++) {
      var bx = toX(bIdx / nBins);
      var bw = plotW / nBins - 1.5;
      var bh = (weights[bIdx] / Math.max(maxW, 0.18)) * (plotH * 0.42);
      ctx.fillRect(bx + 0.75, padT + plotH - bh, bw, bh);
      ctx.strokeRect(bx + 0.75, padT + plotH - bh, bw, bh);
    }

    // Shaded HAT Area under E[T | S = s] = m * s
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(0));
    ctx.lineTo(toX(1), toY(slopeM));
    ctx.lineTo(toX(1), toY(0));
    ctx.closePath();
    ctx.fillStyle = "rgba(220, 38, 38, 0.14)";
    ctx.fill();

    // Parity line y = x
    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(0));
    ctx.lineTo(toX(1), toY(1));
    ctx.stroke();
    ctx.restore();

    // Transfer profile curve y = m * s
    ctx.strokeStyle = "#dc2626";
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(0));
    ctx.lineTo(toX(1), toY(slopeM));
    ctx.stroke();

    // Expected operating point (E[S], E[T])
    ctx.save();
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = "#1d4ed8";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(toX(expSrc), toY(0));
    ctx.lineTo(toX(expSrc), toY(expTgt));
    ctx.lineTo(toX(0), toY(expTgt));
    ctx.stroke();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(toX(expSrc), toY(expTgt), 5.5, 0, Math.PI * 2);
    ctx.fillStyle = "#1d4ed8";
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Axes border
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(padL, padT, plotW, plotH);

    // Labels
    ctx.fillStyle = "#475569";
    ctx.font = "11px Inter, sans-serif";
    ctx.textAlign = "center";
    for (var k = 0; k <= 5; k++) {
      var kv = k * 20;
      ctx.fillText(kv + "%", toX(k / 5.0), padT + plotH + 17);
    }
    ctx.textAlign = "right";
    for (var ky = 0; ky <= 5; ky++) {
      ctx.fillText((ky * 20) + "%", padL - 8, toY(ky / 5.0) + 4);
    }

    ctx.fillStyle = "#0f172a";
    ctx.font = "600 12px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Source Pass-Rate s (%)", padL + plotW / 2, cssH - 8);

    ctx.save();
    ctx.translate(15, padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Expected Target Pass-Rate E[T | S = s]", 0, 0);
    ctx.restore();

    // Inline legend
    ctx.textAlign = "left";
    ctx.font = "600 11px JetBrains Mono, monospace";
    ctx.fillStyle = "#dc2626";
    ctx.fillText("HAT = 2 × Area = " + (hatVal * 100).toFixed(1), padL + 12, padT + 20);
    ctx.fillStyle = "#1d4ed8";
    ctx.fillText("Blue bars: Source density p_S(s|M)", padL + 12, padT + 37);
  }

  if (sliderSource && sliderSlope) {
    sliderSource.addEventListener("input", updateSimulator);
    sliderSlope.addEventListener("input", updateSimulator);

    var presetBtns = document.querySelectorAll("[data-sim-preset]");
    presetBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        presetBtns.forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        sliderSource.value = btn.getAttribute("data-src");
        sliderSlope.value = btn.getAttribute("data-slope");
        updateSimulator();
      });
    });
    updateSimulator();
  }

  // -------------------------------------------------------------------------
  // 3. Interactive 20-Model Leaderboard & Empirical Profile Explorer
  // -------------------------------------------------------------------------
  var state = {
    benchmark: "eclektic",
    family: "All",
    sortKey: "hat",
    sortDir: -1,
    selectedModelId: "gemini-3-flash"
  };

  function getModelById(id) {
    for (var i = 0; i < MODELS.length; i++) {
      if (MODELS[i].id === id) return MODELS[i];
    }
    return MODELS[0];
  }

  function renderInspector() {
    var benchObj = BENCHMARKS[state.benchmark];
    var m = getModelById(state.selectedModelId);
    var d = benchObj.rows[m.id];
    if (!d) return;

    document.getElementById("inspector-model-name").textContent = m.name;
    document.getElementById("inspector-bench-name").textContent = benchObj.label + " · Cutoff " + m.cutoff;
    var imgEl = document.getElementById("inspector-profile-img");
    imgEl.src = "figures/profiles/" + benchObj.filePrefix + "__" + m.slug + ".png";
    imgEl.alt = m.name + " HAT Transfer Profile on " + benchObj.label;

    document.getElementById("insp-src").textContent = d.src.toFixed(1) + "%";
    document.getElementById("insp-tgt").textContent = d.tgt.toFixed(1) + "%";
    document.getElementById("insp-hat").textContent = d.hat.toFixed(1) + " [" + d.ci[0].toFixed(1) + ", " + d.ci[1].toFixed(1) + "]";
  }

  function renderLeaderboard() {
    var benchObj = BENCHMARKS[state.benchmark];
    var thead = document.getElementById("leaderboard-thead");
    var tbody = document.getElementById("leaderboard-tbody");
    if (!thead || !tbody) return;

    var cols = [
      { key: "name", label: "Model", numeric: false },
      { key: "src", label: "Source (%)", numeric: true },
      { key: "tgt", label: "Target (%)", numeric: true },
      { key: "gap", label: "XLT Gap ↓", numeric: true }
    ];
    if (benchObj.hasTransferScore) {
      cols.push({ key: "ts", label: "Transfer (%)", numeric: true });
    }
    cols.push({ key: "hat", label: "HAT Score ↑ (95% CI)", numeric: true });

    // If switched from ECLeKTic while sorting by 'ts', reset sortKey to 'hat'
    if (state.sortKey === "ts" && !benchObj.hasTransferScore) {
      state.sortKey = "hat";
      state.sortDir = -1;
    }

    thead.innerHTML = "";
    var trHead = document.createElement("tr");
    cols.forEach(function (col) {
      var th = document.createElement("th");
      if (col.numeric) th.className = "num";
      var arrow = state.sortKey === col.key ? (state.sortDir === -1 ? " ▼" : " ▲") : "";
      th.textContent = col.label + arrow;
      th.addEventListener("click", function () {
        if (state.sortKey === col.key) {
          state.sortDir *= -1;
        } else {
          state.sortKey = col.key;
          state.sortDir = col.key === "gap" || col.key === "name" ? 1 : -1;
        }
        renderLeaderboard();
      });
      trHead.appendChild(th);
    });
    thead.appendChild(trHead);

    var filtered = MODELS.filter(function (m) {
      return state.family === "All" || m.family === state.family;
    });

    filtered.sort(function (a, b) {
      if (state.sortKey === "name") {
        return a.name.localeCompare(b.name) * state.sortDir;
      }
      var va = benchObj.rows[a.id][state.sortKey];
      var vb = benchObj.rows[b.id][state.sortKey];
      return (va - vb) * state.sortDir;
    });

    if (!filtered.some(function (m) { return m.id === state.selectedModelId; }) && filtered.length > 0) {
      state.selectedModelId = filtered[0].id;
    }

    tbody.innerHTML = "";
    filtered.forEach(function (m) {
      var d = benchObj.rows[m.id];
      var tr = document.createElement("tr");
      if (m.id === state.selectedModelId) tr.className = "selected-row";

      var tdName = document.createElement("td");
      tdName.innerHTML =
        '<span class="model-cell-name">' + m.name + '</span>' +
        '<span class="model-cell-meta">' + m.family + ' · ' + m.cutoff + '</span>';
      tr.appendChild(tdName);

      var tdSrc = document.createElement("td");
      tdSrc.className = "num";
      tdSrc.textContent = d.src.toFixed(1);
      tr.appendChild(tdSrc);

      var tdTgt = document.createElement("td");
      tdTgt.className = "num";
      tdTgt.textContent = d.tgt.toFixed(1);
      tr.appendChild(tdTgt);

      var tdGap = document.createElement("td");
      tdGap.className = "num";
      tdGap.textContent = (d.gap > 0 ? "+" : "") + d.gap.toFixed(1);
      tr.appendChild(tdGap);

      if (benchObj.hasTransferScore) {
        var tdTs = document.createElement("td");
        tdTs.className = "num";
        tdTs.textContent = d.ts.toFixed(1);
        tr.appendChild(tdTs);
      }

      var tdHat = document.createElement("td");
      tdHat.className = "num hat-bar-cell";
      tdHat.innerHTML =
        '<div><span class="hat-score-main">' + d.hat.toFixed(1) + '</span>' +
        '<span class="hat-ci-sub">[' + d.ci[0].toFixed(1) + ', ' + d.ci[1].toFixed(1) + ']</span></div>' +
        '<div class="hat-mini-track"><div class="hat-mini-fill" style="width:' + Math.min(100, d.hat) + '%"></div></div>';
      tr.appendChild(tdHat);

      tr.addEventListener("click", function () {
        state.selectedModelId = m.id;
        renderLeaderboard();
        renderInspector();
      });

      tbody.appendChild(tr);
    });

    renderInspector();
  }

  document.querySelectorAll("[data-bench-tab]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll("[data-bench-tab]").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      state.benchmark = btn.getAttribute("data-bench-tab");
      renderLeaderboard();
    });
  });

  document.querySelectorAll("[data-family-filter]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll("[data-family-filter]").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      state.family = btn.getAttribute("data-family-filter");
      renderLeaderboard();
    });
  });

  renderLeaderboard();

  // -------------------------------------------------------------------------
  // 4. Copy-to-Clipboard Buttons
  // -------------------------------------------------------------------------
  document.querySelectorAll("[data-copy-target]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var targetId = btn.getAttribute("data-copy-target");
      var el = document.getElementById(targetId);
      if (!el) return;
      navigator.clipboard.writeText(el.textContent).then(function () {
        var orig = btn.textContent;
        btn.textContent = "Copied!";
        setTimeout(function () { btn.textContent = orig; }, 1600);
      });
    });
  });
})();
