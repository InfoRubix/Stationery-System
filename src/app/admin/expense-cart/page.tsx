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
    const tableRightX = 550; // Increased to make table wider and better proportioned
    // Adjusted column widths: better proportions for readability
    const colWidths = [30, 160, 70, 60, 70, 110]; // No, Item Name, Tier, Qty, Price, Total (wider)

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

    // Table drawing logic
    let itemIndex = 0;
    let currentPage = 1;
    
    while (itemIndex < cartItems.length) {
      // Draw header for this page
      doc.setFillColor(243, 244, 246);
      doc.rect(tableLeftX, headerY - 15, tableRightX - tableLeftX, rowHeight + 10, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      
      // Main headers
      doc.text('No.', colPositions[0] + 5, headerY);
      doc.text('Item Name', colPositions[1] + 5, headerY);
      doc.text('Tier', colPositions[2] + colWidths[2]/2, headerY, { align: 'center' });
      doc.text('Qty', colPositions[3] + colWidths[3]/2, headerY, { align: 'center' });
      doc.text('Price', colPositions[4] + colWidths[4]/2, headerY, { align: 'center' });
      doc.text('Total', colPositions[5] + colWidths[5]/2, headerY, { align: 'center' });

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

      while (itemIndex < cartItems.length && rowsOnPage < 23) {
        const item = cartItems[itemIndex];
        if (!item) {
          itemIndex++;
          continue; // Skip invalid items
        }
        
        // Calculate required height for this item (including text wrapping)
        const itemNameForHeight = safeText(item.namaBarang);
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
        
        // Check if we have enough space for this item
        if (rowsOnPage >= 20) {
          break; // Move to next page
        }

        // Draw main item row
        if (rowsOnPage % 2 === 1) {
          doc.setFillColor(249, 250, 251);
          doc.rect(tableLeftX, y - rowHeight + 10, tableRightX - tableLeftX, requiredHeight, 'F');
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        
        // Main item data with safe text conversion
        doc.text(safeText(itemIndex + 1), colPositions[0] + 5, y);
        
        // Handle long item names with text wrapping
        const itemName = safeText(item.namaBarang);
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
        doc.text(safeText(item.tier), colPositions[2] + colWidths[2]/2, y, { align: 'center' });
        doc.text(safeText(item.qty), colPositions[3] + colWidths[3]/2, y, { align: 'center' });
        doc.text(`RM${item.price.toFixed(2)}`, colPositions[4] + colWidths[4]/2, y, { align: 'center' });
        doc.setFont('helvetica', 'bold');
        doc.text(`RM${(item.qty * item.price).toFixed(2)}`, colPositions[5] + colWidths[5]/2, y, { align: 'center' });
        doc.setFont('helvetica', 'normal');

        // Draw top border for the main item row
        doc.setLineWidth(1);
        doc.line(tableLeftX, y - rowHeight + 10, tableRightX, y - rowHeight + 10);
        y += requiredHeight;
        rowsOnPage++;

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

      if (itemIndex < cartItems.length) {
        doc.addPage();
        currentPage++;
      }
    }

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
      <div className={styles.card} style={{ position: 'relative' }}>
        {loading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(255, 255, 255, 0.9)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            borderRadius: 12
          }}>
            <DotLoader
              frames={loaderFrames}
              className="gap-0.5"
              dotClassName="dot-loader-dot"
            />
            <div style={{ marginTop: 16, fontSize: 16, fontWeight: 600, color: '#374151' }}>
              Processing Purchase...
            </div>
            <div style={{ marginTop: 8, fontSize: 14, color: '#6b7280' }}>
              Generating PDF and saving to database
            </div>
          </div>
        )}
        
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
            disabled={loading}
            style={{ 
              padding: '12px 24px', 
              background: '#6b7280', 
              color: '#fff', 
              border: 'none', 
              borderRadius: 8, 
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              opacity: loading ? 0.6 : 1
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
              border: '1px solid #8b5cf6',
              opacity: loading ? 0.6 : 1
            }}
          >
            Confirm Purchase
          </button>
        </div>
      </div>
    </div>
  );
} 