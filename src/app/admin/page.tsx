"use client";
import { useEffect, useState } from "react";
import styles from "../page.module.css";

// Helper to get month name
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function AdminDashboard() {
  const [expenseLog, setExpenseLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [monthlyTotals, setMonthlyTotals] = useState<{ [key: string]: number }>({});
  const [currentMonthTotal, setCurrentMonthTotal] = useState(0);
  const [lastMonthTotal, setLastMonthTotal] = useState(0);

  useEffect(() => {
    fetch("/api/expenselog")
      .then(res => res.json())
      .then(data => {
        setExpenseLog(data);
        processExpenses(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load expense log");
        setLoading(false);
      });
  }, []);

  function processExpenses(data: any[]) {
    const monthly: { [key: string]: number } = {};
    let thisMonth = 0;
    let lastMonth = 0;
    const now = new Date();
    const thisMonthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthKey = `${lastMonthDate.getFullYear()}-${lastMonthDate.getMonth() + 1}`;
    data.forEach(row => {
      // Expecting DATETIME in DD/MM/YYYY HH:mm:ss
      const dateStr = row[1] || row.DATETIME;
      const totalStr = row[6] || row["TOTAL PRICE"];
      let total = parseFloat(totalStr || "0");
      if (isNaN(total)) total = 0;
      let monthKey = "";
      if (dateStr) {
        const [d, m, y] = dateStr.split(" ")[0].split("/");
        monthKey = `${y}-${parseInt(m)}`;
      }
      if (monthKey) {
        monthly[monthKey] = (monthly[monthKey] || 0) + total;
        if (monthKey === thisMonthKey) thisMonth += total;
        if (monthKey === lastMonthKey) lastMonth += total;
      }
    });
    setMonthlyTotals(monthly);
    setCurrentMonthTotal(thisMonth);
    setLastMonthTotal(lastMonth);
  }

  function getPercentageChange() {
    if (lastMonthTotal === 0) return currentMonthTotal > 0 ? 100 : 0;
    return ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
  }

  // Prepare data for chart (last 12 months)
  const chartData = (() => {
    const now = new Date();
    const arr = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      arr.push({
        label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
        value: monthlyTotals[key] || 0
      });
    }
    return arr;
  })();

  return (
    <div className={styles.dashboard}>
      <div className={styles.card}>
        <h1 className={styles.heading}>Admin Dashboard</h1>
        {loading ? (
          <div style={{ minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>
        ) : error ? (
          <div style={{ color: 'red' }}>{error}</div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 32, marginBottom: 32, flexWrap: 'wrap' }}>
              <div style={{ minWidth: 220, background: '#f3f4f6', borderRadius: 12, padding: 24, textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#374151' }}>Total Expenses (This Month)</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#2563eb', margin: '12px 0' }}>RM {currentMonthTotal.toFixed(2)}</div>
                <div style={{ fontSize: 14, color: getPercentageChange() >= 0 ? '#059669' : '#dc2626', fontWeight: 600 }}>
                  {getPercentageChange() >= 0 ? '▲' : '▼'} {Math.abs(getPercentageChange()).toFixed(1)}% vs last month
                </div>
              </div>
            </div>
            <div style={{ marginTop: 32 }}>
              <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 12 }}>Monthly Expense Trend (Last 12 Months)</div>
              <div style={{ width: '100%', maxWidth: 600, minHeight: 220, background: '#f9fafb', borderRadius: 12, padding: 24 }}>
                {/* Simple bar chart placeholder */}
                <div style={{ display: 'flex', alignItems: 'flex-end', height: 120, gap: 8 }}>
                  {chartData.map((d, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ height: `${Math.max(10, d.value / (Math.max(...chartData.map(c => c.value), 1)) * 100)}px`, width: 18, background: '#2563eb', borderRadius: 6, marginBottom: 4, transition: 'height 0.3s' }}></div>
                      <div style={{ fontSize: 11, color: '#374151' }}>{d.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 