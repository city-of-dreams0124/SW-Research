import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { metrics, resetMetrics } from '../metrics.js';

const settle = (ms = 40) => new Promise((resolve) => setTimeout(resolve, ms));
const heapMB = () => (performance.memory ? performance.memory.usedJSHeapSize / 1048576 : null);

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Every combination of solution x list size x scenario x optimization.
// The order is randomized to avoid order effects (JIT warm-up, GC state).
function buildConfigs(cfg) {
  const configs = [];
  for (const impl of cfg.implementations)
    for (const size of cfg.sizes)
      for (const scenario of cfg.scenarios)
        for (const optimization of cfg.optimizations) configs.push({ impl, size, scenario, optimization });
  return shuffle(configs);
}

async function runConfig({ impl, size, scenario, optimization }, cfg, root, stage) {
  const optimized = optimization === 'optimized';
  const total = cfg.warmup + cfg.runs;
  const base = { solution: impl.label, listSize: size, scenario, optimization };
  const rows = [];

  // Runs `action` synchronously (flushSync) and measures:
  //  renderMs  = React render + commit (DOM mutation) time
  //  layoutMs  = forced style/layout time right after the commit
  // plus how many times ItemRow / the list component rendered.
  const measure = (action) => {
    resetMetrics();
    const t0 = performance.now();
    flushSync(action);
    const t1 = performance.now();
    stage.getBoundingClientRect(); // forces style + layout
    const t2 = performance.now();
    return {
      renderMs: t1 - t0,
      layoutMs: t2 - t1,
      itemRenders: metrics.itemRenders,
      listRenders: metrics.listRenders,
    };
  };

  if (scenario === 'mount') {
    for (let i = 0; i < total; i++) {
      const { element } = impl.create(size, optimized); // store creation is not measured
      await settle();
      const m = measure(() => root.render(element));
      rows.push({ ...base, run: i + 1, warmup: i < cfg.warmup ? 1 : 0, ...m, heapMB: heapMB() });
      flushSync(() => root.render(null));
      await settle();
    }
    return rows;
  }

  // 'update' and 'add': mount once, then reset the state before every measured run.
  const { element, api } = impl.create(size, optimized);
  flushSync(() => root.render(element));
  await settle();
  const middleId = Math.floor(size / 2);

  for (let i = 0; i < total; i++) {
    flushSync(() => api.reset()); // not measured
    stage.getBoundingClientRect();
    await settle(20);
    const m = measure(() => (scenario === 'update' ? api.update(middleId) : api.add()));
    rows.push({ ...base, run: i + 1, warmup: i < cfg.warmup ? 1 : 0, ...m, heapMB: heapMB() });
  }

  flushSync(() => root.render(null));
  await settle();
  return rows;
}

export async function runBenchmark(cfg, stage, onProgress, shouldStop) {
  const root = createRoot(stage);
  const configs = buildConfigs(cfg);
  const all = [];
  try {
    for (let i = 0; i < configs.length; i++) {
      if (shouldStop()) break;
      const c = configs[i];
      onProgress({
        done: i,
        total: configs.length,
        label: `${c.impl.label} | ${c.size} items | ${c.scenario} | ${c.optimization}`,
      });
      all.push(...(await runConfig(c, cfg, root, stage)));
    }
  } finally {
    root.unmount();
  }
  onProgress({ done: configs.length, total: configs.length, label: 'finished' });
  return all;
}
