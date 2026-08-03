import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { CartRow } from '../components/CartRow';
import { EquipmentMechanicalSummary } from '../components/EquipmentMechanicalSummary';
import { equipmentRegistry } from '../domain/equipment';
import { App } from '../app/App';
import { freshReferenceCharacter } from '../features/characters/referenceCharacter';
import { STORAGE_KEY } from '../features/characters/characterStorage';
import tokens from '../styles/tokens.css?raw';
import styles from '../styles/globals.css?raw';

describe('shared danger button treatment', () => {
  test('Delete character is destructive while adjacent actions remain normal', () => {
    const reference = freshReferenceCharacter();
    const character = {
      ...freshReferenceCharacter(),
      id: 'test-character',
      name: 'Test Druid',
    };
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 2,
        characters: { reference, [character.id]: character },
      }),
    );
    location.hash = '#/';
    render(<App />);

    expect(
      screen.getByRole('button', { name: 'Delete character' }),
    ).toHaveClass('danger');
    expect(
      screen.getByRole('button', { name: 'Duplicate character' }),
    ).not.toHaveClass('danger');
    expect(
      screen.getByRole('button', { name: 'Export character' }),
    ).not.toHaveClass('danger');
  });

  test('uses white text and complete interaction states', () => {
    expect(tokens).toContain('--color-danger-text: #ffffff');
    for (const state of [
      '',
      ':hover',
      ':active',
      ':focus-visible',
      ':disabled',
    ])
      expect(styles).toContain(`button.danger${state}`);
  });
});

describe('CartRow', () => {
  test('keeps a long name, labelled quantity, and action in shared areas', () => {
    render(
      <ul>
        <CartRow
          name="Druidic Focus (Quarterstaff)"
          quantity={
            <label>
              Quantity <input type="number" />
            </label>
          }
          action={<button>Remove</button>}
        />
      </ul>,
    );
    expect(screen.getByText('Druidic Focus (Quarterstaff)')).toHaveClass(
      'cart-item-name',
    );
    expect(screen.getByRole('spinbutton', { name: 'Quantity' })).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Remove' }).parentElement,
    ).toHaveClass('cart-action');
  });

  test('shared grid has no absolute positioning or negative margins', () => {
    const rules = styles.match(/\.cart-row\s*\{[^}]+\}/g)?.join('\n') ?? '';
    expect(rules).toContain('display: grid');
    expect(rules).not.toContain('position: absolute');
    expect(rules).not.toMatch(/margin:\s*-/);
  });
});

describe('EquipmentMechanicalSummary', () => {
  test('shows only existing structured weapon mechanics', () => {
    render(
      <EquipmentMechanicalSummary
        definition={equipmentRegistry.quarterstaff}
      />,
    );
    const summary = screen.getByRole('list', {
      name: 'Quarterstaff mechanics',
    });
    expect(summary).toHaveTextContent('Simple melee weapon');
    expect(summary).toHaveTextContent('Damage: 1d6 bludgeoning');
    expect(summary).toHaveTextContent('Properties: Versatile');
    expect(summary).toHaveTextContent('Versatile (1d8)');
  });

  test('shows armor Dexterity and shield AC rules', () => {
    const { rerender } = render(
      <EquipmentMechanicalSummary
        definition={equipmentRegistry['hide-armor']}
      />,
    );
    expect(screen.getByText(/AC: 12/)).toHaveTextContent(
      'Dexterity modifier (maximum +2)',
    );
    rerender(
      <EquipmentMechanicalSummary definition={equipmentRegistry.shield} />,
    );
    expect(screen.getByText('AC bonus: +2')).toBeVisible();
  });

  test('omits absent mechanics instead of guessing', () => {
    const { container } = render(
      <EquipmentMechanicalSummary
        definition={equipmentRegistry['herbalism-kit']}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
