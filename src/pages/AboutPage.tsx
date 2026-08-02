import { FEATURE_CATEGORY_LABELS, IMPLEMENTED_FEATURES, LATEST_ITERATION_FEATURE_IDS, APPLICATION_BUILD_INFO, CURRENT_ITERATION, KNOWN_LIMITATIONS, RELEASE_NOTES, ROADMAP, SUPPORTED_SCOPE, type FeatureCategory } from '../meta';

const latest = new Set<string>(LATEST_ITERATION_FEATURE_IDS);
const categories = [...new Set(IMPLEMENTED_FEATURES.map((feature) => feature.category))];
export function AboutPage() {
  return <main className="about-page">
    <header><p className="eyebrow">Release information</p><h1>About CharacterForge5E</h1><p>A local-first character manager for the currently verified Druid rules slice.</p></header>
    <div className="about-grid">
      <section><h2>Application</h2><dl><dt>Version</dt><dd>{APPLICATION_BUILD_INFO.version}</dd><dt>Current iteration</dt><dd>{CURRENT_ITERATION.id} — {CURRENT_ITERATION.name}</dd><dt>Completed</dt><dd>{CURRENT_ITERATION.completedAt}</dd></dl></section>
      <section><h2>Supported Scope</h2><ul>{SUPPORTED_SCOPE.map((item) => <li key={item}>{item}</li>)}</ul></section>
    </div>
    <section className="latest-release"><h2>New in Iteration {CURRENT_ITERATION.id}</h2><h3>{CURRENT_ITERATION.name}</h3><ul>{IMPLEMENTED_FEATURES.filter((feature) => latest.has(feature.id)).map((feature) => <li key={feature.id}><strong>{feature.name}</strong> — {feature.summary}</li>)}</ul></section>
    <section id="implemented"><h2>All Implemented Functionality</h2><div className="feature-groups">{categories.map((category) => <section key={category}><h3>{FEATURE_CATEGORY_LABELS[category as FeatureCategory]}</h3><ul className="feature-list">{IMPLEMENTED_FEATURES.filter((feature) => feature.category === category).map((feature) => <li key={feature.id}><strong>{feature.name}</strong><p>{feature.summary}</p><small>Introduced {feature.introducedIn} · {feature.status}</small></li>)}</ul></section>)}</div></section>
    <div className="about-grid"><section><h2>Known Limitations</h2><ul>{KNOWN_LIMITATIONS.map((item) => <li key={item}>{item}</li>)}</ul></section><section><h2>Roadmap <small>(planned)</small></h2><ul>{ROADMAP.map((item) => <li key={item}>{item}</li>)}</ul></section></div>
    <section><h2>Release Notes</h2>{RELEASE_NOTES.map((note) => <article key={note.iterationId}><h3>Iteration {note.iterationId} — {note.title}</h3><p>{note.summary}</p><h4>Fixes</h4><ul>{note.fixes.map((fix) => <li key={fix}>{fix}</li>)}</ul></article>)}</section>
  </main>;
}

