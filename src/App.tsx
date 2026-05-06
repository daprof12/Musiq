import { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Home as HomeIcon, Search, Library, ShoppingBag, Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Player from './components/Player';
import Home from './pages/Home';
import Store from './pages/Store';
import Subscription from './pages/Subscription';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import SearchPage from './pages/Search';
import LibraryPage from './pages/Library';
import LikedSongs from './pages/LikedSongs';
import PlaylistView from './pages/PlaylistView';
import { ProtectedRoute, AdminRoute } from './components/AuthRoutes';

// Mobile bottom nav items
const mobileNavItems = [
  { icon: HomeIcon,   label: 'Home',    path: '/' },
  { icon: Search,     label: 'Search',  path: '/search' },
  { icon: Library,    label: 'Library', path: '/library' },
  { icon: ShoppingBag,label: 'Store',   path: '/store' },
];

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="app-container">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onToggle={() => setSidebarOpen((o) => !o)}
      />

      <main className="main-content">
        {/* Mobile top-bar header */}
        <div
          className="hide-desktop"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 4px',
            marginBottom: '24px',
            borderBottom: '1px solid rgba(255,255,255,0.05)'
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '10px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <span style={{ fontWeight: '800', fontSize: '20px', letterSpacing: '-0.5px' }}>Musiq</span>
          <div style={{ width: '42px' }} />
        </div>

        <Routes>
          {/* Public Routes */}
          <Route path="/"             element={<Home />} />
          <Route path="/search"       element={<SearchPage />} />
          <Route path="/store"        element={<Store />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/login"        element={<Login />} />
          <Route path="/register"     element={<Register />} />

          {/* Protected User Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/library"       element={<LibraryPage />} />
            <Route path="/library/liked" element={<LikedSongs />} />
            <Route path="/playlist/:id"  element={<PlaylistView />} />
            <Route path="/checkout"      element={<Checkout />} />
          </Route>

          {/* Admin Only Routes */}
          <Route element={<AdminRoute />}>
            <Route path="/admin/*" element={<AdminDashboard />} />
          </Route>
        </Routes>
      </main>

      <Player />

      {/* Mobile bottom navigation */}
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {mobileNavItems.map(({ icon: Icon, label, path }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                color: active ? '#1ed760' : '#a7a7a7',
                cursor: 'pointer',
                padding: '8px 12px',
                fontFamily: 'inherit',
                fontSize: '10px',
                fontWeight: active ? '700' : '400',
                transition: 'color 0.2s',
                flex: 1,
              }}
              aria-label={label}
            >
              <Icon size={22} />
              {label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default App;
