export const sections = [
  'summary',
  'actions',
  'spells',
  'features',
  'inventory',
] as const;
export type Section = (typeof sections)[number];
export function Navigation({
  active,
  onChange,
}: {
  active: Section;
  onChange: (s: Section) => void;
}) {
  return (
    <nav className="section-nav" aria-label="Character sections">
      {sections.map((s, i) => (
        <button
          key={s}
          aria-current={active === s ? 'page' : undefined}
          onClick={() => onChange(s)}
        >
          <span aria-hidden="true">{['◇', '⚔', '✦', '❖', '▣'][i]}</span>
          {s[0].toUpperCase() + s.slice(1)}
        </button>
      ))}
    </nav>
  );
}
