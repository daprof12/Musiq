import { create } from 'zustand';

interface Product {
  id: string;
  name: string;
  price: number;
  artist: string;
  image_url: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  total: number;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  total: 0,
  addItem: (product) => set((state) => {
    const existingItem = state.items.find((item) => item.id === product.id);
    let newItems;
    if (existingItem) {
      newItems = state.items.map((item) =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      newItems = [...state.items, { ...product, quantity: 1 }];
    }
    const newTotal = newItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    return { items: newItems, total: newTotal };
  }),
  removeItem: (productId) => set((state) => {
    const newItems = state.items.filter((item) => item.id !== productId);
    const newTotal = newItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    return { items: newItems, total: newTotal };
  }),
  clearCart: () => set({ items: [], total: 0 }),
}));
