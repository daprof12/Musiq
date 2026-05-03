import { useEffect, useState } from 'react';
import { ShoppingCart, Tag } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
}

const Store = () => {
  const { items, addItem } = useCartStore();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) {
        // Ensure price is a number (it comes as a string from DECIMAL in Supabase)
        const formattedData = data.map(p => ({
          ...p,
          price: typeof p.price === 'string' ? parseFloat(p.price) : p.price
        }));
        setProducts(formattedData);
      }
      setLoading(false);
    };

    fetchProducts();
  }, []);

  return (
    <div>
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Tag size={32} color="#1ed760" />
                Artist Merch Store
            </h1>
            <p>Support your favorite artists by purchasing listed promotion items.</p>
        </div>
        <button 
          className="btn-primary" 
          onClick={() => navigate('/checkout')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
            <ShoppingCart size={20} />
            Cart ({items.reduce((acc, item) => acc + item.quantity, 0)})
        </button>
      </header>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
        gap: '32px' 
      }}>
        {loading ? (
           Array(4).fill(0).map((_, i) => (
             <div key={i} style={{ height: '320px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}></div>
           ))
        ) : products.length === 0 ? (
          <p style={{ color: '#a7a7a7' }}>No products available in the store yet.</p>
        ) : (
          products.map((product) => (
            <div 
              key={product.id}
              className="glass"
              style={{ 
                padding: '20px', 
                borderRadius: '12px', 
                transition: 'var(--transition-smooth)'
              }}
            >
              <div style={{ 
                width: '100%', 
                aspectRatio: '1', 
                background: product.image_url ? `url(${product.image_url})` : '#282828', 
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: '8px', 
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#4d4d4d'
              }}>
                  {!product.image_url && <Tag size={48} />}
              </div>
              <div style={{ fontWeight: '700', fontSize: '18px', marginBottom: '4px' }}>{product.name}</div>
              <div style={{ fontSize: '14px', color: '#a7a7a7', marginBottom: '16px', height: '40px', overflow: 'hidden' }}>
                {product.description || 'Exclusive artist merchandise.'}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: '700', fontSize: '20px', color: '#1ed760' }}>${product.price.toFixed(2)}</div>
                  <button 
                    className="btn-primary" 
                    style={{ padding: '8px 16px', fontSize: '14px' }}
                    onClick={() => addItem({
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        artist: 'Various Artists', // In a real app, join with profiles
                        image_url: product.image_url
                    })}
                  >
                    Add to Cart
                  </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Store;
