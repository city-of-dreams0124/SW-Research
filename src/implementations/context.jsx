import { createContext, useContext, useLayoutEffect, useState } from 'react';
import { ItemRow, MemoItemRow } from '../components/ItemRow.jsx';
import { makeItem, makeItems, normalize } from '../data.js';
import { metrics } from '../metrics.js';

const ItemsContext = createContext(null);

// State lives inside React (useState). The controller lets the benchmark
// harness (which is outside React) trigger updates.
function ItemsProvider({ initial, controller, children }) {
  const [state, setState] = useState(initial);
  useLayoutEffect(() => {
    controller.setState = setState;
  }, [controller]);
  return <ItemsContext.Provider value={state}>{children}</ItemsContext.Provider>;
}

// BASELINE: the list reads the context, rows are not memoized.
function BaselineList() {
  metrics.listRenders++;
  const { ids, byId } = useContext(ItemsContext);
  return (
    <ul>
      {ids.map((id) => (
        <ItemRow key={id} item={byId[id]} />
      ))}
    </ul>
  );
}

// OPTIMIZED: Context cannot select a slice, so the only available optimization
// is React.memo on the rows (props comparison).
function OptimizedList() {
  metrics.listRenders++;
  const { ids, byId } = useContext(ItemsContext);
  return (
    <ul>
      {ids.map((id) => (
        <MemoItemRow key={id} item={byId[id]} />
      ))}
    </ul>
  );
}

export const contextImpl = {
  id: 'context',
  label: 'Context API',
  create(n, optimized) {
    const controller = { setState: null };
    const initial = normalize(makeItems(n));

    return {
      element: (
        <ItemsProvider initial={initial} controller={controller}>
          {optimized ? <OptimizedList /> : <BaselineList />}
        </ItemsProvider>
      ),
      api: {
        reset: () => controller.setState(normalize(makeItems(n))),
        update: (id) =>
          controller.setState((s) => ({
            ids: s.ids,
            byId: { ...s.byId, [id]: { ...s.byId[id], completed: !s.byId[id].completed } },
          })),
        add: () =>
          controller.setState((s) => {
            const item = makeItem(n);
            return { ids: [...s.ids, item.id], byId: { ...s.byId, [item.id]: item } };
          }),
      },
    };
  },
};
