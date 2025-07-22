// Updated Google Apps Script backend to support LIMIT field and PDF generation
// Copy this code to your Google Apps Script project

function doGet(e) {
  try {
    const action = e.parameter.action;
    
    switch(action) {
      case 'getItems':
        return ContentService.createTextOutput(JSON.stringify(getItems()));
      case 'getLogs':
        return ContentService.createTextOutput(JSON.stringify(getLogs()));
      case 'getRequests':
        return ContentService.createTextOutput(JSON.stringify(getRequests()));
      case 'getPriceStock':
        return ContentService.createTextOutput(JSON.stringify(getPriceStock()));
      default:
        return ContentService.createTextOutput(JSON.stringify({error: 'Invalid action'}));
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({error: error.toString()}));
  }
}

function doPost(e) {
  try {
    const action = e.parameter.action;
    
    switch(action) {
      case 'addItem':
        return ContentService.createTextOutput(JSON.stringify(addItem(e.parameter)));
      case 'logUsage':
        return ContentService.createTextOutput(JSON.stringify(logUsage(e.parameter)));
      case 'logUsageWithPdf':
        return ContentService.createTextOutput(JSON.stringify(logUsageWithPdf(e.parameter)));
      case 'updateLogStatus':
        return ContentService.createTextOutput(JSON.stringify(updateLogStatus(e.parameter)));
      case 'restockItem':
        return ContentService.createTextOutput(JSON.stringify(restockItem(e.parameter)));
      case 'editItem':
        return ContentService.createTextOutput(JSON.stringify(editItem(e.parameter)));
      case 'editPriceStock':
        return ContentService.createTextOutput(JSON.stringify(editPriceStock(e.parameter)));
      default:
        return ContentService.createTextOutput(JSON.stringify({error: 'Invalid action'}));
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({error: error.toString()}));
  }
}

// IMPORTANT: Update this function to include LIMIT field (column Q)
function getItems() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ITEMLOG');
  const data = sheet.getRange('A2:Q' + sheet.getLastRow()).getValues(); // Changed from P to Q to include LIMIT
  
  return data.map(row => ({
    'ID': row[0] || '',
    'NAMA BARANG': row[1] || '',
    'BILANGAN': parseInt(row[2]) || 0,
    'IMAGE': row[3] || '',
    'BIL LOG 1': parseInt(row[4]) || 0,
    'BIL LOG 2': parseInt(row[5]) || 0,
    'BIL LOG 3': parseInt(row[6]) || 0,
    'BIL LOG 4': parseInt(row[7]) || 0,
    'BIL LOG 5': parseInt(row[8]) || 0,
    'BIL LOG 6': parseInt(row[9]) || 0,
    'BIL LOG 7': parseInt(row[10]) || 0,
    'BIL LOG 8': parseInt(row[11]) || 0,
    'BIL LOG 9': parseInt(row[12]) || 0,
    'BIL LOG 10': parseInt(row[13]) || 0,
    'TOTAL': parseInt(row[14]) || 0,
    'CURRENT': parseInt(row[15]) || 0,
    'LIMIT': parseInt(row[16]) || 0  // NEW: Admin limit field
  }));
}

// Enhanced logUsage function with PDF support
function logUsageWithPdf(params) {
  try {
    const email = params.email;
    const department = params.department;
    const items = JSON.parse(params.items);
    const pdfData = params.pdfData; // Base64 PDF data
    const timestamp = params.timestamp;
    
    // Get LOG sheet and add new entry
    const logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('LOG');
    const nextId = getNextLogId();
    
    // Prepare log entry
    const logRow = [nextId, timestamp, email, department];
    
    // Add items (up to 10)
    for (let i = 0; i < 10; i++) {
      if (i < items.length) {
        logRow.push(items[i].namaBarang, items[i].bilangan);
      } else {
        logRow.push('', 0);
      }
    }
    
    logRow.push('PENDING'); // Status
    
    // Fill remaining columns to reach AC/AD
    while (logRow.length < 28) logRow.push('');
    
    // Upload PDF to Google Drive
    let driveLink = '';
    let fileName = '';
    
    if (pdfData) {
      try {
        fileName = `ORDER_${nextId}_${department.replace(/\s+/g, '_')}_${timestamp.replace(/[/:]/g, '')}.pdf`;
        const pdfBlob = Utilities.newBlob(Utilities.base64Decode(pdfData), 'application/pdf', fileName);
        const file = DriveApp.createFile(pdfBlob);
        
        // Make file publicly viewable
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        driveLink = file.getUrl();
      } catch (pdfError) {
        console.error('Error creating PDF:', pdfError);
      }
    }
    
    // AC: File Status (pdf file name)
    logRow.push(fileName);
    // AD: File Link (pdf link)  
    logRow.push(driveLink);
    
    // Add to LOG sheet
    logSheet.appendRow(logRow);
    
    // Update ITEMLOG for each item (respecting admin limits)
    const itemlogSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ITEMLOG');
    const itemlogData = itemlogSheet.getRange('A:Q').getValues(); // Include LIMIT column
    
    for (const item of items) {
      // Find item row
      let itemRow = -1;
      for (let i = 1; i < itemlogData.length; i++) {
        if (itemlogData[i][1] === item.namaBarang) {
          itemRow = i + 1;
          break;
        }
      }
      
      if (itemRow > -1) {
        const current = parseInt(itemlogData[itemRow - 1][15]) || 0;
        const limit = parseInt(itemlogData[itemRow - 1][16]) || 0;
        
        // Check if order exceeds limit
        if (limit > 0 && item.bilangan > limit) {
          throw new Error(`Order quantity ${item.bilangan} exceeds admin limit ${limit} for item ${item.namaBarang}`);
        }
        
        // Update current stock
        const newCurrent = Math.max(0, current - item.bilangan);
        itemlogSheet.getRange(itemRow, 16).setValue(newCurrent); // Column P (CURRENT)
      }
    }
    
    return {
      success: true,
      logId: nextId,
      pdfLink: driveLink,
      fileName: fileName
    };
    
  } catch (error) {
    console.error('logUsageWithPdf error:', error);
    return {error: error.toString()};
  }
}

// Regular logUsage function (fallback)
function logUsage(params) {
  try {
    const email = params.email;
    const department = params.department;
    const items = JSON.parse(params.items);
    
    // Format timestamp
    const now = new Date();
    const timestamp = Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
    
    const logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('LOG');
    const nextId = getNextLogId();
    
    const logRow = [nextId, timestamp, email, department];
    
    for (let i = 0; i < 10; i++) {
      if (i < items.length) {
        logRow.push(items[i].namaBarang, items[i].bilangan);
      } else {
        logRow.push('', 0);
      }
    }
    logRow.push('PENDING');
    
    logSheet.appendRow(logRow);
    
    // Update ITEMLOG
    const itemlogSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ITEMLOG');
    const itemlogData = itemlogSheet.getRange('A:Q').getValues();
    
    for (const item of items) {
      let itemRow = -1;
      for (let i = 1; i < itemlogData.length; i++) {
        if (itemlogData[i][1] === item.namaBarang) {
          itemRow = i + 1;
          break;
        }
      }
      
      if (itemRow > -1) {
        const current = parseInt(itemlogData[itemRow - 1][15]) || 0;
        const newCurrent = Math.max(0, current - item.bilangan);
        itemlogSheet.getRange(itemRow, 16).setValue(newCurrent);
      }
    }
    
    return {
      success: true,
      logId: nextId
    };
  } catch (error) {
    return {error: error.toString()};
  }
}

function getNextLogId() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('LOG');
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 1;
  
  const lastId = parseInt(sheet.getRange(lastRow, 1).getValue()) || 0;
  return lastId + 1;
}

// Add other existing functions (getLogs, getRequests, addItem, etc.)
// Make sure to update any functions that read ITEMLOG to include the LIMIT column (column Q)

function addItem(params) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ITEMLOG');
    const nextId = getNextItemId();
    
    const newRow = [
      nextId,
      params.namaBarang,
      parseInt(params.bilangan) || 0,
      params.image || '',
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // bilLog1-10
      0, // total
      parseInt(params.bilangan) || 0, // current
      0  // limit (default to 0, admin can set later)
    ];
    
    sheet.appendRow(newRow);
    return {success: true, id: nextId};
  } catch (error) {
    return {error: error.toString()};
  }
}

function getNextItemId() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ITEMLOG');
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 1;
  
  const lastId = parseInt(sheet.getRange(lastRow, 1).getValue()) || 0;
  return lastId + 1;
}

// Update editItem function to handle LIMIT column
function editItem(params) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ITEMLOG');
    const data = sheet.getRange('A:A').getValues();
    
    let targetRow = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == params.id) {
        targetRow = i + 1;
        break;
      }
    }
    
    if (targetRow === -1) {
      return {error: 'Item not found'};
    }
    
    // Update item details
    if (params.namaBarang) sheet.getRange(targetRow, 2).setValue(params.namaBarang);
    if (params.image) sheet.getRange(targetRow, 4).setValue(params.image);
    if (params.current) sheet.getRange(targetRow, 16).setValue(parseInt(params.current));
    if (params.limit !== undefined) sheet.getRange(targetRow, 17).setValue(parseInt(params.limit)); // NEW: Support LIMIT updates
    
    return {success: true};
  } catch (error) {
    return {error: error.toString()};
  }
}

// Add other required functions...