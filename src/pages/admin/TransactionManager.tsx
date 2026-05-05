import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { CheckCircle, Clock, XCircle, ShoppingBag, Zap, Globe } from 'lucide-react';

interface Transaction {
  id: string;
  amount: number;
  currency?: string;
  status: string;
  type: string;
  provider?: string;
  reference?: string;
  created_at: string;
  profiles: {
    username: string;
  };
}

const PROVIDER_BADGE: Record<string, { label: string; color: string }> = {
  netreward: { label: 'NetReward', color: '#1ed760' },
  stripe:    { label: 'Stripe',    color: '#6772e5' },
  paystack:  { label: 'Paystack',  color: '#00c3f7' },
};

const TransactionManager = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'subscription' | 'merch'>('all');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    const { data } = await supabase
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
      case 'pending':   return <Clock size={16} color="#f1c40f" />;
      case 'failed':    return <XCircle size={16} color="#e74c3c" />;
      default:          return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#1ed760';
      case 'pending':   return '#f1c40f';
      case 'failed':    return '#e74c3c';
      default:          return '#a7a7a7';
    }
  };

  const filtered = filter === 'all'
    ? transactions
    : transactions.filter(tx => tx.type === filter);

  // Totals
  const completedTotal = transactions
    .filter(tx => tx.status === 'completed')
    .reduce((acc, tx) => acc + tx.amount, 0);

  return (
    <div>
      <header style={{ marginBottom: '32px' }}>
        <h2>Transaction History</h2>
        <p style={{ color: '#a7a7a7' }}>Monitor all NetReward payments and subscription activities.</p>
      </header>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Total Transactions', value: transactions.length, color: '#a7a7a7' },
          { label: 'Completed Revenue', value: `$${completedTotal.toFixed(2)}`, color: '#1ed760' },
          { label: 'Pending / Failed', value: transactions.filter(t => t.status !== 'completed').length, color: '#f1c40f' },
        ].map((stat) => (
          <div key={stat.label} className="glass" style={{ padding: '20px', borderRadius: '12px' }}>
            <div style={{ fontSize: '28px', fontWeight: '700', color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '13px', color: '#a7a7a7', marginTop: '4px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {(['all', 'subscription', 'merch'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: 'none',
              background: filter === f ? '#1ed760' : 'rgba(255,255,255,0.08)',
              color: filter === f ? 'black' : '#a7a7a7',
              cursor: 'pointer',
              fontWeight: filter === f ? '700' : '400',
              fontSize: '13px',
              transition: 'all 0.2s',
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <button
          onClick={fetchTransactions}
          style={{
            marginLeft: 'auto',
            padding: '8px 16px',
            borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'transparent',
            color: '#a7a7a7',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Table */}
      <div className="glass" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'rgba(255,255,255,0.05)', color: '#a7a7a7', fontSize: '12px', textTransform: 'uppercase' }}>
            <tr>
              <th style={{ padding: '16px' }}>Transaction ID</th>
              <th style={{ padding: '16px' }}>User</th>
              <th style={{ padding: '16px' }}>Type</th>
              <th style={{ padding: '16px' }}>Provider</th>
              <th style={{ padding: '16px' }}>Amount</th>
              <th style={{ padding: '16px' }}>Status</th>
              <th style={{ padding: '16px' }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#a7a7a7' }}>Loading transactions…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#a7a7a7' }}>No transactions recorded yet.</td></tr>
            ) : (
              filtered.map((tx) => {
                const provider = PROVIDER_BADGE[tx.provider ?? ''] ?? { label: tx.provider ?? '—', color: '#a7a7a7' };
                return (
                  <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '16px', fontFamily: 'monospace', fontSize: '12px', color: '#a7a7a7' }}>
                      #{tx.id.substring(0, 8)}
                    </td>
                    <td style={{ padding: '16px' }}>{tx.profiles?.username || 'Anonymous'}</td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                        {tx.type === 'subscription' ? <Zap size={14} color="#1ed760" /> : <ShoppingBag size={14} color="#a7a7a7" />}
                        {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '3px 10px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: `${provider.color}18`,
                        color: provider.color,
                        border: `1px solid ${provider.color}40`,
                      }}>
                        <Globe size={11} />
                        {provider.label}
                      </span>
                    </td>
                    <td style={{ padding: '16px', fontWeight: '700' }}>
                      ${tx.amount.toFixed(2)}
                      {tx.currency && tx.currency !== 'USD' && (
                        <span style={{ fontSize: '11px', color: '#a7a7a7', marginLeft: '4px' }}>{tx.currency}</span>
                      )}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                        {getStatusIcon(tx.status)}
                        <span style={{ color: getStatusColor(tx.status) }}>
                          {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '16px', fontSize: '13px', color: '#a7a7a7' }}>
                      {new Date(tx.created_at).toLocaleString()}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionManager;
