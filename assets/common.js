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
