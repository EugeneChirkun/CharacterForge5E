import type { ComputedCharacter } from '../character';
import {
  emptyWallet,
  equipmentDefinitions,
  equipmentRegistry,
  type CharacterInventory,
  type CurrencyDenomination,
  type CurrencyWallet,
  type EquipmentDefinition,
  type InventoryItem,
  materializeEquipmentPackage,
} from './index';

export type StartingEquipmentChoiceType = 'package' | 'gold' | 'legacy-unknown';
export interface StartingEquipmentSourceChoice {
  readonly sourceId: StartingEquipmentSourceId;
  readonly choiceType: StartingEquipmentChoiceType;
}
export type StartingEquipmentSourceId =
  'druid.class.starting-equipment' | 'farmer.background.starting-equipment';
export type InitialEquipPolicy = 'equipped' | 'carried' | 'stored';
export interface RuleSource {
  readonly ruleset: '5e-2024';
  readonly reference: string;
  readonly verified: boolean;
}
export interface StartingEquipmentPackageDefinition {
  readonly id: string;
  readonly sourceId: StartingEquipmentSourceId;
  readonly label: string;
  readonly grants: readonly StartingEquipmentGrant[];
  readonly ruleSource: RuleSource;
}
export type StartingEquipmentGrant =
  | {
      readonly type: 'item';
      readonly equipmentDefinitionId: string;
      readonly quantity: number;
      readonly carried: boolean;
      readonly equipPolicy: InitialEquipPolicy;
    }
  | { readonly type: 'currency'; readonly wallet: CurrencyWallet };
export interface StartingGoldAlternativeDefinition {
  readonly id: string;
  readonly sourceId: StartingEquipmentSourceId;
  readonly wallet: CurrencyWallet;
  readonly ruleSource: RuleSource;
}
const wallet = (gp: number): CurrencyWallet => ({
  cp: 0,
  sp: 0,
  ep: 0,
  gp,
  pp: 0,
});
const source: RuleSource = {
  ruleset: '5e-2024',
  reference: 'PHB 2024 private / Starting Equipment',
  verified: true,
};
const item = (
  equipmentDefinitionId: string,
  equipPolicy: InitialEquipPolicy = 'carried',
  quantity = 1,
): StartingEquipmentGrant => ({
  type: 'item',
  equipmentDefinitionId,
  quantity,
  carried: equipPolicy !== 'stored',
  equipPolicy,
});

export const startingEquipmentPackages = Object.freeze([
  {
    id: 'druid.class.starting-package',
    sourceId: 'druid.class.starting-equipment',
    label: 'Druid equipment package',
    ruleSource: source,
    grants: [
      item('leather-armor', 'equipped'),
      item('shield', 'equipped'),
      item('sickle'),
      item('quarterstaff'),
      item('explorers-pack'),
      item('herbalism-kit'),
      { type: 'currency', wallet: wallet(9) },
    ],
  },
  {
    id: 'farmer.background.starting-package',
    sourceId: 'farmer.background.starting-equipment',
    label: 'Farmer equipment package',
    ruleSource: source,
    grants: [
      item('carpenters-tools'),
      item('healers-kit'),
      item('iron-pot'),
      item('shovel'),
      item('travelers-clothes'),
      { type: 'currency', wallet: wallet(30) },
    ],
  },
] as const satisfies readonly StartingEquipmentPackageDefinition[]);
export const startingGoldAlternatives = Object.freeze([
  {
    id: 'druid.class.starting-gold',
    sourceId: 'druid.class.starting-equipment',
    wallet: wallet(50),
    ruleSource: source,
  },
  {
    id: 'farmer.background.starting-gold',
    sourceId: 'farmer.background.starting-equipment',
    wallet: wallet(50),
    ruleSource: source,
  },
] as const satisfies readonly StartingGoldAlternativeDefinition[]);

export interface StartingPurchaseCartItem {
  readonly equipmentDefinitionId: string;
  readonly quantity: number;
}
export interface StartingPurchaseDraft {
  readonly sourceWallet: CurrencyWallet;
  readonly items: readonly StartingPurchaseCartItem[];
}
export type StartingEquipmentDiagnosticCode =
  | 'missing-class-equipment-choice'
  | 'missing-background-equipment-choice'
  | 'unknown-starting-package'
  | 'unverified-starting-package'
  | 'unknown-equipment-definition'
  | 'unverified-item-price'
  | 'invalid-purchase-quantity'
  | 'non-stackable-purchase-quantity'
  | 'insufficient-starting-funds'
  | 'duplicate-package-item'
  | 'invalid-initial-equipment-state'
  | 'multiple-armors-equipped'
  | 'multiple-shields-equipped'
  | 'missing-equipment-proficiency'
  | 'legacy-starting-equipment-unresolved'
  | 'corrupt-starting-equipment-state';
export interface StartingEquipmentDiagnostic {
  readonly code: StartingEquipmentDiagnosticCode;
  readonly message: string;
  readonly severity: 'error' | 'warning';
  readonly equipmentDefinitionId?: string;
}
const diagnosticMessages: Record<StartingEquipmentDiagnosticCode, string> = {
  'missing-class-equipment-choice':
    'Choose the Druid equipment package or starting gold.',
  'missing-background-equipment-choice':
    'Choose the Farmer equipment package or starting gold.',
  'unknown-starting-package': 'The selected starting package is unavailable.',
  'unverified-starting-package':
    'The selected package has not been verified and cannot be used.',
  'unknown-equipment-definition': 'An equipment item is unavailable.',
  'unverified-item-price':
    'This item has no verified price and cannot be purchased.',
  'invalid-purchase-quantity': 'Quantity must be a positive integer.',
  'non-stackable-purchase-quantity':
    'This item must be purchased one at a time.',
  'insufficient-starting-funds':
    'The selected equipment costs more than the available starting funds.',
  'duplicate-package-item':
    'A starting package contains an unintended duplicate item.',
  'invalid-initial-equipment-state': 'The initial equipment state is invalid.',
  'multiple-armors-equipped': 'Only one armor can be equipped.',
  'multiple-shields-equipped': 'Only one shield can be equipped.',
  'missing-equipment-proficiency':
    'Your character is not proficient with this equipment.',
  'legacy-starting-equipment-unresolved':
    'This legacy character has no recorded starting-equipment choices.',
  'corrupt-starting-equipment-state':
    'The saved starting-equipment state is invalid.',
};
const diag = (
  code: StartingEquipmentDiagnosticCode,
  severity: 'error' | 'warning' = 'error',
  equipmentDefinitionId?: string,
): StartingEquipmentDiagnostic => ({
  code,
  message: diagnosticMessages[code],
  severity,
  ...(equipmentDefinitionId ? { equipmentDefinitionId } : {}),
});
const factors: Readonly<Record<CurrencyDenomination, number>> = {
  cp: 1,
  sp: 10,
  ep: 50,
  gp: 100,
  pp: 1000,
};
export function validateWallet(
  value: CurrencyWallet,
): readonly StartingEquipmentDiagnostic[] {
  return (Object.keys(factors) as CurrencyDenomination[]).some(
    (key) => !Number.isInteger(value[key]) || value[key] < 0,
  )
    ? [diag('corrupt-starting-equipment-state')]
    : [];
}
export function walletToCopper(value: CurrencyWallet): number {
  if (validateWallet(value).length) throw new Error('Invalid currency wallet');
  return (Object.keys(factors) as CurrencyDenomination[]).reduce(
    (sum, key) => sum + value[key] * factors[key],
    0,
  );
}
/** Display change policy: preserve gold semantics; never silently promote GP to PP. */
export function copperToWallet(value: number): CurrencyWallet {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new Error('Invalid copper value');
  let rest = value;
  const result = emptyWallet() as Record<CurrencyDenomination, number>;
  for (const key of ['gp', 'sp', 'cp'] as const) {
    result[key] = Math.floor(rest / factors[key]);
    rest %= factors[key];
  }
  return result;
}
export const addWallets = (
  ...values: readonly CurrencyWallet[]
): CurrencyWallet =>
  Object.freeze(
    (Object.keys(factors) as CurrencyDenomination[]).reduce(
      (wallet, key) => ({
        ...wallet,
        [key]: values.reduce((sum, value) => sum + value[key], 0),
      }),
      emptyWallet(),
    ),
  );
export function subtractWallet(
  left: CurrencyWallet,
  right: CurrencyWallet,
): CurrencyWallet | null {
  const value = walletToCopper(left) - walletToCopper(right);
  return value < 0 ? null : copperToWallet(value);
}

export function resolveStartingChoices(
  choices: readonly StartingEquipmentSourceChoice[],
) {
  const diagnostics: StartingEquipmentDiagnostic[] = [];
  const grants: {
    grant: StartingEquipmentGrant;
    sourceId: StartingEquipmentSourceId;
  }[] = [];
  let availableWallet = emptyWallet();
  for (const sourceId of [
    'druid.class.starting-equipment',
    'farmer.background.starting-equipment',
  ] as const) {
    const choice = choices.find((entry) => entry.sourceId === sourceId);
    if (!choice || choice.choiceType === 'legacy-unknown') {
      diagnostics.push(
        diag(
          sourceId.startsWith('druid')
            ? 'missing-class-equipment-choice'
            : 'missing-background-equipment-choice',
        ),
      );
      continue;
    }
    if (choice.choiceType === 'gold') {
      const definition = startingGoldAlternatives.find(
        (entry) => entry.sourceId === sourceId,
      );
      if (!definition) diagnostics.push(diag('unknown-starting-package'));
      else availableWallet = addWallets(availableWallet, definition.wallet);
    } else {
      const definition = startingEquipmentPackages.find(
        (entry) => entry.sourceId === sourceId,
      );
      if (!definition) diagnostics.push(diag('unknown-starting-package'));
      else
        for (const grant of definition.grants) {
          if (grant.type === 'currency')
            availableWallet = addWallets(availableWallet, grant.wallet);
          else grants.push({ grant, sourceId });
        }
    }
  }
  return { grants, availableWallet, diagnostics };
}
export interface StartingPurchaseSummary {
  readonly availableWallet: CurrencyWallet;
  readonly cartTotalWallet: CurrencyWallet;
  readonly remainingWallet: CurrencyWallet;
  readonly availableCopperValue: number;
  readonly cartTotalCopperValue: number;
  readonly remainingCopperValue: number;
  readonly affordable: boolean;
  readonly itemCount: number;
}
export function summarizeStartingPurchase(
  draft: StartingPurchaseDraft,
): StartingPurchaseSummary {
  const available = walletToCopper(draft.sourceWallet);
  const total = draft.items.reduce(
    (sum, row) =>
      sum +
      (equipmentRegistry[row.equipmentDefinitionId]?.priceCopper ?? 0) *
        row.quantity,
    0,
  );
  return {
    availableWallet: draft.sourceWallet,
    cartTotalWallet: copperToWallet(total),
    remainingWallet: copperToWallet(Math.max(0, available - total)),
    availableCopperValue: available,
    cartTotalCopperValue: total,
    remainingCopperValue: Math.max(0, available - total),
    affordable: total <= available,
    itemCount: draft.items.reduce((sum, row) => sum + row.quantity, 0),
  };
}
export type StartingPurchaseCommandResult =
  | {
      readonly success: true;
      readonly draft: StartingPurchaseDraft;
      readonly summary: StartingPurchaseSummary;
    }
  | {
      readonly success: false;
      readonly draft: StartingPurchaseDraft;
      readonly diagnostics: readonly StartingEquipmentDiagnostic[];
    };
function setQuantity(
  draft: StartingPurchaseDraft,
  definitionId: string,
  quantity: number,
): StartingPurchaseCommandResult {
  const definition = equipmentRegistry[definitionId];
  if (!definition)
    return {
      success: false,
      draft,
      diagnostics: [diag('unknown-equipment-definition')],
    };
  if (definition.priceCopper === undefined || !definition.source.verified)
    return {
      success: false,
      draft,
      diagnostics: [diag('unverified-item-price', 'error', definitionId)],
    };
  if (!Number.isInteger(quantity) || quantity <= 0)
    return {
      success: false,
      draft,
      diagnostics: [diag('invalid-purchase-quantity', 'error', definitionId)],
    };
  if (!definition.stackable && quantity > 1)
    return {
      success: false,
      draft,
      diagnostics: [
        diag('non-stackable-purchase-quantity', 'error', definitionId),
      ],
    };
  const items = [
    ...draft.items.filter((row) => row.equipmentDefinitionId !== definitionId),
    { equipmentDefinitionId: definitionId, quantity },
  ];
  const next = { ...draft, items };
  return {
    success: true,
    draft: next,
    summary: summarizeStartingPurchase(next),
  };
}
export const addStartingPurchaseItem = (
  draft: StartingPurchaseDraft,
  definitionId: string,
): StartingPurchaseCommandResult =>
  setQuantity(
    draft,
    definitionId,
    (draft.items.find((row) => row.equipmentDefinitionId === definitionId)
      ?.quantity ?? 0) + 1,
  );
export const setStartingPurchaseQuantity = setQuantity;
export function removeStartingPurchaseItem(
  draft: StartingPurchaseDraft,
  definitionId: string,
): StartingPurchaseCommandResult {
  const next = {
    ...draft,
    items: draft.items.filter(
      (row) => row.equipmentDefinitionId !== definitionId,
    ),
  };
  return {
    success: true,
    draft: next,
    summary: summarizeStartingPurchase(next),
  };
}
export function clearStartingPurchaseCart(
  draft: StartingPurchaseDraft,
): StartingPurchaseCommandResult {
  const next = { ...draft, items: [] };
  return {
    success: true,
    draft: next,
    summary: summarizeStartingPurchase(next),
  };
}
export const getPurchasableStartingEquipment =
  (): readonly EquipmentDefinition[] =>
    (equipmentDefinitions as readonly EquipmentDefinition[]).filter(
      (definition) =>
        definition.source.verified && definition.priceCopper !== undefined,
    );
export function equipmentProficiencyWarning(
  definition: EquipmentDefinition,
  proficiencies: ComputedCharacter['proficiencies'],
): string | undefined {
  if (
    definition.category === 'armor' &&
    definition.armorCategory === 'medium' &&
    !proficiencies.armor.includes('Medium armor')
  )
    return 'Your character is not proficient with medium armor.';
  if (
    definition.category === 'weapon' &&
    definition.weaponCategory === 'martial' &&
    !proficiencies.weapons.includes('Martial weapons')
  )
    return 'Your character is not proficient with martial weapons.';
  return undefined;
}

export function finalizeStartingEquipment(
  choices: readonly StartingEquipmentSourceChoice[],
  cartItems: readonly StartingPurchaseCartItem[],
):
  | {
      readonly success: true;
      readonly inventory: CharacterInventory;
      readonly spentWallet: CurrencyWallet;
    }
  | {
      readonly success: false;
      readonly diagnostics: readonly StartingEquipmentDiagnostic[];
    } {
  const resolved = resolveStartingChoices(choices);
  if (resolved.diagnostics.length)
    return { success: false, diagnostics: resolved.diagnostics };
  let draft: StartingPurchaseDraft = {
    sourceWallet: resolved.availableWallet,
    items: [],
  };
  for (const row of cartItems) {
    const result = setQuantity(draft, row.equipmentDefinitionId, row.quantity);
    if (!result.success) return result;
    draft = result.draft;
  }
  const summary = summarizeStartingPurchase(draft);
  if (!summary.affordable)
    return {
      success: false,
      diagnostics: [diag('insufficient-starting-funds')],
    };
  const items: InventoryItem[] = resolved.grants.flatMap(
    ({ grant, sourceId }, index) => {
      if (
        grant.type === 'item' &&
        grant.equipmentDefinitionId === 'explorers-pack'
      )
        return materializeEquipmentPackage(
          'explorers-pack',
          `starting-${sourceId}-explorers-pack`,
        );
      return [
        {
          instanceId: `starting-${sourceId}-${grant.type === 'item' ? grant.equipmentDefinitionId : index}`,
          definitionId:
            grant.type === 'item' ? grant.equipmentDefinitionId : '',
          quantity: grant.type === 'item' ? grant.quantity : 1,
          carried: grant.type === 'item' && grant.carried,
          equipped: grant.type === 'item' && grant.equipPolicy === 'equipped',
          attuned: false,
          acquisitionSource: { type: 'starting-package' as const, sourceId },
        },
      ];
    },
  );
  draft.items.forEach((row) =>
    items.push({
      instanceId: `starting-purchase-${row.equipmentDefinitionId}`,
      definitionId: row.equipmentDefinitionId,
      quantity: row.quantity,
      carried: true,
      equipped: false,
      attuned: false,
      acquisitionSource: { type: 'starting-purchase' },
    }),
  );
  return {
    success: true,
    inventory: { items, currency: summary.remainingWallet, attunementLimit: 3 },
    spentWallet: summary.cartTotalWallet,
  };
}
