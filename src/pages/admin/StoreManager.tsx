import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Trash2, Edit2, ShoppingBag, X, Package, Upload, Loader2 } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock_quantity: number;
}

const StoreManager = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    image_url: '',
    stock_quantity: 0
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setProducts(data);
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('covers') // Reusing covers bucket for products
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('covers')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
    } catch (error: any) {
      alert('Error uploading image: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (editingProduct) {
      await supabase.from('products').update(formData).eq('id', editingProduct.id);
    } else {
      await supabase.from('products').insert([formData]);
    }

    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData({ name: '', description: '', price: 0, image_url: '', stock_quantity: 0 });
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await supabase.from('products').delete().eq('id', id);
      fetchProducts();
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h2>Merchandise Management</h2>
        <button 
          className="btn-primary" 
          onClick={() => {
            setEditingProduct(null);
            setFormData({ name: '', description: '', price: 0, image_url: '', stock_quantity: 0 });
            setIsModalOpen(true);
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={20} /> Add New Product
        </button>
      </div>

      <div className="glass" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'rgba(255,255,255,0.05)', color: '#a7a7a7', fontSize: '12px', textTransform: 'uppercase' }}>
            <tr>
              <th style={{ padding: '16px' }}>Product</th>
              <th style={{ padding: '16px' }}>Price</th>
              <th style={{ padding: '16px' }}>Stock</th>
              <th style={{ padding: '16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && !products.length ? (
              <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center' }}>Loading products...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center' }}>No products found. Add your first merch item!</td></tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        background: product.image_url ? `url(${product.image_url})` : '#282828',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        borderRadius: '4px' 
                      }}>
                        {!product.image_url && <ShoppingBag size={20} style={{ margin: '10px' }} />}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600' }}>{product.name}</div>
                        <div style={{ fontSize: '12px', color: '#a7a7a7' }}>{product.description?.substring(0, 30)}...</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px', fontWeight: '600', color: '#1ed760' }}>${product.price}</td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Package size={16} color="#a7a7a7" />
                        {product.stock_quantity}
                    </div>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => {
                          setEditingProduct(product);
                          setFormData({ 
                            name: product.name, 
                            description: product.description, 
                            price: product.price, 
                            image_url: product.image_url, 
                            stock_quantity: product.stock_quantity 
                          });
                          setIsModalOpen(true);
                        }}
                        style={{ background: 'none', border: 'none', color: '#a7a7a7', cursor: 'pointer' }}
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer' }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass" style={{ width: '100%', maxWidth: '500px', padding: '32px', borderRadius: '16px', position: 'relative' }}>
            <button 
              onClick={() => setIsModalOpen(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#a7a7a7', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
            <h2 style={{ marginBottom: '24px' }}>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input 
                placeholder="Product Name" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                required 
              />
              <textarea 
                placeholder="Description" 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
                style={{ 
                    background: 'rgba(255,255,255,0.05)', 
                    border: '1px solid transparent', 
                    padding: '12px 16px', 
                    borderRadius: '8px', 
                    color: 'white', 
                    minHeight: '80px',
                    fontFamily: 'inherit'
                }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                    <label style={{ fontSize: '12px', color: '#a7a7a7', display: 'block', marginBottom: '4px' }}>Price ($)</label>
                    <input 
                      type="number"
                      step="0.01"
                      placeholder="0.00" 
                      value={formData.price} 
                      onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} 
                    />
                </div>
                <div>
                    <label style={{ fontSize: '12px', color: '#a7a7a7', display: 'block', marginBottom: '4px' }}>Stock Qty</label>
                    <input 
                      type="number"
                      placeholder="0" 
                      value={formData.stock_quantity} 
                      onChange={e => setFormData({...formData, stock_quantity: parseInt(e.target.value)})} 
                    />
                </div>
              </div>
              
              <div style={{ border: '1px dashed rgba(255,255,255,0.2)', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    {uploading ? <Loader2 size={24} className="animate-spin" /> : <Upload size={24} />}
                    <span style={{ fontSize: '14px' }}>{formData.image_url ? 'Product image uploaded ✅' : 'Upload Product Image'}</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
              </div>

              <button className="btn-primary" style={{ marginTop: '12px' }} disabled={loading || uploading}>
                {loading ? 'Saving...' : 'Save Product'}
              </button>
            </form>
          </div>
        </div>
      )}
      <style>{`
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default StoreManager;
