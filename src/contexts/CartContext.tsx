"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
  id: string;
  namaBarang: string;
  bilangan: number;
  image?: string;
  current: number; // available stock
  limit: number; // admin-set limit
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  isInCart: (id: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('stationery-cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('stationery-cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (item: CartItem) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(cartItem => cartItem.id === item.id);
      
      if (existingItem) {
        // If item already exists, update quantity (but don't exceed admin limit)
        const maxAllowed = item.limit > 0 ? item.limit : item.current;
        const newQuantity = Math.min(existingItem.bilangan + 1, maxAllowed);
        return prevItems.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, bilangan: newQuantity }
            : cartItem
        );
      } else {
        // Check if cart is full (max 10 items)
        if (prevItems.length >= 10) {
          return prevItems; // Don't add if cart is full
        }
        // Add new item with quantity 1
        return [...prevItems, { ...item, bilangan: 1 }];
      }
    });
  };

  const removeFromCart = (id: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    setCartItems(prevItems => {
      const item = prevItems.find(cartItem => cartItem.id === id);
      if (!item) return prevItems;

      // Ensure quantity doesn't exceed admin limit (or stock if no limit set)
      const maxAllowed = item.limit > 0 ? item.limit : item.current;
      const newQuantity = Math.min(Math.max(1, quantity), maxAllowed);
      
      return prevItems.map(cartItem =>
        cartItem.id === id
          ? { ...cartItem, bilangan: newQuantity }
          : cartItem
      );
    });
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.bilangan, 0);
  };

  const isInCart = (id: string) => {
    return cartItems.some(item => item.id === id);
  };

  const value: CartContextType = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    isInCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
} 