import { useRef, useState } from 'react';
import { runBenchmark } from './benchmark/runner.js';
import { downloadCsv, summarize } from './benchmark/stats.js';
import { IMPLEMENTATIONS } from './implementations/index.js';

const PRESETS = {
  quick: {
    label: 'Quick test (1k items, 5 runs)',
    sizes: [1000],
    warmup: 2,
    runs: 5,
  },
  full: {
    label: 'Full run (1k / 10k / 50k items, 30 runs)',
    sizes: [1000, 10000, 50000],
    warmup: 5,
    runs: 30,
  },
};

export default function App() {
  const stageRef = useRef(null);
  const stopRef = useRef(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(null);
  const [rows, setRows] = useState([]);

  async function start(key) {
    const preset = PRESETS[key];
    stopRef.current = false;
    setRows([]);
    setRunning(true);
    try {
      const result = await runBenchmark(
        {
          implementations: IMPLEMENTATIONS,
          sizes: preset.sizes,
          scenarios: ['mount', 'update', 'add'],
          optimizations: ['baseline', 'optimized'],
          warmup: preset.warmup,
          runs: preset.runs,
        },
        stageRef.current,
        setProgress,
        () => stopRef.current
      );
      setRows(result);
    } finally {
      setRunning(false);
    }
  }

  const summary = summarize(rows).sort((a, b) =>
    a.scenario.localeCompare(b.scenario) ||
    a.listSize - b.listSize ||
    a.optimization.localeCompare(b.optimization) ||
    a.solution.localeCompare(b.solution)
  );

  return (
    <main>
      <h1>React state management benchmark</h1>
      <p className="lead">
        Redux Toolkit, Context API and Zustand rendering the same list. Use a production build
        (<code>npm run build</code> then <code>npm run preview</code>) and keep this tab in the foreground while it runs.
      </p>

      <div className="controls">
        {Object.entries(PRESETS).map(([key, p]) => (
          <button key={key} disabled={running} onClick={() => start(key)}>
            {p.label}
          </button>
        ))}
        <button disabled={!running} onClick={() => (stopRef.current = true)}>
          Stop after current configuration
        </button>
        <button disabled={running || rows.length === 0} onClick={() => downloadCsv(rows)}>
          Download CSV ({rows.length} rows)
        </button>
      </div>

      {progress && (
        <p className="progress">
          {progress.done} / {progress.total}: {progress.label}
        </p>
      )}

      {summary.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Scenario</th>
              <th>Items</th>
              <th>Variant</th>
              <th>Solution</th>
              <th>n</th>
              <th>Mean render ms</th>
              <th>SD</th>
              <th>Mean row renders</th>
            </tr>
          </thead>
          <tbody>
            {summary.map((s) => (
              <tr key={s.key}>
                <td>{s.scenario}</td>
                <td>{s.listSize}</td>
                <td>{s.optimization}</td>
                <td>{s.solution}</td>
                <td>{s.n}</td>
                <td>{s.meanMs.toFixed(2)}</td>
                <td>{s.sdMs.toFixed(2)}</td>
                <td>{Math.round(s.meanItemRenders)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Render stage</h2>
      <div ref={stageRef} className="stage" />
    </main>
  );
}
