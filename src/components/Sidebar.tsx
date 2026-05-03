import { Home as HomeIcon, Search, Library as LibraryIcon, PlusSquare, Heart, ShoppingBag, Settings, LogOut } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();

  const menuItems = [
    { icon: HomeIcon, label: 'Home', path: '/' },
    { icon: Search, label: 'Search', path: '/search' },
    { icon: LibraryIcon, label: 'Your Library', path: '/library' },
  ];

  const actionItems = [
    { icon: PlusSquare, label: 'Create Playlist', action: 'create' },
    { icon: Heart, label: 'Liked Songs', path: '/library/liked' },
    { icon: ShoppingBag, label: 'Store', path: '/store' },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleCreatePlaylist = async () => {
    if (!user) {
        navigate('/login');
        return;
    }

    const { data, error } = await supabase
        .from('playlists')
        .insert([
            { name: 'My Playlist #1', user_id: user.id }
        ])
        .select()
        .single();
    
    if (data) {
        navigate(`/library`); // For now just go to library
    }
  };

  return (
    <aside className="sidebar">
      <div className="logo" style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
        Musiq
      </div>
      
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {menuItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                color: location.pathname === item.path ? 'white' : '#a7a7a7',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '14px',
                transition: 'color 0.2s'
              }}
            >
              <item.icon size={24} />
              {item.label}
            </Link>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
          {actionItems.map((item) => (
            item.action === 'create' ? (
                <button
                    key={item.label}
                    onClick={handleCreatePlaylist}
                    style={{
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
                        textAlign: 'left'
                    }}
                >
                    <item.icon size={24} />
                    {item.label}
                </button>
            ) : (
                <Link
                key={item.label}
                to={item.path!}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  color: location.pathname === item.path ? 'white' : '#a7a7a7',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'color 0.2s'
                }}
              >
                <item.icon size={24} />
                {item.label}
              </Link>
            )
          ))}
        </div>
      </nav>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
         {isAdmin && (
            <Link
                to="/admin"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  color: location.pathname.startsWith('/admin') ? '#1ed760' : '#a7a7a7',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '14px',
                }}
              >
                <Settings size={24} />
                Admin Panel
              </Link>
         )}

         {user ? (
            <button
              onClick={handleLogout}
              style={{
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
                fontFamily: 'inherit'
              }}
            >
              <LogOut size={24} />
              Log Out
            </button>
         ) : (
            <Link
              to="/login"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                color: '#a7a7a7',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '14px',
              }}
            >
              <LogOut size={24} />
              Log In
            </Link>
         )}
      </div>
    </aside>
  );
};

export default Sidebar;
