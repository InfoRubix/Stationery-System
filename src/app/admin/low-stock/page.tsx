"use client";
import { useEffect, useState, useRef } from "react";
import { getItems } from "@/lib/google-apps-script";
import styles from "../../page.module.css";
import { DotLoader } from "@/components/ui/dot-loader";
// @ts-ignore
import jsPDF from "jspdf";

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

const ITEMS_PER_PAGE = 10;

export default function LowStockPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [modalItem, setModalItem] = useState<any | null>(null);
  const [restockQty, setRestockQty] = useState(1);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    fetchLowStock();
  }, []);

  const fetchLowStock = async () => {
    setLoading(true);
    getItems()
      .then((allItems: any[]) => {
        const lowStock = allItems.filter(item => Number(item["CURRENT"]) < 5);
        setItems(lowStock);
      })
      .finally(() => setLoading(false));
  };

  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const paginatedItems = items.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // PDF generation
  const handleDownloadPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageHeight = 800;
    const rowHeight = 25;
    const headerY = 120; // 15px more space after 'Generated'
    const startY = headerY + rowHeight + 5;
    const tableTopY = 115;
    const tableLeftX = 40;
    const tableRightX = 500;
    const tableMiddleX = 340;

    // Helper for date formatting
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const formattedDate = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Low Stock Report', 40, 60); // Left align title
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${formattedDate}`, 40, 90);

    // Table drawing logic
    let i = 0;
    while (i < items.length) {
      // Draw header and table grid for this page
      doc.setFillColor(243, 244, 246);
      doc.rect(tableLeftX, headerY - 15, tableRightX - tableLeftX, rowHeight + 10, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('Item Name', 50, headerY);
      doc.text('Current Stock', 350, headerY);
      // Draw top border for the table
      doc.setLineWidth(1);
      doc.line(tableLeftX, headerY - 15, tableRightX, headerY - 15); // top border
      // Draw horizontal line after header
      doc.line(tableLeftX, headerY + 10, tableRightX, headerY + 10);
      // Prepare to draw rows
      let y = headerY + rowHeight + 5;
      let rowsOnPage = 0;
      let pageRowStartY = headerY - 15;
      let pageRowEndY = 0;
      // Draw up to as many rows as fit on this page
      while (i < items.length && y + rowHeight <= pageHeight) {
        // Draw row background (zebra striping)
        if (i % 2 === 1) {
          doc.setFillColor(249, 250, 251);
          doc.rect(tableLeftX, y - rowHeight + 10, tableRightX - tableLeftX, rowHeight, 'F');
        }
        // Draw text
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        const item = items[i];
        doc.text(item["NAMA BARANG"] || item.namaBarang || '', 50, y);
        doc.text(String(item["CURRENT"]), 350, y);
        // Draw horizontal line after this row
        doc.setLineWidth(1);
        doc.line(tableLeftX, y + 10, tableRightX, y + 10);
        pageRowEndY = y + 10;
        y += rowHeight;
        rowsOnPage++;
        i++;
      }
      // Draw vertical lines for this page's table, ending exactly at the bottom border
      doc.line(tableLeftX, pageRowStartY, tableLeftX, pageRowEndY); // left
      doc.line(tableMiddleX, pageRowStartY, tableMiddleX, pageRowEndY); // middle
      doc.line(tableRightX, pageRowStartY, tableRightX, pageRowEndY); // right
      if (i < items.length) {
        doc.addPage();
      }
    }
    doc.save('low-stock-report.pdf');
  };

  // Restock modal logic
  const openRestockModal = (item: any) => {
    setModalItem(item);
    setRestockQty(1);
    setModalError('');
  };
  const closeModal = () => {
    setModalItem(null);
    setModalError('');
  };
  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalItem) return;
    if (restockQty < 1) {
      setModalError('Quantity must be at least 1');
      return;
    }
    setModalLoading(true);
    setModalError('');
    try {
      const res = await fetch('/api/items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'restock',
          id: modalItem["ID"],
          addQty: restockQty
        })
      });
      if (!res.ok) throw new Error('Failed to restock');
      closeModal();
      fetchLowStock();
    } catch (err) {
      setModalError('Failed to restock.');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h1 className={styles.heading}>Low Stock Alerts</h1>
          <button
            className={styles.primaryBtn}
            style={{ fontSize: 14, padding: '8px 20px' }}
            onClick={handleDownloadPDF}
            disabled={loading || items.length === 0}
          >
            Download PDF
          </button>
        </div>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 120 }}>
            <DotLoader
              frames={loaderFrames}
              className="gap-0.5"
              dotClassName="dot-loader-dot"
            />
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#059669', fontWeight: 600, padding: 32 }}>
            All items are sufficiently stocked!
          </div>
        ) : (
          <>
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th style={{ textAlign: 'center' }}>Current Stock</th>
                  <th >Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map(item => (
                  <tr key={item.ID || item.id}>
                    <td>{item["NAMA BARANG"] || item.namaBarang}</td>
                    <td style={{ color: Number(item["CURRENT"]) === 0 ? '#b91c1c' : '#92400e', fontWeight: 700, textAlign: 'center' }}>{item["CURRENT"]}</td>
                    <td>
                      <button
                        className={styles.primaryBtn}
                        style={{ fontSize: 13, padding: '6px 16px' }}
                        onClick={() => openRestockModal(item)}
                      >
                        Restock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 24, gap: 16 }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ padding: '6px 18px', borderRadius: 8, background: page === 1 ? '#e5e7eb' : '#2563eb', color: page === 1 ? '#888' : '#fff', border: 'none', fontWeight: 600 }}
              >
                Prev
              </button>
              <span style={{ fontWeight: 600 }}>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ padding: '6px 18px', borderRadius: 8, background: page === totalPages ? '#e5e7eb' : '#2563eb', color: page === totalPages ? '#888' : '#fff', border: 'none', fontWeight: 600 }}
              >
                Next
              </button>
            </div>
          </>
        )}
        {/* Restock Modal */}
        {modalItem && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "20px"
            }}
            onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
          >
            <div
              style={{
                position: "relative",
                maxWidth: 400,
                width: "100%",
                background: "white",
                borderRadius: "12px",
                padding: "28px 24px 24px 24px",
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center"
              }}
            >
              <button
                onClick={closeModal}
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "15px",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#666",
                  zIndex: 1001,
                  width: "30px",
                  height: "30px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  background: "rgba(0, 0, 0, 0.1)"
                }}
                aria-label="Close modal"
              >
                ×
              </button>
              <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 18 }}>
                Restock Item
              </h2>
              <form onSubmit={handleRestock} style={{ width: '100%' }}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontWeight: 500 }}>Item Name</label>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{modalItem["NAMA BARANG"] || modalItem.namaBarang}</div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontWeight: 500 }}>Add Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={restockQty}
                    onChange={e => setRestockQty(Number(e.target.value))}
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e5eaf1', fontSize: 16 }}
                    required
                    disabled={modalLoading}
                  />
                </div>
                {modalError && <div style={{ color: '#b91c1c', marginBottom: 12 }}>{modalError}</div>}
                <button
                  type="submit"
                  className={styles.primaryBtn}
                  style={{ width: '100%', fontSize: 16, padding: '10px 0', marginTop: 8 }}
                  disabled={modalLoading}
                >
                  {modalLoading ? 'Restocking...' : 'Restock'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 