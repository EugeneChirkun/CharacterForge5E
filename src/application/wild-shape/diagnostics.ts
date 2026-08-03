import type { CharacterStateDiagnostic } from '../../domain/character-state';
export const CHARACTER_STATE_DIAGNOSTIC_MESSAGES: Readonly<
  Record<CharacterStateDiagnostic, string>
> = Object.freeze({
  'invalid-character-state': 'The saved character state is invalid.',
  'invalid-wild-shape': 'That Beast is not an eligible Wild Shape form.',
  'unknown-beast': 'The selected Beast is not in the verified registry.',
  'no-wild-shape-uses': 'No Wild Shape uses remain.',
  'invalid-transformation':
    'The character cannot transform from the current state.',
  'invalid-reversion': 'The character is not currently transformed.',
});
export function characterStateDiagnosticMessage(value: unknown): string {
  const code = value instanceof Error ? value.message : String(value);
  return (
    CHARACTER_STATE_DIAGNOSTIC_MESSAGES[code as CharacterStateDiagnostic] ??
    'The character state change failed.'
  );
}
