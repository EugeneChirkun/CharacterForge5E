import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test } from 'vitest';
import { ApplicationFooter } from '../components/ApplicationFooter';
import { AboutPage } from '../pages/AboutPage';
import {
  CURRENT_ITERATION,
  IMPLEMENTED_FEATURES,
  LATEST_ITERATION_FEATURE_IDS,
  RELEASE_NOTES,
} from '../meta';

describe('Iteration 3.5D release metadata', () => {
  test('registry references are unique and complete', () => {
    const all = IMPLEMENTED_FEATURES.map((feature) => feature.id);
    expect(CURRENT_ITERATION.id).toBe('3.5F');
    expect(new Set(all).size).toBe(all.length);
    expect(LATEST_ITERATION_FEATURE_IDS.length).toBeGreaterThan(0);
    expect(new Set(LATEST_ITERATION_FEATURE_IDS).size).toBe(
      LATEST_ITERATION_FEATURE_IDS.length,
    );
    expect(LATEST_ITERATION_FEATURE_IDS.every((id) => all.includes(id))).toBe(
      true,
    );
    expect(
      IMPLEMENTED_FEATURES.every(
        (feature) => feature.category && feature.introducedIn,
      ),
    ).toBe(true);
    expect(
      RELEASE_NOTES.some((note) => note.iterationId === CURRENT_ITERATION.id),
    ).toBe(true);
    expect(
      RELEASE_NOTES.flatMap((note) => note.addedFeatureIds).every((id) =>
        all.includes(id),
      ),
    ).toBe(true);
  });
  test('semantic footer derives counts and links to About', () => {
    const { container } = render(
      <MemoryRouter>
        <ApplicationFooter />
      </MemoryRouter>,
    );
    expect(container.querySelector('footer')).toBeTruthy();
    expect(
      screen.getByText(`Iteration ${CURRENT_ITERATION.id}`),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`Implemented: ${IMPLEMENTED_FEATURES.length} features`),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'About / Release notes' }),
    ).toHaveAttribute('href', '/about');
  });
  test('About groups functionality and distinguishes the latest release', () => {
    const { container } = render(<AboutPage />);
    expect(
      screen.getByRole('heading', { name: 'About CharacterForge5E' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: `New in Iteration ${CURRENT_ITERATION.id}`,
      }),
    ).toBeInTheDocument();
    expect(container.querySelector('.latest-release')).toBeTruthy();
    expect(
      screen.getByRole('heading', { name: 'Known Limitations' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Roadmap/ })).toHaveTextContent(
      'planned',
    );
  });
});
