import { HashRouter, Routes, Route } from 'react-router-dom';
import { CharacterProvider } from './CharacterContext';
import { CharacterListPage } from '../pages/CharacterListPage';
import { CharacterSheetPage } from '../pages/CharacterSheetPage';
import { NewCharacterPage } from '../pages/NewCharacterPage';
export function App() {
  return (
    <CharacterProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<CharacterListPage />} />
          <Route path="/character/reference" element={<CharacterSheetPage />} />
          <Route path="/character/new" element={<NewCharacterPage />} />
          <Route path="*" element={<CharacterListPage />} />
        </Routes>
      </HashRouter>
    </CharacterProvider>
  );
}
