import { memo } from 'react';
import { metrics } from '../metrics.js';

// One DOM row. Identical for all solutions. Counts every time it renders.
export function ItemRow({ item }) {
  metrics.itemRenders++;
  return (
    <li className="row">
      <span>{item.title}</span>
      <span>{item.completed ? 'done' : 'todo'}</span>
    </li>
  );
}

// Used by the Context API "optimized" variant (props-based memoization).
export const MemoItemRow = memo(ItemRow);
