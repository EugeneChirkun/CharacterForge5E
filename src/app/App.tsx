import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { CharacterProvider } from './CharacterContext';
import { CharacterListPage } from '../pages/CharacterListPage';
import { CharacterSheetPage } from '../pages/CharacterSheetPage';
import { NewCharacterPage } from '../pages/NewCharacterPage';
import { LevelUpPage } from '../pages/LevelUpPage';
import { AboutPage } from '../pages/AboutPage';
import { ApplicationFooter } from '../components/ApplicationFooter';
const SpellbookPage = lazy(() => import('../features/spellbook/SpellbookPage').then((m) => ({ default: m.SpellbookPage })));
const SettingsPage = lazy(() => import('../features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })));
export function App() {
  return (
    <CharacterProvider>
      <HashRouter>
        <div className="application-shell"><Suspense fallback={<main className="center-page" role="status" aria-live="polite"><h1>Loading Character Forge…</h1></main>}><Routes>
          <Route path="/" element={<CharacterListPage />} />
          <Route path="/characters" element={<CharacterListPage />} />
          <Route path="/characters/new" element={<NewCharacterPage />} />
          <Route path="/characters/new/:step" element={<NewCharacterPage />} />
          <Route path="/character/new" element={<NewCharacterPage />} />
          <Route path="/character/:id" element={<CharacterSheetPage />} />
          <Route path="/character/:id/level-up" element={<LevelUpPage />} />
          <Route path="/character/:id/spellbook" element={<SpellbookPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<CharacterListPage />} />
        </Routes></Suspense><ApplicationFooter /></div>
      </HashRouter>
    </CharacterProvider>
  );
}
