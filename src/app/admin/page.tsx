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
import { DotLoader } from "@/components/ui/dot-loader";
import { getBaseCardStyle, handleCardHover, isMobile } from "@/utils/cardStyles";

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
  const [priceStock, setPriceStock] = useState<any[]>([]);

  useEffect(() => {
      // Fetch items for category lookup
    fetch("/api/items?limit=1000")
      .then(res => res.json())
      .then(data => {
        console.log("Raw items data:", data.items?.[0]); // Log first item to see structure
        setItems(data.items || []);
      });
    // Fetch logs for orders
    fetch("/api/logs")
      .then(res => res.json())
      .then(data => setLogs(data || []));
    // Fetch price stock for base prices
    fetch("/api/price-stock")
      .then(res => res.json())
      .then(data => setPriceStock(data || []));
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
    // Try different possible field names for category
    const category = item["CATEGORY"] || item["KATEGORI"] || item["Category"] || item["category"] || 
                    item["JENIS"] || item["TYPE"] || item["Type"] || item["type"] || "Unknown";
    map[item["NAMA BARANG"]] = category;
    // Debug logging to see what categories we have
    if (category === "Unknown") {
      console.log("Item with Unknown category:", item["NAMA BARANG"], "Available fields:", Object.keys(item));
    }
  });
  console.log("Category map:", map);
  return map;
}, [items]);

// Helper function to parse Malaysian datetime - subtract 1 day to keep 30/06 in June
const adjustDateForGraphFiltering = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  
  let d;
  if (dateStr.includes("/")) {
    // Malaysian format: DD/MM/YYYY HH:mm:ss
    const [datePart, timePart] = dateStr.split(" ");
    const [dStr, mStr, yStr] = datePart.split("/");
    
    // Parse the date components
    d = new Date(parseInt(yStr), parseInt(mStr) - 1, parseInt(dStr), 12, 0, 0); // Use noon
    
    // Subtract 1 day to keep dates in correct month (30/06 stays in June)
    d.setDate(d.getDate() - 1);
    
    // Debug for date changes
    if (dateStr.includes("30/06")) {
      console.log(`📅 30/06 - 1 day: "${dateStr}" → Month ${d.getMonth() + 1}, Date ${d.getDate()}`);
    }
  } else {
    d = new Date(dateStr);
    // Subtract 1 day for non-slash formats too
    d.setDate(d.getDate() - 1);
  }
  
  return d;
};

// Build monthly category data for last 6 months
const now = new Date();
const categoryMonthlyData: Record<string, Record<string, number>> = {}; // { "2025-1": { "Office": 5, "IT": 3 } }

// Process logs for last 6 months
for (let i = 5; i >= 0; i--) {
  const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
  const monthKey = `${targetDate.getFullYear()}-${targetDate.getMonth() + 1}`;
  categoryMonthlyData[monthKey] = {};
  
  const monthLogs = logs.filter(log => {
    const dateStr = log.tarikhDanMasa || log["TARIKH DAN MASA"];
    if (!dateStr) return false;
    const d = adjustDateForGraphFiltering(dateStr);
    return d.getFullYear() === targetDate.getFullYear() && d.getMonth() === targetDate.getMonth();
  });
  
  monthLogs.forEach(log => {
    // Only process approved orders for category chart
    const isApproved = log.status === "APPROVE" || log["STATUS"] === "APPROVE";
    
    if (isApproved) {
      (log.items || []).forEach((item: any) => {
        const name = item.namaBarang;
        const category = itemCategoryMap[name];
        if (category && category !== "Unknown") {
          categoryMonthlyData[monthKey][category] = (categoryMonthlyData[monthKey][category] || 0) + 1;
        }
      });
    }
  });
}

// For current month data (keep for compatibility with other charts)
const thisMonth = now.getMonth() + 1;
const thisYear = now.getFullYear();
console.log(`Current filtering: Year ${thisYear}, Month ${thisMonth}`);

const logsThisMonth = logs.filter(log => {
  const dateStr = log.tarikhDanMasa || log["TARIKH DAN MASA"];
  if (!dateStr) return false;
  
  const d = adjustDateForGraphFiltering(dateStr);
  const matches = d.getFullYear() === thisYear && d.getMonth() + 1 === thisMonth;
  
  // Debug what month 30/06 gets assigned to after +1 day
  if (dateStr.includes("30/06")) {
    console.log(`📊 30/06 filtering: Adjusted month ${d.getMonth() + 1}, Current month ${thisMonth}, Matches: ${matches}`);
  }
  
  return matches;
});

// Build item name → price lookup from PRICESTOCK (basePrice)
const itemPriceMap = React.useMemo(() => {
  const map: Record<string, number> = {};
  priceStock.forEach((priceItem: any) => {
    const itemName = priceItem["NAMA BARANG"] || priceItem.namaBarang;
    const basePrice = parseFloat(priceItem["BASE PRICE"] || priceItem.basePrice || "0");
    if (itemName && basePrice > 0) {
      map[itemName] = basePrice;
    }
  });
  return map;
}, [priceStock]);

// Aggregate: Category most purchased (with price)
const categoryCount: Record<string, number> = {};
const categoryValue: Record<string, number> = {}; // Total RM value
// Aggregate: Item most ordered (with price)
const itemCount: Record<string, number> = {};
const itemValue: Record<string, number> = {}; // Total RM value
// Aggregate: Department most order (with price)
const departmentCount: Record<string, number> = {};
const departmentValue: Record<string, number> = {}; // Total RM value

logsThisMonth.forEach(log => {
  // Only process approved orders for all charts
  const isApproved = log.status === "APPROVE" || log["STATUS"] === "APPROVE";
  
  if (isApproved) {
    (log.items || []).forEach((item: any) => {
      const name = item.namaBarang;
      const qty = parseInt(item.bilangan) || 0;
      const category = itemCategoryMap[name] || "Unknown";
      const price = itemPriceMap[name] || 0;
      const value = qty * price;
      
      // Count number of orders per category (1 per item ordered, regardless of quantity)
      categoryCount[category] = (categoryCount[category] || 0) + 1;
      categoryValue[category] = (categoryValue[category] || 0) + value;
      // Only count approved items for most ordered item chart
      itemCount[name] = (itemCount[name] || 0) + qty;
      itemValue[name] = (itemValue[name] || 0) + value;
    });
    
    // Count department orders (already approved)
    const dept = log.department || "Unknown";
    const deptValue = (log.items || []).reduce((sum: number, item: any) => {
      const qty = parseInt(item.bilangan) || 0;
      const price = itemPriceMap[item.namaBarang] || 0;
      return sum + (qty * price);
    }, 0);
    const totalQty = (log.items || []).reduce((sum: number, item: any) => sum + (parseInt(item.bilangan) || 0), 0);
    departmentCount[dept] = (departmentCount[dept] || 0) + totalQty;
    departmentValue[dept] = (departmentValue[dept] || 0) + deptValue;
  }
});

// Pie chart data for current month categories
const pieColors = [
  "#2563eb", "#10b981", "#f59e42", "#f43f5e", "#a21caf", "#eab308", "#0ea5e9", "#6366f1", "#f472b6", "#22d3ee"
];

// Get current month's category data (filtered to exclude Unknown)
const currentMonthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
const currentMonthCategories = categoryMonthlyData[currentMonthKey] || {};
const filteredCurrentCategories = Object.fromEntries(
  Object.entries(currentMonthCategories).filter(([category]) => category !== "Unknown")
);

const pieLabels = Object.keys(filteredCurrentCategories);
const pieData = Object.values(filteredCurrentCategories);
const pieColorsAll = pieColors.concat(pieColors).slice(0, pieLabels.length);

const categoryPieData = {
  labels: pieLabels,
  datasets: [
    {
      label: "Orders Count",
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

// Removed unused pie chart options

// Removed old categoryChartData - using categoryMonthlyChartData instead

const sortedItems = Object.entries(itemValue)
  .sort((a, b) => b[1] - a[1]);
const top6Items = sortedItems.slice(0, 6);
const itemLabelsTop6 = top6Items.map(([name]) => name);
const itemDataTop6 = top6Items.map(([, value]) => value);

const itemChartData = {
  labels: itemLabelsTop6,
  datasets: [
    {
      label: "Total Value (RM)",
      data: itemDataTop6,
      backgroundColor: "#10b981",
    },
  ],
};

const sortedDepartments = Object.entries(departmentValue)
  .sort((a, b) => b[1] - a[1]);
const departmentLabelsSorted = sortedDepartments.map(([name]) => name);
const departmentDataSorted = sortedDepartments.map(([, value]) => value);

const departmentChartData = {
  labels: departmentLabelsSorted,
  datasets: [
    {
      label: "Total Value (RM)",
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
    <div className={styles.dashboard} style={{ overflow: 'visible' }}>
      <div className={styles.card} style={{ overflow: 'visible' }}>
        <h1 className={styles.heading}>Admin Dashboard</h1>
        {loading ? (
          <div style={getBaseCardStyle(isMobile())} {...handleCardHover}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 120 }}>
              <DotLoader
                frames={loaderFrames}
                className="gap-0.5"
                dotClassName="dot-loader-dot"
              />
            </div>
          </div>
        ) : error ? (
          <div style={getBaseCardStyle(isMobile())} {...handleCardHover}>
            <p style={{ color: "red" }}>{error}</p>
          </div>
        ) : (
          <>
            {/* Top Row: Expense Trend, Total Expenses, Category Pie */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: window.innerWidth > 768 ? '2.2fr 1.2fr' : '1fr',
              gap: window.innerWidth > 768 ? 32 : 16,
              marginBottom: 32,
              alignItems: 'stretch',
              width: "100%",
              overflow: "hidden"
            }}>
              {/* Monthly Expense Trend */}
              <div style={{ 
                background: '#ffffff', 
                borderRadius: 16, 
                padding: window.innerWidth > 768 ? 24 : 16, 
                minWidth: 0, 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center', 
                overflow: 'hidden',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                border: '1px solid rgba(0, 0, 0, 0.05)',
                transition: 'all 0.3s ease',
                cursor: 'default'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                e.currentTarget.style.transform = 'translateY(0px)';
              }}>
                <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 12, color: '#1f2937' }}>Monthly Expense Trend (Last 12 Months)</div>
                <div style={{ height: 300, width: '100%', overflow: 'hidden' }}>
                  <Bar data={chartData} options={chartOptions} />
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
              {/* Total Expenses */}
              <div style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                borderRadius: 16, 
                padding: window.innerWidth > 768 ? 24 : 16, 
                textAlign: 'center', 
                minWidth: 0, 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                transition: 'all 0.3s ease',
                cursor: 'default'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                e.currentTarget.style.transform = 'translateY(0px) scale(1)';
              }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#ffffff' }}>Total Expenses (This Month)</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#ffffff', margin: '12px 0' }}>RM {currentMonthTotal.toFixed(2)}</div>
                <div style={{ fontSize: 14, color: getPercentageChange() >= 0 ? '#a7f3d0' : '#fecaca', fontWeight: 600 }}>
                  {getPercentageChange() >= 0 ? '▲' : '▼'} {Math.abs(getPercentageChange()).toFixed(1)}% vs last month
                </div>
              </div>
              {/* Most Order Category Pie */}
              <div style={{ 
                background: "#ffffff", 
                borderRadius: 16, 
                padding: window.innerWidth > 768 ? 24 : 16, 
                minWidth: 0, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                overflow: 'hidden',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                border: '1px solid rgba(0, 0, 0, 0.05)',
                transition: 'all 0.3s ease',
                cursor: 'default'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                e.currentTarget.style.transform = 'translateY(0px)';
              }}>
                <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 12, textAlign: 'center', color: '#1f2937' }}>Most Order Category (This Month)</div>
                <div style={{ width: '100%', maxWidth: 200, height: 180, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
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
              </div>
              

            </div>
            {/* Bottom Row: Most Ordered Item & Department Most Orders */}
            <div style={{
              display: "grid",
              gridTemplateColumns: window.innerWidth > 768 ? "1fr 1fr" : "1fr",
              gap: window.innerWidth > 768 ? 32 : 16,
              marginTop: 0,
              alignItems: "stretch",
              width: "100%",
              overflow: "hidden"
            }}>
              {/* Most Ordered Item */}
              <div style={{
                background: "#ffffff",
                borderRadius: 16,
                padding: 24,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%',
                overflow: 'hidden',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                border: '1px solid rgba(0, 0, 0, 0.05)',
                transition: 'all 0.3s ease',
                cursor: 'default'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                e.currentTarget.style.transform = 'translateY(0px)';
              }}>
                <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 12, textAlign: 'center', color: '#1f2937' }}>Most Ordered Item (This Month)</div>
                <div style={{ 
                  height: 250, 
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <Bar data={itemChartData} 
                  options={{ 
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: function(context: any) {
                            return `RM ${context.parsed.y.toFixed(2)}`;
                          }
                        }
                      }
                    }, 
                    indexAxis: 'x',
                    scales: {
                      x: {
                        ticks: {
                          callback: function(value, index, ticks) {
                            const label = String(this.getLabelForValue(Number(value)));
                            return label.length > 12 ? label.slice(0, 6) + '…' : label;
                          },
                          maxRotation: 45,
                          minRotation: 0,
                          autoSkip: false,
                          font: { size: 10 }
                        }
                      },
                      y: {
                        ticks: {
                          callback: function(tickValue: string | number) {
                            return `RM ${tickValue}`;
                          },
                          font: { size: 10 }
                        }
                      }
                    } 
                    }} />
                </div>
              </div>
              {/* Department Most Orders */}
              <div style={{
                background: "#ffffff",
                borderRadius: 16,
                padding: 24,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%',
                overflow: 'hidden',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                border: '1px solid rgba(0, 0, 0, 0.05)',
                transition: 'all 0.3s ease',
                cursor: 'default'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                e.currentTarget.style.transform = 'translateY(0px)';
              }}>
                <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 12, textAlign: 'center', color: '#1f2937' }}>Department Most Orders (This Month)</div>
                <div style={{ 
                  height: 250, 
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <Bar data={departmentChartData} 
                    options={{ 
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { 
                        legend: { display: false },
                        tooltip: {
                          callbacks: {
                            label: function(context: any) {
                              return `RM ${context.parsed.y.toFixed(2)}`;
                            }
                          }
                        }
                      }, 
                      indexAxis: 'x',
                      scales: {
                        x: {
                          ticks: {
                            callback: function(value, index, ticks) {
                              const label = String(this.getLabelForValue(Number(value)));
                              return label.length > 6 ? label.slice(0, 6) + '…' : label;
                            },
                            maxRotation: 45,
                            minRotation: 0,
                            autoSkip: false,
                            font: { size: 10 }
                          }
                        },
                        y: {
                          ticks: {
                            callback: function(tickValue: string | number) {
                              return `RM ${tickValue}`;
                            },
                            font: { size: 10 }
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