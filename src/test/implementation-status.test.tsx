import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import { App } from '../app/App';
import { applicationImplementationStatus } from '../application/implementation-status/implementation-status';

describe('implementation status', () => {
  test('provides the current milestone from one immutable definition', () => {
    expect(applicationImplementationStatus).toMatchObject({
      stage: '3',
      iteration: '3.5E',
      title: 'Smart Choice Filtering and Equipment UX Completion',
    });
    expect(applicationImplementationStatus.implementedFeatures).toContain(
      'Character creation purchasing',
    );
    expect(Object.isFrozen(applicationImplementationStatus)).toBe(true);
    expect(
      Object.isFrozen(applicationImplementationStatus.implementedFeatures),
    ).toBe(true);
  });

  test('renders below creation actions and can be collapsed', async () => {
    location.hash = '#/characters';
    render(<App />);

    const createLink = screen.getByRole('link', { name: /create character/i });
    const heading = screen.getByText('Implementation Status');
    const panel = heading.closest('details');
    expect(panel).toBeInTheDocument();
    expect(
      createLink.compareDocumentPosition(panel as Node) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(panel).toHaveAttribute('open');
    expect(
      screen.getByText(applicationImplementationStatus.title),
    ).toBeVisible();
    expect(
      screen.getByText(`Stage ${applicationImplementationStatus.stage}`, {
        exact: false,
      }),
    ).toBeInTheDocument();
    for (const feature of applicationImplementationStatus.implementedFeatures)
      expect(screen.getByText(feature)).toBeInTheDocument();

    await userEvent.click(heading);
    expect(panel).not.toHaveAttribute('open');
  });
});
