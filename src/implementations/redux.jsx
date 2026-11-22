import { memo } from 'react';
import { Provider, useSelector } from 'react-redux';
import { configureStore, createEntityAdapter, createSlice } from '@reduxjs/toolkit';
import { ItemRow } from '../components/ItemRow.jsx';
import { makeItem, makeItems } from '../data.js';
import { metrics } from '../metrics.js';

// Idiomatic Redux Toolkit: normalized state via createEntityAdapter.
const adapter = createEntityAdapter();

const slice = createSlice({
  name: 'items',
  initialState: adapter.getInitialState(),
  reducers: {
    reset: adapter.setAll,
    add: adapter.addOne,
    toggle(state, action) {
      const entity = state.entities[action.payload];
      if (entity) entity.completed = !entity.completed;
    },
  },
});

const { reset, add, toggle } = slice.actions;
const selectors = adapter.getSelectors((state) => state.items);

// BASELINE: the list subscribes to the whole slice, rows are not memoized.
function BaselineList() {
  metrics.listRenders++;
  const ids = useSelector(selectors.selectIds);
  const entities = useSelector(selectors.selectEntities);
  return (
    <ul>
      {ids.map((id) => (
        <ItemRow key={id} item={entities[id]} />
      ))}
    </ul>
  );
}

// OPTIMIZED: every row subscribes to its own entity by id (+ React.memo).
const OptimizedRow = memo(function OptimizedRow({ id }) {
  const item = useSelector((state) => selectors.selectById(state, id));
  return <ItemRow item={item} />;
});

function OptimizedList() {
  metrics.listRenders++;
  const ids = useSelector(selectors.selectIds);
  return (
    <ul>
      {ids.map((id) => (
        <OptimizedRow key={id} id={id} />
      ))}
    </ul>
  );
}

export const reduxImpl = {
  id: 'redux',
  label: 'Redux Toolkit',
  create(n, optimized) {
    const store = configureStore({
      reducer: { items: slice.reducer },
      preloadedState: { items: adapter.setAll(adapter.getInitialState(), makeItems(n)) },
      // Dev-only checks are disabled so that dev and production runs are comparable.
      middleware: (getDefault) => getDefault({ immutableCheck: false, serializableCheck: false }),
    });

    return {
      element: <Provider store={store}>{optimized ? <OptimizedList /> : <BaselineList />}</Provider>,
      api: {
        reset: () => store.dispatch(reset(makeItems(n))),
        update: (id) => store.dispatch(toggle(id)),
        add: () => store.dispatch(add(makeItem(n))),
      },
    };
  },
};
