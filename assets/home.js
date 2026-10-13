import { loadAtlas, bivariateColor, markActiveNav } from "./common.js";

const d3 = window.d3;
markActiveNav();

const S = 360, P = 30;
const svg = d3.select("#hero-field").attr("viewBox", `0 0 ${S + P + 8} ${S + P + 8}`);
const g = svg.append("g").attr("transform", `translate(${P},8)`);
const ext = 3;
const x = d3.scaleLinear([-ext, ext], [0, S]);
const y = d3.scaleLinear([-ext, ext], [S, 0]);

const n = 36, c = S / n;
for (let i = 0; i < n; i++)
  for (let j = 0; j < n; j++) {
    const e = -ext + (2 * ext * (i + 0.5)) / n, w = ext - (2 * ext * (j + 0.5)) / n;
    g.append("rect").attr("x", i * c).attr("y", j * c).attr("width", c + 0.4).attr("height", c + 0.4).attr("fill", bivariateColor(e, w)).attr("opacity", 0.55);
  }
g.append("text").attr("x", S / 2).attr("y", S + 22).attr("text-anchor", "middle").attr("class", "legend-axis").style("font-size", "12px").text("Energy: calm → rousing");
g.append("text").attr("transform", `translate(-12,${S / 2}) rotate(-90)`).attr("text-anchor", "middle").attr("class", "legend-axis").style("font-size", "12px").text("Wisdom →");

loadAtlas().then((data) => {
  const pts = data.songList.filter((s) => s.energy && s.energy[0] != null);
  const dens = d3.contourDensity().x((s) => x(s.energy[0])).y((s) => y(s.wisdom[0])).size([S, S]).bandwidth(30).thresholds(7)(pts);
  const max = d3.max(dens, (d) => d.value);
  g.append("g").selectAll("path").data(dens).join("path").attr("d", d3.geoPath()).attr("fill", "none").attr("stroke", "#222").attr("stroke-opacity", (d) => 0.08 + 0.3 * (d.value / max));
  g.append("g").selectAll("circle").data(pts).join("circle")
    .attr("cx", (s) => x(Math.max(-ext, Math.min(ext, s.energy[0])))).attr("cy", (s) => y(Math.max(-ext, Math.min(ext, s.wisdom[0]))))
    .attr("r", 3.2).attr("fill", (s) => bivariateColor(s.energy[0], s.wisdom[0])).attr("stroke", "#fff").attr("stroke-width", 0.7);
}).catch(() => {});
