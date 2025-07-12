# Google Apps Script Setup for Stationery Management System

This document provides the complete Google Apps Script code needed to handle all operations for the stationery management system.

## Setup Instructions

1. Go to [Google Apps Script](https://script.google.com/)
2. Create a new project
3. Replace the default code with the code below
4. Deploy as a web app
5. Set access to "Anyone"
6. Copy the web app URL and update it in `src/lib/google-apps-script.ts`

## Complete Google Apps Script Code

```javascript
function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  let allParams = {};
  let action = '';

  if (e.postData && e.postData.contents) {
    try {
      allParams = JSON.parse(e.postData.contents);
      action = allParams.action;
    } catch (parseError) {
      console.error('Error parsing POST data:', parseError);
    }
  } else if (e.parameter) {
    allParams = e.parameter;
    action = allParams.action;
  }

  console.log('Received action:', action, 'with params:', allParams);

  let result;
  switch(action) {
    case 'getItems':
      result = getItems();
      break;
    case 'getLogs':
      result = getLogs();
      break;
    case 'getRequests':
      result = getRequests();
      break;
    case 'addItem':
      result = addItem(allParams);
      break;
    case 'restockItem':
      result = restockItem(allParams);
      break;
    case 'editItem':
      result = editItem(allParams);
      break;
    case 'logUsage':
      result = logUsage(allParams);
      break;
    case 'updateLogStatus':
      result = updateLogStatus(allParams);
      break;
    case 'test':
      result = { message: 'Apps Script is working!', timestamp: new Date().toISOString() };
      break;
    default:
      result = { error: 'Unknown or missing action' };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// Format date to Malaysian format: DD/MM/YYYY HH:MM:SS
function formatMalaysianDateTime(date) {
  // Use Google Apps Script's Utilities.formatDate to force Malaysia time
  return Utilities.formatDate(date, 'Asia/Kuala_Lumpur', 'dd/MM/yyyy HH:mm:ss');
}

function getItems() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ITEMLOG');
  if (!sheet) {
    throw new Error('ITEMLOG sheet not found');
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1); // Skip header row
  
  return rows.map(row => {
    const obj = {};
    for (let i = 0; i < headers.length; i++) {
      obj[headers[i]] = row[i];
    }
    return obj;
  });
}

function getLogs() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('LOG');
  if (!sheet) {
    throw new Error('LOG sheet not found');
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1); // Skip header row

  return rows.map(row => {
    const obj = {};
    for (let i = 0; i < headers.length; i++) {
      obj[headers[i]] = row[i];
    }

    // Build items array from NAMA BARANG*X and BILANGAN*X
    const items = [];
    for (let i = 1; i <= 10; i++) {
      const nama = obj[`NAMA BARANG*${i}`] || obj[`NAMA BARANG *${i}`];
      const bil = obj[`BILANGAN*${i}`];
      if (nama && bil) {
        items.push({ namaBarang: nama, bilangan: bil });
      }
    }
    obj.items = items;

    // Add PDF_LINK alias for compatibility
    obj['PDF_LINK'] = obj['[Document Studio] File Link #Iso9pkez'] || obj['[Document Studio] File Link'] || '';

    // Map to expected frontend fields
    return {
      id: obj['ID'],
      tarikhDanMasa: obj['TARIKH DAN MASA'],
      email: obj['EMAIL'],
      department: obj['DEPARTMENT'],
      items: obj.items,
      status: obj['STATUS'],
      // PDF_LINK: obj['PDF_LINK'],
    };
  });
}

// NEW FUNCTION: Get requests for admin page (formatted for frontend)
function getRequests() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('LOG');
  if (!sheet) {
    throw new Error('LOG sheet not found');
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1); // Skip header row

  return rows.map(row => {
    const obj = {};
    for (let i = 0; i < headers.length; i++) {
      obj[headers[i]] = row[i];
    }

    // Build items array from NAMA BARANG*X and BILANGAN*X
    const items = [];
    for (let i = 1; i <= 10; i++) {
      const nama = obj[`NAMA BARANG*${i}`] || obj[`NAMA BARANG *${i}`];
      const bil = obj[`BILANGAN*${i}`];
      if (nama && bil) {
        items.push({ 
          namaBarang: nama, 
          bilangan: parseInt(bil) || 0 
        });
      }
    }

    // Return format expected by admin page
    return {
      id: parseInt(obj['ID']) || 0,
      email: obj['EMAIL'] || '',
      department: obj['DEPARTMENT'] || '',
      items: items,
      status: obj['STATUS'] || 'PENDING',
      logId: parseInt(obj['ID']) || 0
    };
  });
}

function addItem(params) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ITEMLOG');
  if (!sheet) {
    throw new Error('ITEMLOG sheet not found');
  }
  
  const namaBarang = params.namaBarang;
  const bilangan = parseInt(params.bilangan) || 0;
  const image = params.image || '';
  
  if (!namaBarang || bilangan <= 0) {
    throw new Error('Item name and quantity are required');
  }
  
  // Get next ID
  const lastRow = sheet.getLastRow();
  const id = lastRow; // or lastRow + 1 if you want to skip header row
  
  // Prepare row data
  const newRow = [
    id,
    namaBarang,
    bilangan.toString(),
    image,
    '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', // bilLog1-10
    '0', // total
    bilangan.toString() // current
  ];
  
  // Add to sheet
  sheet.appendRow(newRow);
  
  return { success: true, id: id };
}

function restockItem(params) {
  try {
    const id = Number(params.id);
    const addQty = Math.max(0, Number(params.addQty) || 0);
    
    console.log('Restock request:', { id, addQty });
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ITEMLOG');
    if (!sheet) {
      throw new Error('ITEMLOG sheet not found');
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Find the current column index
    const currentColIndex = headers.findIndex(header => header === 'CURRENT');
    if (currentColIndex === -1) {
      throw new Error('CURRENT column not found');
    }
    
    // Find the row with matching ID
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (Number(data[i][0]) === id) {
        rowIndex = i;
        break;
      }
    }
    
    if (rowIndex === -1) {
      throw new Error(`Item with ID ${id} not found`);
    }
    
    // Get current value and calculate new value
    const currentValue = Number(data[rowIndex][currentColIndex]) || 0;
    const newValue = currentValue + addQty;
    
    // Update the cell
    const range = sheet.getRange(rowIndex + 1, currentColIndex + 1);
    range.setValue(newValue);
    
    // Verify the update
    const updatedValue = range.getValue();
    if (Number(updatedValue) !== newValue) {
      throw new Error('Failed to update value');
    }
    
    console.log('Restock successful:', {
      id,
      oldValue: currentValue,
      addQty,
      newValue: updatedValue
    });
    
    return {
      success: true,
      id,
      oldStock: currentValue,
      addQty,
      newStock: updatedValue
    };
    
  } catch (error) {
    console.error('Restock error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

function editItem(params) {
  const id = params.id;
  const newName = params.namaBarang;
  const newImage = params.image;
  const newCurrent = params.current;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ITEMLOG');
  
  if (!sheet) {
    throw new Error('ITEMLOG sheet not found');
  }
  
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == id) { // assuming ID is in column 0
      if (newName !== undefined) {
        sheet.getRange(i+1, 2).setValue(newName); // column 2 is NAMA BARANG
      }
      if (newImage !== undefined) {
        sheet.getRange(i+1, 4).setValue(newImage); // column 4 is IMAGE
      }
      if (newCurrent !== undefined) {
        sheet.getRange(i+1, 16).setValue(newCurrent); // column 16 is CURRENT
      }
      return { success: true };
    }
  }
  throw new Error('Item not found');
}

function logUsage(params) {
  console.log('Starting logUsage with params:', JSON.stringify(params));
  
  const logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('LOG');
  const itemSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ITEMLOG');
  
  console.log('Sheets found:', {
    logSheet: !!logSheet,
    itemSheet: !!itemSheet
  });
  
  if (!logSheet || !itemSheet) throw new Error('Required sheets not found');

  const email = params.email;
  const department = params.department;
  let items = [];
  
  console.log('Processing items parameter:', typeof params.items, params.items);
  
  if (Array.isArray(params.items)) {
    items = params.items;
  } else if (typeof params.items === 'string') {
    try { 
      items = JSON.parse(params.items);
      console.log('Parsed items from string:', items);
    } catch (err) {
      console.error('Failed to parse items:', err);
      throw new Error('Invalid items JSON');
    }
  }
  
  if (!email || !department || !items || items.length === 0) {
    console.error('Validation failed:', { email, department, itemsLength: items?.length });
    throw new Error('Email, department, and items are required');
  }

  // Get next log ID
  const lastLogRow = logSheet.getLastRow();
  const logId = lastLogRow;
  
  console.log('Generated logId:', logId);

  // Format date in Malaysian format
  const timestamp = Utilities.formatDate(new Date(), 'Asia/Kuala_Lumpur', 'dd/MM/yyyy HH:mm:ss');

  // Prepare log entry
  const logRow = [logId, timestamp, email, department];
  for (let i = 0; i < 10; i++) {
    if (i < items.length) {
      logRow.push(items[i].namaBarang, items[i].bilangan.toString());
    } else {
      logRow.push('', '0');
    }
  }
  logRow.push('PENDING'); // status
  logRow.push(''); // [Document Studio] File Status
  logRow.push(''); // [Document Studio] File Link

  console.log('Prepared log row:', logRow);

  try {
    // Add to LOG sheet
    logSheet.appendRow(logRow);
    console.log('Successfully added log row');

    // Deduct stock for each item
    console.log('Starting stock deduction...');
    const itemData = itemSheet.getDataRange().getValues();
    
    for (let j = 0; j < items.length; j++) {
      const itemName = items[j].namaBarang;
      const qty = parseInt(items[j].bilangan);
      console.log('Processing item:', { itemName, qty });
      
      let found = false;
      for (let k = 1; k < itemData.length; k++) {
        if (itemData[k][1] == itemName) {
          found = true;
          const current = parseInt(itemData[k][15]) || 0; // CURRENT is in column 16 (index 15)
          const newCurrent = Math.max(0, current - qty);
          console.log('Updating stock:', { 
            item: itemName, 
            row: k+1, 
            oldStock: current, 
            deduction: qty, 
            newStock: newCurrent 
          });
          itemSheet.getRange(k+1, 16).setValue(newCurrent);
          break;
        }
      }
      if (!found) {
        console.warn(`Item not found in ITEMLOG: ${itemName}`);
      }
    }
    console.log('Stock deduction completed');

    return { success: true, logId: logId };
  } catch (error) {
    console.error('Error in logUsage:', error);
    throw error;
  }
}

function updateLogStatus(params) {
  console.log('Starting updateLogStatus with params:', JSON.stringify(params));
  
  const logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('LOG');
  if (!logSheet) throw new Error('LOG sheet not found');

  // Accept both logId and id
  const logId = params.logId || params.id;
  const newStatus = params.status;
  let items = [];
  
  console.log('Processing request:', { logId, newStatus });
  
  if (Array.isArray(params.items)) {
    items = params.items;
  } else if (typeof params.items === 'string') {
    try { 
      items = JSON.parse(params.items);
      console.log('Parsed items from string:', items);
    } catch (err) {
      console.warn('Failed to parse items:', err);
      // Don't throw error here as items are optional for status update
    }
  }

  if (!logId || !newStatus) {
    console.error('Missing required fields:', { logId, newStatus });
    throw new Error('Log ID and status are required');
  }

  // Validate status
  const validStatuses = ['PENDING', 'APPROVE', 'DECLINE', 'APPLY'];
  if (!validStatuses.includes(newStatus)) {
    console.error('Invalid status:', newStatus);
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  // Find the log entry
  const data = logSheet.getDataRange().getValues();
  let logRowIndex = -1;

  console.log('Searching for log entry with ID:', logId);
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(logId)) {
      logRowIndex = i + 1;
      console.log('Found log entry at row:', logRowIndex);
      break;
    }
  }

  if (logRowIndex === -1) {
    console.error('Log entry not found for ID:', logId);
    throw new Error('Log entry not found');
  }

  try {
    // Update the status (Column Y - index 24)
    console.log('Updating status to:', newStatus, 'at row:', logRowIndex);
    logSheet.getRange(logRowIndex, 25).setValue(newStatus);

    // Handle stock restoration for DECLINE
    if (newStatus === 'DECLINE' && items.length > 0) {
      console.log('Processing stock restoration for declined request');
      const itemSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ITEMLOG');
      if (itemSheet) {
        const itemData = itemSheet.getDataRange().getValues();
        for (let j = 0; j < items.length; j++) {
          const itemName = items[j].namaBarang;
          const qty = parseInt(items[j].bilangan);
          console.log('Restoring stock for:', { itemName, qty });
          
          let found = false;
          for (let k = 1; k < itemData.length; k++) {
            if (itemData[k][1] == itemName) {
              found = true;
              const current = parseInt(itemData[k][15]) || 0;
              const newCurrent = current + qty;
              console.log('Updating stock:', {
                item: itemName,
                row: k+1,
                oldStock: current,
                addition: qty,
                newStock: newCurrent
              });
              itemSheet.getRange(k+1, 16).setValue(newCurrent);
              break;
            }
          }
          if (!found) {
            console.warn(`Item not found in ITEMLOG: ${itemName}`);
          }
        }
      }
    }

    return { 
      success: true, 
      message: 'Status updated successfully', 
      logId: logId, 
      status: newStatus 
    };
  } catch (error) {
    console.error('Error in updateLogStatus:', error);
    throw error;
  }
}

function listImageFiles() {
  try {
    const folder = DriveApp.getFoldersByName('ITEMLOG_Images').next();
    const files = folder.getFiles();
    const sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('ImageFileIDs');
    sheet.appendRow(['File Name', 'File ID']);
    while (files.hasNext()) {
      const file = files.next();
      sheet.appendRow([file.getName(), file.getId()]);
    }
    return { success: true, message: 'Image files listed successfully' };
  } catch (error) {
    throw new Error('Error listing image files: ' + error.message);
  }
}
```

## Sheet Structure

### ITEMLOG Sheet
- Column A: ID
- Column B: NAMA BARANG (Item Name)
- Column C: BILANGAN (Quantity)
- Column D: IMAGE
- Columns E-N: bilLog1 to bilLog10 (Historical logs)
- Column O: TOTAL
- Column P: CURRENT (Available stock)

### LOG Sheet
- Column A: ID
- Column B: TARIKH DAN MASA (Date & Time)
- Column C: EMAIL
- Column D: DEPARTMENT
- Columns E-W: Items (up to 10 items, alternating NAMA BARANG*X and BILANGAN*X)
- Column Y: STATUS (PENDING, APPROVE, DECLINE, APPLY)
- Column Z: [Document Studio] File Status
- Column AA: [Document Studio] File Link

## Deployment

1. Click "Deploy" > "New deployment"
2. Choose "Web app"
3. Set "Execute as" to your account
4. Set "Who has access" to "Anyone"
5. Click "Deploy"
6. Copy the web app URL
7. Update the `APPS_SCRIPT_URL` in `src/lib/google-apps-script.ts`

## Testing

After deployment, you can test the endpoints:

- `GET /exec?action=getItems` - Get all items
- `GET /exec?action=getLogs` - Get all logs
- `GET /exec?action=getRequests` - Get all requests (for admin)
- `POST /exec` with action and data - Perform operations

## Notes

- The system now uses Google Sheets as the single source of truth
- All data is stored in Google Sheets, making it suitable for Netlify deployment
- The admin page will always show the latest requests from Google Sheets
- No local JSON files are needed for production 