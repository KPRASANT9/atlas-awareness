import { escapeHtml, fmt, fmtTriple, describe, songTypeLabel, divergingColor } from "./common.js";

const AXIS = 3.2;
const SUB_LABELS = {
  mobilisation: "Mobilisation",
  awakening: "Awakening",
  struggle: "Struggle (content)",
  drive: "Drive (rhetoric)",
  invocation: "Invocation (content)",
  build: "Build (refrain, acclamation)",
};
const SUB_HELP = {
  mobilisation: "calls to struggle and action; half of Energy",
  awakening: "waking, hailing and song; half of Energy",
  struggle: "martial and freedom-through-struggle themes",
  drive: "imperatives, exclamations, march tempo",
  invocation: "the Awakening theme",
  build: "refrain repetition and final acclamation",
};
const CONF_HELP = {
  High: "0–0.5 penalty points",
  Medium: "1–1.5 penalty points",
  Low: "2 or more penalty points",
};

/** One horizontal interval row as inline SVG: zero line, optional bar, 90% whisker, point. */
function intervalSvg(t, { bar = false, color = "#333" } = {}) {
  const W = 180, H = 18, pad = 4;
  const x = (v) => pad + ((Math.max(-AXIS, Math.min(AXIS, v)) + AXIS) / (2 * AXIS)) * (W - 2 * pad);
  if (!t || t[0] == null) return `<svg class="iv" viewBox="0 0 ${W} ${H}" aria-hidden="true"></svg>`;
  const [v, lo, hi] = t;
  let s = `<svg class="iv" viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false">`;
  for (const g of [-2, -1, 1, 2]) s += `<line x1="${x(g)}" x2="${x(g)}" y1="2" y2="${H - 2}" class="iv-grid"/>`;
  s += `<line x1="${x(0)}" x2="${x(0)}" y1="0" y2="${H}" class="iv-zero"/>`;
  if (bar) {
    const a = Math.min(x(0), x(v)), b = Math.max(x(0), x(v));
    s += `<rect x="${a}" y="5" width="${Math.max(1, b - a)}" height="8" rx="1.5" fill="${color}" opacity="0.9"/>`;
  }
  if (lo != null && hi != null) {
    s += `<line x1="${x(lo)}" x2="${x(hi)}" y1="9" y2="9" class="iv-whisker"/>`;
    s += `<line x1="${x(lo)}" x2="${x(lo)}" y1="5" y2="13" class="iv-whisker"/><line x1="${x(hi)}" x2="${x(hi)}" y1="5" y2="13" class="iv-whisker"/>`;
  }
  if (!bar) s += `<circle cx="${x(v)}" cy="9" r="4" fill="${color}" stroke="#fff" stroke-width="1.2"/>`;
  return s + "</svg>";
}

function row(label, t, opts = {}, help = "") {
  const txt = fmtTriple(t);
  return `<div class="iv-row" role="listitem">
    <span class="iv-label">${escapeHtml(label)}${help ? `<span class="iv-help">${escapeHtml(help)}</span>` : ""}</span>
    ${intervalSvg(t, opts)}
    <span class="iv-val"><span class="sr-only">${escapeHtml(label)}: </span>${txt}<span class="sr-only">, ${describe(t)}</span></span>
  </div>`;
}

function axisScale() {
  return `<div class="iv-row iv-scale" aria-hidden="true"><span></span>
    <svg class="iv" viewBox="0 0 180 14">${[-3, -2, -1, 0, 1, 2, 3]
      .map((g) => { const x = 4 + ((g + AXIS) / (2 * AXIS)) * 172; return `<text x="${x}" y="11" text-anchor="middle">${g === 0 ? "0" : fmt(g, 0)}</text>`; })
      .join("")}</svg><span class="iv-val">value [90% range]</span></div>`;
}

function confidenceBadge(grade, reasons) {
  const cls = { High: "conf-high", Medium: "conf-med", Low: "conf-low" }[grade] || "conf-none";
  return `<span class="badge ${cls}" title="${escapeHtml(CONF_HELP[grade] || "")}">Data confidence: ${escapeHtml(grade)}</span>${
    reasons ? `<span class="conf-reasons">${escapeHtml(reasons)}</span>` : grade === "High" ? `<span class="conf-reasons">no data-quality penalties</span>` : ""
  }`;
}

function songMeta(s) {
  const bits = [];
  bits.push(escapeHtml(songTypeLabel(s.type)));
  if (s.year) bits.push(`adopted/written ${s.year}`);
  if (s.lyricist) bits.push(`words: ${escapeHtml(s.lyricist)}`);
  if (s.composer) bits.push(`music: ${escapeHtml(s.composer)}`);
  return bits.join(" · ");
}

function evidence(s) {
  const ety = s.ety || {};
  const layer = { core: `curated roots (${ety.core} terms)`, light: `light root lexicon (${ety.light} root hits)`, none: "none" }[ety.layer] || ety.layer;
  const items = [];
  items.push(["Source language", s.englishOriginal ? "English (scored text is the original; no translation)" : `${s.lang || "?"}${s.family ? ` · ${s.family}` : ""}`]);
  items.push(["Etymology layer", `${layer}${ety.alpha ? `, weight α = ${ety.alpha.toFixed(2)}` : ""}`]);
  if (ety.drift != null) items.push(["Translation drift", `${ety.drift.toFixed(2)} (${escapeHtml(ety.driftBasis || "")})`]);
  items.push(["Second translation", s.secondTranslation ? `yes; moves Energy ${fmt(s.shift[0])}, Wisdom ${fmt(s.shift[1])}` : "none available to compare"]);
  if (s.words) items.push(["Words analysed", `${s.words}${s.words < 60 ? " (short text)" : ""}`]);
  if (s.archetype) items.push(["Archetype (soft family)", escapeHtml(s.archetype)]);
  if (s.lyricStatus) items.push(["Lyric status", escapeHtml(s.lyricStatus)]);
  return `<dl class="evidence">${items.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>`;
}

function sourceLink(s) {
  const url = s.revUrl || s.sourceUrl;
  if (!url) return s.source ? `<p class="source">Text source: ${escapeHtml(s.source)}</p>` : "";
  const note = s.revLabel
    ? `Scored text: ${escapeHtml(s.revLabel)} (Wikipedia contributors, CC BY-SA 4.0 unless the text is public domain).`
    : escapeHtml(s.source || "");
  return `<p class="source">This site shows scores only, never lyrics.
    <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">Read the song and its translation at the source<span class="sr-only"> (opens in a new tab)</span> ↗</a>
    ${note ? `<span class="source-note">${note}</span>` : ""}</p>`;
}

function songDetail(data, s) {
  if (!s || s.notScored || !s.energy || s.energy[0] == null) {
    return `<div class="song-detail"><h3>${escapeHtml(s ? s.title : "No song")}</h3>
      <p class="muted">${s ? songMeta(s) : ""}</p>
      <p class="notice">Not scored: ${escapeHtml((s && s.lyricStatus) || "no scorable text")}.</p>${s ? sourceLink(s) : ""}</div>`;
  }
  const themes = data.meta.themes
    .map((t) => ({ ...t, v: s.themes[t.key] }))
    .sort((a, b) => (b.v[0] ?? -9) - (a.v[0] ?? -9));
  return `<div class="song-detail">
    <h3>${escapeHtml(s.title)}${s.titleEn && s.titleEn !== s.title ? ` <span class="title-en">“${escapeHtml(s.titleEn)}”</span>` : ""}</h3>
    <p class="muted">${songMeta(s)}</p>
    <p class="reading">${escapeHtml(s.reading || "")}</p>
    <div class="conf">${confidenceBadge(s.confidence, s.reasons)}</div>

    <h4>Energy and Wisdom <span class="h-note">standard deviations from the average song; bracket = 90% range</span></h4>
    <div role="list" class="iv-list">
      ${axisScale()}
      ${row("Energy", s.energy, { color: "#c2610c" }, "how strongly the words rouse")}
      ${row("Wisdom", s.wisdom, { color: "#2f64a3" }, "justice, virtue and the future")}
    </div>
    <p class="levels">Atlas levels (quintiles, for reference only): Energy ${s.levels[0] ?? "–"} of 5, Wisdom ${s.levels[1] ?? "–"} of 5.</p>

    <h4>Sub-indices</h4>
    <div role="list" class="iv-list">
      ${["mobilisation", "awakening", "struggle", "drive", "invocation", "build"].map((k) => row(SUB_LABELS[k], s.subs[k], { color: "#555" }, SUB_HELP[k])).join("")}
    </div>

    <h4>Themes <span class="h-note">sorted for this song; bars show the score, whiskers the 90% range</span></h4>
    <div role="list" class="iv-list themes">
      ${themes.map((t) => row(t.label, t.v, { bar: true, color: divergingColor(t.v[0]) })).join("")}
    </div>

    <details class="evidence-wrap"><summary>Evidence behind this score</summary>${evidence(s)}</details>
    ${sourceLink(s)}
  </div>`;
}

function songsTable(data, geo, activeId) {
  const rows = geo.songs.map((id) => data.songs[id]).filter(Boolean);
  if (rows.length < 2) return "";
  return `<h3 id="songs-h" class="card-sub">All songs for ${escapeHtml(geo.name)} (${rows.length})</h3>
  <div class="song-tabs" role="group" aria-labelledby="songs-h">${rows
    .map(
      (s) => `<button type="button" class="song-tab" data-song="${s.id}" aria-pressed="${s.id === activeId}">
        <span class="st-title">${escapeHtml(s.title)}</span>
        <span class="st-meta">${escapeHtml(songTypeLabel(s.type))}${s.energy && s.energy[0] != null ? ` · E ${fmt(s.energy[0])} · W ${fmt(s.wisdom[0])}` : " · not scored"}</span>
      </button>`
    )
    .join("")}</div>`;
}

/**
 * Renders the spectrum card for a geography into `el`.
 * opts.onSelectGeo(name) is called when a related entry is chosen.
 */
export function renderCard(el, data, geoName, { songId = null, onSelectGeo = null, onClose = null } = {}) {
  const geo = data.geoByName.get(geoName);
  if (!geo) return;
  const active = songId && geo.songs.includes(songId) ? songId : geo.main;
  const s = data.songs[active];
  const kids = data.childrenOf.get(geo.name) || [];
  const parentLink = geo.parent && geo.parent !== geo.name && data.geoByName.has(geo.parent) ? geo.parent : null;
  const where = [geo.subregion, geo.macro].filter(Boolean).join(" · ");
  el.innerHTML = `
    <div class="card-head">
      <div>
        <p class="eyebrow">${escapeHtml(where)}${geo.status && geo.status !== "UN member/observer" ? ` · ${escapeHtml(geo.status)}` : ""}</p>
        <h2 id="card-title" tabindex="-1">${escapeHtml(geo.name)}</h2>
      </div>
      ${onClose ? `<button type="button" class="icon-btn card-close" aria-label="Close spectrum card">×</button>` : ""}
    </div>
    ${geo.mapNote ? `<p class="notice">Map note: ${escapeHtml(geo.mapNote)}.</p>` : ""}
    ${songsTable(data, geo, active)}
    ${songDetail(data, s)}
    ${
      kids.length || parentLink
        ? `<h4>Related entries</h4><ul class="related">${parentLink ? `<li><button type="button" class="linklike" data-geo="${escapeHtml(parentLink)}">${escapeHtml(parentLink)}</button> (parent country)</li>` : ""}${kids
            .map((k) => `<li><button type="button" class="linklike" data-geo="${escapeHtml(k)}">${escapeHtml(k)}</button></li>`)
            .join("")}</ul>`
        : ""
    }
    <p class="card-foot">Themes, not rankings: these numbers describe what the words talk about, not the worth of a country or its people.</p>`;
  el.hidden = false;
  el.querySelectorAll(".song-tab").forEach((b) =>
    b.addEventListener("click", () => {
      renderCard(el, data, geoName, { songId: b.dataset.song, onSelectGeo, onClose });
      el.querySelector(`.song-tab[data-song="${b.dataset.song}"]`)?.focus();
    })
  );
  el.querySelectorAll("[data-geo]").forEach((b) => b.addEventListener("click", () => onSelectGeo && onSelectGeo(b.dataset.geo)));
  const close = el.querySelector(".card-close");
  if (close) close.addEventListener("click", onClose);
}

export function renderPlaceholder(el, html) {
  el.innerHTML = html;
}
