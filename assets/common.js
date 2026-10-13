/* Shared data loading, colour scales and formatting. d3 is loaded globally from vendor/. */
const d3 = window.d3;

async function fetchJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Could not load ${url} (${r.status})`);
  return r.json();
}

/** Prefer a single atlas.json; fall back to sharded files that fit GitHub MCP uploads. */
let atlasPromise = null;
export function loadAtlas() {
  if (!atlasPromise) {
    atlasPromise = fetchJson("data/atlas.json")
      .catch(() =>
        Promise.all([
          fetchJson("data/atlas-core.json"),
          ...[0, 1, 2, 3, 4, 5, 6].map((i) =>
            Promise.all(
              ["", "b", "c", "d", "e", "f"].map((s) =>
                fetchJson(`data/atlas-songs-${i}${s}.json`).catch(() => ({}))
              )
            ).then((parts) => Object.assign({}, ...parts))
          ),
        ]).then(([core, ...parts]) => ({
          meta: core.meta,
          geos: core.geos,
          songs: Object.assign({}, ...parts),
        }))
      )
      .then((data) => {
        data.geoByName = new Map(data.geos.map((g) => [g.name, g]));
        data.songList = Object.values(data.songs);
        data.childrenOf = new Map();
        for (const g of data.geos) {
          if (g.parent && g.parent !== g.name && data.geoByName.has(g.parent)) {
            if (!data.childrenOf.has(g.parent)) data.childrenOf.set(g.parent, []);
            data.childrenOf.get(g.parent).push(g.name);
          }
        }
        return data;
      });
  }
  return atlasPromise;
}

export function loadWorldTopo() {
  const loadArcShard = (i) =>
    Promise.all(
      ["", "b", "c"].map((s) => fetchJson(`data/world-arcs-${i}${s}.json`).catch(() => []))
    ).then((parts) => parts.flatMap((p) => (Array.isArray(p) ? p : [])));
  return fetchJson("data/world.topo.json").catch(() =>
    Promise.all([
      fetchJson("data/world-head.json"),
      fetchJson("data/world-geoms-0.json").catch(() => []),
      fetchJson("data/world-geoms-1.json").catch(() => []),
      ...[0, 1, 2, 3, 4].map(loadArcShard),
    ]).then(([head, g0, g1, ...arcParts]) => {
      const existing = head.objects?.countries?.geometries || [];
      const extra = [...(Array.isArray(g0) ? g0 : []), ...(Array.isArray(g1) ? g1 : [])];
      const geometries = existing.length ? existing : extra;
      return {
        ...head,
        objects: {
          ...head.objects,
          countries: {
            ...(head.objects?.countries || {}),
            type: head.objects?.countries?.type || "GeometryCollection",
            geometries,
          },
        },
        arcs: arcParts.flat(),
      };
    })
  );
}

export const LAYERS = [
  { id: "combined", label: "Energy \u00d7 Wisdom (combined)", group: "Axes" },
  { id: "energy", label: "Energy", group: "Axes" },
  { id: "wisdom", label: "Wisdom", group: "Axes" },
  { id: "sub:mobilisation", label: "Mobilisation (sub-index of Energy)", group: "Axes" },
  { id: "sub:awakening", label: "Awakening (sub-index of Energy)", group: "Axes" },
];

export function themeLayers(meta) {
  return meta.themes.map((t) => ({ id: `theme:${t.key}`, label: t.label, group: "Themes" }));
}

/** Returns [value, lo, hi] for a song and layer id (not used for \"combined\"). */
export function layerTriple(song, layer) {
  if (!song || !song.energy || song.energy[0] == null) return null;
  if (layer === "energy") return song.energy;
  if (layer === "wisdom") return song.wisdom;
  if (layer.startsWith("sub:")) return song.subs[layer.slice(4)];
  if (layer.startsWith("theme:")) return song.themes[layer.slice(6)];
  return null;
}

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

/* Colour-blind-safe bivariate field (orange/blue plus lightness, no red-versus-green):
   calm & low Wisdom = light sand, rousing = orange, high Wisdom = blue, both high = deep purple,
   typical on both = a neutral grey-beige. Bilinear in CIELAB over a 3x3 anchor grid, so the
   field is continuous and its centre stays neutral instead of averaging to a muddy mauve. */
export const BIV = { ll: "#f1e6cc", hl: "#e0700f", lh: "#2878c2", hh: "#40195e" };
export const BIV_CENTRE = "#d6d0c8";
const BIV_RANGE = 1.7;
const mid = (a, b) => d3.interpolateLab(a, b)(0.5);
const ANCH = [
  [BIV.ll, mid(BIV.ll, BIV.hl), BIV.hl],
  [mid(BIV.ll, BIV.lh), BIV_CENTRE, mid(BIV.hl, BIV.hh)],
  [BIV.lh, mid(BIV.lh, BIV.hh), BIV.hh],
];
export function bivariateColor(e, w) {
  const x = clamp((e + BIV_RANGE) / BIV_RANGE, 0, 2);
  const y = clamp((w + BIV_RANGE) / BIV_RANGE, 0, 2);
  const i = Math.min(1, Math.floor(x)), j = Math.min(1, Math.floor(y));
  const fx = x - i, fy = y - j;
  const bottom = d3.interpolateLab(ANCH[j][i], ANCH[j][i + 1])(fx);
  const top = d3.interpolateLab(ANCH[j + 1][i], ANCH[j + 1][i + 1])(fx);
  return d3.interpolateLab(bottom, top)(fy);
}

/* Diverging purple (less than typical) to orange (more than typical); PuOr is colour-blind safe. */
const DIV_RANGE = 1.8;
export function divergingColor(v) {
  const t = clamp((v + DIV_RANGE) / (2 * DIV_RANGE), 0, 1);
  return d3.interpolatePuOr(t);
}
export const DIV_DOMAIN = DIV_RANGE;
export const BIV_DOMAIN = BIV_RANGE;

/** Pull a colour toward the scale's neutral \"typical\" colour as the 90% interval widens:
    an uncertain score is drawn closer to \"can't tell from typical\". */
export function fade(color, width, toward, minW = 0.8, maxW = 2.6) {
  if (width == null || !isFinite(width)) return color;
  const t = clamp((width - minW) / (maxW - minW), 0, 1);
  return d3.interpolateLab(color, toward)(t * 0.72);
}

export function songColor(song, layer, uncertainty) {
  if (!song || !song.energy || song.energy[0] == null) return null;
  let c, width, neutral;
  if (layer === "combined") {
    c = bivariateColor(song.energy[0], song.wisdom[0]);
    width = ((song.energy[2] - song.energy[1]) + (song.wisdom[2] - song.wisdom[1])) / 2;
    neutral = BIV_CENTRE;
  } else {
    const t = layerTriple(song, layer);
    if (!t || t[0] == null) return null;
    c = divergingColor(t[0]);
    width = t[2] - t[1];
    neutral = divergingColor(0);
  }
  return uncertainty === "fade" ? fade(c, width, neutral) : c;
}

export function intervalWidth(song, layer) {
  if (!song || !song.energy || song.energy[0] == null) return null;
  if (layer === "combined")
    return ((song.energy[2] - song.energy[1]) + (song.wisdom[2] - song.wisdom[1])) / 2;
  const t = layerTriple(song, layer);
  return t ? t[2] - t[1] : null;
}

const MINUS = "\u2212";
export function fmt(v, nd = 2) {
  if (v == null || !isFinite(v)) return "\u2013";
  const s = Math.abs(v).toFixed(nd);
  if (Number(s) === 0) return s;
  return (v < 0 ? MINUS : "+") + s;
}
export function fmtTriple(t) {
  if (!t || t[0] == null) return "not scored";
  return `${fmt(t[0])} [${fmt(t[1])}, ${fmt(t[2])}]`;
}

/** Plain-language description of a value and its 90% interval (mirrors the country-spectra rules). */
export function describe(t) {
  if (!t || t[0] == null) return "not scored";
  const [v, lo, hi] = t;
  if (lo > 0) return "more than typical";
  if (hi < 0) return "less than typical";
  if (v >= 0.5) return "leans higher";
  if (v <= -0.5) return "leans lower";
  return "in the typical range";
}

export function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

export function songTypeLabel(t) {
  return t === "national anthem" ? "anthem" : t;
}

/** Pick which song represents a geography on the map/scatter. */
export function representativeSong(data, geo, mode = "main") {
  if (!geo || !geo.main) return null;
  if (mode === "national-song") {
    const ns = geo.songs.map((id) => data.songs[id]).find((s) => s && (s.type === "national song" || s.type === "second anthem") && s.energy && s.energy[0] != null);
    if (ns) return ns;
  }
  return data.songs[geo.main];
}

export function markActiveNav() {
  const here = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".site-nav a").forEach((a) => {
    if (a.getAttribute("href") === here) a.setAttribute("aria-current", "page");
  });
}

/** Draws a small 2-D legend for the bivariate field into an SVG selection. */
export function drawBivariateLegend(svg, size = 96) {
  const n = 24;
  const cell = size / n;
  const g = svg.attr("viewBox", `0 0 ${size + 44} ${size + 36}`).append("g").attr("transform", "translate(30,4)");
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const e = -BIV_RANGE + (2 * BIV_RANGE * (i + 0.5)) / n;
      const w = BIV_RANGE - (2 * BIV_RANGE * (j + 0.5)) / n;
      g.append("rect").attr("x", i * cell).attr("y", j * cell).attr("width", cell + 0.3).attr("height", cell + 0.3).attr("fill", bivariateColor(e, w));
    }
  g.append("text").attr("x", size / 2).attr("y", size + 14).attr("text-anchor", "middle").attr("class", "legend-axis").text("Energy \u2192");
  g.append("text").attr("transform", `translate(-8,${size / 2}) rotate(-90)`).attr("text-anchor", "middle").attr("class", "legend-axis").text("Wisdom \u2192");
  g.append("text").attr("x", 0).attr("y", size + 28).attr("class", "legend-tick").text("calm");
  g.append("text").attr("x", size).attr("y", size + 28).attr("text-anchor", "end").attr("class", "legend-tick").text("rousing");
}

export function drawDivergingLegend(svg, width = 220) {
  const h = 12;
  svg.attr("viewBox", `0 0 ${width} 40`);
  const defs = svg.append("defs");
  const id = "divgrad" + Math.random().toString(36).slice(2, 7);
  const lg = defs.append("linearGradient").attr("id", id);
  d3.range(0, 1.01, 0.1).forEach((t) => lg.append("stop").attr("offset", `${t * 100}%`).attr("stop-color", divergingColor(-DIV_RANGE + 2 * DIV_RANGE * t)));
  svg.append("rect").attr("x", 10).attr("y", 4).attr("width", width - 20).attr("height", h).attr("fill", `url(#${id})`).attr("rx", 2);
  const x = d3.scaleLinear([-DIV_RANGE, DIV_RANGE], [10, width - 10]);
  [-1.5, -0.75, 0, 0.75, 1.5].forEach((v) => {
    svg.append("line").attr("x1", x(v)).attr("x2", x(v)).attr("y1", 4 + h).attr("y2", 4 + h + 4).attr("stroke", "#555");
    svg.append("text").attr("x", x(v)).attr("y", 4 + h + 15).attr("text-anchor", "middle").attr("class", "legend-tick").text(v === 0 ? "typical" : fmt(v, 1));
  });
}
