"use client";
import { useEffect, useState } from "react";
import styles from "../page.module.css";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

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
        console.log('Raw API response:', data);
        setExpenseLog(data);
        processExpenses(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('API error:', error);
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
      const dateStr = row.DATETIME || row[1];
      const totalStr = row["TOTAL PRICE"] || row[6];
      let total = parseFloat(totalStr || "0");
      if (isNaN(total)) total = 0;
      let monthKey = "";
      if (dateStr) {
        let year, month;
        if (dateStr.includes("/")) {
          // Malaysian format: DD/MM/YYYY
          const [d, m, y] = dateStr.split(" ")[0].split("/");
          year = parseInt(y);
          month = parseInt(m);
        } else if (dateStr.includes("T")) {
          // ISO format: 2025-07-19T10:42:18.000Z
          const d = new Date(dateStr);
          year = d.getFullYear();
          month = d.getMonth() + 1;
        }
        if (year && month) {
          monthKey = `${year}-${month}`;
        }
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

  // Prepare data for Chart.js (last 12 months)
  const chartLabels: string[] = [];
  const chartValues: number[] = [];
  (() => {
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      chartLabels.push(`${monthNames[d.getMonth()]} ${d.getFullYear()}`);
      chartValues.push(monthlyTotals[key] || 0);
    }
  })();

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: "Monthly Expenses (RM)",
        data: chartValues,
        backgroundColor: "#2563eb",
        borderRadius: 8,
        borderSkipped: false,
        barPercentage: 0.7,
        categoryPercentage: 0.8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `RM ${context.parsed.y.toFixed(2)}`;
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(this: any, tickValue: string | number) {
            return `RM ${tickValue}`;
          }
        },
        grid: {
          color: "#e5e7eb",
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        }
      }
    },
  };

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
            <div style={{ display: 'flex', gap: 32, marginBottom: 32, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              {/* Left: Bar Chart */}
              <div style={{ flex: 2, minWidth: 320, background: '#f9fafb', borderRadius: 12, padding: 24 }}>
                <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 12 }}>Monthly Expense Trend (Last 12 Months)</div>
                <div style={{ height: 300 }}>
                  <Bar data={chartData} options={chartOptions} />
                </div>
              </div>
              
              {/* Right: Total Expense Card */}
              <div style={{ flex: 1, minWidth: 220, background: '#f3f4f6', borderRadius: 12, padding: 24, textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#374151' }}>Total Expenses (This Month)</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#2563eb', margin: '12px 0' }}>RM {currentMonthTotal.toFixed(2)}</div>
                <div style={{ fontSize: 14, color: getPercentageChange() >= 0 ? '#059669' : '#dc2626', fontWeight: 600 }}>
                  {getPercentageChange() >= 0 ? '▲' : '▼'} {Math.abs(getPercentageChange()).toFixed(1)}% vs last month
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 