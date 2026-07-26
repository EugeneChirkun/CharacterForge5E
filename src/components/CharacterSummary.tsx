import { abilityNames, type AbilityName } from '../domain/abilities';
import { skillNames, skillToAbility, type SkillName } from '../domain/skills';
import type { CharacterViewModel } from '../features/characters/character.types';

const abilityLabels: Record<AbilityName, string> = {
  strength: 'Strength',
  dexterity: 'Dexterity',
  constitution: 'Constitution',
  intelligence: 'Intelligence',
  wisdom: 'Wisdom',
  charisma: 'Charisma',
};
const skillLabels: Record<SkillName, string> = {
  acrobatics: 'Acrobatics',
  animalHandling: 'Animal Handling',
  arcana: 'Arcana',
  athletics: 'Athletics',
  deception: 'Deception',
  history: 'History',
  insight: 'Insight',
  intimidation: 'Intimidation',
  investigation: 'Investigation',
  medicine: 'Medicine',
  nature: 'Nature',
  perception: 'Perception',
  performance: 'Performance',
  persuasion: 'Persuasion',
  religion: 'Religion',
  sleightOfHand: 'Sleight of Hand',
  stealth: 'Stealth',
  survival: 'Survival',
};
const signed = (value: number) => (value >= 0 ? `+${value}` : `${value}`);

function ProficiencyMark({ proficient }: { proficient: boolean }) {
  return (
    <span
      className="proficiency-mark"
      aria-label={proficient ? 'Proficient' : 'Not proficient'}
    >
      {proficient ? '●' : '○'}
    </span>
  );
}

export function SkillRow({
  skill,
  c,
}: {
  skill: SkillName;
  c: CharacterViewModel;
}) {
  const proficient = c.skillProficiencies.includes(skill);
  return (
    <li className="proficiency-row">
      <ProficiencyMark proficient={proficient} />
      <span>{skillLabels[skill]}</span>
      <strong>{signed(c.skills[skill])}</strong>
    </li>
  );
}

export function SavingThrowRow({
  ability,
  c,
}: {
  ability: AbilityName;
  c: CharacterViewModel;
}) {
  const score = c.abilities[ability];
  return (
    <div className="proficiency-row saving-throw">
      <ProficiencyMark proficient={score.proficientInSave} />
      <span>Saving Throw</span>
      <strong>{signed(score.savingThrow)}</strong>
    </div>
  );
}

export function AbilityPanel({
  ability,
  c,
}: {
  ability: AbilityName;
  c: CharacterViewModel;
}) {
  const score = c.abilities[ability];
  const skills = skillNames.filter(
    (skill) => skillToAbility[skill] === ability,
  );
  return (
    <article className="ability-panel" aria-labelledby={`ability-${ability}`}>
      <header>
        <h3 id={`ability-${ability}`}>{abilityLabels[ability]}</h3>
        <strong className="ability-score">{score.score}</strong>
        <span className="ability-modifier">
          Modifier {signed(score.modifier)}
        </span>
      </header>
      <SavingThrowRow ability={ability} c={c} />
      {skills.length > 0 && (
        <ul
          className="skill-list"
          aria-label={`${abilityLabels[ability]} skills`}
        >
          {skills.map((skill) => (
            <SkillRow key={skill} skill={skill} c={c} />
          ))}
        </ul>
      )}
    </article>
  );
}

export function CombatSummary({ c }: { c: CharacterViewModel }) {
  const stats = [
    ['Armor Class', c.armorClass],
    ['Initiative', signed(c.initiative)],
    ['Speed', `${c.speed} ft`],
    ['Proficiency Bonus', signed(c.proficiencyBonus)],
    ['Current HP', c.currentHp],
    ['Maximum HP', c.maximumHp],
    ['Temporary HP', c.temporaryHp],
    ['Hit Dice', c.hitDice],
    ['Passive Perception', c.passivePerception],
    ['Spell Save DC', c.spellSaveDc],
    ['Spell Attack', signed(c.spellAttackBonus)],
  ];
  return (
    <section
      className="sheet-panel combat-panel"
      aria-labelledby="combat-heading"
    >
      <h2 id="combat-heading">Combat</h2>
      <dl className="combat-grid">
        {stats.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function ListPanel({
  title,
  items,
}: {
  title: string;
  items: readonly string[];
}) {
  return (
    <section
      className="sheet-panel"
      aria-labelledby={`${title.toLowerCase()}-heading`}
    >
      <h2 id={`${title.toLowerCase()}-heading`}>{title}</h2>
      <ul className="plain-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export function CharacterSummary({ c }: { c: CharacterViewModel }) {
  const featureSources = [
    'class',
    'subclass',
    'species',
    'background',
    'feat',
  ] as const;
  return (
    <section className="character-summary" aria-labelledby="summary-heading">
      <h2 id="summary-heading" className="visually-hidden">
        Summary
      </h2>
      <div className="sheet-primary">
        <section
          className="abilities-section"
          aria-labelledby="abilities-heading"
        >
          <h2 id="abilities-heading">Abilities &amp; Skills</h2>
          <div className="ability-stack">
            {abilityNames.map((ability) => (
              <AbilityPanel key={ability} ability={ability} c={c} />
            ))}
          </div>
        </section>
        <CombatSummary c={c} />
      </div>
      <div className="sheet-secondary">
        <section
          className="sheet-panel"
          aria-labelledby="proficiencies-heading"
        >
          <h2 id="proficiencies-heading">Proficiencies</h2>
          {c.proficiencies.map((group) => (
            <div className="list-group" key={group.category}>
              <h3>{group.category}</h3>
              <ul className="plain-list">
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
        <ListPanel title="Languages" items={c.languages} />
        <ListPanel title="Senses" items={c.senses} />
        <section
          className="sheet-panel features-panel"
          aria-labelledby="summary-features-heading"
        >
          <h2 id="summary-features-heading">Features</h2>
          {featureSources.map((source) => {
            const features = c.features.filter(
              (feature) => feature.sourceType === source,
            );
            return features.length ? (
              <section className="feature-group" key={source}>
                <h3>{source[0].toUpperCase() + source.slice(1)}</h3>
                {features.map((feature) => (
                  <div key={feature.id}>
                    <strong>{feature.name}</strong>
                    <p>{feature.summary}</p>
                  </div>
                ))}
              </section>
            ) : null;
          })}
        </section>
      </div>
      <section
        className="sheet-panel resources-panel"
        aria-labelledby="resources-heading"
      >
        <h2 id="resources-heading">Resources</h2>
        <div className="resource-grid">
          {c.resources.map((resource) => (
            <article key={resource.id}>
              <h3>{resource.name}</h3>
              <strong>
                {resource.current} / {resource.maximum}
              </strong>
              <small>Recovers on a {resource.recovery} rest</small>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
