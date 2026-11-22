// Global counters. Every render of ItemRow / a list component increments them.
// They are reset right before each measured action.
export const metrics = { itemRenders: 0, listRenders: 0 };

export function resetMetrics() {
  metrics.itemRenders = 0;
  metrics.listRenders = 0;
}
