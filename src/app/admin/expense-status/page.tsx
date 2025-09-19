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
  const [printMonthFilter, setPrintMonthFilter] = useState<string>('ALL');

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

  // Get all expenses for printing with month filter
  const getAllExpensesForPrint = () => {
    let filtered = expenses;

    // Filter by month if selected
    if (printMonthFilter !== 'ALL') {
      const [year, month] = printMonthFilter.split('-');
      filtered = expenses.filter(expense => {
        const expenseDate = new Date(expense.DATETIME || expense.datetime);
        expenseDate.setHours(expenseDate.getHours() - 15); // Apply same time adjustment
        const expenseYear = expenseDate.getFullYear();
        const expenseMonth = expenseDate.getMonth() + 1;
        return expenseYear.toString() === year && expenseMonth.toString().padStart(2, '0') === month;
      });
    }

    return filtered;
  };

  // Get available months from expenses data
  const getAvailableMonths = () => {
    const monthsSet = new Set<string>();
    expenses.forEach(expense => {
      const expenseDate = new Date(expense.DATETIME || expense.datetime);
      expenseDate.setHours(expenseDate.getHours() - 15); // Apply same time adjustment
      const year = expenseDate.getFullYear();
      const month = (expenseDate.getMonth() + 1).toString().padStart(2, '0');
      monthsSet.add(`${year}-${month}`);
    });
    return Array.from(monthsSet).sort().reverse(); // Latest months first
  };

  // Cycle status filter on header click
  const handleStatusHeaderClick = () => {
    setStatusFilter(prev => prev === 'ALL' ? 'SUCCESS' : prev === 'SUCCESS' ? 'FAILED' : 'ALL');
    setPage(1); // Reset to first page on filter change
  };

  // Format date as dd/mm/yyyy for printing (using same adjustment as Malaysian format)
  const formatPrintDate = (isoDateString: string) => {
    try {
      const date = new Date(isoDateString);
      // Apply same -15 hours adjustment as formatMalaysianDateTime
      date.setHours(date.getHours() - 15);

      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return isoDateString;
    }
  };

  // Print all data with automatic PDF generation
  const handlePrintAll = () => {
    const currentDate = new Date();
    const formattedCurrentDate = `${currentDate.getDate().toString().padStart(2, '0')}/${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getFullYear()}`;

    const allExpenses = getAllExpensesForPrint();
    const monthFilterText = printMonthFilter === 'ALL' ? 'All Months' :
      (() => {
        const [year, month] = printMonthFilter.split('-');
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'];
        return `${monthNames[parseInt(month) - 1]} ${year}`;
      })();

    // Generate filename for PDF
    const filenameSuffix = printMonthFilter === 'ALL' ? 'All_Months' :
      printMonthFilter.split('-').reverse().join('_'); // Convert 2025-01 to 01_2025
    const filename = `Expense_Status_Report_${filenameSuffix}_${currentDate.getFullYear()}${(currentDate.getMonth() + 1).toString().padStart(2, '0')}${currentDate.getDate().toString().padStart(2, '0')}`;

    const printContent = `<!DOCTYPE html>
<html>
<head>
  <title>${filename}</title>
  <style>
    @page {
      margin: 15mm;
      size: A4;
      @top-left { content: ""; }
      @top-center { content: ""; }
      @top-right { content: ""; }
      @bottom-left { content: ""; }
      @bottom-center { content: ""; }
      @bottom-right { content: ""; }
    }
    * {
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background: white !important;
    }
    .header { text-align: center; margin-bottom: 30px; }
    .company-name { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
    .report-title { font-size: 18px; color: #666; }
    .report-date { font-size: 14px; color: #888; margin-top: 10px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
    th { background-color: #f5f5f5 !important; font-weight: bold; }
    .status-pending { background-color: #fef3c7 !important; color: #92400e !important; }
    .status-success { background-color: #d1fae5 !important; color: #065f46 !important; }
    .status-failed { background-color: #fee2e2 !important; color: #991b1b !important; }
    .summary { margin-top: 20px; font-size: 14px; }
    @media print {
      body { margin: 0 !important; padding: 20px !important; }
      .no-print { display: none !important; }
      @page { margin: 0 !important; }
    }
  </style>
  <script>
    window.onload = function() {
      // Auto-trigger print dialog
      setTimeout(() => {
        window.print();
      }, 500);
    };
  </script>
</head>
<body>
  <div class="header">
    <div class="company-name">Stationery Management System</div>
    <div class="report-title">Expense Status Report</div>
    <div class="report-date">Generated on: ${formattedCurrentDate}</div>
  </div>
  <div class="summary">
    <strong>Total Requests: ${allExpenses.length}</strong>
    <br><strong>Filter: ${monthFilterText}</strong>
  </div>
  <table>
    <thead>
      <tr>
        <th>No.</th>
        <th>ID</th>
        <th>Date</th>
        <th>Item Name</th>
        <th>Tier</th>
        <th>Qty</th>
        <th>Price (RM)</th>
        <th>Total (RM)</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${allExpenses.map((expense, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${expense.ID || expense.id}</td>
          <td>${formatPrintDate(expense.DATETIME || expense.datetime)}</td>
          <td>${expense["ITEM NAME"] || expense.itemName || 'N/A'}</td>
          <td>${expense["TIER QTY"] || expense.tierQty || 'N/A'}</td>
          <td>${expense.QUANTITY || expense.quantity || 'N/A'}</td>
          <td>${parseFloat(expense["TIER PRICE"] || expense.tierPrice || 0).toFixed(2)}</td>
          <td>${parseFloat(expense["TOTAL PRICE"] || expense.totalPrice || 0).toFixed(2)}</td>
          <td class="status-${(expense.STATUS || expense.status).toLowerCase()}">${expense.STATUS || expense.status}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>`;

    // Open in new window and auto-trigger print with filename suggestion
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();

      // Focus the window
      printWindow.focus();

      // Show notification
      setNotification('Print dialog opened - choose "Save as PDF" with suggested filename!');
      setTimeout(() => setNotification(''), 5000);
    } else {
      setNotification('Please allow popups to enable print functionality');
      setTimeout(() => setNotification(''), 3000);
    }
  };

  // Print single receipt with automatic PDF generation
  const handlePrintSingle = (expense: any) => {
    const currentDate = new Date();
    const formattedCurrentDate = `${currentDate.getDate().toString().padStart(2, '0')}/${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getFullYear()}`;

    // Generate filename for single receipt
    const expenseId = expense.ID || expense.id;
    const filename = `Expense_Receipt_${expenseId}_${currentDate.getFullYear()}${(currentDate.getMonth() + 1).toString().padStart(2, '0')}${currentDate.getDate().toString().padStart(2, '0')}`;

    const printContent = `<!DOCTYPE html>
<html>
<head>
  <title>${filename}</title>
  <style>
    @page {
      margin: 15mm;
      size: A4;
      @top-left { content: ""; }
      @top-center { content: ""; }
      @top-right { content: ""; }
      @bottom-left { content: ""; }
      @bottom-center { content: ""; }
      @bottom-right { content: ""; }
    }
    * {
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: white !important;
    }
    .receipt-container {
      max-width: 600px;
      width: 100%;
      background: white !important;
      padding: 30px;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
      border-radius: 8px;
    }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
    .company-name { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
    .receipt-title { font-size: 18px; color: #666; }
    .receipt-info { margin: 20px 0; }
    .info-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
    .label { font-weight: bold; color: #333; }
    .value { color: #666; }
    .status-badge { padding: 10px 20px; border-radius: 6px; font-weight: bold; text-align: center; margin: 20px 0; }
    .status-pending { background-color: #fef3c7 !important; color: #92400e !important; }
    .status-success { background-color: #d1fae5 !important; color: #065f46 !important; }
    .status-failed { background-color: #fee2e2 !important; color: #991b1b !important; }
    .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #888; }
    @media print {
      body {
        margin: 0 !important;
        background: white !important;
        display: block !important;
        min-height: auto !important;
        padding: 20px !important;
      }
      .receipt-container {
        box-shadow: none !important;
        margin: 0 auto !important;
        border-radius: 0 !important;
      }
      @page { margin: 0 !important; }
    }
  </style>
  <script>
    window.onload = function() {
      // Auto-trigger print dialog
      setTimeout(() => {
        window.print();
      }, 500);
    };
  </script>
</head>
<body>
  <div class="receipt-container">
    <div class="header">
      <div class="company-name">Stationery Management System</div>
      <div class="receipt-title">Expense Receipt</div>
    </div>
    <div class="receipt-info">
      <div class="info-row">
        <span class="label">Request ID:</span>
        <span class="value">${expense.ID || expense.id}</span>
      </div>
      <div class="info-row">
        <span class="label">Date:</span>
        <span class="value">${formatPrintDate(expense.DATETIME || expense.datetime)}</span>
      </div>
      <div class="info-row">
        <span class="label">Item Name:</span>
        <span class="value">${expense["ITEM NAME"] || expense.itemName || 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="label">Tier:</span>
        <span class="value">${expense["TIER QTY"] || expense.tierQty || 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="label">Quantity:</span>
        <span class="value">${expense.QUANTITY || expense.quantity || 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="label">Unit Price:</span>
        <span class="value">RM ${parseFloat(expense["TIER PRICE"] || expense.tierPrice || 0).toFixed(2)}</span>
      </div>
      <div class="info-row" style="border-bottom: 2px solid #333; font-size: 16px;">
        <span class="label">Total Amount:</span>
        <span class="value">RM ${parseFloat(expense["TOTAL PRICE"] || expense.totalPrice || 0).toFixed(2)}</span>
      </div>
    </div>
    <div class="status-badge status-${(expense.STATUS || expense.status).toLowerCase()}">
      Status: ${expense.STATUS || expense.status}
    </div>
    <div class="footer">
      <p>Generated on: ${formattedCurrentDate}</p>
      <p>This is a system-generated receipt.</p>
    </div>
  </div>
</body>
</html>`;

    // Open in new window and auto-trigger print with filename suggestion
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();

      // Focus the window
      printWindow.focus();

      // Show notification
      setNotification('Print dialog opened - choose "Save as PDF" with suggested filename!');
      setTimeout(() => setNotification(''), 5000);
    } else {
      setNotification('Please allow popups to enable print functionality');
      setTimeout(() => setNotification(''), 3000);
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>
              Total Requests: {expenses.length}
            </div>
            <select
              value={printMonthFilter}
              onChange={(e) => setPrintMonthFilter(e.target.value)}
              style={{
                padding: '6px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                background: '#fff',
                color: '#374151',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Months</option>
              {getAvailableMonths().map(monthKey => {
                const [year, month] = monthKey.split('-');
                const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];
                const monthName = monthNames[parseInt(month) - 1];
                return (
                  <option key={monthKey} value={monthKey}>
                    {monthName} {year}
                  </option>
                );
              })}
            </select>
            <button
              onClick={handlePrintAll}
              className={styles.primaryBtn}
              style={{
                padding: '8px 16px',
                background: '#6366f1',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              🖨️ Print All
            </button>
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
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {(expense.STATUS || expense.status) === 'PENDING' && (
                            <>
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
                            </>
                          )}
                          <button
                            onClick={() => handlePrintSingle(expense)}
                            style={{
                              padding: '4px 8px',
                              background: '#6366f1',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                            title="Print this record"
                          >
                            🖨️
                          </button>
                        </div>
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