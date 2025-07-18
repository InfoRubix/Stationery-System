"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface ExpenseCartItem {
  id: string;
  namaBarang: string;
  tier?: string; // e.g. 'Tier 1', 'Tier 2', etc.
  qty: number;
  price: number;
  image?: string;
}

interface ExpenseCartContextType {
  cartItems: ExpenseCartItem[];
  addToCart: (item: ExpenseCartItem) => void;
  removeFromCart: (index: number) => void;
  updateItem: (index: number, item: Partial<ExpenseCartItem>) => void;
  clearCart: () => void;
  getCartTotal: () => number;
}

const ExpenseCartContext = createContext<ExpenseCartContextType | undefined>(undefined);

export function ExpenseCartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<ExpenseCartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('admin-expense-cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading expense cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('admin-expense-cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (item: ExpenseCartItem) => {
    setCartItems(prevItems => {
      // Check for same id and tier
      const idx = prevItems.findIndex(
        i => i.id === item.id && i.tier === item.tier
      );
      if (idx !== -1) {
        // Update quantity
        const updated = [...prevItems];
        updated[idx] = { ...updated[idx], qty: updated[idx].qty + item.qty };
        return updated;
      }
      // Add new item
      return [...prevItems, item];
    });
  };

  const removeFromCart = (index: number) => {
    setCartItems(prevItems => prevItems.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, item: Partial<ExpenseCartItem>) => {
    setCartItems(prevItems => prevItems.map((it, i) => i === index ? { ...it, ...item } : it));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.qty * item.price), 0);
  };

  const value: ExpenseCartContextType = {
    cartItems,
    addToCart,
    removeFromCart,
    updateItem,
    clearCart,
    getCartTotal,
  };

  return (
    <ExpenseCartContext.Provider value={value}>
      {children}
    </ExpenseCartContext.Provider>
  );
}

export function useExpenseCart() {
  const context = useContext(ExpenseCartContext);
  if (context === undefined) {
    throw new Error('useExpenseCart must be used within an ExpenseCartProvider');
  }
  return context;
} 