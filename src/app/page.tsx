"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from "./page.module.css";
import { useCart } from "../contexts/CartContext";
import { DotLoader } from "@/components/ui/dot-loader";

const loaderFrames = [
    [14, 7, 0, 8, 6, 13, 20],
    [14, 7, 13, 20, 16, 27, 21],
    [14, 20, 27, 21, 34, 24, 28],
    [27, 21, 34, 28, 41, 32, 35],
    [34, 28, 41, 35, 48, 40, 42],
    [34, 28, 41, 35, 48, 42, 46],
    [34, 28, 41, 35, 48, 42, 38],
    [34, 28, 41, 35, 48, 30, 21],
    [34, 28, 41, 48, 21, 22, 14],
    [34, 28, 41, 21, 14, 16, 27],
    [34, 28, 21, 14, 10, 20, 27],
    [28, 21, 14, 4, 13, 20, 27],
    [28, 21, 14, 12, 6, 13, 20],
    [28, 21, 14, 6, 13, 20, 11],
    [28, 21, 14, 6, 13, 20, 10],
    [14, 6, 13, 20, 9, 7, 21],
];

export default function HomePage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingItems, setFetchingItems] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { cartItems, removeFromCart, updateQuantity, clearCart } = useCart();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setFetchingItems(true);
      const response = await fetch('/api/items?page=1&limit=10000');
      if (!response.ok) {
        throw new Error('Failed to fetch items');
      }
      const data = await response.json();
      setItems(data.items || data); // support both paginated and array response
    } catch (err) {
      setError('Failed to load items');
      console.error('Error fetching items:', err);
    } finally {
      setFetchingItems(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSubmitting(true);

    if (!email || !department) {
      setError('Email and Department are required');
      setSubmitting(false);
      return;
    }
    if (cartItems.length === 0) {
      setError('Please add at least one item to your cart');
      setSubmitting(false);
      return;
    }
    // Check that all quantities are within stock
    for (const item of cartItems) {
      const found = items.find(i => i["NAMA BARANG"] === item.namaBarang);
      if (!found || item.bilangan > found["CURRENT"]) {
        setError(`Quantity for "${item.namaBarang}" exceeds available stock.`);
        setSubmitting(false);
        return;
      }
    }
    // Map cartItems to the format expected by the API
    const itemsToSend = cartItems.map(item => ({
      namaBarang: item.namaBarang,
      bilangan: item.bilangan,
    }));
    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          department,
          items: itemsToSend,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit order');
      }
      setSuccess(true);
      clearCart();
      setEmail('');
      setDepartment('');
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err) {
      console.error('Order submission error:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuantityChange = (id: string, newQuantity: number) => {
    updateQuantity(id, newQuantity);
  };

  if (fetchingItems) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.card}>
        <h1 className={styles.heading}>Order Stationery</h1>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 120 }}>
          <DotLoader
            frames={loaderFrames}
            className="gap-0.5"
            dotClassName="dot-loader-dot"
          />
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.card}>
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className={styles.heading}>Order Stationery</h1>
          <form onSubmit={handleSubmit}>
             <button type="submit" className={styles.primaryBtn} style={{ fontSize: 12 }} disabled={submitting || loading}>
             {submitting ? 'Submitting...' : 'Submit'}
             </button>
          </form>
        </div>
        {success && (
          <div style={{
            background: '#d1fae5',
            color: '#065f46',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
            border: '1px solid #a7f3d0'
          }}>
            Order submitted successfull 👌
          </div>
        )}
        {error && (
          <div style={{
            background: '#fee2e2',
            color: '#991b1b',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
            border: '1px solid #fca5a5'
          }}>
            Error: {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
        <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: "1rem",
              marginBottom: 16,
            }}
            // Responsive: stack vertically on small screens
            className="order-form-fields"
          >
            <input
              type="email"
              placeholder="Your Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={styles.input}
              required
              style={{ flex: 1, minWidth: 0 }}
            />
            <select
              value={department}
              onChange={e => setDepartment(e.target.value)}
              className={styles.input}
              required
              style={{ flex: 1, minWidth: 0 }}
            >
              <option value="" disabled>
                Select Department
              </option>
              <option value="CVK">CVK</option>
              <option value="CREATIVE DEPARTMENT">CREATIVE DEPARTMENT</option>
              <option value="ACCOUNT">ACCOUNT</option>
              <option value="HR">HR</option>
              <option value="LITIGATION">LITIGATION</option>
              <option value="SPA">SPA</option>
              <option value="LOAN">LOAN</option>
            </select>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <label style={{ fontWeight: 600 }} suppressHydrationWarning>
                Items in Cart ({cartItems.length}/10)
                {cartItems.length >= 10 && (
                  <span style={{ 
                    marginLeft: 8, 
                    fontSize: 12, 
                    color: '#dc2626', 
                    fontWeight: 500 
                  }}>
                    (Maximum reached)
                  </span>
                )}
              </label>
              {cartItems.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 4,
                    border: '1px solid #ef4444',
                    background: 'none',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 500
                  }}
                >
                  Clear Cart
                </button>
              )}
            </div>
            
            <div suppressHydrationWarning>
              {cartItems.length === 0 ? (
              <div style={{ 
                padding: '20px', 
                textAlign: 'center', 
                background: '#f9fafb', 
                borderRadius: 8, 
                border: '1px dashed #d1d5db',
                color: '#6b7280'
              }}>
                <p>No items in cart</p>
                <p style={{ fontSize: 14, marginTop: 4 }}>Go to Stock List to add items</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {cartItems.map((item) => (
                  <div key={item.id} style={{ 
                    display: 'flex', 
                    gap: 12, 
                    alignItems: 'center', 
                    padding: 12,
                    background: '#f9fafb',
                    borderRadius: 8,
                    border: '1px solid #e5eaf1'
                  }}>
                    {item.image && (
                      <img
                        src={`/${item.image}`}
                        alt={item.namaBarang}
                        style={{
                          width: 50,
                          height: 50,
                          objectFit: 'contain',
                          borderRadius: 4,
                          background: 'white'
                        }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{item.namaBarang}</div>
                      <div style={{ color: '#64748b', fontSize: 12 }}>Stock: {item.current}</div>
                    </div>
                    <input
                      type="number"
                      min={1}
                      max={item.current}
                      value={item.bilangan}
                      onChange={e => {
                        let val = Number(e.target.value);
                        if (val > item.current) val = item.current;
                        if (val < 1) val = 1;
                        handleQuantityChange(item.id, val);
                      }}
                      style={{ 
                        width: 60, 
                        padding: 6, 
                        borderRadius: 4, 
                        border: '1px solid #e5eaf1',
                        textAlign: 'center'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: '#ef4444', 
                        fontWeight: 700, 
                        fontSize: 16, 
                        cursor: 'pointer',
                        padding: 4
                      }}
                      aria-label="Remove item"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            </div>
          </div>
          <button type="submit" className={styles.primaryBtn} style={{ marginTop: 16, fontSize: 12 }} disabled={submitting || loading}>
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
}
