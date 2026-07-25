import type { CharacterViewModel } from '../characters/character.types';
import type { RestOptions, RestPreview, RestType } from './rest.types';
export function previewRest(
  type: RestType,
  c: CharacterViewModel,
): RestPreview {
  const resources = c.resources
    .filter((r) => r.recovery === type && r.current < r.maximum)
    .map((r) => `${r.name}: ${r.current} → ${r.maximum}`);
  return {
    title: type === 'short' ? 'Short Rest preview' : 'Long Rest preview',
    items:
      type === 'long'
        ? [
            `HP: ${c.currentHp} → ${c.maximumHp}`,
            'Temporary HP cleared',
            'All spell slots restored',
            ...resources,
          ]
        : resources,
  };
}
export function performRest(
  type: RestType,
  c: CharacterViewModel,
  options?: RestOptions,
): CharacterViewModel {
  return {
    ...c,
    ...(type === 'long'
      ? {
          currentHp: c.maximumHp,
          temporaryHp: 0,
          landType: options?.landType ?? c.landType,
          spellSlots: c.spellSlots.map((s) => ({ ...s, current: s.maximum })),
        }
      : {}),
    resources: c.resources.map((r) =>
      r.recovery === type ? { ...r, current: r.maximum } : r,
    ),
  };
}
