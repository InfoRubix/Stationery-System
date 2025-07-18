"use client";
import { useEffect, useState } from "react";
import styles from "../../page.module.css";
import { useExpenseCart } from "@/contexts/ExpenseCartContext";
import { DotLoader } from "@/components/ui/dot-loader";
import { getImageSrc } from "@/lib/getImageSrc";
import Link from "next/link";
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

export default function ExpenseCartPage() {
  const { cartItems, removeFromCart, updateItem, clearCart, getCartTotal } = useExpenseCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Generate PDF for expense cart
  const generateExpensePDF = () => {
    if (cartItems.length === 0) return;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageHeight = 800;
    const rowHeight = 25;
    const headerY = 140;
    const tableLeftX = 40;
    const tableRightX = 550;
    const colWidths = [30, 200, 80, 80, 80, 80]; // No, Item Name, Tier, Qty, Price, Total

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
    const totalPrice = cartItems.reduce((sum, item) => sum + (item.qty * item.price), 0);

    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Expense Purchase Request', 40, 60);
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

    // Draw header
    doc.setFillColor(243, 244, 246);
    doc.rect(tableLeftX, headerY - 15, tableRightX - tableLeftX, rowHeight + 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    
    doc.text('No.', colPositions[0] + 5, headerY);
    doc.text('Item Name', colPositions[1] + 5, headerY);
    doc.text('Tier', colPositions[2] + colWidths[2]/2, headerY, { align: 'center' });
    doc.text('Qty', colPositions[3] + colWidths[3]/2, headerY, { align: 'center' });
    doc.text('Price', colPositions[4] + colWidths[4]/2, headerY, { align: 'center' });
    doc.text('Total', colPositions[5] + colWidths[5]/2, headerY, { align: 'center' });

    // Draw header borders
    doc.setLineWidth(1);
    doc.line(tableLeftX, headerY - 15, tableRightX, headerY - 15);
    doc.line(tableLeftX, headerY + 10, tableRightX, headerY + 10);

    // Draw header vertical lines
    colPositions.forEach(x => {
      doc.line(x, headerY - 15, x, headerY + 10);
    });
    doc.line(tableRightX, headerY - 15, tableRightX, headerY + 10);

    // Draw rows
    let y = headerY + rowHeight + 5;
    let currentPage = 1;
    let rowsOnPage = 0;

    for (let i = 0; i < cartItems.length; i++) {
      const item = cartItems[i];
      
      // Check if we need a new page
      if (rowsOnPage >= 20) {
        doc.addPage();
        currentPage++;
        y = headerY + rowHeight + 5;
        rowsOnPage = 0;
        
        // Redraw header for new page
        doc.setFillColor(243, 244, 246);
        doc.rect(tableLeftX, headerY - 15, tableRightX - tableLeftX, rowHeight + 10, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        
        doc.text('No.', colPositions[0] + 5, headerY);
        doc.text('Item Name', colPositions[1] + 5, headerY);
        doc.text('Tier', colPositions[2] + colWidths[2]/2, headerY, { align: 'center' });
        doc.text('Qty', colPositions[3] + colWidths[3]/2, headerY, { align: 'center' });
        doc.text('Price', colPositions[4] + colWidths[4]/2, headerY, { align: 'center' });
        doc.text('Total', colPositions[5] + colWidths[5]/2, headerY, { align: 'center' });

        // Redraw header borders
        doc.setLineWidth(1);
        doc.line(tableLeftX, headerY - 15, tableRightX, headerY - 15);
        doc.line(tableLeftX, headerY + 10, tableRightX, headerY + 10);
        colPositions.forEach(x => {
          doc.line(x, headerY - 15, x, headerY + 10);
        });
        doc.line(tableRightX, headerY - 15, tableRightX, headerY + 10);
      }

      // Alternate row colors
      if (rowsOnPage % 2 === 1) {
        doc.setFillColor(249, 250, 251);
        doc.rect(tableLeftX, y - rowHeight + 10, tableRightX - tableLeftX, rowHeight, 'F');
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      
      // Item data
      doc.text(safeText(i + 1), colPositions[0] + 5, y);
      
      // Handle long item names with text wrapping
      const itemName = safeText(item.namaBarang);
      const maxWidth = colWidths[1] - 10;
      if (doc.getTextWidth(itemName) > maxWidth) {
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
        
        doc.text(lines[0], colPositions[1] + 5, y);
        for (let j = 1; j < lines.length; j++) {
          doc.text(lines[j], colPositions[1] + 5, y + (j * 8));
        }
      } else {
        doc.text(itemName, colPositions[1] + 5, y);
      }
      
      doc.text(safeText(item.tier), colPositions[2] + colWidths[2]/2, y, { align: 'center' });
      doc.text(safeText(item.qty), colPositions[3] + colWidths[3]/2, y, { align: 'center' });
      doc.text(`RM${item.price.toFixed(2)}`, colPositions[4] + colWidths[4]/2, y, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.text(`RM${(item.qty * item.price).toFixed(2)}`, colPositions[5] + colWidths[5]/2, y, { align: 'center' });
      doc.setFont('helvetica', 'normal');

      // Draw row borders
      doc.setLineWidth(1);
      doc.line(tableLeftX, y - rowHeight + 10, tableRightX, y - rowHeight + 10);
      doc.line(tableLeftX, y + 10, tableRightX, y + 10);

      y += rowHeight;
      rowsOnPage++;
    }

    // Draw final bottom border
    doc.setLineWidth(1);
    doc.line(tableLeftX, y + 10, tableRightX, y + 10);

    // Draw vertical lines
    colPositions.forEach(x => {
      doc.line(x, headerY - 15, x, y + 10);
    });
    doc.line(tableRightX, headerY - 15, tableRightX, y + 10);

    // Add page number
    doc.setFontSize(10);
    doc.text(`Page ${currentPage}`, tableRightX - 60, pageHeight - 20);

    return doc;
  };

  const handleConfirmPurchase = async () => {
    if (cartItems.length === 0) {
      alert("No items in cart to confirm");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Generate PDF
      const doc = generateExpensePDF();
      if (!doc) {
        throw new Error("Failed to generate PDF");
      }

      // Convert PDF to base64
      const pdfBase64 = doc.output('datauristring').split(',')[1];

      // Save to EXPENSESTATUS Google Sheet
      const formData = new FormData();
      formData.append('action', 'addExpenseRequest');
      formData.append('pdfData', pdfBase64);
      formData.append('items', JSON.stringify(cartItems));
      formData.append('totalAmount', getCartTotal().toString());

      const response = await fetch('/api/expenses', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to save expense request');
      }

      const result = await response.json();
      
      if (result.success) {
        // Download the PDF
        doc.save('expense-purchase-request.pdf');
        
        // Clear the cart
        clearCart();
        
        alert("Purchase confirmed! PDF generated and saved to EXPENSESTATUS.");
      } else {
        throw new Error(result.error || 'Failed to save expense request');
      }
    } catch (err: any) {
      setError(err.message || "Failed to confirm purchase");
      console.error("Error confirming purchase:", err);
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.card}>
          <div style={{ textAlign: 'center', padding: 32 }}>
            <h1 className={styles.heading}>Expense Cart</h1>
            <p style={{ color: '#6b7280', marginBottom: 24 }}>Your expense cart is empty</p>
            <Link href="/admin/restock" className={styles.primaryBtn} style={{ textDecoration: 'none' }}>
              Go to Restock Page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 className={styles.heading}>Expense Cart</h1>
          <div style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>
            Total: RM {getCartTotal().toFixed(2)}
          </div>
        </div>

        {error && (
          <div style={{ color: '#dc2626', marginBottom: 16, padding: 12, background: '#fef2f2', borderRadius: 8 }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: 24 }}>
          {cartItems.map((item, index) => (
            <div key={`${item.id}-${index}`} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              padding: 16, 
              border: '1px solid #e5e7eb', 
              borderRadius: 8, 
              marginBottom: 12,
              background: '#fff'
            }}>
              {item.image && (
                <img
                  src={getImageSrc(item.image) || ''}
                  alt={item.namaBarang}
                  style={{ 
                    width: 60, 
                    height: 60, 
                    objectFit: 'contain', 
                    borderRadius: 4, 
                    marginRight: 16,
                    border: '1px solid #e5e7eb'
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
                  {item.namaBarang}
                </div>
                <div style={{ color: '#6b7280', fontSize: 14 }}>
                  {item.tier} - RM {item.price.toFixed(2)} each
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  type="number"
                  min={1}
                  value={item.qty}
                  onChange={e => {
                    let val = Number(e.target.value);
                    if (val < 1) val = 1;
                    updateItem(index, { qty: val });
                  }}
                  style={{ 
                    width: 60, 
                    padding: 8, 
                    borderRadius: 4, 
                    border: '1px solid #e5e7eb',
                    textAlign: 'center'
                  }}
                />
                <div style={{ fontWeight: 600, fontSize: 16, minWidth: 80, textAlign: 'right' }}>
                  RM {(item.qty * item.price).toFixed(2)}
                </div>
                <button
                  onClick={() => removeFromCart(index)}
                  style={{ 
                    background: '#dc2626', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: 4, 
                    width: 32, 
                    height: 32, 
                    cursor: 'pointer',
                    fontSize: 16
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            onClick={clearCart}
            style={{ 
              padding: '12px 24px', 
              background: '#6b7280', 
              color: '#fff', 
              border: 'none', 
              borderRadius: 8, 
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Clear Cart
          </button>
          <button
            onClick={handleConfirmPurchase}
            disabled={loading}
            className={styles.primaryBtn}
            style={{ 
              padding: '12px 24px', 
              fontSize: 16, 
              fontWeight: 600,
              background: '#8b5cf6',
              border: '1px solid #8b5cf6'
            }}
          >
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <DotLoader
                  frames={loaderFrames}
                  className="gap-0.5"
                  dotClassName="dot-loader-dot"
                />
                Processing...
              </div>
            ) : (
              'Confirm Purchase'
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 