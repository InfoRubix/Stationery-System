"use client";
import { useEffect, useState } from "react";
import { getLogs } from "@/lib/google-apps-script";
import styles from "../../page.module.css";
// @ts-ignore
import jsPDF from "jspdf";
import { DotLoader } from "@/components/ui/dot-loader";

export default function AdminLogHistory() {
  const [logs, setLogs] = useState<any[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Helper to parse both DD/MM/YYYY and ISO date strings as Date objects
  function parseMalaysiaDate(dateString: string) {
    // If ISO, just use Date
    if (!/\d{2}\/\d{2}\/\d{4}/.test(dateString)) return new Date(dateString);
    // If DD/MM/YYYY HH:mm:ss, parse manually
    const [datePart, timePart] = dateString.split(' ');
    const [day, month, year] = datePart.split('/').map(Number);
    const [hour, minute, second] = timePart.split(':').map(Number);
    return new Date(year, month - 1, day, hour, minute, second);
  }

  useEffect(() => {
    setLoading(true);
    getLogs()
      .then((data) => {
        // Sort by latest date/time first using parseMalaysiaDate
        const sorted = data.sort((a: any, b: any) =>
          parseMalaysiaDate(b.tarikhDanMasa).getTime() - parseMalaysiaDate(a.tarikhDanMasa).getTime()
        );
        setLogs(sorted);
        setFilteredLogs(sorted.slice(0, 5)); // Only show latest 5
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredLogs(logs.slice(0, 5)); // Only show latest 5
    } else {
      const q = searchQuery.toLowerCase();
      // Sort filtered logs by date/time as well
      const filtered = logs.filter(
        (log) =>
          log.email.toLowerCase().includes(q) ||
          log.department.toLowerCase().includes(q) ||
          log.items.some((item: any) => 
            typeof item.namaBarang === 'string' ?
            item.namaBarang.toLowerCase().includes(q)
            : String(item.namaBarang).toLowerCase().includes(q)
        )
      );
      const sortedFiltered = filtered.sort((a: any, b: any) =>
        parseMalaysiaDate(b.tarikhDanMasa).getTime() - parseMalaysiaDate(a.tarikhDanMasa).getTime()
      );
      setFilteredLogs(sortedFiltered.slice(0, 5)); // Only show latest 5 matching
    }
  }, [searchQuery, logs]);

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value);
  const handleSearch = () => setSearchQuery(search);
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleDownloadPDFForLog = (log: any) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4'
    });

    // Title
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('STATIONERY ORDER FORM', 40, 60);

    // Order info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Order by : `, 40, 90);
    doc.setFont('helvetica', 'bold');
    doc.text(`${log.email}`, 100, 90);

    doc.setFont('helvetica', 'normal');
    doc.text(`Date Order : `, 40, 110);
    doc.setFont('helvetica', 'bold');
    doc.text(`${formatDateTime(log.tarikhDanMasa)}`, 110, 110);

    doc.setFont('helvetica', 'normal');
    doc.text(`Department: `, 40, 130);
    doc.setFont('helvetica', 'bold');
    doc.text(`${log.department}`, 110, 130);

    // Table headers
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Nama Barang', 50, 170);
    doc.text('Bilangan Barang', 350, 170);

    // Table rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    let y = 195; // padding top
    const maxRows = 10;
    const colLeft = 50;
    const colRight = 350;
    const colCenter = (colLeft + colRight) / 2;

    for (let i = 0; i < maxRows; i++) {
    const item = log.items[i];
    doc.text(item ? item.namaBarang : '', 50, y);
    if (item) {
        const qtyText = String(item.bilangan);
        const textWidth = doc.getTextWidth(qtyText);
        doc.text(qtyText, colCenter - textWidth / 2, y);
    } else {
        doc.text('', colCenter, y);
    }
    y += 25;
    }

    // Draw table lines
    // Horizontal lines
    doc.setLineWidth(1);
    doc.line(40, 155, 500, 155); // top
    doc.line(40, 180, 500, 180); // header bottom
    for (let i = 1; i <= maxRows; i++) {
      doc.line(40, 180 + i * 25, 500, 180 + i * 25);
    }
    // Vertical lines
    doc.line(40, 155, 40, 180 + maxRows * 25);
    doc.line(340, 155, 340, 180 + maxRows * 25);
    doc.line(500, 155, 500, 180 + maxRows * 25);

    doc.save(`order-${log.id}.pdf`);
  };

  // Helper to display date/time in Malaysia time, supporting both DD/MM/YYYY and ISO formats
  function formatDateTime(dateString: string) {
    if (!dateString) return '-';
    // If already in DD/MM/YYYY format, just return as-is
    if (/\d{2}\/\d{2}\/\d{4}/.test(dateString)) return dateString;
    // If ISO, parse and subtract 15 hours to get Malaysia time
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    // Subtract 15 hours to convert to Malaysia time
    const malaysiaTime = new Date(date.getTime() - (15 * 60 * 60 * 1000));
    
    const pad = (n: number) => n.toString().padStart(2, '0');
    const day = pad(malaysiaTime.getDate());
    const month = pad(malaysiaTime.getMonth() + 1);
    const year = malaysiaTime.getFullYear();
    const hours = pad(malaysiaTime.getHours());
    const minutes = pad(malaysiaTime.getMinutes());
    const seconds = pad(malaysiaTime.getSeconds());
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }

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

  return (
    <div className={styles.dashboard}>
      <div className={styles.card} style={{ overflowX: "auto" }}>
        <h1 className={styles.heading}>Log History</h1>
        <div className={styles.searchRow}>
          <input
            type="text"
            placeholder="Search by email, department, or item name..."
            value={search}
            onChange={handleSearchInput}
            onKeyDown={handleSearchKeyDown}
            className={styles.searchInput}
          />
          <button
            className={styles.primaryBtn + " " + styles.searchButton}
            type="button"
            onClick={handleSearch}
          >
            Search
          </button>
        </div>
        <table className={styles.adminTable}>
          <thead>
            <tr>
              <th>Date/Time</th>
              <th>Email</th>
              <th>Department</th>
              <th>Items</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5}>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 120 }}>
                    <div className="flex items-center gap-5 rounded bg-black px-4 py-3 text-white">
                      <DotLoader
                        frames={loaderFrames}
                        className="gap-0.5"
                        dotClassName="dot-loader-dot"
                      />
                    </div>
                  </div>
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr><td colSpan={5}>No logs found.</td></tr>
            ) : (
              filteredLogs.map((log, idx) => (
                <tr key={log.id} className={idx % 2 === 0 ? styles.zebra : ""}>
                  <td>{formatDateTime(log.tarikhDanMasa)}</td>
                  <td>{log.email}</td>
                  <td>{log.department}</td>
                  <td>
                    {log.items.map((item: any, i: number) => (
                      <div key={i} style={{
                        background: "#f3f4f6",
                        borderRadius: 8,
                        padding: "6px 10px",
                        marginBottom: 6,
                        fontWeight: 500,
                        fontSize: "0.98em",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}>
                        <span>{item.namaBarang}</span>
                        <span style={{ color: "#64748b", marginLeft: 8 }}>x{item.bilangan}</span>
                      </div>
                    ))}
                  </td>
                  <td style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {log.status}
                    <button
                      className={styles.primaryBtn}
                      type="button"
                      style={{ marginTop: 6, fontSize: 12, padding: '4px 8px' }}
                      onClick={() => handleDownloadPDFForLog(log)}
                    >
                      Download PDF
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 