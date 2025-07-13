# Updated Google Apps Script with Image Upload

This script adds Google Drive image upload functionality to your existing Google Apps Script while keeping all your current functionality intact.

## Complete Updated Script

```javascript
// Google Apps Script for Stationery Management System
// Enhanced with Google Drive image upload functionality

// Configuration
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // Replace with your actual spreadsheet ID
const DRIVE_FOLDER_NAME = 'ITEMLOG_Images'; // Folder name for storing images

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
    case 'uploadImage':
      result = uploadImageToDrive(allParams);
      break;
    case 'deleteImage':
      result = deleteImageFromDrive(allParams);
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

// NEW FUNCTIONS: Google Drive Image Operations

function uploadImageToDrive(data) {
  try {
    console.log('Starting image upload to Google Drive');
    
    // Decode base64 data
    const fileData = Utilities.base64Decode(data.fileData);
    const blob = Utilities.newBlob(fileData, data.mimeType, data.fileName);
    
    // Get or create the ITEMLOG_Images folder
    let folder;
    try {
      folder = DriveApp.getFoldersByName(DRIVE_FOLDER_NAME).next();
    } catch (error) {
      // Create folder if it doesn't exist
      folder = DriveApp.createFolder(DRIVE_FOLDER_NAME);
      console.log('Created new folder:', DRIVE_FOLDER_NAME);
    }
    
    // Create file in the folder
    const file = folder.createFile(blob);
    
    // Set file permissions to anyone with the link can view
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    console.log('Image uploaded successfully:', file.getName());
    
    return {
      success: true,
      id: file.getId(),
      name: file.getName(),
      webViewLink: file.getUrl(),
      webContentLink: `https://drive.google.com/uc?export=view&id=${file.getId()}`
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    return { error: error.toString() };
  }
}

function deleteImageFromDrive(data) {
  try {
    console.log('Deleting image from Google Drive:', data.fileId);
    
    const file = DriveApp.getFileById(data.fileId);
    file.setTrashed(true);
    
    console.log('Image deleted successfully');
    return { success: true };
  } catch (error) {
    console.error('Error deleting image:', error);
    return { error: error.toString() };
  }
}

function listImageFiles() {
  try {
    const folder = DriveApp.getFoldersByName(DRIVE_FOLDER_NAME).next();
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

## 🔄 **What's New**

The updated script adds these **new functions** while keeping all your existing functionality:

1. **`uploadImageToDrive(data)`** - Uploads images to Google Drive
2. **`deleteImageFromDrive(data)`** - Deletes images from Google Drive
3. **Enhanced folder handling** - Uses `ITEMLOG_Images` folder name
4. **Better error handling** - More detailed logging

## 📋 **Setup Steps**

1. **Copy the entire script** above
2. **Replace your current Google Apps Script** with this new code
3. **Update the configuration**:
   ```javascript
   const SPREADSHEET_ID = 'YOUR_ACTUAL_SPREADSHEET_ID';
   ```
4. **Deploy as web app** with "Anyone" access
5. **Update your application URLs** with the new web app URL

## 🔍 **Pages That Need Updates**

After updating the script, you'll need to update these pages to handle Google Drive URLs:

1. **`/admin/restock`** - Update image display
2. **`/` (home page)** - Update image display  
3. **`/components/Sidebar`** - Update cart image display

The `/stock` page is already updated and will work with both local and Google Drive URLs.

Would you like me to update those remaining pages as well? 