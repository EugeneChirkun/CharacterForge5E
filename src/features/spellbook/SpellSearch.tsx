export function SpellSearch({
  value,
  onChange,
}: {
  readonly value: string;
  readonly onChange: (value: string) => void;
}) {
  return (
    <label className="spell-search">
      <span>Search by spell name</span>
      <input
        type="search"
        placeholder="Search spells"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
