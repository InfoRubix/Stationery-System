"use client";
import { useEffect, useState } from "react";
import styles from "../../page.module.css";
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

export default function ExpenseStatusPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch('/api/expenses');
      if (!response.ok) throw new Error("Failed to fetch expenses");
      const data = await response.json();
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setExpenses(data);
      } else if (data && Array.isArray(data.expenses)) {
        setExpenses(data.expenses);
      } else if (data && Array.isArray(data.data)) {
        setExpenses(data.data);
      } else {
        console.warn('Unexpected data format:', data);
        setExpenses([]);
      }
    } catch (err) {
      setError("Failed to load expenses");
      console.error("Error fetching expenses:", err);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: 'SUCCESS' | 'FAILED') => {
    setUpdatingId(id);
    try {
      const formData = new FormData();
      formData.append('action', 'updateExpenseStatus');
      formData.append('id', id);
      formData.append('status', status);

      const response = await fetch('/api/expenses', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to update status');
      
      const result = await response.json();
      if (result.success) {
        // Refresh the list
        fetchExpenses();
        alert(`Status updated to ${status}`);
      } else {
        throw new Error(result.error || 'Failed to update status');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
      console.error("Error updating status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '#f59e0b';
      case 'SUCCESS':
        return '#10b981';
      case 'FAILED':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.card}>
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

  if (error) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.card}>
          <p style={{ color: "red" }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 className={styles.heading}>Expense Status</h1>
          <div style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>
            Total Requests: {expenses.length}
          </div>
        </div>

        {expenses.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#6b7280', fontSize: 16, padding: 32 }}>
            No expense requests found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Date/Time</th>
                  <th>Item Name</th>
                  <th>Tier</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>PDF</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense, index) => {
                  // Parse items from JSON string if needed
                  let items = [];
                  try {
                    if (typeof expense.ITEMS === 'string') {
                      items = JSON.parse(expense.ITEMS);
                    } else if (Array.isArray(expense.ITEMS)) {
                      items = expense.ITEMS;
                    }
                  } catch (e) {
                    console.warn('Failed to parse items:', e);
                  }
                  
                  return (
                    <tr key={`${expense.ID || expense.id}-${index}`}>
                      <td>{expense.ID || expense.id}</td>
                      <td>{expense.DATETIME || expense.datetime}</td>
                      <td>
                        {items.length > 0 ? (
                          <div>
                            {items.map((item: any, itemIndex: number) => (
                              <div key={itemIndex} style={{ marginBottom: '4px' }}>
                                {item.namaBarang} (Qty: {item.qty}, Tier: {item.tier})
                              </div>
                            ))}
                          </div>
                        ) : (
                          'No items'
                        )}
                      </td>
                      <td>
                        {items.length > 0 ? (
                          <div>
                            {items.map((item: any, itemIndex: number) => (
                              <div key={itemIndex} style={{ marginBottom: '4px' }}>
                                {item.tier}
                              </div>
                            ))}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        {items.length > 0 ? (
                          <div>
                            {items.map((item: any, itemIndex: number) => (
                              <div key={itemIndex} style={{ marginBottom: '4px' }}>
                                {item.qty}
                              </div>
                            ))}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        {items.length > 0 ? (
                          <div>
                            {items.map((item: any, itemIndex: number) => (
                              <div key={itemIndex} style={{ marginBottom: '4px' }}>
                                RM {parseFloat(item.price || 0).toFixed(2)}
                              </div>
                            ))}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>RM {parseFloat(expense["TOTAL AMOUNT"] || expense.totalAmount || 0).toFixed(2)}</td>
                      <td>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#fff',
                          background: getStatusColor(expense.STATUS || expense.status)
                        }}>
                          {expense.STATUS || expense.status}
                        </span>
                      </td>
                      <td>
                        {expense["PDF DATA"] || expense.pdfData ? (
                          <a
                            href={expense["PDF DATA"] || expense.pdfData}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: '#2563eb',
                              textDecoration: 'none',
                              fontWeight: '600'
                            }}
                          >
                            View PDF
                          </a>
                        ) : (
                          'No PDF'
                        )}
                      </td>
                      <td>
                        {(expense.STATUS || expense.status) === 'PENDING' && (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              onClick={() => handleStatusUpdate(expense.ID || expense.id, 'SUCCESS')}
                              disabled={updatingId === (expense.ID || expense.id)}
                              style={{
                                padding: '4px 8px',
                                background: '#10b981',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: updatingId === (expense.ID || expense.id) ? 'not-allowed' : 'pointer',
                                opacity: updatingId === (expense.ID || expense.id) ? 0.6 : 1
                              }}
                            >
                              {updatingId === (expense.ID || expense.id) ? 'Updating...' : 'Success'}
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(expense.ID || expense.id, 'FAILED')}
                              disabled={updatingId === (expense.ID || expense.id)}
                              style={{
                                padding: '4px 8px',
                                background: '#ef4444',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: updatingId === (expense.ID || expense.id) ? 'not-allowed' : 'pointer',
                                opacity: updatingId === (expense.ID || expense.id) ? 0.6 : 1
                              }}
                            >
                              {updatingId === (expense.ID || expense.id) ? 'Updating...' : 'Failed'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 