import type { SpellDefinition } from '../rules';

export interface PrivateSpellContentEntry {
  readonly description: string;
  readonly higherLevels?: string;
}
export interface PrivateSpellContentPack {
  readonly format: 'characterforge5e-spell-content';
  readonly version: 1;
  readonly source: { readonly id: string; readonly label: string };
  readonly spells: Readonly<Record<string, PrivateSpellContentEntry>>;
}
export interface ResolvedSpellContent {
  readonly definition: SpellDefinition;
  readonly proseSource: 'srd' | 'private-phb' | 'generated-summary';
}

export function parsePrivateSpellContentPack(value: unknown): PrivateSpellContentPack {
  if (!value || typeof value !== 'object') throw new Error('Content pack must be an object.');
  const candidate = value as Partial<PrivateSpellContentPack>;
  if (candidate.format !== 'characterforge5e-spell-content' || candidate.version !== 1)
    throw new Error('Unsupported spell content pack format or version.');
  if (!candidate.source?.id?.trim() || !candidate.source.label?.trim() || !candidate.spells)
    throw new Error('Content pack source and spells are required.');
  for (const [id, entry] of Object.entries(candidate.spells)) {
    if (!id.trim() || !entry || typeof entry.description !== 'string' || !entry.description.trim())
      throw new Error(`Invalid private spell content entry: ${id || '(empty id)'}.`);
  }
  return candidate as PrivateSpellContentPack;
}

/** Mechanics always come from the verified public registry; private packs may only replace prose. */
export function resolveSpellContent(input: {
  readonly spellId: string;
  readonly publicContentRegistry: Readonly<Record<string, SpellDefinition>>;
  readonly privateContentRegistry?: PrivateSpellContentPack;
}): ResolvedSpellContent {
  const definition = input.publicContentRegistry[input.spellId];
  if (!definition) throw new Error(`Unknown spell id: ${input.spellId}`);
  const privateEntry = input.privateContentRegistry?.spells[input.spellId];
  if (privateEntry) {
    return {
      definition: { ...definition, description: privateEntry.description, higherLevels: privateEntry.higherLevels ?? definition.higherLevels,
        content: { completeness: 'full', source: input.privateContentRegistry!.source.label } },
      proseSource: 'private-phb',
    };
  }
  return { definition, proseSource: definition.source.sourceType === 'srd' ? 'srd' : 'generated-summary' };
}
