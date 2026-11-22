import { memo } from 'react';
import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { ItemRow } from '../components/ItemRow.jsx';
import { makeItem, makeItems, normalize } from '../data.js';
import { metrics } from '../metrics.js';

// BASELINE: the list subscribes to ids and byId, rows are not memoized.
function BaselineList({ store }) {
  metrics.listRenders++;
  const ids = useStore(store, (s) => s.ids);
  const byId = useStore(store, (s) => s.byId);
  return (
    <ul>
      {ids.map((id) => (
        <ItemRow key={id} item={byId[id]} />
      ))}
    </ul>
  );
}

// OPTIMIZED: every row selects only its own entity (+ React.memo).
const OptimizedRow = memo(function OptimizedRow({ store, id }) {
  const item = useStore(store, (s) => s.byId[id]);
  return <ItemRow item={item} />;
});

function OptimizedList({ store }) {
  metrics.listRenders++;
  const ids = useStore(store, (s) => s.ids);
  return (
    <ul>
      {ids.map((id) => (
        <OptimizedRow key={id} store={store} id={id} />
      ))}
    </ul>
  );
}

export const zustandImpl = {
  id: 'zustand',
  label: 'Zustand',
  create(n, optimized) {
    const store = createStore(() => normalize(makeItems(n)));

    return {
      element: optimized ? <OptimizedList store={store} /> : <BaselineList store={store} />,
      api: {
        reset: () => store.setState(normalize(makeItems(n)), true),
        update: (id) =>
          store.setState((s) => ({
            byId: { ...s.byId, [id]: { ...s.byId[id], completed: !s.byId[id].completed } },
          })),
        add: () =>
          store.setState((s) => {
            const item = makeItem(n);
            return { ids: [...s.ids, item.id], byId: { ...s.byId, [item.id]: item } };
          }),
      },
    };
  },
};
