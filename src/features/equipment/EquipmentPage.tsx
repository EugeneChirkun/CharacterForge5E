import { useId, useState } from 'react';
import type { CharacterViewModel } from '../characters/character.types';
import {
  equipmentRegistry,
  getEquipmentCatalogItems,
  productionEquipmentCategories,
  sortInventoryItems,
  type EquipmentCategory,
  equipmentPackageRegistry,
} from '../../domain/equipment';
import {
  addInventoryItem,
  applyInventoryToViewModel,
  attuneInventoryItem,
  endAttunement,
  equipInventoryItem,
  moveInventoryItemToContainer,
  removeInventoryItem,
  setCurrency,
  setInventoryItemCarried,
  setInventoryQuantity,
  unequipInventoryItem,
  updateInventoryItemNotes,
  type InventoryCommandResult,
} from '../../application/inventory';
import { EquipmentMechanicalSummary } from '../../components/EquipmentMechanicalSummary';
import { EquipmentPackageViewer } from '../../components/EquipmentPackageViewer';

export function EquipmentPage({
  character,
  onChange,
}: {
  readonly character: CharacterViewModel;
  readonly onChange: (character: CharacterViewModel) => void;
}) {
  const dialogTitle = useId();
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'alphabetical' | 'cost' | 'weight'>(
    'alphabetical',
  );
  const [category, setCategory] = useState<EquipmentCategory | 'all'>('all');
  const [diagnostics, setDiagnostics] = useState<readonly string[]>([]);
  const apply = (result: InventoryCommandResult) => {
    if (!result.success)
      return setDiagnostics(result.diagnostics.map((d) => d.message));
    setDiagnostics(result.diagnostics?.map((d) => d.message) ?? []);
    onChange(applyInventoryToViewModel(character, result.inventory));
  };
  const items = sortInventoryItems(character.inventory.items);
  const groups = [
    ['Equipped', items.filter((i) => i.equipped)],
    [
      'Weapons',
      items.filter(
        (i) =>
          !i.equipped &&
          equipmentRegistry[i.definitionId]?.category === 'weapon',
      ),
    ],
    [
      'Armor and Shields',
      items.filter(
        (i) =>
          !i.equipped &&
          ['armor', 'shield'].includes(
            equipmentRegistry[i.definitionId]?.category ?? '',
          ),
      ),
    ],
    [
      'Tools and Focuses',
      items.filter(
        (i) =>
          !i.equipped &&
          ['tool', 'spellcasting-focus'].includes(
            equipmentRegistry[i.definitionId]?.category ?? '',
          ),
      ),
    ],
    [
      'Adventuring Gear',
      items.filter(
        (i) =>
          !i.equipped &&
          equipmentRegistry[i.definitionId]?.category === 'adventuring-gear',
      ),
    ],
    [
      'Containers',
      items.filter(
        (i) =>
          !i.equipped &&
          equipmentRegistry[i.definitionId]?.category === 'container',
      ),
    ],
  ] as const;
  const available = [
    ...getEquipmentCatalogItems({
      registry: equipmentRegistry,
      category,
      search,
      verifiedOnly: true,
    }),
  ].sort((a, b) =>
    sort === 'cost'
      ? (a.priceCopper ?? Number.MAX_SAFE_INTEGER) -
        (b.priceCopper ?? Number.MAX_SAFE_INTEGER)
      : sort === 'weight'
        ? (a.weight ?? Number.MAX_SAFE_INTEGER) -
          (b.weight ?? Number.MAX_SAFE_INTEGER)
        : a.name.localeCompare(b.name),
  );
  return (
    <section className="equipment-page">
      <header className="equipment-heading">
        <div>
          <h2>Equipment</h2>
          <p>
            {character.carriedWeight} lb carried · {character.ownedWeight} lb
            owned · AC {character.armorClass}
          </p>
        </div>
        <button onClick={() => setAddOpen(true)}>Add item</button>
      </header>
      <section className="panel" aria-labelledby="currency-heading">
        <h3 id="currency-heading">Currency</h3>
        <div className="currency-grid">
          {(['cp', 'sp', 'ep', 'gp', 'pp'] as const).map((coin) => (
            <label key={coin}>
              {coin.toUpperCase()}
              <input
                aria-label={coin.toUpperCase()}
                type="number"
                min="0"
                step="1"
                value={character.inventory.currency[coin]}
                onChange={(e) =>
                  apply(
                    setCurrency(
                      character.inventory,
                      coin,
                      Number(e.target.value),
                    ),
                  )
                }
              />
            </label>
          ))}
        </div>
      </section>
      {!!diagnostics.length && (
        <div role="alert" className="equipment-warning">
          {diagnostics.map((d) => (
            <p key={d}>{d}</p>
          ))}
        </div>
      )}
      <div className="inventory-groups">
        {groups
          .filter(([, group]) => group.length)
          .map(([name, group]) => (
            <section className="panel" key={name}>
              <h3>{name}</h3>
              <ul className="inventory-list">
                {group.map((item) => {
                  const d = equipmentRegistry[item.definitionId]!;
                  return (
                    <li key={item.instanceId}>
                      <div>
                        <strong>{d.name}</strong>
                        <small>
                          {d.category} ·{' '}
                          {d.weight === undefined
                            ? 'weight unverified'
                            : `${d.weight * item.quantity} lb`}{' '}
                          {item.attuned ? ' · Attuned' : ''}
                        </small>
                      </div>
                      <label>
                        Quantity
                        <input
                          aria-label={`${d.name} quantity`}
                          type="number"
                          min="1"
                          value={item.quantity}
                          disabled={!d.stackable}
                          onChange={(e) =>
                            apply(
                              setInventoryQuantity(
                                character.inventory,
                                item.instanceId,
                                Number(e.target.value),
                              ),
                            )
                          }
                        />
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={item.carried}
                          onChange={(e) =>
                            apply(
                              setInventoryItemCarried(
                                character.inventory,
                                item.instanceId,
                                e.target.checked,
                              ),
                            )
                          }
                        />{' '}
                        Carried
                      </label>
                      {[
                        'armor',
                        'shield',
                        'weapon',
                        'spellcasting-focus',
                        'tool',
                      ].includes(d.category) && (
                        <button
                          onClick={() =>
                            apply(
                              item.equipped
                                ? unequipInventoryItem(
                                    character.inventory,
                                    item.instanceId,
                                  )
                                : equipInventoryItem(
                                    character.inventory,
                                    item.instanceId,
                                    d.category === 'armor',
                                  ),
                            )
                          }
                        >
                          {item.equipped ? 'Unequip' : 'Equip'}
                        </button>
                      )}
                      {d.attunement && (
                        <button
                          onClick={() =>
                            apply(
                              item.attuned
                                ? endAttunement(
                                    character.inventory,
                                    item.instanceId,
                                  )
                                : attuneInventoryItem(
                                    character.inventory,
                                    item.instanceId,
                                  ),
                            )
                          }
                        >
                          {item.attuned ? 'End attunement' : 'Attune'}
                        </button>
                      )}
                      <select
                        aria-label={`Container for ${d.name}`}
                        value={item.containerInstanceId ?? ''}
                        onChange={(e) =>
                          apply(
                            moveInventoryItemToContainer(
                              character.inventory,
                              item.instanceId,
                              e.target.value || undefined,
                            ),
                          )
                        }
                      >
                        <option value="">Root inventory</option>
                        {items
                          .filter(
                            (candidate) =>
                              candidate.instanceId !== item.instanceId &&
                              equipmentRegistry[candidate.definitionId]
                                ?.category === 'container',
                          )
                          .map((container) => (
                            <option
                              key={container.instanceId}
                              value={container.instanceId}
                            >
                              {equipmentRegistry[container.definitionId]?.name}
                            </option>
                          ))}
                      </select>
                      <input
                        aria-label={`${d.name} notes`}
                        placeholder="Notes"
                        value={item.notes ?? ''}
                        onChange={(e) =>
                          apply(
                            updateInventoryItemNotes(
                              character.inventory,
                              item.instanceId,
                              e.target.value,
                            ),
                          )
                        }
                      />
                      <button
                        className="danger"
                        onClick={() => {
                          if (confirm(`Remove ${d.name}?`))
                            apply(
                              removeInventoryItem(
                                character.inventory,
                                item.instanceId,
                                { unequip: true, endAttunement: true },
                              ),
                            );
                        }}
                      >
                        Remove
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
      </div>
      {addOpen && (
        <div className="dialog-backdrop" role="presentation">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitle}
            className="dialog"
          >
            <h2 id={dialogTitle}>Add equipment</h2>
            <label>
              Search
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <label>
              Category
              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as EquipmentCategory | 'all')
                }
              >
                <option value="all">All categories</option>
                {productionEquipmentCategories(equipmentRegistry).map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              Sort
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as typeof sort)}
              >
                <option value="alphabetical">Alphabetical</option>
                <option value="cost">Cost</option>
                <option value="weight">Weight</option>
              </select>
            </label>
            {available.length ? (
              <ul className="add-items">
                {available.map((d) => (
                  <li key={d.id}>
                    <span>
                      {d.name} <small>{d.category}</small>
                      <EquipmentMechanicalSummary definition={d} />
                      {equipmentPackageRegistry[d.id] && (
                        <EquipmentPackageViewer
                          definition={equipmentPackageRegistry[d.id]}
                        />
                      )}
                    </span>
                    <button
                      onClick={() => {
                        apply(
                          addInventoryItem(character.inventory, {
                            instanceId: `item-${Date.now()}-${d.id}`,
                            definitionId: d.id,
                            quantity: 1,
                            carried: true,
                          }),
                        );
                        setAddOpen(false);
                      }}
                    >
                      Add
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p role="status">
                {search.trim()
                  ? 'No equipment matches the current search and category filters.'
                  : 'No equipment is available in this category.'}
              </p>
            )}
            <button onClick={() => setAddOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </section>
  );
}
