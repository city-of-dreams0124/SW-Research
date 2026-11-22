// Identical data and identical normalized shape ({ ids, byId }) for all three solutions,
// so that the only thing that differs between them is the state management library.

export function makeItem(id) {
  return { id, title: `Item ${id}`, completed: false };
}

export function makeItems(n) {
  return Array.from({ length: n }, (_, i) => makeItem(i));
}

export function normalize(items) {
  const ids = new Array(items.length);
  const byId = {};
  for (let i = 0; i < items.length; i++) {
    ids[i] = items[i].id;
    byId[items[i].id] = items[i];
  }
  return { ids, byId };
}
