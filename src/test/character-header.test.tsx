import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { CharacterHeader } from '../components/CharacterHeader';
import { referenceCharacter } from '../features/characters/referenceCharacter';

describe('CharacterHeader', () => {
  test('keeps a long identity and complete metadata in separate containers', () => {
    const { container } = render(<CharacterHeader character={{ ...referenceCharacter, name: 'TestOneDruidWithAVeryLongCharacterName' }} onLandChange={() => undefined} />);
    expect(screen.getByRole('heading', { name: 'TestOneDruidWithAVeryLongCharacterName' })).toHaveClass('character-header__name');
    expect(container.querySelector('.character-header__identity')).toBeTruthy();
    expect(container.querySelector('.character-header__metadata')).toBeTruthy();
    for (const label of ['Level', 'Class', 'Species', 'Legacy', 'Background', 'Subclass'])
      expect(screen.getByText(label)).toBeInTheDocument();
    expect(container.querySelector('.character-header__metadata')).not.toHaveStyle({ position: 'absolute' });
    expect(screen.getByText('Circle land')).toBeInTheDocument();
  });
});
