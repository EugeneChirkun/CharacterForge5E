import { HashRouter, Routes, Route } from 'react-router-dom';
import { CharacterProvider } from './CharacterContext';
import { CharacterListPage } from '../pages/CharacterListPage';
import { CharacterSheetPage } from '../pages/CharacterSheetPage';
import { NewCharacterPage } from '../pages/NewCharacterPage';
import { LevelUpPage } from '../pages/LevelUpPage';
export function App() {
  return (
    <CharacterProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<CharacterListPage />} />
          <Route path="/characters" element={<CharacterListPage />} />
          <Route path="/characters/new" element={<NewCharacterPage />} />
          <Route path="/characters/new/:step" element={<NewCharacterPage />} />
          <Route path="/character/new" element={<NewCharacterPage />} />
          <Route path="/character/:id" element={<CharacterSheetPage />} />
          <Route path="/character/:id/level-up" element={<LevelUpPage />} />
          <Route path="*" element={<CharacterListPage />} />
        </Routes>
      </HashRouter>
    </CharacterProvider>
  );
}
