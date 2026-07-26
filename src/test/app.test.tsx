import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';
import { App } from '../app/App';
import { freshReferenceCharacter } from '../features/characters/referenceCharacter';
import { performRest } from '../features/rests/restService';
import {
  loadState,
  STORAGE_KEY,
} from '../features/characters/characterStorage';
function start(hash = '#/') {
  location.hash = hash;
  return render(<App />);
}
test('character list renders and opens reference character', async () => {
  start();
  expect(screen.getByText('Reference Character')).toBeInTheDocument();
  await userEvent.click(
    screen.getByRole('button', { name: /open character/i }),
  );
  expect(
    await screen.findByRole('heading', { name: 'Summary' }),
  ).toBeInTheDocument();
  expect(location.hash).toBe('#/character/reference');
});
test('mobile navigation switches sections', async () => {
  start('#/character/reference');
  await userEvent.click(screen.getAllByRole('button', { name: /spells/i })[0]);
  expect(screen.getByRole('heading', { name: 'Spells' })).toBeInTheDocument();
});
test('summary renders a grouped, complete character sheet', () => {
  start('#/character/reference');
  expect(
    screen.getAllByRole('article', {
      name: /^(strength|dexterity|constitution|intelligence|wisdom|charisma)$/i,
    }),
  ).toHaveLength(6);
  const expectedSkills = [
    'Acrobatics',
    'Animal Handling',
    'Arcana',
    'Athletics',
    'Deception',
    'History',
    'Insight',
    'Intimidation',
    'Investigation',
    'Medicine',
    'Nature',
    'Perception',
    'Performance',
    'Persuasion',
    'Religion',
    'Sleight of Hand',
    'Stealth',
    'Survival',
  ];
  expectedSkills.forEach((skill) =>
    expect(screen.getAllByText(skill)).toHaveLength(1),
  );
  expect(
    screen.getByRole('list', { name: 'Strength skills' }),
  ).toHaveTextContent('Athletics');
  expect(screen.getByRole('list', { name: 'Wisdom skills' })).toHaveTextContent(
    'Perception',
  );
  expect(screen.getAllByLabelText(/proficient|not proficient/i)).toHaveLength(
    24,
  );
  [
    'Armor Class',
    'Initiative',
    'Speed',
    'Current HP',
    'Passive Perception',
    'Spell Save DC',
  ].forEach((stat) => expect(screen.getByText(stat)).toBeInTheDocument());
  ['Common', 'Infernal', 'Druidic', 'Light Armor', 'Herbalism Kit'].forEach(
    (item) => expect(screen.getByText(item)).toBeInTheDocument(),
  );
  expect(
    screen.getByRole('heading', { name: 'Resources' }),
  ).toBeInTheDocument();
  expect(screen.getByText('Wild Shape')).toBeInTheDocument();
});
test('short rest opens preview and supports undo', async () => {
  start('#/character/reference');
  await userEvent.click(
    screen.getAllByRole('button', { name: /short rest/i })[0],
  );
  expect(screen.getByRole('dialog')).toHaveTextContent('Short Rest preview');
  await userEvent.click(
    screen.getByRole('button', { name: /confirm short rest/i }),
  );
  expect(screen.getByRole('status')).toHaveTextContent('complete');
  await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
  expect(screen.getByRole('status')).toHaveTextContent('undone');
});
test('short rest restores only short resources', () => {
  const c = freshReferenceCharacter();
  const n = performRest('short', c);
  expect(n.resources.find((r) => r.id === 'wild-shape')?.current).toBe(1);
  expect(n.resources.find((r) => r.id === 'nature-aid')?.current).toBe(0);
  expect(n.currentHp).toBe(46);
});
test('long rest restores values and changes land', () => {
  const n = performRest('long', freshReferenceCharacter(), {
    landType: 'polar',
  });
  expect(n.currentHp).toBe(n.maximumHp);
  expect(n.temporaryHp).toBe(0);
  expect(n.spellSlots.every((s) => s.current === s.maximum)).toBe(true);
  expect(n.resources.find((r) => r.id === 'nature-aid')?.current).toBe(1);
  expect(n.landType).toBe('polar');
});
test('stored state loads and invalid data falls back', () => {
  const c = freshReferenceCharacter();
  c.landType = 'tropical';
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ schemaVersion: 1, characters: { reference: c } }),
  );
  expect(loadState().characters.reference.landType).toBe('tropical');
  localStorage.setItem(STORAGE_KEY, 'broken');
  expect(loadState().characters.reference.landType).toBe('temperate');
});
