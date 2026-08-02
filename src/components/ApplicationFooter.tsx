import { Link } from 'react-router-dom';
import { APPLICATION_BUILD_INFO, CURRENT_ITERATION, IMPLEMENTED_FEATURES, LATEST_ITERATION_FEATURE_IDS } from '../meta';

export function ApplicationFooter() {
  return <footer className="application-footer">
    <div><strong>CharacterForge5E</strong><span>Iteration {CURRENT_ITERATION.id}</span><span>Version {APPLICATION_BUILD_INFO.version}</span></div>
    <p>Druid MVP • Levels 1–8 • D&amp;D 5e 2024</p>
    <div><span>Implemented: {IMPLEMENTED_FEATURES.length} features</span><span>New in {CURRENT_ITERATION.id}: {LATEST_ITERATION_FEATURE_IDS.length} features</span></div>
    <nav aria-label="Release information"><Link to="/about#implemented">View implemented features</Link><Link to="/about">About / Release notes</Link></nav>
  </footer>;
}

