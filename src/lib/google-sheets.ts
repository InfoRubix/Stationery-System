import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

// Helper function to properly format the private key
function formatPrivateKey(key: string | undefined): string {
  if (!key) {
    throw new Error('GOOGLE_PRIVATE_KEY is not set in environment variables');
  }
  
  // Remove any extra quotes and format the key properly
  let formattedKey = key.replace(/\\n/g, '\n');
  
  // Handle different quote scenarios
  if (formattedKey.startsWith('"') && formattedKey.endsWith('"')) {
    formattedKey = formattedKey.slice(1, -1);
  }
  
  // Ensure the key starts and ends with the proper markers
  if (!formattedKey.includes('-----BEGIN PRIVATE KEY-----')) {
    throw new Error('Invalid private key format: missing BEGIN marker');
  }
  if (!formattedKey.includes('-----END PRIVATE KEY-----')) {
    throw new Error('Invalid private key format: missing END marker');
  }
  
  return formattedKey;
}

// Initialize Google Sheets API with better error handling
let auth: JWT | null = null;
let sheets: any = null;
let drive: any = null;

// Function to initialize the API on-demand
async function initializeGoogleAPI() {
  if (auth && sheets && drive) {
    console.log('Google API: Using existing initialized instances');
    return { auth, sheets, drive };
  }

  console.log('Google API: Starting initialization...');
  
  try {
    console.log('Google API: Formatting private key...');
    const privateKey = formatPrivateKey(process.env.GOOGLE_PRIVATE_KEY);
    console.log('Google API: Private key formatted successfully');
    
    console.log('Google API: Creating JWT client...');
    // Create JWT with explicit algorithm specification
    auth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: privateKey,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.readonly'
      ],
    });
    console.log('Google API: JWT client created successfully');

    console.log('Google API: Creating Sheets API client...');
    sheets = google.sheets({ version: 'v4', auth });
    console.log('Google API: Creating Drive API client...');
    drive = google.drive({ version: 'v3', auth });
    
    console.log('Google Sheets API initialized successfully');
    return { auth, sheets, drive };
  } catch (error) {
    console.error('Google API: Failed to initialize Google Sheets API:', error);
    
    // If it's an OpenSSL error, provide specific guidance
    if (error instanceof Error && error.message.includes('ERR_OSSL_UNSUPPORTED')) {
      console.error('OpenSSL compatibility issue detected. Please try:');
      console.error('1. Downgrade to Node.js 16.x');
      console.error('2. Or use the --openssl-legacy-provider flag (already added to package.json)');
      console.error('3. Or update your Google service account key to use a different format');
    }
    
    throw new Error(`Google Sheets initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Remove the old console.log since we're now initializing on-demand
// console.log('Google Sheets API initialized successfully');

// Support multiple sheet IDs
const getSheetId = (sheetType: 'itemlog' | 'log' = 'itemlog') => {
  if (sheetType === 'log') {
    return process.env.GOOGLE_LOG_SHEET_ID || process.env.GOOGLE_SHEET_ID;
  }
  return process.env.GOOGLE_SHEET_ID;
};

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

// Get all items from ITEMLOG sheet
export async function getItems(): Promise<ItemLog[]> {
  try {
    console.log('getItems: Starting to fetch items...');
    const { sheets: sheetsAPI } = await initializeGoogleAPI();
    console.log('getItems: Google API initialized, making request...');
    
    const response = await sheetsAPI.spreadsheets.values.get({
      spreadsheetId: getSheetId('itemlog'),
      range: 'ITEMLOG!A2:P', // Skip header row
    });
    console.log('getItems: Received response from Google Sheets');

    const rows = response.data.values || [];
    console.log(`getItems: Processing ${rows.length} rows`);
    
    return rows.map((row: any[], index: number) => ({
      id: row[0] || '',
      namaBarang: row[1] || '',
      bilangan: parseInt(row[2]) || 0,
      image: row[3] || '',
      bilLog1: parseInt(row[4]) || 0,
      bilLog2: parseInt(row[5]) || 0,
      bilLog3: parseInt(row[6]) || 0,
      bilLog4: parseInt(row[7]) || 0,
      bilLog5: parseInt(row[8]) || 0,
      bilLog6: parseInt(row[9]) || 0,
      bilLog7: parseInt(row[10]) || 0,
      bilLog8: parseInt(row[11]) || 0,
      bilLog9: parseInt(row[12]) || 0,
      bilLog10: parseInt(row[13]) || 0,
      total: parseInt(row[14]) || 0,
      current: parseInt(row[15]) || 0,
    }));
  } catch (error) {
    // Print everything about the error
    console.error('getItems: Error fetching items:', error);
    if (error instanceof Error) {
      // Type error as any to access response.data safely
      const err = error as any;
      if (err.response && err.response.data) {
        console.error('getItems: Google API error response:', err.response.data);
      }
      throw new Error(error.message);
    }
    throw error;
  }
}

// Get all logs from LOG sheet
export async function getLogs(): Promise<LogEntry[]> {
  try {
    const { sheets: sheetsAPI } = await initializeGoogleAPI();
    
    const response = await sheetsAPI.spreadsheets.values.get({
      spreadsheetId: getSheetId('log'),
      range: 'LOG!A2:Z', // Skip header row
    });

    const rows = response.data.values || [];
    return rows.map((row: any[]) => {
      const items = [];
      for (let i = 4; i < 24; i += 2) { // Columns E, G, I, K, M, O, Q, S, U, W
        if (row[i] && row[i + 1]) {
          items.push({
            namaBarang: row[i],
            bilangan: parseInt(row[i + 1]) || 0,
          });
        }
      }

      return {
        id: row[0] || '',
        tarikhDanMasa: row[1] || '',
        email: row[2] || '',
        department: row[3] || '',
        items,
        status: row[24] || '', // Column Y
      };
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    throw new Error('Failed to fetch logs from Google Sheets');
  }
}

// Add new item to ITEMLOG sheet
export async function addItem(item: Omit<ItemLog, 'id'>): Promise<void> {
  try {
    const { sheets: sheetsAPI } = await initializeGoogleAPI();
    const nextId = await getNextId();
    const values = [
      [
        nextId,
        item.namaBarang,
        item.bilangan.toString(),
        item.image,
        '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', // bilLog1-10
        '0', // total
        item.bilangan.toString() // current
      ]
    ];

    await sheetsAPI.spreadsheets.values.append({
      spreadsheetId: getSheetId('itemlog'),
      range: 'ITEMLOG!A:P',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values,
      },
    });
  } catch (error) {
    console.error('Error adding item:', error);
    throw new Error('Failed to add item to Google Sheets');
  }
}

// Log usage (add to LOG sheet and update ITEMLOG)
export async function logUsage(email: string, department: string, items: Array<{ namaBarang: string; bilangan: number }>, pdfFileName?: string, pdfLink?: string): Promise<void> {
  try {
    const { sheets: sheetsAPI } = await initializeGoogleAPI();
    
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
    
    const nextLogId = await getNextLogId();

    // Generate PDF
    const pdfBuffer = await generateOrderPdf({
      email,
      department,
      date: timestamp,
      items
    });

    // Generate PDF filename
    const fileName = `ORDER_${nextLogId}_${department.replace(/\s+/g, '_')}_${timestamp.replace(/[/:]/g, '')}.pdf`;

    // Upload to Google Drive
    const driveLink = await uploadPdfToDrive(pdfBuffer, fileName);
    
    // Prepare log entry
    const logRow = [nextLogId, timestamp, email, department];
    
    // Add items (up to 10 items)
    for (let i = 0; i < 10; i++) {
      if (i < items.length) {
        logRow.push(items[i].namaBarang, items[i].bilangan.toString());
      } else {
        logRow.push('', '0');
      }
    }
    logRow.push('PENDING'); // status (Y)
    // Fill columns Z-AA-...-AB if needed to reach AC/AD
    while (logRow.length < 28) logRow.push('');
    // AC: File Status (pdf file name)
    logRow.push(fileName);
    // AD: File Link (pdf link)
    logRow.push(driveLink);

    // Add to LOG sheet
    await sheetsAPI.spreadsheets.values.append({
      spreadsheetId: getSheetId('log'),
      range: 'LOG!A:AD',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [logRow],
      },
    });

    // Update ITEMLOG for each item
    for (const item of items) {
      await updateItemUsage(item.namaBarang, item.bilangan);
    }
  } catch (error) {
    console.error('Error logging usage:', error);
    throw new Error('Failed to log usage');
  }
}

// Update item usage in ITEMLOG
async function updateItemUsage(namaBarang: string, quantity: number): Promise<void> {
  try {
    const { sheets: sheetsAPI } = await initializeGoogleAPI();
    
    // First, find the item row
    const response = await sheetsAPI.spreadsheets.values.get({
      spreadsheetId: getSheetId('itemlog'),
      range: 'ITEMLOG!A:B',
    });

    const rows = response.data.values || [];
    let itemRow = -1;
    
    for (let i = 1; i < rows.length; i++) { // Skip header
      if (rows[i][1] === namaBarang) {
        itemRow = i + 1; // Sheets is 1-indexed
        break;
      }
    }

    if (itemRow === -1) {
      throw new Error(`Item ${namaBarang} not found`);
    }

    // Get current values
    const itemResponse = await sheetsAPI.spreadsheets.values.get({
      spreadsheetId: getSheetId('itemlog'),
      range: `ITEMLOG!A${itemRow}:P${itemRow}`,
    });

    const currentValues = itemResponse.data.values?.[0] || [];
    const current = parseInt(currentValues[15]) || 0;
    const newCurrent = Math.max(0, current - quantity);

    // Update current quantity
    await sheetsAPI.spreadsheets.values.update({
      spreadsheetId: getSheetId('itemlog'),
      range: `ITEMLOG!P${itemRow}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[newCurrent.toString()]],
      },
    });
  } catch (error) {
    console.error('Error updating item usage:', error);
    throw new Error('Failed to update item usage');
  }
}

// Get next available ID for ITEMLOG
async function getNextId(): Promise<string> {
  try {
    const { sheets: sheetsAPI } = await initializeGoogleAPI();
    
    const response = await sheetsAPI.spreadsheets.values.get({
      spreadsheetId: getSheetId('itemlog'),
      range: 'ITEMLOG!A:A',
    });

    const rows = response.data.values || [];
    if (rows.length <= 1) return '1'; // Only header row

    const lastId = parseInt(rows[rows.length - 1][0]) || 0;
    return (lastId + 1).toString();
  } catch (error) {
    console.error('Error getting next ID:', error);
    return Date.now().toString(); // Fallback
  }
}

// Get next available ID for LOG
async function getNextLogId(): Promise<string> {
  try {
    const { sheets: sheetsAPI } = await initializeGoogleAPI();
    
    const response = await sheetsAPI.spreadsheets.values.get({
      spreadsheetId: getSheetId('log'),
      range: 'LOG!A:A',
    });

    const rows = response.data.values || [];
    if (rows.length <= 1) return '1'; // Only header row

    const lastId = parseInt(rows[rows.length - 1][0]) || 0;
    return (lastId + 1).toString();
  } catch (error) {
    console.error('Error getting next log ID:', error);
    return Date.now().toString(); // Fallback
  }
}

// Get image URL from Google Drive
export async function getImageUrl(imagePath: string): Promise<string> {
  try {
    if (!imagePath) return '';
    
    const { drive: driveAPI } = await initializeGoogleAPI();
    
    // Extract file ID from the path
    const fileIdMatch = imagePath.match(/[a-zA-Z0-9-_]{25,}/);
    if (!fileIdMatch) return '';

    const fileId = fileIdMatch[0];
    
    // Get file metadata
    const file = await driveAPI.files.get({
      fileId,
      fields: 'id,name,webContentLink',
    });

    // Return a direct download link
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  } catch (error) {
    console.error('Error getting image URL:', error);
    return '';
  }
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
  const year = new Date(date).getFullYear();
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
 * Upload a PDF buffer to Google Drive and return the shareable link
 * @param {Uint8Array} pdfBuffer
 * @param {string} filename
 * @returns {Promise<string>} Shareable Google Drive link
 */
export async function uploadPdfToDrive(pdfBuffer: Uint8Array, filename: string): Promise<string> {
  const { drive: driveAPI } = await initializeGoogleAPI();
  const res = await driveAPI.files.create({
    requestBody: {
      name: filename,
      mimeType: 'application/pdf',
    },
    media: {
      mimeType: 'application/pdf',
      body: Buffer.from(pdfBuffer),
    },
    fields: 'id',
  });
  const fileId = res.data.id;
  // Make file public
  await driveAPI.permissions.create({
    fileId,
    requestBody: { role: 'reader', type: 'anyone' },
  });
  return `https://drive.google.com/file/d/${fileId}/view`;
} 