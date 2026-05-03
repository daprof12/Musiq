import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Music, ShoppingBag, CreditCard, Users, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import MusicManager from './admin/MusicManager';
import StoreManager from './admin/StoreManager';
import TransactionManager from './admin/TransactionManager';
import UserManager from './admin/UserManager';

const AdminOverview = () => {
  const [stats, setStats] = useState([
    { label: 'Total Revenue', value: '$0.00', icon: CreditCard, color: '#1ed760' },
    { label: 'Active Users', value: '0', icon: Users, color: '#1ed760' },
    { label: 'Tracks Uploaded', value: '0', icon: Music, color: '#1ed760' },
    { label: 'Orders Processed', value: '0', icon: ShoppingBag, color: '#1ed760' },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    
    // 1. Fetch Revenue
    const { data: revenueData } = await supabase
      .from('transactions')
      .select('amount')
      .eq('status', 'completed');
    
    const totalRevenue = revenueData?.reduce((acc, curr) => acc + parseFloat(curr.amount as any), 0) || 0;

    // 2. Fetch User Count
    const { count: userCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // 3. Fetch Track Count
    const { count: trackCount } = await supabase
      .from('tracks')
      .select('*', { count: 'exact', head: true });

    // 4. Fetch Order Count
    const { count: orderCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });

    setStats([
      { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, icon: CreditCard, color: '#1ed760' },
      { label: 'Active Users', value: userCount?.toString() || '0', icon: Users, color: '#1ed760' },
      { label: 'Tracks Uploaded', value: trackCount?.toString() || '0', icon: Music, color: '#1ed760' },
      { label: 'Orders Processed', value: orderCount?.toString() || '0', icon: ShoppingBag, color: '#1ed760' },
    ]);
    setLoading(false);
  };

  return (
    <div>
      <header style={{ marginBottom: '32px' }}>
        <h1>Admin Overview</h1>
        <p>Real-time performance and system health.</p>
      </header>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', 
        gap: '24px',
        marginBottom: '48px'
      }}>
        {stats.map((stat) => (
          <div key={stat.label} className="glass" style={{ padding: '24px', borderRadius: '12px' }}>
            <div style={{ color: '#a7a7a7', fontSize: '14px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                {stat.label}
                <stat.icon size={20} color={stat.color} />
            </div>
            <div style={{ fontSize: '28px', fontWeight: '700' }}>
                {loading ? '...' : stat.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        <section className="glass" style={{ padding: '24px', borderRadius: '12px' }}>
            <h2>System Health</h2>
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>API Response Time</span>
                    <span style={{ color: '#1ed760' }}>124ms</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Storage Usage</span>
                    <span>14.2 GB / 50 GB</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Database Status</span>
                    <span style={{ color: '#1ed760' }}>Optimal</span>
                </div>
            </div>
        </section>

        <section className="glass" style={{ padding: '24px', borderRadius: '12px' }}>
             <h2>Platform Status</h2>
             <div style={{ marginTop: '24px', color: '#a7a7a7', textAlign: 'center', padding: '20px' }}>
                 All systems operational.
             </div>
        </section>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const location = useLocation();

  const navItems = [
    { label: 'Overview', path: '/admin', icon: LayoutDashboard },
    { label: 'Manage Music', path: '/admin/music', icon: Music },
    { label: 'Manage Store', path: '/admin/store', icon: ShoppingBag },
    { label: 'Transactions', path: '/admin/transactions', icon: CreditCard },
    { label: 'Users', path: '/admin/users', icon: Users },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
      <nav style={{ display: 'flex', gap: '32px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '20px' }}>
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: (location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path))) ? '#1ed760' : '#a7a7a7',
              textDecoration: 'none',
              fontWeight: '700',
              fontSize: '14px',
              transition: 'color 0.2s'
            }}
          >
            <item.icon size={20} />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="admin-content">
        <Routes>
          <Route index element={<AdminOverview />} />
          <Route path="music" element={<MusicManager />} />
          <Route path="store" element={<StoreManager />} />
          <Route path="transactions" element={<TransactionManager />} />
          <Route path="users" element={<UserManager />} />
        </Routes>
      </div>
    </div>
  );
};

export default AdminDashboard;
