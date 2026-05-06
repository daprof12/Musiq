import { Home as HomeIcon, Search, Library as LibraryIcon, PlusSquare, Heart, ShoppingBag, Settings, LogOut, X, Menu } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useToastStore } from '../store/useToastStore';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}

const Sidebar = ({ isOpen, onClose, onToggle }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();
  const { addToast } = useToastStore();

  const menuItems = [
    { icon: HomeIcon,     label: 'Home',         path: '/' },
    { icon: Search,       label: 'Search',        path: '/search' },
    { icon: LibraryIcon,  label: 'Your Library',  path: '/library' },
  ];

  const actionItems = [
    { icon: PlusSquare,  label: 'Create Playlist', action: 'create' as const },
    { icon: Heart,       label: 'Liked Songs',      path: '/library/liked' },
    { icon: ShoppingBag, label: 'Store',             path: '/store' },
  ];

  const handleLogout = async () => {
    onClose();
    await signOut();
    navigate('/login');
  };

  const handleCreatePlaylist = async () => {
    if (!user) { navigate('/login'); onClose(); return; }
    
    const name = window.prompt('Enter playlist name:', 'My New Playlist');
    if (!name) return;

    try {
      const { data, error } = await supabase
        .from('playlists')
        .insert([{ name, user_id: user.id }])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating playlist:', error);
        addToast('Failed to create playlist', 'error');
        return;
      }

      if (data) {
        addToast(`Created playlist "${name}"`);
        navigate('/library');
        onClose();
        // Force a refresh if already on library
        if (location.pathname === '/library') {
          window.location.reload();
        }
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('An unexpected error occurred.');
    }
  };

  const handleNavClick = () => onClose();

  const linkStyle = (path?: string) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    color: path && location.pathname === path ? 'white' : '#a7a7a7',
    textDecoration: 'none',
    fontWeight: '600' as const,
    fontSize: '14px',
    transition: 'color 0.2s',
  });

  const buttonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    color: '#a7a7a7',
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    fontFamily: 'inherit',
    textAlign: 'left',
  };

  return (
    <>
      {/* ── Overlay (mobile only) ── */}
      <div
        className={`sidebar-overlay${isOpen ? ' visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Sidebar drawer ── */}
      <aside className={`sidebar${isOpen ? ' open' : ''}`}>

        {/* Close button (mobile) / Hamburger toggle (desktop) */}
        <button
          onClick={onToggle}
          className="sidebar-toggle"
          style={{
            display: 'flex',
            position: 'absolute',
            top: '16px',
            right: '16px',
          }}
          aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Logo */}
        <div className="logo" style={{ fontSize: '24px', fontWeight: 'bold' }}>
          Musiq
        </div>

        {/* Navigation */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {menuItems.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                style={linkStyle(item.path)}
                onClick={handleNavClick}
              >
                <item.icon size={24} />
                {item.label}
              </Link>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {actionItems.map((item) =>
              item.action === 'create' ? (
                <button key={item.label} onClick={handleCreatePlaylist} style={buttonStyle}>
                  <item.icon size={24} />
                  {item.label}
                </button>
              ) : (
                <Link
                  key={item.label}
                  to={item.path!}
                  style={linkStyle(item.path)}
                  onClick={handleNavClick}
                >
                  <item.icon size={24} />
                  {item.label}
                </Link>
              )
            )}
          </div>
        </nav>

        {/* Bottom actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isAdmin && (
            <Link
              to="/admin"
              style={{
                ...linkStyle('/admin'),
                color: location.pathname.startsWith('/admin') ? '#1ed760' : '#a7a7a7',
              }}
              onClick={handleNavClick}
            >
              <Settings size={24} />
              Admin Panel
            </Link>
          )}

          {user ? (
            <button onClick={handleLogout} style={buttonStyle}>
              <LogOut size={24} />
              Log Out
            </button>
          ) : (
            <Link to="/login" style={linkStyle()} onClick={handleNavClick}>
              <LogOut size={24} />
              Log In
            </Link>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
