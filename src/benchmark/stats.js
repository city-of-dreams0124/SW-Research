const COLUMNS = [
  'solution',
  'listSize',
  'scenario',
  'optimization',
  'run',
  'warmup',
  'renderMs',
  'layoutMs',
  'itemRenders',
  'listRenders',
  'heapMB',
];

const fmt = (v) => (v === null || v === undefined ? '' : typeof v === 'number' && !Number.isInteger(v) ? v.toFixed(4) : String(v));

export function toCsv(rows) {
  const lines = [COLUMNS.join(',')];
  for (const r of rows) lines.push(COLUMNS.map((c) => fmt(r[c])).join(','));
  return lines.join('\n');
}

const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const sd = (a) => {
  if (a.length < 2) return 0;
  const m = mean(a);
  return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1));
};

// Quick sanity-check summary (warm-up runs excluded). The real analysis is done in SPSS.
export function summarize(rows) {
  const groups = new Map();
  for (const r of rows) {
    if (r.warmup) continue;
    const key = [r.solution, r.listSize, r.scenario, r.optimization].join('|');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  }
  return [...groups.entries()].map(([key, rs]) => {
    const [solution, listSize, scenario, optimization] = key.split('|');
    const t = rs.map((r) => r.renderMs);
    return {
      key,
      solution,
      listSize: Number(listSize),
      scenario,
      optimization,
      n: rs.length,
      meanMs: mean(t),
      sdMs: sd(t),
      meanItemRenders: mean(rs.map((r) => r.itemRenders)),
    };
  });
}

export function downloadCsv(rows) {
  const blob = new Blob([toCsv(rows)], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `benchmark-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
