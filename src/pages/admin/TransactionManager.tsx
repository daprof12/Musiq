import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { CreditCard, CheckCircle, Clock, XCircle, ShoppingBag, Zap } from 'lucide-react';

interface Transaction {
  id: string;
  amount: number;
  status: string;
  type: string;
  created_at: string;
  profiles: {
    username: string;
    email: string;
  };
}

const TransactionManager = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        profiles (
          username
        )
      `)
      .order('created_at', { ascending: false });
    
    if (data) setTransactions(data);
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} color="#1ed760" />;
      case 'pending': return <Clock size={16} color="#f1c40f" />;
      case 'failed': return <XCircle size={16} color="#e74c3c" />;
      default: return null;
    }
  };

  return (
    <div>
      <header style={{ marginBottom: '32px' }}>
        <h2>Transaction History</h2>
        <p>Monitor all system payments and subscription activities.</p>
      </header>

      <div className="glass" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'rgba(255,255,255,0.05)', color: '#a7a7a7', fontSize: '12px', textTransform: 'uppercase' }}>
            <tr>
              <th style={{ padding: '16px' }}>Transaction ID</th>
              <th style={{ padding: '16px' }}>User</th>
              <th style={{ padding: '16px' }}>Type</th>
              <th style={{ padding: '16px' }}>Amount</th>
              <th style={{ padding: '16px' }}>Status</th>
              <th style={{ padding: '16px' }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center' }}>Loading transactions...</td></tr>
            ) : transactions.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center' }}>No transactions recorded yet.</td></tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '16px', fontFamily: 'monospace', fontSize: '12px' }}>#{tx.id.substring(0, 8)}</td>
                  <td style={{ padding: '16px' }}>{tx.profiles?.username || 'Anonymous'}</td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                        {tx.type === 'subscription' ? <Zap size={14} color="#1ed760" /> : <ShoppingBag size={14} color="#a7a7a7" />}
                        {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                    </div>
                  </td>
                  <td style={{ padding: '16px', fontWeight: '700' }}>${tx.amount.toFixed(2)}</td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                        {getStatusIcon(tx.status)}
                        <span style={{ color: tx.status === 'completed' ? '#1ed760' : tx.status === 'pending' ? '#f1c40f' : '#e74c3c' }}>
                            {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                        </span>
                    </div>
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#a7a7a7' }}>
                    {new Date(tx.created_at).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionManager;
