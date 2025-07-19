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
  [28, 21, 14, 10, 20, 27],
  [28, 21, 14, 4, 13, 20, 27],
  [28, 21, 14, 12, 6, 13, 20],
  [28, 21, 14, 6, 13, 20, 11],
  [28, 21, 14, 6, 13, 20, 10],
  [14, 6, 13, 20, 9, 7, 21],
];

const ITEMS_PER_PAGE = 10;

export default function ExpenseStatusPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [notification, setNotification] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'FAILED'>('ALL');

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
      let expensesData = [];
      if (Array.isArray(data)) {
        expensesData = data;
      } else if (data && Array.isArray(data.expenses)) {
        expensesData = data.expenses;
      } else if (data && Array.isArray(data.data)) {
        expensesData = data.data;
      } else {
        expensesData = [];
      }

      // Find all pending
      const pendingExpenses = expensesData.filter(
        (expense: any) => (expense.STATUS || expense.status) === 'PENDING'
      );

      let displayExpenses;
      if (pendingExpenses.length > 0) {
        displayExpenses = pendingExpenses;
      } else {
        displayExpenses = expensesData;
      }

      // Sort latest first
      displayExpenses = displayExpenses.sort((a: any, b: any) => {
        const dateA = new Date(a.DATETIME || a.datetime || 0);
        const dateB = new Date(b.DATETIME || b.datetime || 0);
        return dateB.getTime() - dateA.getTime();
      });

      setExpenses(displayExpenses);
      setTotalPages(Math.ceil(displayExpenses.length / ITEMS_PER_PAGE));
    } catch (err) {
      setError("Failed to load expenses");
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
        setNotification(`Status updated to ${status}`);
        setTimeout(() => setNotification(''), 3000);
      } else {
        throw new Error(result.error || 'Failed to update status');
      }
    } catch (err: any) {
      setNotification(`Error: ${err.message}`);
      setTimeout(() => setNotification(''), 3000);
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

  // Convert ISO date to Malaysian format (UTC+8)
  const formatMalaysianDateTime = (isoDateString: string) => {
    try {
      const date = new Date(isoDateString);
      // minus 15 hours to convert from UTC to Malaysian time (UTC+8)
      date.setHours(date.getHours() - 15);
      
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');
      
      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return isoDateString; // Return original if parsing fails
    }
  };

  // Get paginated expenses with status filter
  const getPaginatedExpenses = () => {
    let filtered = expenses;
    if (statusFilter === 'SUCCESS') {
      filtered = expenses.filter(e => (e.STATUS || e.status) === 'SUCCESS');
    } else if (statusFilter === 'FAILED') {
      filtered = expenses.filter(e => (e.STATUS || e.status) === 'FAILED');
    }
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filtered.slice(startIndex, endIndex);
  };

  // Cycle status filter on header click
  const handleStatusHeaderClick = () => {
    setStatusFilter(prev => prev === 'ALL' ? 'SUCCESS' : prev === 'SUCCESS' ? 'FAILED' : 'ALL');
    setPage(1); // Reset to first page on filter change
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

  const paginatedExpenses = getPaginatedExpenses();

  return (
    <div className={styles.dashboard}>
      {notification && (
        <div style={{
          position: 'fixed',
          top: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          background: notification.includes('Error') ? '#dc2626' : '#2563eb',
          color: '#fff',
          padding: '12px 32px',
          borderRadius: 8,
          fontWeight: 600,
          fontSize: 16,
          zIndex: 2000,
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
        }}>
          {notification}
        </div>
      )}
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
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className={styles.adminTable}>
                <thead>
                  <tr>
                    <th>No.</th>
                    <th>ID</th>
                    <th>Date/Time</th>
                    <th>Item Name</th>
                    <th>Tier</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                    <th
                      style={{ cursor: 'pointer', userSelect: 'none', background: '#f3f4f6' }}
                      onClick={handleStatusHeaderClick}
                      title="Click to filter by status"
                    >
                      Status{' '}
                      <span style={{ fontWeight: 400, fontSize: 14, marginLeft: 4, verticalAlign: 'middle' }}>
                        {statusFilter === 'ALL' && '⬍(Default)'}
                        {statusFilter === 'SUCCESS' && '✔️'}
                        {statusFilter === 'FAILED' && '❌'}
                      </span>
                      {statusFilter !== 'ALL' && (
                        <span style={{ fontWeight: 400, fontSize: 12, marginLeft: 4 }}>
                          ({statusFilter})
                        </span>
                      )}
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedExpenses.map((expense, index) => (
                    <tr key={`${expense.ID || expense.id}-${index}`}>
                      <td>{(page - 1) * ITEMS_PER_PAGE + index + 1}</td>
                      <td>{expense.ID || expense.id}</td>
                      <td>{formatMalaysianDateTime(expense.DATETIME || expense.datetime)}</td>
                      <td>{expense["ITEM NAME"] || expense.itemName || 'N/A'}</td>
                      <td>{expense["TIER QTY"] || expense.tierQty || 'N/A'}</td>
                      <td>{expense.QUANTITY || expense.quantity || 'N/A'}</td>
                      <td>RM {parseFloat(expense["TIER PRICE"] || expense.tierPrice || 0).toFixed(2)}</td>
                      <td>RM {parseFloat(expense["TOTAL PRICE"] || expense.totalPrice || 0).toFixed(2)}</td>
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
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 8,
                marginTop: 24,
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className={styles.primaryBtn}
                  style={{
                    padding: '8px 16px',
                    opacity: page === 1 ? 0.5 : 1,
                    cursor: page === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Previous
                </button>
                <span style={{
                  padding: '8px 16px',
                  background: '#f3f4f6',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className={styles.primaryBtn}
                  style={{
                    padding: '8px 16px',
                    opacity: page === totalPages ? 0.5 : 1,
                    cursor: page === totalPages ? 'not-allowed' : 'pointer'
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 