// Google Apps Script integration for stationery management system
// This replaces the Google Sheets API with a simpler Apps Script web app approach

// PDF generation imports
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwPiDhossG-Zu9YEIp4jUskclb15L5jdtvvD1Ynbdy3Iu2PPjWdmwVnv8gfHDko6k5D/exec';

// Types for our data
export interface ItemLog {
  id: string;
  namaBarang: string;
  bilangan: number;
  image: string;
  bilLog1: number;
  bilLog2: number;
  bilLog3: number;
  bilLog4: number;
  bilLog5: number;
  bilLog6: number;
  bilLog7: number;
  bilLog8: number;
  bilLog9: number;
  bilLog10: number;
  total: number;
  current: number;
  targetStock: number;
  category: string;
  limit: number; // Note: Google Sheets uses "LIMIT" field name
}

export interface LogEntry {
  id: string;
  tarikhDanMasa: string;
  email: string;
  department: string;
  items: Array<{
    namaBarang: string;
    bilangan: number;
  }>;
  status: string;
}

interface RequestItem {
  namaBarang: string;
  bilangan: number;
}

interface Request {
  id: number;
  email: string;
  department: string;
  items: RequestItem[];
  status: 'PENDING' | 'APPROVE' | 'DECLINE' | 'APPLY';
  originalItems?: RequestItem[];
  stockRestoration?: RequestItem[];
}

// Get all items from ITEMLOG sheet
export async function getItems(): Promise<ItemLog[]> {
  try {
    const response = await fetch(APPS_SCRIPT_URL + '?action=getItems');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    if (result.error) {
      throw new Error(result.error);
    }
    return result;
  } catch (error) {
    console.error('getItems: Error fetching items:', error);
    throw error;
  }
}

// Get all logs from LOG sheet
export async function getLogs(): Promise<LogEntry[]> {
  try {
    const response = await fetch(APPS_SCRIPT_URL + '?action=getLogs');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    if (result.error) {
      throw new Error(result.error);
    }
    return result;
  } catch (error) {
    console.error('getLogs: Error fetching logs:', error);
    throw error;
  }
}

// Get all requests from LOG sheet (for admin page)
export async function getRequests(): Promise<Request[]> {
  try {
    const response = await fetch(APPS_SCRIPT_URL + '?action=getRequests');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    if (result.error) {
      throw new Error(result.error);
    }
    return result;
  } catch (error) {
    console.error('getRequests: Error fetching requests:', error);
    throw error;
  }
}

// Add new item to ITEMLOG sheet
export async function addItem(item: Omit<ItemLog, 'id'>): Promise<void> {
  try {
    const formData = new FormData();
    formData.append('action', 'addItem');
    formData.append('namaBarang', item.namaBarang);
    formData.append('bilangan', String(item.bilangan));
    formData.append('image', item.image);
    formData.append('targetStock', String(item.targetStock));
    formData.append('limit', String(item.limit));
    formData.append('category', item.category);
    
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    if (result.error) {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('addItem: Error adding item:', error);
    throw error;
  }
}

// Log usage (add to LOG sheet and update ITEMLOG)
export async function logUsage(
  email: string,
  department: string,
  items: RequestItem[]
): Promise<any> {
  try {
    const formData = new FormData();
    formData.append('action', 'logUsage');
    formData.append('email', email);
    formData.append('department', department);
    formData.append('items', JSON.stringify(items.map(item => ({ ...item, bilangan: Number(item.bilangan) }))));
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    if (result.error) {
      throw new Error(result.error);
    }
    return result;
  } catch (error) {
    console.error('logUsage: Error logging usage:', error);
    throw error;
  }
}

export async function updateLogStatus(request: Request): Promise<any> {
  try {
    const formData = new FormData();
    formData.append('action', 'updateLogStatus');
    formData.append('logId', String(request.id));
    formData.append('id', String(request.id));
    formData.append('status', request.status);
    formData.append('email', request.email);
    formData.append('department', request.department);
    formData.append('items', JSON.stringify(request.items.map(item => ({ ...item, bilangan: Number(item.bilangan) }))));
    
    if (request.originalItems) {
      formData.append('originalItems', JSON.stringify(request.originalItems.map(item => ({ ...item, bilangan: Number(item.bilangan) }))));
    }
    
    if (request.stockRestoration && request.stockRestoration.length > 0) {
      formData.append('stockRestoration', JSON.stringify(request.stockRestoration.map(item => ({ ...item, bilangan: Number(item.bilangan) }))));
    }
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    if (result.error) {
      throw new Error(result.error);
    }
    return result;
  } catch (error) {
    console.error('updateLogStatus: Error updating status:', error);
    throw error;
  }
}

export async function restockItem(id: string, addQty: number): Promise<void> {
  try {
    const formData = new FormData();
    formData.append('action', 'restockItem');
    formData.append('id', String(id));
    formData.append('addQty', String(Math.max(0, Number(addQty))));
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    if (result.error) {
      throw new Error(result.error);
    }
    console.log('Restock result:', result);
  } catch (error) {
    console.error('restockItem: Error restocking item:', error);
    throw error;
  }
}

export async function editItem(id: string, namaBarang: string , image: string, current: string, targetStock?: string, limit?: string, oldName?: string): Promise<void> {
  try {
    console.log('editItem called with:', { id, namaBarang, current, targetStock, limit, oldName });
    const formData = new FormData();
    formData.append('action', 'editItem');
    formData.append('id', String(id));
    formData.append('namaBarang', namaBarang);
    formData.append('image', image);
    formData.append('current', current);
    if (targetStock !== undefined && targetStock !== '') {
      formData.append('targetStock', targetStock);
      console.log('Added targetStock:', targetStock);
    }
    // Always send limit parameter, even if empty/0, so Google Apps Script can update it
    if (limit !== undefined && limit !== null) {
      formData.append('limit', String(limit)); // Match Google Sheets column name LIMIT
      console.log('Added limit:', limit);
    } else {
      console.log('Skipped limit - value is undefined/null:', limit);
    }
    if (oldName !== undefined && oldName !== '') {
      formData.append('oldName', oldName);
    }
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    console.log('Google Apps Script editItem response:', result);
    if (result.error) {
      console.error('Google Apps Script editItem error:', result.error);
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('editItem: Error editing item:', error);
    throw error;
  }
}

export async function deleteItem(id: string): Promise<void> {
  try {
    const formData = new FormData();
    formData.append('action', 'deleteItem');
    formData.append('id', String(id));
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    if (result.error) {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('deleteItem: Error deleting item:', error);
    throw error;
  }
}

// Get image URL from Google Drive (simplified version)
export async function getImageUrl(imagePath: string): Promise<string> {
  try {
    if (!imagePath) return '';
    
    // For Apps Script approach, we'll return the path as-is
    // You can modify this to use Google Drive API if needed
    if (imagePath.includes('drive.google.com')) {
      return imagePath;
    }
    
    // If it's a file ID, convert to viewable URL
    return `/ITEMLOG_Images/${imagePath}`;
  } catch (error) {
    console.error('Error getting image URL:', error);
    return '';
  }
} 

// Get all price stock items from PRICESTOCK sheet
export async function getPriceStock(): Promise<any[]> {
  try {
    const response = await fetch(APPS_SCRIPT_URL + '?action=getPriceStock');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    if (result.error) {
      throw new Error(result.error);
    }
    return result;
  } catch (error) {
    console.error('getPriceStock: Error fetching price stock:', error);
    throw error;
  }
}

// Edit a price stock item in PRICESTOCK sheet
export async function editPriceStock(id: string, fields: Record<string, any>): Promise<void> {
  try {
    const formData = new FormData();
    formData.append('action', 'editPriceStock');
    formData.append('id', String(id));
    Object.entries(fields).forEach(([key, value]) => formData.append(key, value));
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    if (result.error) {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('editPriceStock: Error editing price stock:', error);
    throw error;
  }
}

// Correct interface for price stock
export interface PriceStock {
  id: string;
  namaBarang: string;
  basePrice: number;
  typeStock: string;
  tier1Qty: number;
  tier1Price: number;
  tier2Qty: number;
  tier2Price: number;
  tier3Qty: number;
  tier3Price: number;
  tier4Qty: number;
  tier4Price: number;
  tier5Qty: number;
  tier5Price: number;
}

/**
 * Generate a stationery order PDF as a Buffer
 * @param {Object} params
 * @param {string} params.email
 * @param {string} params.department  
 * @param {string} params.date
 * @param {Array<{ namaBarang: string, bilangan: number }>} params.items
 * @returns {Promise<Uint8Array>} PDF buffer
 */
export async function generateOrderPdf({ email, department, date, items }: { email: string, department: string, date: string, items: Array<{ namaBarang: string, bilangan: number }> }): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([500, 600]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Title (year dynamic)
  const year = new Date().getFullYear();
  page.drawText(`${year} STATIONERY ORDER FORM`, {
    x: 30,
    y: 560,
    size: 24,
    font: boldFont,
  });

  // Order info
  page.drawText(`Order by :`, { x: 30, y: 535, size: 12, font });
  page.drawText(email, { x: 95, y: 535, size: 12, font: boldFont });
  page.drawText(`Date Order :`, { x: 30, y: 520, size: 12, font });
  page.drawText(date, { x: 110, y: 520, size: 12, font: boldFont });
  page.drawText(`Department:`, { x: 30, y: 505, size: 12, font });
  page.drawText(department, { x: 105, y: 505, size: 12, font: boldFont });

  // Table header
  page.drawRectangle({ x: 30, y: 470, width: 440, height: 30, borderColor: rgb(0,0,0), borderWidth: 1 });
  page.drawLine({ start: { x: 250, y: 470 }, end: { x: 250, y: 500 }, thickness: 1, color: rgb(0,0,0) });
  page.drawText('Nama Barang', { x: 40, y: 480, size: 13, font: boldFont });
  page.drawText('Bilangan Barang', { x: 260, y: 480, size: 13, font: boldFont });

  // Table rows (up to 10)
  for (let i = 0; i < 10; i++) {
    const y = 470 - (i + 1) * 30;
    page.drawRectangle({ x: 30, y, width: 440, height: 30, borderColor: rgb(0,0,0), borderWidth: 1 });
    page.drawLine({ start: { x: 250, y }, end: { x: 250, y: y + 30 }, thickness: 1, color: rgb(0,0,0) });
    if (i < items.length) {
      page.drawText(items[i].namaBarang, { x: 40, y: y + 10, size: 12, font });
      page.drawText(String(items[i].bilangan), { x: 260, y: y + 10, size: 12, font });
    }
  }

  return await pdfDoc.save();
}

/**
 * Validate if requested items are within admin limits
 */
export async function validateOrderLimits(items: RequestItem[]): Promise<{ valid: boolean; errors: string[] }> {
  try {
    const allItems = await getItems();
    const errors: string[] = [];

    for (const requestedItem of items) {
      // Google Apps Script returns items with "NAMA BARANG" field
      const foundItem = allItems.find((item: any) => item["NAMA BARANG"] === requestedItem.namaBarang);
      
      if (!foundItem) {
        errors.push(`Item "${requestedItem.namaBarang}" not found.`);
        continue;
      }

      // Check against admin limit if set, otherwise check against stock
      const limit = foundItem["LIMIT"] || 0;
      const current = foundItem["CURRENT"] || 0;
      const maxAllowed = limit > 0 ? limit : current;
      
      if (requestedItem.bilangan > maxAllowed) {
        const limitType = limit > 0 ? "admin limit" : "available stock";
        errors.push(`Quantity for "${requestedItem.namaBarang}" exceeds ${limitType} (max: ${maxAllowed}, requested: ${requestedItem.bilangan}).`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  } catch (error) {
    console.error('Error validating order limits:', error);
    return {
      valid: false,
      errors: ['Failed to validate order limits. Please try again.']
    };
  }
}

/**
 * Enhanced logUsage that generates PDF and includes it in the request
 */
export async function logUsageWithPdf(
  email: string,
  department: string,
  items: RequestItem[]
): Promise<any> {
  try {
    // Format date as DD/MM/YYYY HH:mm:ss
    const now = new Date();
    const timestamp = now.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(/,/g, '');

    // Generate PDF
    const pdfBuffer = await generateOrderPdf({
      email,
      department,
      date: timestamp,
      items
    });

    // Convert PDF buffer to base64 for sending to Google Apps Script
    const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');
    
    const formData = new FormData();
    formData.append('action', 'logUsageWithPdf');
    formData.append('email', email);
    formData.append('department', department);
    formData.append('items', JSON.stringify(items.map(item => ({ ...item, bilangan: Number(item.bilangan) }))));
    formData.append('pdfData', pdfBase64);
    formData.append('timestamp', timestamp);

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (result.error) {
      throw new Error(result.error);
    }

    return result;
  } catch (error) {
    console.error('logUsageWithPdf: Error logging usage with PDF:', error);
    // Fall back to regular logUsage if PDF generation fails
    return await logUsage(email, department, items);
  }
}