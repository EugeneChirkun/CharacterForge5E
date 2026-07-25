import { Link } from 'react-router-dom';
export function NewCharacterPage() {
  return (
    <main className="center-page">
      <p className="eyebrow">Coming in a future iteration</p>
      <h1>Character creation</h1>
      <p>This scaffold is ready for a guided creation workflow.</p>
      <Link className="button" to="/">
        Return to characters
      </Link>
    </main>
  );
}
