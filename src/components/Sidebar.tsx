"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';
import { useCart } from '../contexts/CartContext';
import { useExpenseCart } from '../contexts/ExpenseCartContext';
import { getItems, ItemLog } from '../lib/google-apps-script';
import { getImageSrc } from "@/lib/getImageSrc";

type NavItem = {
  label: string;
  icon: string;
  href: string;
  isExpenseCart?: boolean;
  isLowStock?: boolean;
};

const navItemsUser: NavItem[] = [
  { label: 'Order Stationery', icon: '🛒', href: '/' },
  { label: 'List Stock', icon: '📋', href: '/stock' },
  { label: 'List Out of Stock', icon: '🔴', href: '/out-stock' },
  { label: 'Admin', icon: '👤 ', href: '/admin' },
];
// Replace navItemsAdmin with navSectionsAdmin for grouped sections
const navSectionsAdmin = [
  {
    header: "Analytic & Oversight",
    items: [
      { label: 'Dashboard', icon: '📊', href: '/admin' },
      { label: 'User Requests', icon: '📥', href: '/admin/user-requests' },
      { label: 'Log History', icon: '📜', href: '/admin/log-history' },
    ] as NavItem[]
  },
  {
    header: "Inventory Management",
    items: [
      { label: 'Restock & Edit', icon: '🛠️', href: '/admin/restock' },
      { label: 'Add New Stock', icon: '➕', href: '/admin/add-stock' },
      { label: 'Low Stock Alerts', icon: '⚠️', href: '/admin/low-stock', isLowStock: true },
      { label: 'Price Stock', icon: '💰', href: '/admin/price-stock' },
    ] as NavItem[]
  },
  {
    header: "Financial & Expense",
    items: [
      { label: 'Expense Status', icon: '📊', href: '/admin/expense-status' },
      { label: 'Expense Cart', icon: '💰', href: '/admin/expense-cart', isExpenseCart: true },
    ] as NavItem[]
  }
];

export default function Sidebar({ sidebarOpen: sidebarOpenProp, setSidebarOpen: setSidebarOpenProp, role }: { sidebarOpen?: boolean, setSidebarOpen?: (open: boolean) => void, role?: 'admin' | 'user' }) {
  const pathname = usePathname();
  const [localSidebarOpen, setLocalSidebarOpen] = useState(false);
  const sidebarOpen = sidebarOpenProp !== undefined ? sidebarOpenProp : localSidebarOpen;
  const setSidebarOpen = setSidebarOpenProp || setLocalSidebarOpen;
  const navItems = role === 'admin' ? navSectionsAdmin : navItemsUser;
  const { cartItems, removeFromCart, updateQuantity, getCartTotal } = useCart();
  // Always call useExpenseCart at the top level to follow Rules of Hooks
  const expenseCart = useExpenseCart();
  // Only use expense cart values for admin
  let expenseCartItems: any[] = [];
  let removeFromExpenseCart = (index: number) => {};
  let updateExpenseItem = (index: number, item: any) => {};
  let getExpenseCartTotal = () => 0;
  if (role === 'admin' && expenseCart) {
    expenseCartItems = expenseCart.cartItems || [];
    removeFromExpenseCart = expenseCart.removeFromCart || ((index: number) => {});
    updateExpenseItem = expenseCart.updateItem || ((index: number, item: any) => {});
    getExpenseCartTotal = expenseCart.getCartTotal || (() => 0);
  }
  
  // Low stock state for admin
  const [lowStockItems, setLowStockItems] = useState<ItemLog[]>([]);
  useEffect(() => {
    if (role === 'admin') {
      getItems().then((items: ItemLog[]) => {
        setLowStockItems(items.filter((item: ItemLog) => Number(item.current) <= 5));
      }).catch(() => setLowStockItems([]));
    }
  }, [role]);

  const handleQuantityChange = (id: string, newQuantity: number) => {
    updateQuantity(id, newQuantity);
  };

  // Logout handler for admin
  const handleLogout = () => {
    localStorage.removeItem("admin_logged_in");
    window.location.href = "/admin/login";
  };

  // Hide sidebar on admin login page (after all hooks)
  if (pathname === "/admin/login") return null;

  return (
    <>
      {/* Burger menu button for mobile */}
      <button
        className={styles.burger}
        aria-label="Open sidebar menu"
        onClick={() => setSidebarOpen(true)}
        style={{ display: sidebarOpen ? 'none' : undefined }}
      >
        &#9776;
      </button>
      {/* Overlay for mobile */}
      <div
        className={styles.sidebarOverlay + (sidebarOpen ? ' ' + styles.open : '')}
        onClick={() => setSidebarOpen(false)}
        style={{ pointerEvents: sidebarOpen ? 'auto' : 'none' }}
      />
      <aside className={styles.sidebar + (sidebarOpen ? ' ' + styles.open : '')}>
        <Link href="/">
          <div className={styles.logo} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontWeight: 700, fontSize: 22, color: '#2563eb', textAlign: 'center' }}>Stationery</span>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#111', textAlign: 'center', marginTop: 2 }}>By Rubix Technology</span>
          </div>
        </Link>
        <ul className={styles.navList}>
          {role === 'admin'
            ? navSectionsAdmin.map(section => (
                <React.Fragment key={section.header}>
                  <div className={styles.sectionHeader}>{section.header}</div>
                  <ul className={styles.navList}>
                    {section.items.map(item => (
                      <li
                        key={item.href}
                        className={
                          pathname === item.href
                            ? styles.active
                            : item.isLowStock && lowStockItems.length > 0
                            ? styles.lowStockAlert
                            : ''
                        }
                        onClick={() => setSidebarOpen && setSidebarOpen(false)}
                      >
                        <Link href={item.href} className={styles.navLink}>
                          <div suppressHydrationWarning style={{ display: 'flex', alignItems: 'center', position: 'relative', gap: 8 }}>
                            <span className={styles.icon}>{item.icon}</span>
                            {item.label}
                            {/* Show badge for Expense Cart if items > 0 */}
                            {item.isExpenseCart && expenseCartItems.length > 0 && (
                              <span style={{
                                marginLeft: 8,
                                background: '#8b5cf6',
                                color: '#fff',
                                borderRadius: '50%',
                                width: 22,
                                height: 22,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: 13,
                                position: 'absolute',
                                right: -28,
                                top: '50%',
                                transform: 'translateY(-50%)',
                              }}>{expenseCartItems.length}</span>
                            )}
                            {/* Show badge for Low Stock Alerts if items > 0 */}
                            {item.isLowStock && lowStockItems.length > 0 && (
                              <span style={{ marginLeft: 6, fontWeight: 700, color: '#fff', background: '#dc2626', borderRadius: 8, padding: '2px 8px', fontSize: 12 }}>
                                {lowStockItems.length}
                              </span>
                            )}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </React.Fragment>
              ))
            : navItemsUser.map((item) => (
                <li
                  key={item.href}
                  className={pathname === item.href ? styles.active : ''}
                  onClick={() => setSidebarOpen && setSidebarOpen(false)}
                >
                  <Link href={item.href} className={styles.navLink}>
                    <div suppressHydrationWarning style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                      <span className={styles.icon}>{item.icon}</span>
                      {item.label}
                    </div>
                  </Link>
                </li>
              ))}
        </ul>
        
        {/* Cart Items Display - Only show for user role */}
        {role !== 'admin' && (
          <div className={styles.cartSection}>
            <div className={styles.cartHeader}>
              <span className={styles.cartIcon}>🛒</span>
              <span className={styles.cartTitle}>Your Order</span>
              <span className={styles.cartCount} suppressHydrationWarning>
                ({cartItems.length}/10)
              </span>
            </div>
            
            <div className={styles.cartItems}>
              {cartItems.length === 0 ? (
                <div className={styles.emptyCart}>
                  <p>No items in cart</p>
                  <p>Go to Stock List to add items</p>
                </div>
              ) : (
                <div className={styles.cartList}>
                  {cartItems.map((item) => (
                    <div key={item.id} className={styles.cartItem}>
                      {item.image && (
                        <img
                          src={getImageSrc(item.image) || ''}
                          alt={item.namaBarang}
                          className={styles.cartItemImage}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      )}
                      <div className={styles.cartItemDetails}>
                        <div className={styles.cartItemName}>{item.namaBarang}</div>
                        <div className={styles.cartItemStock}>Stock: {item.current}</div>
                      </div>
                      <div className={styles.cartItemControls}>
                        <input
                          type="number"
                          min={1}
                          max={item.current}
                          value={item.bilangan}
                          onChange={e => {
                            let val = Number(e.target.value);
                            if (val > item.current) val = item.current;
                            if (val < 1) val = 1;
                            updateQuantity(item.id, val);
                          }}
                          className={styles.cartQuantityInput}
                        />
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className={styles.cartRemoveBtn}
                          aria-label="Remove item"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Move cartTotal outside of cartItems so it is never overlapped */}
            {cartItems.length > 0 && (
              <div className={styles.cartTotal}>
                <span>Total Items: {getCartTotal()}</span>
              </div>
            )}
          </div>
        )}
        
        {/* Expense Cart Button for admin (no detailed section) */}
        {/* The Expense Cart button is now part of navItemsAdmin, so it's handled by the map above. */}
        
        {/* Logout button for admin, inside sidebar */}
        {role === 'admin' && (
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              background: '#dc2626',
              color: '#fff',
              fontWeight: 600,
              fontSize: 16,
              padding: '10px 0',
              border: 'none',
              borderRadius: 8,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        )}
      </aside>
    </>
  );
} 