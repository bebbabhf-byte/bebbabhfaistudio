import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, ProductOption, OrderItem, OrderItemOption } from '../types';

interface CartContextType {
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  itemCount: number;
  addToCart: (
    product: Product,
    quantity: number,
    selectedOptions: ProductOption[],
    specialInstructions?: string
  ) => void;
  updateQuantity: (itemId: string, newQty: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<OrderItem[]>(() => {
    const saved = localStorage.getItem('bebba_cart');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('bebba_cart', JSON.stringify(items));
  }, [items]);

  const deliveryFee = items.length > 0 ? 5.0 : 0.0;

  const subtotal = items.reduce((acc, item) => acc + item.itemTotal, 0);
  const totalAmount = parseFloat((subtotal + deliveryFee).toFixed(2));
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const addToCart = (
    product: Product,
    quantity: number,
    selectedOptions: ProductOption[],
    specialInstructions?: string
  ) => {
    const optionsDelta = selectedOptions.reduce((sum, opt) => sum + opt.priceDelta, 0);
    const unitPrice = product.basePrice;
    const itemTotal = parseFloat(((unitPrice + optionsDelta) * quantity).toFixed(2));

    const orderOptions: OrderItemOption[] = selectedOptions.map(opt => ({
      optionId: opt.id,
      name: opt.name,
      priceDelta: opt.priceDelta
    }));

    const newItem: OrderItem = {
      id: `cart_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      productId: product.id,
      productName: product.name,
      productImage: product.image,
      unitPrice,
      quantity,
      selectedOptions: orderOptions,
      itemTotal,
      specialInstructions
    };

    setItems(prev => [...prev, newItem]);
    setIsCartOpen(true);
  };

  const updateQuantity = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      removeItem(itemId);
      return;
    }
    setItems(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          const optionsDelta = item.selectedOptions.reduce((sum, opt) => sum + opt.priceDelta, 0);
          const itemTotal = parseFloat(((item.unitPrice + optionsDelta) * newQty).toFixed(2));
          return { ...item, quantity: newQty, itemTotal };
        }
        return item;
      })
    );
  };

  const removeItem = (itemId: string) => {
    setItems(prev => prev.filter(i => i.id !== itemId));
  };

  const clearCart = () => {
    setItems([]);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        subtotal: parseFloat(subtotal.toFixed(2)),
        deliveryFee,
        totalAmount,
        itemCount,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        isCartOpen,
        setIsCartOpen
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
