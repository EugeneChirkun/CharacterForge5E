import { useState } from 'react';
import {
  resolvePackageContents,
  summarizeEquipmentPackage,
  type EquipmentPackageDefinition,
} from '../domain/equipment';

export function EquipmentPackageViewer({
  definition,
}: {
  readonly definition: EquipmentPackageDefinition;
}) {
  const [expanded, setExpanded] = useState(false);
  const summary = summarizeEquipmentPackage(definition);
  return (
    <section className="equipment-package">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? 'Collapse contents' : 'Expand contents'}
      </button>
      <small>
        {summary.itemCount} items · {summary.totalWeight} lb ·{' '}
        {summary.totalCostCopper / 100} GP
      </small>
      {expanded && (
        <ul>
          {resolvePackageContents(definition).map(
            ({ definition: item, quantity }) => (
              <li key={item.id}>
                {item.name}
                {quantity > 1 ? ` ×${quantity}` : ''}
              </li>
            ),
          )}
        </ul>
      )}
    </section>
  );
}
