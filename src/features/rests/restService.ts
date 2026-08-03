import type { CharacterViewModel } from '../characters/character.types';
import type { RestOptions, RestPreview, RestType } from './rest.types';
export function previewRest(
  type: RestType,
  c: CharacterViewModel,
): RestPreview {
  const resources = c.resources
    .filter(
      (r) =>
        (r.recoveryOn?.includes(type) ?? r.recovery === type) &&
        r.current < r.maximum,
    )
    .map((r) => {
      const after =
        type === 'short' && r.id === 'wild-shape'
          ? Math.min(r.maximum, r.current + 1)
          : r.maximum;
      return `${r.name}: ${r.current} / ${r.maximum} → ${after} / ${r.maximum}`;
    });
  return {
    title: type === 'short' ? 'Short Rest preview' : 'Long Rest preview',
    items:
      type === 'long'
        ? [
            `HP: ${c.currentHp} → ${c.maximumHp}`,
            'Temporary HP cleared',
            'All spell slots restored',
            ...(c.conditions?.length
              ? [`Conditions cleared: ${c.conditions.join(', ')}`]
              : []),
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
    ...(type === 'long' ? { characterState: { type: 'normal' as const } } : {}),
    ...(type === 'long'
      ? {
          currentHp: c.maximumHp,
          temporaryHp: 0,
          landType: options?.landType ?? c.landType,
          spellSlots: c.spellSlots.map((s) => ({ ...s, current: s.maximum })),
          conditions: [],
        }
      : {}),
    resources: c.resources.map((r) =>
      (r.recoveryOn?.includes(type) ?? r.recovery === type)
        ? {
            ...r,
            current:
              type === 'short' && r.id === 'wild-shape'
                ? Math.min(r.maximum, r.current + 1)
                : r.maximum,
          }
        : r,
    ),
  };
}
