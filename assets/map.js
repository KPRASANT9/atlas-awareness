import {
  loadAtlas, LAYERS, themeLayers, songColor, intervalWidth, layerTriple, fmt, fmtTriple, escapeHtml,
  representativeSong, drawBivariateLegend, drawDivergingLegend, markActiveNav, songTypeLabel,
} from "./common.js";
import { renderCard } from "./card.js";

const d3 = window.d3;
const topojson = window.topojson;
markActiveNav();

const W = 960, H = 470;
const EARTH_R = 6371;
const NODATA = "#c9c9c9", OUTSCOPE = "#ebebeb";

const state = { layer: "combined", songMode: "main", uncertainty: "fade", selected: null };

const svg = d3.select("#map").attr("viewBox", `0 0 ${W} ${H}`);
const tooltip = d3.select("#tooltip");
const card = document.getElementById("card");
const placeholder = card.innerHTML;

Promise.all([loadAtlas(), fetch("data/world.topo.json").then((r) => r.json())])
  .then(([data, topo]) => init(data, topo))
  .catch((err) => {
    document.getElementById("map-status").textContent = `The map could not load: ${err.message}`;
  });

function init(data, topo) {
  const features = topojson.feature(topo, topo.objects.countries).features;
  const projection = d3.geoEqualEarth().fitExtent([[6, 6], [W - 6, H - 6]], { type: "Sphere" });
  const path = d3.geoPath(projection);

  // layer select
  const sel = document.getElementById("layer");
  const groups = d3.group([...LAYERS, ...themeLayers(data.meta)], (d) => d.group);
  for (const [g, items] of groups) {
    const og = document.createElement("optgroup");
    og.label = g;
    for (const it of items) og.append(new Option(it.label, it.id));
    sel.append(og);
  }

  const defs = svg.append("defs");
  defs.append("pattern").attr("id", "nodata-hatch").attr("patternUnits", "userSpaceOnUse").attr("width", 5).attr("height", 5).attr("patternTransform", "rotate(45)")
    .call((p) => { p.append("rect").attr("width", 5).attr("height", 5).attr("fill", NODATA); p.append("line").attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", 5).attr("stroke", "#8a8a8a").attr("stroke-width", 1.4); });
  defs.append("pattern").attr("id", "unc-hatch").attr("patternUnits", "userSpaceOnUse").attr("width", 4).attr("height", 4).attr("patternTransform", "rotate(-45)")
    .call((p) => p.append("line").attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", 4).attr("stroke", "#1b1b1b").attr("stroke-opacity", 0.55).attr("stroke-width", 1.1));

  const root = svg.append("g").attr("class", "zoom-root");
  root.append("path").datum({ type: "Sphere" }).attr("class", "sphere").attr("d", path);
  root.append("path").datum(d3.geoGraticule10()).attr("class", "graticule").attr("d", path);

  const geoOf = (f) => (f.properties.geo ? data.geoByName.get(f.properties.geo) : null);
  for (const f of features) {
    const g = geoOf(f);
    f.geoRec = g;
    f.isMicro = !!g && d3.geoArea(f) * EARTH_R * EARTH_R < 5000;
  }

  const countries = root.append("g").attr("class", "countries")
    .selectAll("path").data(features).join("path")
    .attr("d", path)
    .attr("class", (f) => `country ${f.geoRec ? (f.geoRec.scored ? "has-data" : "no-data") : f.properties.role}`);
  const uncOverlay = root.append("g").attr("class", "unc-overlay").attr("pointer-events", "none");

  // circles for microstates and geographies without polygons
  const pts = [];
  for (const f of features) if (f.isMicro) pts.push({ geo: f.geoRec, xy: projection([f.properties.LABEL_X, f.properties.LABEL_Y]) });
  for (const g of data.geos) if (g.point) pts.push({ geo: g, xy: projection(g.point) });
  const dots = root.append("g").attr("class", "micro").selectAll("circle").data(pts).join("circle")
    .attr("cx", (d) => d.xy[0]).attr("cy", (d) => d.xy[1]).attr("r", 3.6);

  function songFor(g) { return g && g.scored ? representativeSong(data, g, state.songMode) : null; }
  function fillFor(g) {
    if (!g) return OUTSCOPE;
    if (!g.scored) return "url(#nodata-hatch)";
    return songColor(songFor(g), state.layer, state.uncertainty) || NODATA;
  }

  function widthThreshold() {
    const ws = data.geos.filter((g) => g.scored && (g.key || g.point)).map((g) => intervalWidth(songFor(g), state.layer)).filter((x) => x != null);
    return d3.quantile(ws.sort(d3.ascending), 0.8);
  }

  function paint() {
    countries.attr("fill", (f) => (f.properties.role === "nodata" ? "url(#nodata-hatch)" : fillFor(f.geoRec)));
    dots.attr("fill", (d) => fillFor(d.geo));
    uncOverlay.selectAll("*").remove();
    const thr = widthThreshold();
    const wide = (g) => g && g.scored && intervalWidth(songFor(g), state.layer) >= thr;
    dots.classed("uncertain", (d) => state.uncertainty === "hatch" && wide(d.geo));
    if (state.uncertainty === "hatch") {
      uncOverlay.selectAll("path").data(features.filter((f) => !f.isMicro && wide(f.geoRec))).join("path").attr("d", path).attr("fill", "url(#unc-hatch)");
    }
    drawLegend(thr);
    renderTable();
    updateSelection();
  }

  function drawLegend(thr) {
    const lg = d3.select("#legend-graphic");
    lg.selectAll("*").remove();
    const note = document.getElementById("legend-note");
    const label = [...LAYERS, ...themeLayers(data.meta)].find((l) => l.id === state.layer).label;
    if (state.layer === "combined") {
      drawBivariateLegend(lg);
      note.innerHTML = `A continuous blend of both axes. Corners: <strong>orange</strong> = rousing, little justice/virtue/future language; <strong>blue</strong> = calm, much of it; <strong>deep purple</strong> = rousing and much of it; <strong>light sand</strong> = calm and little of it. Grey-beige = typical on both.`;
    } else {
      drawDivergingLegend(lg);
      note.innerHTML = `<strong>${escapeHtml(label)}</strong>: orange = more than the average song, purple = less. Units are standard deviations.`;
    }
    const unc = {
      fade: "Less certain scores (wider 90% intervals) are pulled toward the neutral “typical” colour.",
      hatch: `Hatched = the 20% of countries with the widest 90% intervals (width ≥ ${thr ? thr.toFixed(1) : "?"} SD).`,
      none: "Uncertainty display is off; every score still has a wide 90% range.",
    }[state.uncertainty];
    note.innerHTML += ` ${unc} <span class="legend-key"><span class="sw sw-nodata"></span>no official lyrics / not mapped</span> <span class="legend-key"><span class="sw sw-out"></span>outside the dataset</span>`;
  }

  // interaction
  function showTip(event, g) {
    if (!g) {
      tooltip.attr("hidden", true);
      return;
    }
    const s = songFor(g);
    let body;
    if (!g.scored) body = `<span class="muted">Not scored: ${escapeHtml(g.lyricStatus || "")}</span>`;
    else {
      const t = state.layer === "combined" ? null : layerTriple(s, state.layer);
      body = `<em>${escapeHtml(s.title)}</em> (${escapeHtml(songTypeLabel(s.type))})<br>
        Energy ${fmtTriple(s.energy)}<br>Wisdom ${fmtTriple(s.wisdom)}${
          t ? `<br>${escapeHtml([...LAYERS, ...themeLayers(data.meta)].find((l) => l.id === state.layer).label)} ${fmtTriple(t)}` : ""
        }<br><span class="muted">Confidence: ${escapeHtml(s.confidence)} · click for the full spectrum</span>`;
    }
    tooltip.html(`<strong>${escapeHtml(g.name)}</strong><br>${body}`).attr("hidden", null);
    const box = document.getElementById("map-wrap").getBoundingClientRect();
    const x = event.clientX - box.left, y = event.clientY - box.top;
    const tw = tooltip.node().offsetWidth;
    tooltip.style("left", `${Math.min(x + 14, box.width - tw - 6)}px`).style("top", `${y + 14}px`);
  }
  function hideTip() { tooltip.attr("hidden", true); }

  countries
    .on("pointermove", (e, f) => { if (f.geoRec) { showTip(e, f.geoRec); d3.select(e.currentTarget).classed("hover", true).raise(); } else if (f.properties.role === "nodata") { tooltip.html(`<strong>${escapeHtml(f.properties.name)}</strong><br><span class="muted">${escapeHtml(f.properties.note || "not mapped")}</span>`).attr("hidden", null); } else hideTip(); })
    .on("pointerleave", (e) => { d3.select(e.currentTarget).classed("hover", false); hideTip(); })
    .on("click", (e, f) => f.geoRec && select(f.geoRec.name, true));
  dots
    .on("pointermove", (e, d) => showTip(e, d.geo))
    .on("pointerleave", hideTip)
    .on("click", (e, d) => select(d.geo.name, true));

  function updateSelection() {
    countries.classed("selected", (f) => !!state.selected && f.geoRec && f.geoRec.name === state.selected);
    countries.filter(".selected").raise();
    dots.classed("selected", (d) => d.geo.name === state.selected);
  }

  function select(name, focusCard) {
    state.selected = name;
    updateSelection();
    renderCard(card, data, name, {
      onSelectGeo: (n) => select(n, true),
      onClose: () => clearSelection(),
    });
    card.classList.add("open");
    history.replaceState(null, "", `#geo=${encodeURIComponent(name)}`);
    if (focusCard) card.querySelector("#card-title")?.focus({ preventScroll: window.innerWidth > 900 });
    if (focusCard && window.innerWidth <= 900) card.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function clearSelection() {
    state.selected = null;
    updateSelection();
    card.innerHTML = placeholder;
    card.classList.remove("open");
    history.replaceState(null, "", location.pathname);
  }

  // zoom
  const zoom = d3.zoom().scaleExtent([1, 10]).translateExtent([[0, 0], [W, H]]).on("zoom", (e) => {
    root.attr("transform", e.transform);
    dots.attr("r", 3.6 / Math.sqrt(e.transform.k)).attr("stroke-width", 0.8 / e.transform.k);
  });
  svg.call(zoom).on("dblclick.zoom", null);
  document.getElementById("zoom-in").addEventListener("click", () => svg.transition().duration(300).call(zoom.scaleBy, 1.6));
  document.getElementById("zoom-out").addEventListener("click", () => svg.transition().duration(300).call(zoom.scaleBy, 1 / 1.6));
  document.getElementById("zoom-reset").addEventListener("click", () => svg.transition().duration(300).call(zoom.transform, d3.zoomIdentity));

  // controls
  sel.addEventListener("change", () => { state.layer = sel.value; paint(); });
  document.querySelectorAll('input[name="unc"]').forEach((r) => r.addEventListener("change", () => { state.uncertainty = r.value; paint(); }));
  document.getElementById("song-mode").addEventListener("change", (e) => { state.songMode = e.target.value; paint(); });

  const find = document.getElementById("find");
  const dl = document.getElementById("geo-list");
  data.geos.map((g) => g.name).sort((a, b) => a.localeCompare(b)).forEach((n) => dl.append(new Option(n)));
  function tryFind() {
    const v = find.value.trim().toLowerCase();
    const g = data.geos.find((x) => x.name.toLowerCase() === v);
    if (g) select(g.name, true);
  }
  find.addEventListener("change", tryFind);
  find.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); tryFind(); } });

  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && state.selected) clearSelection(); });

  // accessible table view (alphabetical, never sorted by score)
  function renderTable() {
    const tb = document.querySelector("#geo-table tbody");
    const label = [...LAYERS, ...themeLayers(data.meta)].find((l) => l.id === state.layer).label;
    document.getElementById("table-layer-h").textContent = state.layer === "combined" ? "Energy · Wisdom [90%]" : `${label} [90%]`;
    const rows = [...data.geos].sort((a, b) => a.name.localeCompare(b.name));
    tb.innerHTML = rows.map((g) => {
      const s = songFor(g);
      let val = "not scored";
      if (s) val = state.layer === "combined" ? `E ${fmtTriple(s.energy)}<br>W ${fmtTriple(s.wisdom)}` : fmtTriple(layerTriple(s, state.layer));
      return `<tr><th scope="row"><button type="button" class="linklike" data-open="${escapeHtml(g.name)}">${escapeHtml(g.name)}</button></th>
        <td>${s ? `<em>${escapeHtml(s.title)}</em>` : escapeHtml(g.lyricStatus || "")}</td><td class="num">${val}</td><td>${escapeHtml(s ? s.confidence : "Not scored")}</td></tr>`;
    }).join("");
    tb.querySelectorAll("[data-open]").forEach((b) => b.addEventListener("click", () => select(b.dataset.open, true)));
  }

  paint();
  document.getElementById("map-status").textContent = "";
  const m = location.hash.match(/geo=([^&]+)/);
  if (m && data.geoByName.has(decodeURIComponent(m[1]))) select(decodeURIComponent(m[1]), false);
}
