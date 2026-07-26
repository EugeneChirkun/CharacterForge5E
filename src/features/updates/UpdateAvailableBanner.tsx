export function UpdateAvailableBanner({ onUpdate, onDismiss }: { onUpdate: () => void; onDismiss: () => void }) {
  return <aside className="update-banner print-hidden" role="status" aria-label="Application update available"><span>A new version of CharacterForge5E is available.</span><button type="button" onClick={onUpdate}>Update now</button><button type="button" className="secondary" onClick={onDismiss}>Later</button></aside>;
}
