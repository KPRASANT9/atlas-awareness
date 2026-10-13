import { loadAtlas, bivariateColor, fmt, fmtTriple, escapeHtml, songTypeLabel, markActiveNav } from "./common.js";
import { renderCard } from "./card.js";

const d3 = window.d3;
markActiveNav();

const W = 720, H = 580;
const M = { top: 24, right: 24, bottom: 54, left: 62 };
const IW = W - M.left - M.right, IH = H - M.top - M.bottom;
const state = { set: "main", intervals: false, query: "", selected: null };

const svg = d3.select("#scatter").attr("viewBox", `0 0 ${W} ${H}`);
const tooltip = d3.select("#tooltip");
const card = document.getElementById("card");
const placeholder = card.innerHTML;

loadAtlas().then(init).catch((err) => {
  document.getElementById("scatter-status").textContent = `The chart could not load: ${err.message}`;
});

function init(data) {
  const all = data.songList.filter((s) => s.energy && s.energy[0] != null);
  const pad = 0.35;
  const x = d3.scaleLinear([d3.min(all, (s) => s.energy[0]) - pad, d3.max(all, (s) => s.energy[0]) + pad], [0, IW]);
  const y = d3.scaleLinear([d3.min(all, (s) => s.wisdom[0]) - pad, d3.max(all, (s) => s.wisdom[0]) + pad], [IH, 0]).nice();
  const g = svg.append("g").attr("transform", `translate(${M.left},${M.top})`);

  g.append("rect").attr("width", IW).attr("height", IH).attr("class", "plot-bg");
  const heat = g.append("g").attr("class", "heat");
  const cuts = data.meta.cutpoints;
  const grid = g.append("g").attr("class", "cuts");
  cuts.energy.forEach((c) => grid.append("line").attr("x1", x(c)).attr("x2", x(c)).attr("y1", 0).attr("y2", IH));
  cuts.wisdom.forEach((c) => grid.append("line").attr("y1", y(c)).attr("y2", y(c)).attr("x1", 0).attr("x2", IW));
  g.append("line").attr("class", "zero").attr("x1", x(0)).attr("x2", x(0)).attr("y1", 0).attr("y2", IH);
  g.append("line").attr("class", "zero").attr("y1", y(0)).attr("y2", y(0)).attr("x1", 0).attr("x2", IW);

  const corners = [
    [0.03, 0.04, "start", "Contemplative & ethical", "calm, high Wisdom"],
    [0.97, 0.04, "end", "Rousing idealism", "rousing, high Wisdom"],
    [0.03, 0.93, "start", "Rooted & serene", "calm, low Wisdom"],
    [0.97, 0.93, "end", "Martial resolve", "rousing, low Wisdom"],
  ];
  const cg = g.append("g").attr("class", "corner-labels").attr("aria-hidden", "true");
  corners.forEach(([fx, fy, a, t, sub]) => {
    cg.append("text").attr("x", fx * IW).attr("y", fy * IH + 8).attr("text-anchor", a).attr("class", "corner").text(t);
    cg.append("text").attr("x", fx * IW).attr("y", fy * IH + 22).attr("text-anchor", a).attr("class", "corner-sub").text(sub);
  });

  g.append("g").attr("class", "axis").attr("transform", `translate(0,${IH})`).call(d3.axisBottom(x).ticks(7).tickFormat((v) => (v === 0 ? "0" : fmt(v, 0))));
  g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(7).tickFormat((v) => (v === 0 ? "0" : fmt(v, 0))));
  g.append("text").attr("class", "axis-title").attr("x", IW / 2).attr("y", IH + 42).attr("text-anchor", "middle").text("Energy: calm ← typical → rousing (SD)");
  g.append("text").attr("class", "axis-title").attr("transform", `translate(${-46},${IH / 2}) rotate(-90)`).attr("text-anchor", "middle").text("Wisdom: less ← typical → more justice, virtue, future (SD)");

  svg.append("defs").append("clipPath").attr("id", "plot-clip").append("rect").attr("width", IW).attr("height", IH);
  const ivs = g.append("g").attr("class", "intervals").attr("clip-path", "url(#plot-clip)");
  const ptsG = g.append("g").attr("class", "points");

  function visible() {
    return state.set === "main" ? all.filter((s) => s.primary) : all;
  }

  function matches(s) {
    if (!state.query) return false;
    const q = state.query.toLowerCase();
    return s.geo.toLowerCase().includes(q) || s.title.toLowerCase().includes(q) || (s.titleEn || "").toLowerCase().includes(q);
  }

  function draw() {
    const pts = visible();
    heat.selectAll("*").remove();
    const dens = d3.contourDensity().x((s) => x(s.energy[0])).y((s) => y(s.wisdom[0])).size([IW, IH]).bandwidth(30).thresholds(8)(pts);
    const dmax = d3.max(dens, (d) => d.value);
    heat.selectAll("path").data(dens).join("path").attr("d", d3.geoPath()).attr("fill", (d) => d3.interpolateGreys(0.04 + 0.24 * (d.value / dmax))).attr("stroke", "none");

    const hasQ = !!state.query;
    const sel = ptsG.selectAll("circle").data(pts, (s) => s.id).join("circle")
      .attr("cx", (s) => x(s.energy[0])).attr("cy", (s) => y(s.wisdom[0]))
      .attr("r", (s) => (matches(s) || s.id === state.selected ? 6.5 : 4.4))
      .attr("fill", (s) => bivariateColor(s.energy[0], s.wisdom[0]))
      .attr("class", (s) => `pt${hasQ && !matches(s) ? " dim" : ""}${matches(s) ? " match" : ""}${s.id === state.selected ? " selected" : ""}`)
      .attr("aria-hidden", "true");
    sel.filter(".match, .selected").raise();
    sel.on("pointermove", (e, s) => showTip(e, s)).on("pointerleave", () => tooltip.attr("hidden", true)).on("click", (e, s) => select(s, true));

    ivs.selectAll("*").remove();
    if (state.intervals) {
      const show = hasQ ? pts.filter(matches) : pts;
      ivs.selectAll("g").data(show).join("g").attr("class", hasQ ? "iv-hl" : "")
        .call((gg) => {
          gg.append("line").attr("x1", (s) => x(s.energy[1])).attr("x2", (s) => x(s.energy[2])).attr("y1", (s) => y(s.wisdom[0])).attr("y2", (s) => y(s.wisdom[0]));
          gg.append("line").attr("y1", (s) => y(s.wisdom[1])).attr("y2", (s) => y(s.wisdom[2])).attr("x1", (s) => x(s.energy[0])).attr("x2", (s) => x(s.energy[0]));
        });
    }

    const n = pts.length, m = hasQ ? pts.filter(matches).length : 0;
    document.getElementById("scatter-count").textContent = hasQ
      ? `${m} of ${n} songs match “${state.query}”.`
      : `${n} songs shown. Nothing is highlighted until you search or select.`;
    renderResults(pts.filter(matches));
  }

  function showTip(e, s) {
    tooltip.html(`<strong>${escapeHtml(s.geo)}</strong><br><em>${escapeHtml(s.title)}</em> (${escapeHtml(songTypeLabel(s.type))})<br>Energy ${fmtTriple(s.energy)}<br>Wisdom ${fmtTriple(s.wisdom)}<br><span class="muted">Confidence: ${escapeHtml(s.confidence)}</span>`).attr("hidden", null);
    const box = document.getElementById("scatter-wrap").getBoundingClientRect();
    const tw = tooltip.node().offsetWidth;
    tooltip.style("left", `${Math.min(e.clientX - box.left + 14, box.width - tw - 6)}px`).style("top", `${e.clientY - box.top + 14}px`);
  }

  function renderResults(list) {
    const ul = document.getElementById("results");
    if (!state.query) { ul.innerHTML = ""; return; }
    ul.innerHTML = list.slice(0, 30).map((s) => `<li><button type="button" class="linklike" data-id="${s.id}">${escapeHtml(s.geo)}: <em>${escapeHtml(s.title)}</em></button> <span class="muted">E ${fmt(s.energy[0])}, W ${fmt(s.wisdom[0])}</span></li>`).join("");
    ul.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => select(data.songs[b.dataset.id], true)));
  }

  function select(s, focus) {
    state.selected = s.id;
    draw();
    renderCard(card, data, s.geo, { songId: s.id, onSelectGeo: (n) => { const gg = data.geoByName.get(n); if (gg && gg.main && data.songs[gg.main]) select(data.songs[gg.main], true); }, onClose: clear });
    card.classList.add("open");
    if (focus) card.querySelector("#card-title")?.focus({ preventScroll: window.innerWidth > 900 });
    if (focus && window.innerWidth <= 900) card.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function clear() {
    state.selected = null;
    card.innerHTML = placeholder;
    card.classList.remove("open");
    draw();
  }

  document.querySelectorAll('input[name="set"]').forEach((r) => r.addEventListener("change", () => { state.set = r.value; draw(); }));
  document.getElementById("show-intervals").addEventListener("change", (e) => { state.intervals = e.target.checked; draw(); });
  const q = document.getElementById("search");
  q.addEventListener("input", () => { state.query = q.value.trim(); draw(); });
  document.getElementById("clear-search").addEventListener("click", () => { q.value = ""; state.query = ""; draw(); q.focus(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && state.selected) clear(); });

  draw();
  document.getElementById("scatter-status").textContent = "";
}
