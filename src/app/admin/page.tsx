"use client";
import { useEffect, useState } from "react";
import styles from "../page.module.css";
import { Bar, Pie } from "react-chartjs-2";
import React from "react";
import { ArcElement } from "chart.js";
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
  ArcElement,
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
  const [items, setItems] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
      // Fetch items for category lookup
    fetch("/api/items?limit=1000")
      .then(res => res.json())
      .then(data => setItems(data.items || []));
    // Fetch logs for orders
    fetch("/api/logs")
      .then(res => res.json())
      .then(data => setLogs(data || []));
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

// Build item name → category lookup
const itemCategoryMap = React.useMemo(() => {
  const map: Record<string, string> = {};
  items.forEach(item => {
    map[item["NAMA BARANG"]] = item["CATEGORY"] || "Unknown";
  });
  return map;
}, [items]);

// Filter logs for current month
const now = new Date();
const thisMonth = now.getMonth() + 1;
const thisYear = now.getFullYear();
const logsThisMonth = logs.filter(log => {
  const dateStr = log.tarikhDanMasa || log["TARIKH DAN MASA"];
  if (!dateStr) return false;
  let d;
  if (dateStr.includes("/")) {
    // Malaysian format: DD/MM/YYYY
    const [dStr, mStr, yStr] = dateStr.split(" ")[0].split("/");
    d = new Date(`${yStr}-${mStr}-${dStr}`);
  } else {
    d = new Date(dateStr);
  }
  return d.getFullYear() === thisYear && d.getMonth() + 1 === thisMonth;
});

// Aggregate: Category most purchased
const categoryCount: Record<string, number> = {};
// Aggregate: Item most ordered
const itemCount: Record<string, number> = {};
// Aggregate: Department most order
const departmentCount: Record<string, number> = {};

logsThisMonth.forEach(log => {
  (log.items || []).forEach((item: any) => {
    const name = item.namaBarang;
    const qty = parseInt(item.bilangan) || 0;
    const category = itemCategoryMap[name] || "Unknown";
    categoryCount[category] = (categoryCount[category] || 0) + qty;
    itemCount[name] = (itemCount[name] || 0) + qty;
  });
  const dept = log.department || "Unknown";
  const totalQty = (log.items || []).reduce((sum: number, item: any) => sum + (parseInt(item.bilangan) || 0), 0);
  departmentCount[dept] = (departmentCount[dept] || 0) + totalQty;
});

// Pie chart data for category (move after categoryCount is defined)
const pieColors = [
  "#2563eb", "#10b981", "#f59e42", "#f43f5e", "#a21caf", "#eab308", "#0ea5e9", "#6366f1", "#f472b6", "#22d3ee"
];
// Pie chart: Show all categories, no grouping
const pieLabels = Object.keys(categoryCount);
const pieData = Object.values(categoryCount);
const pieColorsAll = pieColors.concat(pieColors).slice(0, pieLabels.length); // repeat colors if needed

const categoryPieData = {
  labels: pieLabels,
  datasets: [
    {
      label: "Total Purchased",
      data: pieData,
      backgroundColor: pieColorsAll,
      borderWidth: 1,
    },
  ],
};

const pieOptions = {
  responsive: true,
  plugins: {
    legend: {
      display: true,
      position: "bottom" as const,
      labels: {
        boxWidth: 18,
        font: { size: 13 }
      }
    },
    tooltip: {
      callbacks: {
        label: function(context: any) {
          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
          const value = context.parsed;
          const percent = ((value / total) * 100).toFixed(1);
          return `${context.label}: ${value} (${percent}%)`;
        }
      }
    }
  }
};

// Prepare Chart.js data
const categoryChartData = {
  labels: Object.keys(categoryCount),
  datasets: [
    {
      label: "Total Purchased",
      data: Object.values(categoryCount),
      backgroundColor: "#2563eb",
    },
  ],
};

const sortedItems = Object.entries(itemCount)
  .sort((a, b) => b[1] - a[1]);
const top6Items = sortedItems.slice(0, 6);
const itemLabelsTop6 = top6Items.map(([name]) => name);
const itemDataTop6 = top6Items.map(([, value]) => value);

const itemChartData = {
  labels: itemLabelsTop6,
  datasets: [
    {
      label: "Total Ordered",
      data: itemDataTop6,
      backgroundColor: "#10b981",
    },
  ],
};

const sortedDepartments = Object.entries(departmentCount)
  .sort((a, b) => b[1] - a[1]);
const departmentLabelsSorted = sortedDepartments.map(([name]) => name);
const departmentDataSorted = sortedDepartments.map(([, value]) => value);

const departmentChartData = {
  labels: departmentLabelsSorted,
  datasets: [
    {
      label: "Total Orders",
      data: departmentDataSorted,
      backgroundColor: "#f59e42",
    },
  ],
};

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
            {/* Top Row: Expense Trend, Total Expenses, Category Pie */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2.2fr 1.2fr',
              gap: 32,
              marginBottom: 32,
              alignItems: 'stretch'
            }}>
              {/* Monthly Expense Trend */}
              <div style={{ background: '#f9fafb', borderRadius: 12, padding: 24, minWidth: 320, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 12 }}>Monthly Expense Trend (Last 12 Months)</div>
                <div style={{ height: 300 }}>
                  <Bar data={chartData} options={chartOptions} />
                </div>
              </div>
              
              <span>
              {/* Total Expenses */}
              <div style={{ background: '#f3f4f6', borderRadius: 12, padding: 24, textAlign: 'center', minWidth: 220, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#374151' }}>Total Expenses (This Month)</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#2563eb', margin: '12px 0' }}>RM {currentMonthTotal.toFixed(2)}</div>
                <div style={{ fontSize: 14, color: getPercentageChange() >= 0 ? '#059669' : '#dc2626', fontWeight: 600 }}>
                  {getPercentageChange() >= 0 ? '▲' : '▼'} {Math.abs(getPercentageChange()).toFixed(1)}% vs last month
                </div>
              </div>
              {/* Most Purchased Category Pie */}
              <div style={{ background: "#f9fafb", borderRadius: 12, padding: 24, minWidth: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 12, textAlign: 'center' }}>Most Order Category (This Month)</div>
                <div style={{ width: '100%', maxWidth: 260, height: 220, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Pie data={categoryPieData} options={{ ...pieOptions, plugins: { ...pieOptions.plugins, legend: { display: false } } }} />
                </div>
                {/* Custom 2-column legend */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '4px 16px',
                    marginTop: 12,
                    fontSize: 14,
                    justifyItems: 'start'
                  }}
                >
                  {pieLabels.map((label, i) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        display: 'inline-block',
                        width: 16,
                        height: 16,
                        background: pieColorsAll[i],
                        borderRadius: 4,
                        marginRight: 4
                      }} />
                      <span title={label}>
                        {label.length > 6 ? label.slice(0, 6) + '…' : label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              </span>
              

            </div>
            {/* Bottom Row: Most Ordered Item & Department Most Orders */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 32,
              marginTop: 0,
              alignItems: "stretch"
            }}>
              {/* Most Ordered Item */}
              <div style={{
                background: "#f9fafb",
                borderRadius: 12,
                padding: 24,
                minWidth: 320,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%'
              }}>
                <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 12, textAlign: 'center' }}>Most Ordered Item (This Month)</div>
                <div style={{ height: 250, width: '100%' }}>
                  <Bar data={itemChartData} 
                  options={{ 
                    responsive: true, 
                    plugins: { legend: { display: false } }, 
                    indexAxis: 'x',
                    scales: {
                      x: {
                        ticks: {
                          callback: function(value, index, ticks) {
                            const label = String(this.getLabelForValue(Number(value)));
                            return label.length > 12 ? label.slice(0, 6) + '…' : label;
                          },
                          maxRotation: 120,
                          minRotation: 0,
                          autoSkip: false,
                        }
                      }
                    } 
                    }} />
                </div>
              </div>
              {/* Department Most Orders */}
              <div style={{
                background: "#f9fafb",
                borderRadius: 12,
                padding: 24,
                minWidth: 320,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%'
              }}>
                <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 12, textAlign: 'center' }}>Department Most Orders (This Month)</div>
                <div style={{ height: 250, width: '100%' }}>
                  <Bar data={departmentChartData} 
                    options={{ 
                      responsive: true, 
                      plugins: { legend: { display: false } }, 
                      indexAxis: 'x',
                      scales: {
                        x: {
                          ticks: {
                            callback: function(value, index, ticks) {
                              const label = String(this.getLabelForValue(Number(value)));
                              return label.length > 6 ? label.slice(0, 6) + '…' : label;
                            },
                            maxRotation: 0,
                            minRotation: 0,
                            autoSkip: false,
                          }
                        }
                      } 
                    }} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 