"use client";
import { useEffect, useState, useRef } from "react";
import { getItems, getPriceStock } from "@/lib/google-apps-script";
import styles from "../../page.module.css";
import { DotLoader } from "@/components/ui/dot-loader";
// @ts-ignore
import jsPDF from "jspdf";
import React from "react";

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

// Utility: Calculate tier breakdown
function calculateTierBreakdown(quantityToBuy: number, priceData: any): Array<{
  tierQty: number;
  qty: number;
  pricePerUnit: number;
  totalPrice: number;
}> {
  const tiers: Array<{ tierQty: number; qty: number; pricePerUnit: number; totalPrice: number }> = [];
  let remaining = quantityToBuy;
  // Gather all tier data
  const tierData: Array<{ qty: number; price: number }> = [];
  for (let i = 1; i <= 5; i++) {
    const qty = Number(priceData[`TIER ${i} QTY`] || priceData[`tier${i}Qty`] || 0);
    const price = Number(priceData[`TIER ${i} PRICE`] || priceData[`tier${i}Price`] || 0);
    if (qty > 0 && price > 0) tierData.push({ qty, price });
  }
  // Sort by largest tier first
  tierData.sort((a, b) => b.qty - a.qty);
  for (const tier of tierData) {
    if (remaining <= 0) break;
    const units = Math.floor(remaining / tier.qty);
    if (units > 0) {
      tiers.push({
        tierQty: tier.qty,
        qty: units,
        pricePerUnit: tier.price,
        totalPrice: units * tier.price,
      });
      remaining -= units * tier.qty;
    }
  }
  // If any left, use the smallest tier
  if (remaining > 0 && tierData.length > 0) {
    const last = tierData[tierData.length - 1];
    tiers.push({
      tierQty: last.qty,
      qty: Math.ceil(remaining / last.qty),
      pricePerUnit: last.price,
      totalPrice: Math.ceil(remaining / last.qty) * last.qty * last.price,
    });
  }
  return tiers;
}

const ITEMS_PER_PAGE = 10;

export default function LowStockPage() {
  const [items, setItems] = useState<any[]>([]);
  const [priceStock, setPriceStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [modalItem, setModalItem] = useState<any | null>(null);
  const [restockQty, setRestockQty] = useState(1);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [allItems, allPrices] = await Promise.all([
        getItems(),
        getPriceStock()
      ]);
      setItems(allItems);
      setPriceStock(allPrices);
    } finally {
      setLoading(false);
    }
  };

  // Combine and process low stock items
  const lowStockItems = items
    .map(item => {
      const current = Number(item.CURRENT ?? item.current ?? 0);
      const targetStock = Number(item.TARGETSTOCK ?? item.targetStock ?? 0);
      const priceData = priceStock.find(ps => (ps.ID || ps.id) == (item.ID || item.id));
      if (current < targetStock && targetStock > 0 && priceData) {
        const quantityToBuy = targetStock - current;
        return {
          ...item,
          current,
          targetStock,
          quantityToBuy,
          priceData,
          tiers: calculateTierBreakdown(quantityToBuy, priceData)
        };
      }
      return null;
    })
    .filter(Boolean);

  const totalPages = Math.ceil(lowStockItems.length / ITEMS_PER_PAGE);
  const paginatedItems = lowStockItems.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // PDF generation
  const handleDownloadPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageHeight = 800;
    const rowHeight = 25;
    const headerY = 140;
    const tableLeftX = 40;
    const tableRightX = 550; // Increased to make table wider and better proportioned
    // Adjusted column widths: better proportions for readability
    const colWidths = [30, 130, 45, 45, 45, 40, 30, 50, 70]; // No, Name, Current, Target, QtyBuy, TierQty, Qty, Price, Total

    // Helper for date formatting
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const formattedDate = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    // Helper function to safely convert values to strings
    const safeText = (value: any): string => {
      if (value === null || value === undefined) return '';
      return String(value);
    };

    // Calculate total price
    const totalPrice = lowStockItems.reduce((sum: number, item: any) => {
      if (item.tiers) {
        return sum + item.tiers.reduce((itemSum: number, tier: any) => {
          return itemSum + (Number(tier.totalPrice) || 0);
        }, 0);
      }
      return sum;
    }, 0);

    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Low Stock Report', 40, 60);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${formattedDate}`, 40, 100);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`Total Purchase Cost: RM${totalPrice.toFixed(2)}`, 40, 120);
    doc.setFont('helvetica', 'normal');

    // Calculate column positions
    const colPositions = [];
    let currentX = tableLeftX;
    for (let i = 0; i < colWidths.length; i++) {
      colPositions.push(currentX);
      currentX += colWidths[i];
    }

    // Table drawing logic
    let itemIndex = 0;
    let currentPage = 1;
    
    while (itemIndex < lowStockItems.length) {
      // Draw header for this page
      doc.setFillColor(243, 244, 246);
      doc.rect(tableLeftX, headerY - 15, tableRightX - tableLeftX, rowHeight + 10, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      
      // Main headers
      doc.text('No.', colPositions[0] + 5, headerY);
      doc.text('Item Name', colPositions[1] + 5, headerY);
      doc.text('Current', colPositions[2] + colWidths[2]/2, headerY, { align: 'center' });
      doc.text('Target', colPositions[3] + colWidths[3]/2, headerY, { align: 'center' });
      doc.text('Qty Buy', colPositions[4] + colWidths[4]/2, headerY, { align: 'center' });
      
      // Tier headers
      doc.text('Tier Qty', colPositions[5] + colWidths[5]/2, headerY, { align: 'center' });
      doc.text('Qty', colPositions[6] + colWidths[6]/2, headerY, { align: 'center' });
      doc.text('Tier Price', colPositions[7] + colWidths[7]/2, headerY, { align: 'center' });
      doc.text('Total Price', colPositions[8] + colWidths[8]/2, headerY, { align: 'center' });

      // Draw header borders - both top and bottom borders for complete look
      doc.setLineWidth(1);
      doc.line(tableLeftX, headerY - 15, tableRightX, headerY - 15); // top border
      doc.line(tableLeftX, headerY + 10, tableRightX, headerY + 10); // bottom border

      // Draw header vertical lines
      colPositions.forEach(x => {
        doc.line(x, headerY - 15, x, headerY + 10);
      });
      doc.line(tableRightX, headerY - 15, tableRightX, headerY + 10);

      // Draw rows
      let y = headerY + rowHeight + 5;
      let rowsOnPage = 0;
      let pageRowStartY = headerY - 15;
      let pageRowEndY = headerY + 10;

      while (itemIndex < lowStockItems.length && rowsOnPage < 23) {
        const item = lowStockItems[itemIndex];
        if (!item || !item.tiers) {
          itemIndex++;
          continue; // Skip invalid items
        }
        
        const totalTierRows = item.tiers.length;
        
        // Calculate required height for this item (including text wrapping)
        const itemNameForHeight = safeText(item.namaBarang || item["NAMA BARANG"]);
        const maxWidthForHeight = colWidths[1] - 10;
        let requiredHeight = rowHeight;
        if (doc.getTextWidth(itemNameForHeight) > maxWidthForHeight) {
          const words = itemNameForHeight.split(' ');
          let currentLine = '';
          let lines = 1;
          for (let word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            if (doc.getTextWidth(testLine) <= maxWidthForHeight) {
              currentLine = testLine;
            } else {
              if (currentLine) lines++;
              currentLine = word;
            }
          }
          requiredHeight = Math.max(rowHeight, lines * 8 + 15); // 8pt per line + padding
        }
        
        // Check if we have enough space for this item and all its tiers
        if (rowsOnPage + totalTierRows > 20) {
          break; // Move to next page
        }

        // Draw main item row
        if (rowsOnPage % 2 === 1) {
          doc.setFillColor(249, 250, 251);
          doc.rect(tableLeftX, y - rowHeight + 10, tableRightX - tableLeftX, requiredHeight, 'F');
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        
        // Main item data with safe text conversion
        doc.text(safeText(itemIndex + 1), colPositions[0] + 5, y);
        
        // Handle long item names with text wrapping
        const itemName = safeText(item.namaBarang || item["NAMA BARANG"]);
        const maxWidth = colWidths[1] - 10; // Leave 5pt padding on each side
        if (doc.getTextWidth(itemName) > maxWidth) {
          // Split text into multiple lines
          const words = itemName.split(' ');
          let currentLine = '';
          let lines = [];
          for (let word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            if (doc.getTextWidth(testLine) <= maxWidth) {
              currentLine = testLine;
            } else {
              if (currentLine) lines.push(currentLine);
              currentLine = word;
            }
          }
          if (currentLine) lines.push(currentLine);
          
          // Draw first line
          doc.text(lines[0], colPositions[1] + 5, y);
          // Draw additional lines if needed
          for (let i = 1; i < lines.length; i++) {
            doc.text(lines[i], colPositions[1] + 5, y + (i * 8));
          }
        } else {
          doc.text(itemName, colPositions[1] + 5, y);
        }
        
        // Centered columns
        doc.text(safeText(item.current), colPositions[2] + colWidths[2]/2, y, { align: 'center' });
        doc.text(safeText(item.targetStock), colPositions[3] + colWidths[3]/2, y, { align: 'center' });
        doc.setFont('helvetica', 'bold');
        doc.text(safeText(item.quantityToBuy), colPositions[4] + colWidths[4]/2, y, { align: 'center' });
        doc.setFont('helvetica', 'normal');

        // Draw first tier data
        if (item.tiers.length > 0 && item.tiers[0]) {
          const tier = item.tiers[0];
          doc.text(safeText(tier.tierQty), colPositions[5] + colWidths[5]/2, y, { align: 'center' });
          doc.text(safeText(tier.qty), colPositions[6] + colWidths[6]/2, y, { align: 'center' });
          doc.text(`RM${Number(tier.pricePerUnit || 0).toFixed(2)}`, colPositions[7] + colWidths[7]/2, y, { align: 'center' });
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7);
          doc.text(`RM${Number(tier.totalPrice || 0).toFixed(2)}`, colPositions[8] + colWidths[8]/2, y, { align: 'center' });
          doc.setFont('helvetica', 'normal');
        }

        // Draw top border for the main item row
        doc.setLineWidth(1);
        doc.line(tableLeftX, y - rowHeight + 10, tableRightX, y - rowHeight + 10);
        y += requiredHeight;
        rowsOnPage++;

        // Draw additional tier rows
        for (let t = 1; t < item.tiers.length; t++) {
          if (rowsOnPage % 2 === 1) {
            doc.setFillColor(249, 250, 251);
            doc.rect(tableLeftX, y - rowHeight + 10, tableRightX - tableLeftX, rowHeight, 'F');
          }

          const tier = item.tiers[t];
          if (!tier) continue; // Skip invalid tiers
          
          doc.text(safeText(tier.tierQty), colPositions[5] + colWidths[5]/2, y, { align: 'center' });
          doc.text(safeText(tier.qty), colPositions[6] + colWidths[6]/2, y, { align: 'center' });
          doc.text(`RM${Number(tier.pricePerUnit || 0).toFixed(2)}`, colPositions[7] + colWidths[7]/2, y, { align: 'center' });
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7);
          doc.text(`RM${Number(tier.totalPrice || 0).toFixed(2)}`, colPositions[8] + colWidths[8]/2, y, { align: 'center' });
          doc.setFont('helvetica', 'normal');

          y += rowHeight;
          rowsOnPage++;
        }

        // Update page row end position
        pageRowEndY = y + 10;

        itemIndex++;
      }

      // Draw bottom border for the last row
      if (pageRowEndY > headerY + 10) {
        doc.setLineWidth(1);
        doc.line(tableLeftX, pageRowEndY, tableRightX, pageRowEndY);
      }

      // Draw vertical lines for this page
      colPositions.forEach(x => {
        doc.line(x, pageRowStartY, x, pageRowEndY);
      });
      doc.line(tableRightX, pageRowStartY, tableRightX, pageRowEndY);

      // Add page number at bottom right of the page
      doc.setFontSize(10);
      doc.text(`Page ${currentPage}`, tableRightX - 60, pageHeight - 20);

      if (itemIndex < lowStockItems.length) {
        doc.addPage();
        currentPage++;
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
      fetchData(); // Re-fetch data to update lowStockItems
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
            disabled={loading || lowStockItems.length === 0}
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
        ) : lowStockItems.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#059669', fontWeight: 600, padding: 32 }}>
            All items are sufficiently stocked!
          </div>
        ) : (
          <>
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Item Name</th>
                  <th style={{ textAlign: 'center' }}>Current Stock</th>
                  <th style={{ textAlign: 'center' }}>Target Stock</th>
                  <th style={{ textAlign: 'center' }}>Quantity to Buy</th>
                  <th colSpan={4} style={{ textAlign: 'center' }}>Purchase Breakdown</th>
                </tr>
                <tr>
                  <th colSpan={5}></th>
                  <th style={{ textAlign: 'center' }}>Tier Qty</th>
                  <th style={{ textAlign: 'center' }}>Qty</th>
                  <th style={{ textAlign: 'center' }}>Tier Price</th>
                  <th style={{ textAlign: 'center' }}>Total Price</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((item, idx) => (
                  <React.Fragment key={item.ID || item.id}>
                    <tr style={{ backgroundColor: idx % 2 === 0 ? '#f8f9fa' : '#ffffff' }}>
                      <td rowSpan={item.tiers.length + 1} style={{ verticalAlign: 'top' }}>{(page - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                      <td rowSpan={item.tiers.length + 1} style={{ verticalAlign: 'top' }}>{item["NAMA BARANG"] || item.namaBarang}</td>
                      <td rowSpan={item.tiers.length + 1} style={{ textAlign: 'center', verticalAlign: 'top' }}>{item.current}</td>
                      <td rowSpan={item.tiers.length + 1} style={{ textAlign: 'center', verticalAlign: 'top' }}>{item.targetStock}</td>
                      <td rowSpan={item.tiers.length + 1} style={{ textAlign: 'center', fontWeight: 700, verticalAlign: 'top' }}>{item.quantityToBuy}</td>
                      {/* First tier row will be rendered below */}
                    </tr>
                    {item.tiers.map((tier: any, tIdx: number) => (
                      <tr key={`${item.ID || item.id}-tier-${tIdx}`} style={{ backgroundColor: idx % 2 === 0 ? '#f8f9fa' : '#ffffff' }}>
                        <td style={{ textAlign: 'center' }}>{tier.tierQty}</td>
                        <td style={{ textAlign: 'center' }}>{tier.qty}</td>
                        <td style={{ textAlign: 'center' }}>RM{Number(tier.pricePerUnit).toFixed(2)}</td>
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>RM{Number(tier.totalPrice).toFixed(2)}</td>
                      </tr>
                    ))}
                  </React.Fragment>
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