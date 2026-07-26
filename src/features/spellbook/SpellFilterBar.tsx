import type { SpellbookFilters, SpellbookSort } from '../../domain/spells';
import type { SpellSchool } from '../../domain/rules';
const schools: readonly SpellSchool[] = [
  'abjuration',
  'conjuration',
  'divination',
  'enchantment',
  'evocation',
  'illusion',
  'necromancy',
  'transmutation',
];
export function SpellFilterBar({
  filters,
  sort,
  onFilters,
  onSort,
}: {
  readonly filters: SpellbookFilters;
  readonly sort: SpellbookSort;
  readonly onFilters: (filters: SpellbookFilters) => void;
  readonly onSort: (sort: SpellbookSort) => void;
}) {
  const check = (key: 'cantrips' | 'ritual' | 'concentration') => (
    <label>
      <input
        type="checkbox"
        checked={filters[key]}
        onChange={(e) => onFilters({ ...filters, [key]: e.target.checked })}
      />
      {key[0].toUpperCase() + key.slice(1)}
    </label>
  );
  return (
    <div className="spell-filters" aria-label="Spell filters">
      <select
        aria-label="Preparation status"
        value={filters.preparation}
        onChange={(e) =>
          onFilters({
            ...filters,
            preparation: e.target.value as SpellbookFilters['preparation'],
          })
        }
      >
        <option value="all">Any preparation</option>
        <option value="prepared">Prepared</option>
        <option value="not-prepared">Not Prepared</option>
      </select>
      {check('cantrips')}
      {check('ritual')}
      {check('concentration')}
      <select
        aria-label="Spell source"
        value={filters.sources[0] ?? ''}
        onChange={(e) =>
          onFilters({
            ...filters,
            sources: e.target.value
              ? [e.target.value as 'class' | 'subclass' | 'species']
              : [],
          })
        }
      >
        <option value="">All sources</option>
        <option value="class">Class</option>
        <option value="subclass">Subclass</option>
        <option value="species">Species</option>
      </select>
      <select
        aria-label="Spell school"
        value={filters.school ?? ''}
        onChange={(e) =>
          onFilters({
            ...filters,
            school: (e.target.value || undefined) as SpellSchool | undefined,
          })
        }
      >
        <option value="">All schools</option>
        {schools.map((school) => (
          <option key={school}>{school}</option>
        ))}
      </select>
      <select
        aria-label="Spell level"
        value={filters.level ?? ''}
        onChange={(e) =>
          onFilters({
            ...filters,
            level: e.target.value === '' ? undefined : Number(e.target.value),
          })
        }
      >
        <option value="">All levels</option>
        <option value="0">Cantrips</option>
        {[1, 2, 3, 4].map((level) => (
          <option value={level} key={level}>
            Level {level}
          </option>
        ))}
      </select>
      <select
        aria-label="Availability"
        value={filters.availability}
        onChange={(e) =>
          onFilters({
            ...filters,
            availability: e.target.value as SpellbookFilters['availability'],
          })
        }
      >
        <option value="all">Available & unavailable</option>
        <option value="available">Available</option>
        <option value="unavailable">Unavailable</option>
      </select>
      <select
        aria-label="Sort spells"
        value={sort}
        onChange={(e) => onSort(e.target.value as SpellbookSort)}
      >
        <option value="level">Level</option>
        <option value="alphabetical">Alphabetical</option>
        <option value="prepared">Prepared First</option>
        <option value="source">Source</option>
      </select>
    </div>
  );
}
