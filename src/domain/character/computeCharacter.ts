import {
  abilityNames,
  getAbilityModifier,
  type AbilityName,
} from '../abilities';
import { calculateArmorClass } from '../armor-class';
import { calculateMaximumHp } from '../hit-points';
import { getProficiencyBonus } from '../proficiency';
import {
  calculateSkillModifier,
  skillNames,
  skillToAbility,
  type SkillName,
} from '../skills';
import {
  calculateSpellAttackBonus,
  calculateSpellSaveDc,
  calculateSpellSlots,
} from '../spellcasting';
import {
  calculateInitiative,
  calculatePassivePerception,
  calculateSavingThrow,
} from './statistics';
import type {
  CharacterBuild,
  CharacterSession,
  ComputedCharacter,
} from './models';
import { validateCharacterSession } from './session';

export function computeCharacter(
  build: CharacterBuild,
  session: CharacterSession,
): ComputedCharacter {
  const abilityModifiers = Object.fromEntries(
    abilityNames.map((ability) => [
      ability,
      getAbilityModifier(build.abilityScores[ability]),
    ]),
  ) as Record<AbilityName, ReturnType<typeof getAbilityModifier>>;
  const proficiencyBonus = getProficiencyBonus(build.totalLevel);
  const savingThrows = Object.fromEntries(
    abilityNames.map((ability) => [
      ability,
      calculateSavingThrow({
        abilityModifier: abilityModifiers[ability].value,
        proficiencyBonus: proficiencyBonus.value,
        proficient: build.savingThrowProficiencies.includes(ability),
      }),
    ]),
  ) as ComputedCharacter['savingThrows'];
  const skills = Object.fromEntries(
    skillNames.map((skill) => [
      skill,
      calculateSkillModifier({
        skill,
        abilityModifier: abilityModifiers[skillToAbility[skill]].value,
        proficiencyBonus: proficiencyBonus.value,
        proficient: build.skillProficiencies.includes(skill),
        expertise: build.expertiseSkills.includes(skill),
      }),
    ]),
  ) as Record<SkillName, ReturnType<typeof calculateSkillModifier>>;
  const initiative = calculateInitiative({
    dexterityModifier: abilityModifiers.dexterity.value,
  });
  const passivePerception = calculatePassivePerception(skills.perception);
  const armorClass = calculateArmorClass({
    sources: build.armorClassSources,
    abilityModifiers: Object.fromEntries(
      abilityNames.map((name) => [name, abilityModifiers[name].value]),
    ) as Record<AbilityName, number>,
  });
  const maximumHp = calculateMaximumHp({
    level: build.totalLevel,
    constitutionModifier: abilityModifiers.constitution.value,
    progression: build.hitPointProgression,
  });
  validateCharacterSession(session, maximumHp.value);
  const spellcasting = build.spellcasting
    ? (() => {
        const abilityModifier = abilityModifiers[build.spellcasting.ability];
        return {
          ability: build.spellcasting.ability,
          abilityModifier,
          spellSaveDc: calculateSpellSaveDc({
            proficiencyBonus: proficiencyBonus.value,
            abilityModifier: abilityModifier.value,
          }),
          spellAttackBonus: calculateSpellAttackBonus({
            proficiencyBonus: proficiencyBonus.value,
            abilityModifier: abilityModifier.value,
          }),
          slots: calculateSpellSlots({
            level: build.totalLevel,
            progression: build.spellcasting.slotProgression,
            spent: session.spentSpellSlots,
          }),
        };
      })()
    : undefined;
  return {
    abilityModifiers,
    proficiencyBonus,
    savingThrows,
    skills,
    initiative,
    passivePerception,
    armorClass,
    maximumHp,
    currentHp: session.currentHp,
    temporaryHp: session.temporaryHp,
    spellcasting,
  };
}
