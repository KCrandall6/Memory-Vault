// src/App.tsx
import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import UploadPage from './pages/UploadPage';
import SearchPage from './pages/SearchPage';
import MediaPage from './pages/MediaPage';
import RecentUploadsPage from './pages/RecentUploadsPage';
import VaultSettingsPage from './pages/VaultSettingsPage';
import FirstRunSetupPage from './pages/FirstRunSetupPage';
import { BrowseCollectionsPage, BrowseDatesPage, BrowsePeoplePage, BrowseTagsPage } from './pages/BrowsePages';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

function App() {
  const [libraryReady, setLibraryReady] = useState<boolean | null>(null);

  useEffect(() => {
    window.electronAPI.getLibraryStatus()
      .then((status) => setLibraryReady(status.configured))
      .catch(() => setLibraryReady(false));
  }, []);

  if (libraryReady === null) {
    return <div className="app-loading">Preparing Memory Vault…</div>;
  }

  if (!libraryReady) {
    return <FirstRunSetupPage onLibraryReady={() => setLibraryReady(true)} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="recent-uploads" element={<RecentUploadsPage />} />
          <Route path="browse/collections" element={<BrowseCollectionsPage />} />
          <Route path="browse/people" element={<BrowsePeoplePage />} />
          <Route path="browse/tags" element={<BrowseTagsPage />} />
          <Route path="browse/dates" element={<BrowseDatesPage />} />
          <Route path="media/:id" element={<MediaPage />} />
          <Route path="vault-settings" element={<VaultSettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;