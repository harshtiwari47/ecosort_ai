import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { SiteLayout } from './components/SiteLayout';
import { HistoryProvider } from './features/history/HistoryContext';
import { SettingsProvider } from './features/settings/SettingsContext';
import { AboutPage } from './pages/AboutPage';
import { ClassifyPage } from './pages/ClassifyPage';
import { GuidePage } from './pages/GuidePage';
import { HistoryPage } from './pages/HistoryPage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  return (
    <SettingsProvider>
      <HistoryProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<SiteLayout />}>
              <Route index element={<HomePage />} />
              <Route path="classify" element={<ClassifyPage />} />
              <Route path="guide" element={<GuidePage />} />
              <Route path="history" element={<HistoryPage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </HistoryProvider>
    </SettingsProvider>
  );
}
