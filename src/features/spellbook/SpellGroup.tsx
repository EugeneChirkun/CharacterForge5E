import type { SpellLevelGroup as Group } from '../../domain/spells';
import { SpellCard } from './SpellCard';
export function SpellGroup({
  group,
  selected,
  onSelect,
  onToggle,
}: {
  readonly group: Group;
  readonly selected?: string;
  readonly onSelect: (id: string) => void;
  readonly onToggle: (id: string) => void;
}) {
  return (
    <section
      className="spell-level"
      aria-labelledby={`spell-level-${group.level}`}
    >
      <h2 id={`spell-level-${group.level}`}>{group.label}</h2>
      <div className="spell-card-list">
        {group.spells.map((spell) => (
          <SpellCard
            key={spell.id}
            spell={spell}
            selected={selected === spell.id}
            onSelect={() => onSelect(spell.id)}
            onToggle={() => onToggle(spell.id)}
          />
        ))}
      </div>
    </section>
  );
}
