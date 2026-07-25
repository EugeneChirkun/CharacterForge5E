import { useState } from 'react';
import type {
  AbilityName,
  CharacterViewModel,
} from '../features/characters/character.types';
const labels: Record<AbilityName, string> = {
  strength: 'Strength',
  dexterity: 'Dexterity',
  constitution: 'Constitution',
  intelligence: 'Intelligence',
  wisdom: 'Wisdom',
  charisma: 'Charisma',
};
const signed = (n: number) => (n >= 0 ? `+${n}` : `${n}`);
export function Summary({ c }: { c: CharacterViewModel }) {
  const stats = [
    ['Armor Class', c.armorClass],
    ['Initiative', signed(c.initiative)],
    ['Speed', `${c.speed} ft`],
    ['Proficiency', signed(c.proficiencyBonus)],
    ['Current HP', c.currentHp],
    ['Maximum HP', c.maximumHp],
    ['Temporary HP', c.temporaryHp],
    ['Hit Dice', c.hitDice],
    ['Passive Perception', c.passivePerception],
    ['Spell Save DC', c.spellSaveDc],
    ['Spell Attack', signed(c.spellAttackBonus)],
  ];
  return (
    <section>
      <h2>Summary</h2>
      <div className="stat-grid">
        {stats.map(([l, v]) => (
          <article className="stat" key={l}>
            <span>{l}</span>
            <strong>{v}</strong>
          </article>
        ))}
      </div>
      <h2>Abilities</h2>
      <div className="ability-grid">
        {Object.entries(c.abilities).map(([name, a]) => (
          <article className="ability" key={name}>
            <h3>{labels[name as AbilityName]}</h3>
            <strong>{a.score}</strong>
            <p>Modifier {signed(a.modifier)}</p>
            <p>
              Save {signed(a.savingThrow)}
              {a.proficientInSave ? ' •' : ''}
            </p>
          </article>
        ))}
      </div>
      <div className="info-grid">
        {[
          ['Skills', 'Animal Handling, Nature, Perception'],
          ['Senses', 'Darkvision, passive awareness'],
          ['Proficiencies', 'Light armor, herbalism kit'],
          ['Languages', 'Common, Infernal, Druidic'],
        ].map(([h, p]) => (
          <article className="panel" key={h}>
            <h3>{h}</h3>
            <p>{p}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
const groups = [
  ['Actions', ['Wild Shape', 'Spellcasting']],
  ['Bonus Actions', ['Nature’s Step']],
  ['Reactions', ['Opportunity Attack']],
  ['Other Actions', ['Study', 'Search']],
];
export function Actions() {
  return (
    <section>
      <h2>Actions</h2>
      <div className="info-grid">
        {groups.map(([g, items]) => (
          <article className="panel" key={g as string}>
            <h3>{g}</h3>
            {(items as string[]).map((i) => (
              <div className="feature" key={i}>
                <strong>{i}</strong>
                <small>Mock action summary for quick reference.</small>
              </div>
            ))}
          </article>
        ))}
      </div>
    </section>
  );
}
export function Spells({
  c,
  onSlots,
}: {
  c: CharacterViewModel;
  onSlots: (c: CharacterViewModel) => void;
}) {
  const [search, setSearch] = useState('');
  return (
    <section>
      <h2>Spells</h2>
      <article className="panel">
        <h3>Spell slots</h3>
        <div className="slots">
          {c.spellSlots.map((s) => (
            <div key={s.level}>
              <strong>Level {s.level}</strong>
              <div>
                {Array.from({ length: s.maximum }, (_, i) => (
                  <button
                    aria-label={`Level ${s.level} slot ${i + 1}`}
                    className={i < s.current ? 'slot full' : 'slot'}
                    key={i}
                    onClick={() =>
                      onSlots({
                        ...c,
                        spellSlots: c.spellSlots.map((x) =>
                          x.level === s.level
                            ? {
                                ...x,
                                current:
                                  i < s.current
                                    ? Math.max(0, x.current - 1)
                                    : Math.min(x.maximum, x.current + 1),
                              }
                            : x,
                        ),
                      })
                    }
                  />
                ))}
              </div>
              <small>
                {s.current} / {s.maximum} available
              </small>
            </div>
          ))}
        </div>
      </article>
      <div className="filters">
        <input
          aria-label="Search spells"
          placeholder="Search spells"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select aria-label="Spell level">
          <option>All levels</option>
          <option>Cantrip</option>
          <option>Level 1</option>
        </select>
        <label>
          <input type="checkbox" /> Concentration
        </label>
      </div>
      {[
        ['Cantrips', 'Verdant Spark'],
        ['Prepared spells', 'Mending Breeze'],
        ['Always-prepared Circle spells', 'Woodland Veil'],
      ].map(([h, n]) => (
        <article className="panel spell" key={h}>
          <div>
            <h3>{h}</h3>
            <strong>{n}</strong>
            <p>Minimal fictional spell placeholder.</p>
          </div>
          <label>
            <input type="checkbox" defaultChecked /> Prepared
          </label>
        </article>
      ))}
    </section>
  );
}
export function Features() {
  return (
    <section>
      <h2>Features</h2>
      <div className="info-grid">
        {[
          'Tiefling traits',
          'Chthonic Legacy',
          'Druid features',
          'Circle of the Land features',
          'Background features',
          'Feats',
        ].map((x) => (
          <article className="panel" key={x}>
            <h3>{x}</h3>
            <div className="feature">
              <strong>{x} reference</strong>
              <small>
                Short UI placeholder; rules content will be added separately.
              </small>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
export function Inventory() {
  return (
    <section>
      <h2>Inventory</h2>
      <div className="info-grid">
        {[
          ['Equipped armor', 'Travel-worn hide'],
          ['Equipped weapon', 'Wooden staff'],
          ['Druidic focus', 'Carved branch'],
          ['Backpack items', 'Bedroll, twine, field journal'],
          ['Currency', '42 gp · 8 sp'],
          ['Carrying capacity', '68 / 150 lb (fixture)'],
        ].map(([h, p]) => (
          <article className="panel" key={h}>
            <h3>{h}</h3>
            <p>{p}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
