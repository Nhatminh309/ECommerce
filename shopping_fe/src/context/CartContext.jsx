import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { cartService } from '../services/cartService';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(null);
      return null;
    }

    setLoading(true);
    try {
      const data = await cartService.getCart();
      setCart(data);
      return data;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const addToCart = async (data) => {
    const updated = await cartService.addItemToCart(data);
    setCart(updated);
    return updated;
  };

  const updateCart = async (data) => {
    const updated = await cartService.updateCartItem(data);
    setCart(updated);
    return updated;
  };

  const removeFromCart = async (productId) => {
    await cartService.removeItemFromCart(productId);
    return loadCart();
  };

  const clearCart = async () => {
    await cartService.clearCart();
    return loadCart();
  };

  const clearLocalCart = () => {
    setCart(null);
  };

  const value = useMemo(
    () => ({
      cart,
      loading,
      loadCart,
      addToCart,
      updateCart,
      removeFromCart,
      clearCart,
      clearLocalCart,
    }),
    [cart, loading, loadCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
